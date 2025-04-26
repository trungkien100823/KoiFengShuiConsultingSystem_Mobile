import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getAuthToken } from '../../services/authService';
import { paymentService } from '../../constants/paymentService';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);

export default function YourPaidCoursesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paidCourses, setPaidCourses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  useFocusEffect(
    React.useCallback(() => {
      fetchPaidCourses();
    }, [])
  );

  const fetchPaidCourses = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem khóa học');
        router.push('/login');
        return;
      }

      
      const apiUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getPaidCourses}`;
      
      
      // Gọi API để lấy danh sách khóa học đã mua
      const coursesResponse = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      

      if (coursesResponse.data && coursesResponse.data.isSuccess) {
        const courses = coursesResponse.data.data || [];
        
        setPaidCourses(courses);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách khóa học:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Không hiển thị Alert khi không có khóa học (404)
      if (!error.response || error.response.status !== 404) {
        Alert.alert(
          'Thông báo',
          'Không thể tải danh sách khóa học. Vui lòng thử lại sau.'
        );
      }
      
      // Hiển thị danh sách trống trong trường hợp lỗi
      setPaidCourses([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaidCourses();
  }, []);

  const handleCoursePress = (course) => {
    // Lấy trạng thái thanh toán từ khóa học
    const paymentStatus = course.paymentStatus || 'Paid';
    
    // Nếu đã thanh toán, chuyển đến trang chi tiết khóa học
    if (paymentStatus === 'Paid') {
      router.push({
        pathname: '/(tabs)/course_chapter',
        params: {
          courseId: course.courseId,
          courseName: course.courseName,
          courseImage: course.imageUrl,
          courseRating: course.rating,
          courseDescription: course.description,
          source: 'your_paid_courses'
        }
      });
    } else {
      // Nếu chưa thanh toán, chuyển đến trang thông tin khóa học
      router.push({
        pathname: '/(tabs)/course_details',
        params: {
          courseId: course.courseId,
          orderStatus: paymentStatus, // Truyền trạng thái thanh toán
          source: 'your_paid_courses'
        }
      });
    }
  };

  const cancelCourse = async (course) => {
    try {
      // Lấy trạng thái thanh toán từ course
      const paymentStatus = course.paymentStatus || '';
      
     
      
      // Kiểm tra trạng thái có thể hủy không
      const canCancel = paymentStatus === 'Pending';
      
      if (!canCancel) {
        Alert.alert('Thông báo', 'Không thể hủy đăng ký khóa học trong trạng thái hiện tại');
        return;
      }

      Alert.alert(
        'Xác nhận hủy đăng ký',
        'Bạn có chắc chắn muốn hủy đăng ký khóa học này không?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Xác nhận',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert('Thông báo', 'Vui lòng đăng nhập lại để tiếp tục');
                  setIsLoading(false);
                  return;
                }
                
                // Đảm bảo có courseId
                if (!course.courseId) {
                  setIsLoading(false);
                  Alert.alert('Thông báo', 'Không tìm thấy thông tin khóa học');
                  return;
                }
                
                
                
                try {
                  // Gọi API hủy đơn hàng theo endpoint [HttpPut("cancel/{id}")]
                  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.cancelOrder.replace('{id}', course.courseId)}`;
                  
                  
                  const cancelResponse = await axios.put(
                    url,
                    null,
                    {
                      params: {
                        type: 'Course' // PaymentTypeEnums.Course
                      },
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                  
                  
                  
                  if (cancelResponse.data && cancelResponse.data.isSuccess) {
                    setTimeout(() => {
                      setIsLoading(false);
                      Alert.alert(
                        'Thành công',
                        'Đã hủy đăng ký khóa học thành công',
                        [
                          {
                            text: 'OK',
                            onPress: fetchPaidCourses
                          }
                        ]
                      );
                    }, 100);
                  } else {
                    throw new Error(cancelResponse.data?.message || 'Không thể hủy đăng ký khóa học');
                  }
                } catch (error) {
                  console.error('Lỗi khi hủy khóa học:', error);
                  if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                  }
                  
                  setIsLoading(false);
                  Alert.alert('Thông báo', error.response?.data?.message || 'Không thể hủy đăng ký khóa học. Vui lòng thử lại sau.');
                }
              } catch (error) {
                console.error('Lỗi khi hủy khóa học:', error);
                setIsLoading(false);
                Alert.alert('Thông báo', 'Đã xảy ra lỗi khi hủy đăng ký. Vui lòng thử lại sau.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi hủy khóa học:', error);
      Alert.alert('Thông báo', 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#999';
    
    switch (status) {
      case 'Paid': return '#4CAF50';
      case 'Pending': return '#FFA726';
      case 'PendingConfirm': return '#FFA726';
      case 'Canceled': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Đã thanh toán';
    
    switch (status) {
      case 'Paid': return 'Đã thanh toán';
      case 'Pending': return 'Chờ thanh toán';
      case 'PendingConfirm': return 'Chờ xác nhận';
      case 'Canceled': return 'Đã hủy';
      default: return status;
    }
  };

  const CourseCard = ({ course }) => {
    const paymentStatus = course.paymentStatus || 'Paid';
    const showCancelButton = paymentStatus === 'Pending';
    
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity 
          style={styles.courseCard}
          onPress={() => handleCoursePress(course)}
          activeOpacity={0.9}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.courseCategoryTag}>
              <Ionicons name="school-outline" size={scale(14)} color="#8B0000" />
              <Text style={styles.courseCategoryText}>Khóa học</Text>
            </View>
            
            <View style={[styles.statusTag, {backgroundColor: getStatusColor(paymentStatus)}]}>
              <Text style={styles.statusTagText}>{getStatusDisplay(paymentStatus)}</Text>
            </View>
          </View>
          
          {/* Card Content */}
          <View style={styles.cardContent}>
            <View style={styles.courseImageBox}>
              <Image 
                source={
                  course.imageUrl 
                    ? { uri: course.imageUrl } 
                    : require('../../assets/images/buddha.png')
                } 
                style={styles.courseImage}
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.courseDetails}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.courseName || 'Chưa có tên'}
              </Text>
              
              <View style={styles.courseMeta}>
                <View style={styles.priceContainer}>
                  <Ionicons name="pricetag-outline" size={scale(14)} color="#4CAF50" />
                  <Text style={styles.priceText}>
                    {course.price ? `${course.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                  </Text>
                </View>
                
                {/* Additional meta info could go here */}
              </View>
            </View>
          </View>
          
          {/* Card Footer */}
          <View style={styles.cardFooter}>
            {showCancelButton ? (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => cancelCourse(course)}
              >
                <LinearGradient
                  colors={['#F44336', '#D32F2F']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.cancelButtonGradient}
                >
                  <Ionicons name="close-circle-outline" size={scale(16)} color="#FFF" />
                  <Text style={styles.buttonText}>Hủy đăng ký</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => handleCoursePress(course)}
              >
                <LinearGradient
                  colors={['#8B0000', '#600000']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.viewButtonGradient}
                >
                  <Text style={styles.buttonText}>Xem khóa học</Text>
                  <Ionicons name="arrow-forward" size={scale(16)} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [scale(150), scale(80)],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      {/* Header */}
      <LinearGradient 
        colors={['#8B0000', '#600000']} 
        start={[0, 0]} 
        end={[1, 0]}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.backButton}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Khóa học của bạn</Text>
          <Text style={styles.headerSubtitle}>
            {paidCourses.length > 0 
              ? `${paidCourses.length} khóa học đã đăng ký` 
              : 'Khám phá và đăng ký khóa học ngay'
            }
          </Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải danh sách khóa học...</Text>
          </View>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8B0000"]}
              tintColor="#8B0000"
              progressBackgroundColor="#FFF"
            />
          }
        >
          {paidCourses.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Danh sách khóa học</Text>
              {paidCourses.map((course, index) => (
                <CourseCard key={index} course={course} />
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Ionicons name="book-outline" size={scale(60)} color="#8B0000" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
                <Text style={styles.emptyText}>
                  Bạn chưa đăng ký khóa học nào. Hãy khám phá các khóa học của chúng tôi ngay.
                </Text>
                <TouchableOpacity 
                  style={styles.browseButton} 
                  onPress={() => router.push('/(tabs)/courses')}
                >
                  <LinearGradient
                    colors={['#8B0000', '#600000']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.browseButtonGradient}
                  >
                    <Text style={styles.browseButtonText}>Xem khóa học</Text>
                    <Ionicons name="arrow-forward" size={scale(16)} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + scale(16) : scale(16),
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTitleContainer: {
    marginLeft: scale(16),
    flex: 1,
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
  },
  headerSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255,255,255,0.8)',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
    paddingBottom: scale(30),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    marginBottom: scale(16),
    color: '#333',
    marginLeft: scale(4),
  },
  
  // Brand new card styles
  cardWrapper: {
    marginBottom: scale(20),
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(12),
    paddingBottom: scale(8),
  },
  courseCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(20),
  },
  courseCategoryText: {
    fontSize: scale(12),
    color: '#8B0000',
    fontWeight: '500',
    marginLeft: scale(4),
  },
  statusTag: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(20),
  },
  statusTagText: {
    fontSize: scale(12),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    padding: scale(12),
    paddingTop: scale(4),
    paddingBottom: scale(12),
  },
  courseImageBox: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(10),
    overflow: 'hidden',
    marginRight: scale(12),
    backgroundColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: scale(8),
    lineHeight: scale(22),
  },
  courseMeta: {
    marginTop: scale(4),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: scale(14),
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: scale(6),
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: scale(12),
  },
  cancelButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
  },
  viewButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(14),
    fontWeight: '600',
    marginRight: scale(6),
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: scale(20),
    borderRadius: scale(16),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(16),
    color: '#666',
  },
  
  // Empty state styles
  emptyContainer: {
    paddingVertical: scale(40),
    paddingHorizontal: scale(8),
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(20),
    padding: scale(30),
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  emptyIcon: {
    marginBottom: scale(16),
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(12),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#666',
    marginBottom: scale(24),
    textAlign: 'center',
    lineHeight: scale(24),
  },
  browseButton: {
    borderRadius: scale(30),
    overflow: 'hidden',
    width: '100%',
    maxWidth: scale(200),
  },
  browseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(14),
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginRight: scale(8),
  },
  bottomSpacer: {
    height: IS_IPHONE_X ? scale(40) : scale(20),
  },
}); 