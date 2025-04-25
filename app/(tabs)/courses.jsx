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
  ImageBackground,
  Platform,
  RefreshControl
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
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    const reloadData = async () => {
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
        console.error('Error refreshing data:', error);
      } finally {
        setRefreshing(false);
      }
    };
    
    reloadData();
  }, []);

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
            <ScrollView 
              style={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#8B0000']}
                  tintColor="#FFFFFF"
                  title="Đang làm mới..."
                  titleColor="#FFFFFF"
                />
              }
            >
              {/* Hiển thị kết quả tìm kiếm khi có từ khóa */}
              {searchQuery.trim() !== '' && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleGradient}>
                      <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
                    </View>
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
                  <View style={styles.sectionTitleGradient}>
                    <Text style={styles.sectionTitle}>Khóa học bán chạy</Text>
                  </View>
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
                  <View style={styles.sectionTitleGradient}>
                    <Text style={styles.sectionTitle}>Danh mục</Text>
                  </View>
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
                  <View style={styles.sectionTitleGradient}>
                    <Text style={styles.sectionTitle}>Khóa học được đánh giá cao</Text>
                  </View>
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
    paddingHorizontal: width * 0.04,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight + 10,
    paddingBottom: width * 0.03,
    marginTop: Platform.OS === 'ios' ? -20 : 5,
  },
  headerTitle: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: width * 0.04,
    marginBottom: width * 0.04,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 30, 30, 0.6)',
    borderRadius: width * 0.06,
    paddingHorizontal: width * 0.04,
    height: width * 0.12,
  },
  searchInput: {
    flex: 1,
    fontSize: width * 0.04,
    color: '#FFFFFF',
    paddingVertical: width * 0.025,
  },
  searchButton: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: width * 0.0375,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: width * 0.06,
    paddingTop: width * 0.02,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginBottom: width * 0.04,
  },
  sectionTitleGradient: {
    paddingVertical: width * 0.01,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
    paddingLeft: width * 0.03,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  horizontalList: {
    paddingLeft: width * 0.05,
    paddingRight: width * 0.025,
  },
  featuredCard: {
    width: width * 0.7,
    height: width * 0.5,
    marginRight: width * 0.04,
    borderRadius: width * 0.04,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: width * 0.01 },
    shadowOpacity: 0.3,
    shadowRadius: width * 0.02,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardInner: {
    flex: 1,
    borderRadius: width * 0.04,
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
    padding: width * 0.04,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: width * 0.02,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  courseStats: {
    marginTop: width * 0.02,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width * 0.015,
  },
  statText: {
    fontSize: width * 0.035,
    color: '#FFF',
    marginLeft: width * 0.02,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  priceText: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: width * 0.02,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  categoryCard: {
    width: width * 0.4,
    height: width * 0.2,
    marginRight: width * 0.04,
    borderRadius: width * 0.04,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: width * 0.01 },
    shadowOpacity: 0.1,
    shadowRadius: width * 0.02,
    elevation: 5,
  },
  categoryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: width * 0.04,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryIcon: {
    marginLeft: 5,
  },
  topCourseCard: {
    width: width * 0.6,
    height: width * 0.45,
    marginRight: width * 0.04,
    borderRadius: width * 0.04,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: width * 0.01 },
    shadowOpacity: 0.1,
    shadowRadius: width * 0.02,
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
    fontSize: width * 0.04,
    fontWeight: 'bold',
    marginBottom: width * 0.015,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: width * 0.5,
  },
  loadingText: {
    marginTop: width * 0.03,
    color: '#8B0000',
    fontSize: width * 0.04,
  },
  emptySearchResults: {
    padding: width * 0.075,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
  },
  emptySearchText: {
    fontSize: width * 0.04,
    color: '#FFF',
    textAlign: 'center',
    marginTop: width * 0.03,
  },
});
