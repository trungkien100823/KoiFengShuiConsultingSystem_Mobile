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
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function CoursesListScreen() {
  const { categoryId, categoryTitle } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('John Smith');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('Token không tồn tại');
          router.push('/login');
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getCourseByCategory.replace('{id}', categoryId)}`,
          config
        );

        console.log('API Response:', response.data);

        if (response.data?.isSuccess) {
          const processedCourses = response.data.data.map(course => ({
            id: course.courseId,
            title: course.courseName,
            image: course.imageUrl 
              ? { uri: course.imageUrl }
              : require('../../assets/images/koi_image.jpg'),
            price: course.price || 0,
            rating: course.rating || 0,
            category: course.categoryName || 'Course',
          }));
          setCourses(processedCourses);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [categoryId]);

  const renderCourseCard = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => router.push({
        pathname: '/(tabs)/course_details',
        params: { 
          courseId: item.id,
          source: 'courses_list'
        }
      })}
    >
      <View style={styles.cardInner}>
        <Image source={item.image} style={styles.courseImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
          style={styles.imageOverlay}
        />
        
        <View style={styles.cardContent}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    star <= item.rating
                      ? "star"
                      : star - 0.5 <= item.rating
                      ? "star-half"
                      : "star-outline"
                  }
                  size={14}
                  color="#FFD700"
                  style={{marginRight: 2}}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.priceChip}>
              <Text style={styles.priceText}>{item.price.toLocaleString('vi-VN')} đ</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book" size={70} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
      <Text style={styles.emptyText}>Hiện tại chưa có khóa học nào trong danh mục này</Text>
      <TouchableOpacity 
        style={styles.emptyButton} 
        onPress={() => router.back()}
      >
        <LinearGradient
          colors={['#FF6B6B', '#8B0000']}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonText}>Khám phá danh mục khác</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/feng shui.png')}
      style={styles.backgroundImage}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/courses')}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{categoryTitle}</Text>
            <Text style={styles.headerSubtitle}>Danh mục khóa học</Text>
          </View>
        </View>

        {/* Search Bar */}
        

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Đang tải khóa học...</Text>
          </View>
        ) : (
          courses.length > 0 ? (
            <FlatList
              data={courses}
              renderItem={renderCourseCard}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.coursesList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState />
          )
        )}

        <CustomTabBar />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 15,
    marginTop: -20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.4)',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  coursesList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  courseCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardInner: {
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  categoryChip: {
    position: 'absolute',
    top: -170,
    left: 10,
    backgroundColor: 'rgba(139, 0, 0, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceChip: {
    backgroundColor: 'rgba(139, 0, 0, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  priceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  emptyButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
