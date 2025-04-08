import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { useRouter } from 'expo-router';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoursesScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('John Smith');
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState(null);
  const [masterInfo, setMasterInfo] = useState(null);

  const processApiResponse = (response, defaultValue = []) => {
    if (response?.data?.isSuccess && Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    console.warn('Invalid response format:', response?.data);
    return defaultValue;
  };

  const fetchWithRetry = async (url, config, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url, config);
        return response;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchData = async (url, config) => {
    try {
      const response = await fetchWithRetry(url, config);
      console.log('API Response:', url, response.data);
      return response;
    } catch (error) {
      console.error('API Error:', url, error.response?.data || error.message);
      return { data: { isSuccess: false, data: [] } };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('Token không tồn tại, chuyển hướng đến trang đăng nhập');
          navigation.navigate('login');
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const [bestSellerRes, categoriesRes, topRatedRes] = await Promise.all([
          fetchData(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.bestSellerCourse}`, config),
          fetchData(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.getAllCategory}`, config),
          fetchData(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.sortByRating}`, config)
        ]);

        setFeaturedCourses(processApiResponse(bestSellerRes));
        setCategories(processApiResponse(categoriesRes));
        setTopCourses(processApiResponse(topRatedRes));

      } catch (error) {
        console.error('Error loading data:', error);
        setFeaturedCourses([]);
        setCategories([]);
        setTopCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Màn hình Courses được focus - Tải lại dữ liệu');
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const renderFeaturedCourse = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/course_details',
          params: { 
            courseId: item.courseId,
            source: 'courses' 
          }
        });
      }}
    >
      <Image 
        source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/buddha.png')}
        style={styles.featuredImage} 
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.featuredTitle}>{item.courseName}</Text>
        <Text style={styles.authorText}>{item.categoryName}</Text>
        <Text style={styles.priceText}>
          {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={async () => {
        try {
          setIsLoading(true);
          const token = await AsyncStorage.getItem('accessToken');
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };
          
          const response = await fetchData(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getCourseByCategory.replace('{id}', item.categoryId)}`,
            config
          );
          
          if (response.data?.isSuccess) {
            const categoryData = response.data.data;
            if (Array.isArray(categoryData) && categoryData.length > 0) {
              router.push({
                pathname: '/(tabs)/courses_list',
                params: { 
                  categoryId: item.categoryId,
                  categoryTitle: item.categoryName,
                  coursesData: JSON.stringify(categoryData),
                  source: 'courses'
                }
              });
            } else {
              Alert.alert('Thông báo', 'Không có khóa học nào trong danh mục này');
            }
          } else {
            Alert.alert('Thông báo', 'Không thể tải danh sách khóa học');
          }
        } catch (error) {
          console.error('Lỗi khi lấy danh sách khóa học theo danh mục:', error);
          Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi tải danh sách khóa học');
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <Image 
        source={require('../../assets/images/buddha.png')}
        style={styles.categoryImage} 
      />
      <View style={styles.categoryOverlay}>
        <Text style={styles.categoryTitle}>{item.categoryName}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTopCourse = ({ item }) => (
    <TouchableOpacity 
      style={styles.topCourseCard}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/course_details',
          params: { 
            courseId: item.courseId,
            source: 'courses' 
          }
        });
      }}
    >
      <Image 
        source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/buddha.png')}
        style={styles.topCourseImage} 
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.topCourseTitle}>{item.courseName}</Text>
        <Text style={styles.authorText}>{item.categoryName}</Text>
        <Text style={styles.priceText}>
          {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Hàm xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Hàm lọc khóa học theo từ khóa tìm kiếm
  const filterCourses = (courses) => {
    if (!searchQuery.trim()) return courses;
    
    return courses.filter(course => 
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hi, {userName}</Text>
            <Text style={styles.subGreeting}>Choose your course today</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="cart-outline" size={35} color="#8B0000" style={{ marginTop: 20, marginRight: 5 }} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm khóa học..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <Ionicons name="search" size={20} color="#666" />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      ) : (
        <ScrollView style={styles.scrollContent}>
          {/* Hiển thị kết quả tìm kiếm khi có từ khóa */}
          {searchQuery.trim() !== '' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Searching courses</Text>
              {isLoading ? (
                <ActivityIndicator size="large" color="#8B0000" />
              ) : (
                <FlatList
                  horizontal
                  data={[
                    ...filterCourses(featuredCourses), 
                    ...filterCourses(topCourses)
                  ].filter((course, index, self) => 
                    index === self.findIndex((c) => c.courseId === course.courseId)
                  )}
                  renderItem={renderFeaturedCourse}
                  keyExtractor={(item, index) => `search-${item.courseId}-${index}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                  ListEmptyComponent={
                    <View style={styles.emptySearchResults}>
                      <Text style={styles.emptySearchText}>Không tìm thấy khóa học nào phù hợp</Text>
                    </View>
                  }
                />
              )}
            </View>
          )}

          {/* Best Seller Courses - Luôn hiển thị đầu tiên */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Best Seller Courses</Text>
            {featuredCourses.length > 0 && (
              <FlatList
                data={featuredCourses}
                renderItem={renderFeaturedCourse}
                keyExtractor={item => item.courseId?.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredList}
              />
            )}
          </View>
          
          {/* Categories - Luôn ở giữa */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {categories.length > 0 && (
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={item => item.categoryId?.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            )}
          </View>
          
          {/* Top Rated Courses - Luôn ở cuối */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top Rated Courses</Text>
            {topCourses.length > 0 && (
              <FlatList
                data={topCourses}
                renderItem={renderTopCourse}
                keyExtractor={item => item.courseId?.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topCoursesList}
              />
            )}
          </View>
        </ScrollView>
      )}

      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#8B0000',
    marginTop: 10,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featuredList: {
    paddingLeft: 16,
  },
  featuredCard: {
    width: 220,
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesList: {
    paddingLeft: 16,
  },
  categoryCard: {
    width: 160,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  topCoursesList: {
    paddingLeft: 16,
    paddingBottom: 100,
  },
  topCourseCard: {
    width: 220,
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topCourseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topCourseTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  authorText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySearchResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
