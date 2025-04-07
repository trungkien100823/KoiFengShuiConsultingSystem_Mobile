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
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function YourPaidCoursesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paidCourses, setPaidCourses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPaidCourses();
  }, []);

  const fetchPaidCourses = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem khóa học');
        router.push('/login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getPaidCourses}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Paid courses response:', response.data);

      if (response.data && response.data.isSuccess) {
        setPaidCourses(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách khóa học:', error);
      Alert.alert(
        'Thông báo',
        'Không thể tải danh sách khóa học. Vui lòng thử lại sau.'
      );
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
  };

  const CourseCard = ({ course }) => (
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
          Trạng thái: {course.status || 'Đã thanh toán'}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>My Courses</Text>
        <TouchableOpacity 
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
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
    justifyContent: 'space-between',
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
    color: '#8B0000',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  browseButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
}); 