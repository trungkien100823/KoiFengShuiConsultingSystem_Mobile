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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getAuthToken } from '../../services/authService';
import { paymentService } from '../../constants/paymentService';

export default function YourPaidCoursesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paidCourses, setPaidCourses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

      console.log('Fetching paid courses...');
      const apiUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getPaidCourses}`;
      console.log('API URL:', apiUrl);
      
      // Gọi API để lấy danh sách khóa học đã mua
      const coursesResponse = await axios.get(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Status code:', coursesResponse.status);
      console.log('Course response data:', coursesResponse.data);

      if (coursesResponse.data && coursesResponse.data.isSuccess) {
        const courses = coursesResponse.data.data || [];
        console.log('Courses found:', courses.length);
        console.log('Course details:', courses);
        
        setPaidCourses(courses);
        
        if (courses.length === 0) {
          console.log('API trả về thành công nhưng không có khóa học');
        }
      } else {
        console.log('API trả về không thành công:', coursesResponse.data);
        setPaidCourses([]);
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
      } else {
        console.log('Không tìm thấy khóa học (404), hiển thị danh sách trống');
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
    
    console.log('handleCoursePress called with:', {
      courseId: course.courseId,
      courseName: course.courseName,
      paymentStatus: paymentStatus
    });
    
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
      
      console.log('cancelCourse called with:', {
        courseId: course.courseId,
        courseName: course.courseName,
        paymentStatus: paymentStatus,
        orderId: course.orderId
      });
      
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
                
                console.log('Hủy khóa học với courseId:', course.courseId);
                
                try {
                  // Gọi API hủy đơn hàng theo endpoint [HttpPut("cancel/{id}")]
                  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.cancelOrder.replace('{id}', course.courseId)}`;
                  console.log('Gọi API URL:', url);
                  
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
                  
                  console.log('Cancel course response:', cancelResponse.data);
                  
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
    console.log('Rendering course card:', {
      courseId: course.courseId,
      courseName: course.courseName,
      paymentStatus: course.paymentStatus,
      orderId: course.orderId
    });
    
    const paymentStatus = course.paymentStatus || 'Paid';
    
    // Hiển thị nút hủy khi trạng thái là Pending hoặc PendingConfirm
    const showCancelButton = 
      paymentStatus === 'Pending';
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => handleCoursePress(course)}
        activeOpacity={0.7}
      >
        <Image 
          source={
            course.imageUrl 
              ? { uri: course.imageUrl } 
              : require('../../assets/images/buddha.png')
          } 
          style={styles.orderImage}
        />
        <View style={styles.orderInfo}>
          <Text style={styles.serviceType}>Dịch vụ: Course</Text>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {course.courseName || 'Chưa có tên'}
          </Text>
          <Text style={styles.totalAmount}>
            Giá: {course.price ? `${course.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
          </Text>
          <Text style={styles.status}>
            Trạng thái: <Text style={{color: getStatusColor(paymentStatus)}}>{getStatusDisplay(paymentStatus)}</Text>
          </Text>
          
          {showCancelButton && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => cancelCourse(course)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Hủy gói</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khóa học</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải danh sách khóa học...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8B0000"]}
              tintColor="#8B0000"
            />
          }
        >
          {paidCourses.length > 0 ? (
            paidCourses.map((course, index) => (
              <CourseCard key={index} course={course} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Bạn chưa có khóa học nào
              </Text>
              <TouchableOpacity 
                style={styles.browseButton} 
                onPress={() => router.push('/(tabs)/courses')}
              >
                <Text style={styles.browseButtonText}>Xem khóa học</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#8B0000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  totalAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 