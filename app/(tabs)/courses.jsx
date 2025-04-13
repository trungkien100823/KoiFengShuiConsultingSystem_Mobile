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
  Alert,
  Dimensions,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { useRouter } from 'expo-router';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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

  // Hàm xử lý tìm kiếm - cập nhật searchQuery ngay khi gõ
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Hàm lọc khóa học theo từ khóa tìm kiếm
  const filterCourses = (courses) => {
    if (!searchQuery.trim()) return courses;
    
    return courses.filter(course => 
      (course.courseName && course.courseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.categoryName && course.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

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
      <View style={styles.cardInner}>
        <Image 
          source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/buddha.png')}
          style={styles.featuredImage} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        />
        <View style={styles.cardContent}>
          <Text style={styles.featuredTitle}>{item.courseName}</Text>
          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={14} color="#FFF" />
              <Text style={styles.statText}>{item.categoryName}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="pricetag-outline" size={14} color="#FFF" />
              <Text style={styles.priceText}>
                {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
              </Text>
            </View>
          </View>
        </View>
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
      <LinearGradient
        colors={['#8B0000', '#600000']}
        start={[0.0, 0.0]}
        end={[1.0, 1.0]}
        style={styles.categoryGradient}
      >
        <Text style={styles.categoryTitle}>{item.categoryName}</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFF" style={styles.categoryIcon} />
      </LinearGradient>
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
      <View style={styles.cardInner}>
        <Image 
          source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/buddha.png')}
          style={styles.topCourseImage} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        />
        <View style={styles.cardContent}>
          <Text style={styles.topCourseTitle}>{item.courseName}</Text>
          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={14} color="#FFF" />
              <Text style={styles.statText}>{item.categoryName}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="pricetag-outline" size={14} color="#FFF" />
              <Text style={styles.priceText}>
                {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(139,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" />
          
          {/* Modern Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
          </View>

          {/* Enhanced Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ở đây"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF9999" />
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Hiển thị kết quả tìm kiếm khi có từ khóa */}
              {searchQuery.trim() !== '' && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <LinearGradient
                      colors={['#8B0000', '#600000']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.sectionTitleGradient}
                    >
                      <Text style={styles.sectionTitle}>Searching courses</Text>
                    </LinearGradient>
                  </View>
                  
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#8B0000" />
                      <Text style={styles.loadingText}>Đang tải kết quả...</Text>
                    </View>
                  ) : (
                    <FlatList
                      horizontal
                      data={[...filterCourses(featuredCourses), ...filterCourses(topCourses)].filter(Boolean)}
                      renderItem={renderFeaturedCourse}
                      keyExtractor={(item, index) => `search-${item.courseId || index}`}
                      contentContainerStyle={styles.horizontalList}
                      showsHorizontalScrollIndicator={false}
                      ListEmptyComponent={
                        <View style={styles.emptySearchResults}>
                          <Ionicons name="search-outline" size={40} color="#ccc" />
                          <Text style={styles.emptySearchText}>Không tìm thấy khóa học nào phù hợp</Text>
                        </View>
                      }
                    />
                  )}
                </View>
              )}

              {/* Best Seller Courses Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#8B0000', '#600000']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.sectionTitleGradient}
                  >
                    <Text style={styles.sectionTitle}>Best Seller Courses</Text>
                  </LinearGradient>
                </View>
                
                {featuredCourses.length > 0 && (
                  <FlatList
                    data={featuredCourses}
                    renderItem={renderFeaturedCourse}
                    keyExtractor={item => item.courseId?.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  />
                )}
              </View>
              
              {/* Categories Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#8B0000', '#600000']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.sectionTitleGradient}
                  >
                    <Text style={styles.sectionTitle}>Categories</Text>
                  </LinearGradient>
                </View>
                
                {categories.length > 0 && (
                  <FlatList
                    data={categories}
                    renderItem={renderCategory}
                    keyExtractor={item => item.categoryId?.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  />
                )}
              </View>
              
              {/* Top Rated Courses Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#8B0000', '#600000']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.sectionTitleGradient}
                  >
                    <Text style={styles.sectionTitle}>Top Rated Courses</Text>
                  </LinearGradient>
                </View>
                
                {topCourses.length > 0 && (
                  <FlatList
                    data={topCourses}
                    renderItem={renderTopCourse}
                    keyExtractor={item => item.courseId?.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  />
                )}
              </View>
              
              {/* Bottom spacer for tab bar */}
              <View style={{height: 100}} />
            </ScrollView>
          )}

          <CustomTabBar />
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    marginTop: -20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 30, 30, 0.6)',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 10,
  },
  searchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  featuredCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardInner: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  courseStats: {
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  categoryCard: {
    width: 160,
    height: 80,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryIcon: {
    marginLeft: 5,
  },
  topCourseCard: {
    width: width * 0.6,
    height: 180,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  topCourseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topCourseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8B0000',
    fontSize: 16,
  },
  emptySearchResults: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 12,
  },
});
