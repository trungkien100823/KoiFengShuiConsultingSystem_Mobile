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
  FlatList
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
            reviews: course.enrolledStudents || 0,
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
      style={[styles.courseCard, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}
      onPress={() => router.push({
        pathname: '/(tabs)/course_details',
        params: { 
          courseId: item.id,
          source: 'courses_list'
        }
      })}
    >
      <View style={styles.cardInner}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.courseImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(item.rating) ? "star" : "star-outline"}
                  size={14}
                  color="#FFD700"
                  style={styles.starIcon}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
          
          <View style={styles.enrollmentRow}>
            <Ionicons name="person-outline" size={14} color="#777" />
            <Text style={styles.enrollmentText}>{item.reviews} học viên</Text>
          </View>
          
          <View style={styles.priceRow}>
            <LinearGradient
              colors={['#8B0000', '#600000']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.priceContainer}
            >
              <Text style={styles.priceText}>{item.price.toLocaleString('vi-VN')} đ</Text>
            </LinearGradient>
            
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book" size={80} color="#e0e0e0" />
      <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
      <Text style={styles.emptyText}>Hiện tại chưa có khóa học nào trong danh mục này</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
        <Text style={styles.emptyButtonText}>Khám phá danh mục khác</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#8B0000', '#600000']}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/courses')}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Danh mục khóa học</Text>
            <Text style={styles.headerTitle}>{categoryTitle}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm khóa học trong danh mục này..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
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
            numColumns={1}
          />
        ) : (
          <EmptyState />
        )
      )}

      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerGradient: {
    paddingTop: 15,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#8B0000',
    fontSize: 16,
  },
  coursesList: {
    padding: 16,
    paddingBottom: 90,
  },
  courseCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: '#FFFFFF',
  },
  cardLeft: {
    transform: [{translateX: -3}],
  },
  cardRight: {
    transform: [{translateX: 3}],
  },
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.85)',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    lineHeight: 24,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  enrollmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  enrollmentText: {
    fontSize: 13,
    color: '#777',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  enrollButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enrollButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
