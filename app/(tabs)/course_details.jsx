import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CustomTabBar from '../../components/ui/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';

const { width } = Dimensions.get('window');

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { courseId, courseData, source } = useLocalSearchParams();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [masterInfo, setMasterInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Thêm hàm handleBack
  const handleBack = () => {
    router.push('/(tabs)/courses');
  };

  useFocusEffect(
    React.useCallback(() => {
      // Reset state khi màn hình được focus
      setCourseDetails(null);
      setMasterInfo(null);
      setIsLoading(true);
      
      // Load lại dữ liệu
      loadCourseDetails();

      return () => {
        // Cleanup khi unmount
        setCourseDetails(null);
        setMasterInfo(null);
      };
    }, [courseId])
  );

  const loadCourseDetails = async () => {
    try {
      console.log('Loading course details for courseId:', courseId);
      setIsLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getCourseById.replace('{id}', courseId)}`;
      console.log('API URL:', url);
      
      const response = await axios.get(url, config);
      console.log('Full API Response:', response.data);

      if (response.data?.isSuccess) {
        const courseData = response.data.data;
        console.log('Course Data from API:', {
          courseId: courseData.courseId,
          courseName: courseData.courseName,
          introduction: courseData.introduction,
          description: courseData.description
        });

        const processedCourse = {
          id: courseData.courseId,
          title: courseData.courseName,
          image: courseData.imageUrl 
            ? { uri: courseData.imageUrl }
            : require('../../assets/images/buddha.png'),
          price: courseData.price,
          rating: courseData.rating,
          enrolledStudents: courseData.enrolledStudents,
          includes: [
            `${courseData.totalChapters || 0} Chương`,
            `${courseData.totalQuestions || 0} Câu hỏi`
          ],
          learning: courseData.introduction ? courseData.introduction.split(',').map(item => item.trim()) : [],
          description: courseData.description,
          categoryName: courseData.categoryName
        };

        console.log('Processed Learning Items:', {
          original: courseData.introduction,
          processed: processedCourse.learning
        });
        
        setCourseDetails(processedCourse);

        // Nếu có masterId thì mới gọi API lấy thông tin master
        if (courseData.masterId) {
          try {
            // Thêm log để debug
            console.log('Calling Master API for masterId:', courseData.masterId);
            
            const masterResponse = await axios.get(
              `${API_CONFIG.baseURL}/api/Master/${courseData.masterId}`,
              config
            );

            // Log response từ API master
            console.log('Master API Response:', masterResponse.data);

            if (masterResponse.data?.isSuccess) {
              const masterData = masterResponse.data.data;
              // Log masterData để kiểm tra
              console.log('Processed Master Data:', masterData);
              
              setMasterInfo({
                name: masterData.masterName ?? 'Chưa có tên',
                title: masterData.title ?? 'Master',
                rating: masterData.rating ?? 4.0,
                bio: masterData.biography ?? 'Chưa có thông tin',
                experience: masterData.experience ?? 'Chưa cập nhật',
                expertise: masterData.expertise ?? 'Chưa cập nhật',
                image: masterData.imageUrl 
                  ? { uri: masterData.imageUrl }
                  : require('../../assets/images/buddha.png'),
                achievements: [
                  masterData.experience ? `${masterData.experience} kinh nghiệm` : 'Chưa cập nhật kinh nghiệm',
                  masterData.expertise ?? 'Chưa cập nhật chuyên môn'
                ]
              });
            } else {
              console.warn('Master API không trả về dữ liệu thành công');
            }
          } catch (masterError) {
            console.error('Chi tiết lỗi khi lấy thông tin master:', masterError.response || masterError);
          }
        }
      } else {
        throw new Error('Không thể tải thông tin khóa học');
      }

      console.log('Course API Response:', {
        rawResponse: response.data,
        courseData: response.data.data,
        hasCalculatedFields: {
          rating: response.data.data.rating,
          enrolledStudents: response.data.data.enrolledStudents,
          totalChapters: response.data.data.totalChapters,
          totalDuration: response.data.data.totalDuration
        }
      });
    } catch (error) {
      console.error('Lỗi:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin khóa học');
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  // Render main content only when course details are available
  return courseDetails ? (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Fixed Header with back button, title and cart */}
        <SafeAreaView style={styles.fixedHeader}>
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.courseTitle}>{courseDetails.title}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingScore}>
              {courseDetails.rating ? courseDetails.rating.toFixed(1) : '0.0'}
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(courseDetails.rating || 0) ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>• {courseDetails.enrolledStudents} người đăng ký</Text>
          </View>
        </SafeAreaView>
        
        {/* Thumbnail Image */}
        
        
        {/* Scrollable Content */}
        <ScrollView style={styles.scrollContent}>
        <Image 
          source={courseDetails.image} 
          style={styles.thumbnailImage}
        />
          {/* Course Includes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This course includes:</Text>
            <View style={styles.includesContainer}>
              {courseDetails.includes.map((item, index) => (
                <View key={index} style={styles.includeItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.includeText}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* What You'll Learn Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bạn sẽ được học:</Text>
            {courseDetails && courseDetails.learning && courseDetails.learning.length > 0 ? (
              courseDetails.learning.map((item, index) => (
                <View key={index} style={styles.learningItem}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={[styles.learningText, {marginLeft: 10}]}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.learningText, {marginLeft: 10}]}>Chưa có nội dung học tập</Text>
            )}
          </View>
          
          {/* Description Section - Now Collapsible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả:</Text>
            <Text style={styles.descriptionText}>
              {showFullDescription 
                ? courseDetails.description 
                : courseDetails.description?.substring(0, 150) + (courseDetails.description?.length > 150 ? '...' : '')}
            </Text>
            
            {showFullDescription ? (
              <>
                {/* About Master Section - Only visible when expanded */}
                <View style={styles.masterSection}>
                  <Text style={styles.subSectionTitle}>Thông tin của thầy:</Text>
                  <View style={styles.instructorContainer}>
                    <Image source={masterInfo?.image} style={styles.instructorImage} />
                    <View style={styles.instructorInfo}>
                      <Text style={styles.instructorName}>{masterInfo?.name}</Text>
                      <Text style={styles.instructorTitle}>{masterInfo?.title}</Text>
                      <View style={styles.instructorRating}>
                        <Text style={{color: '#fff', marginRight: 5}}>{masterInfo?.rating}</Text>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= masterInfo?.rating ? "star" : "star-outline"}
                            size={14}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                      <Text style={styles.instructorBio}>{masterInfo?.bio}</Text>
                      <Text style={styles.instructorExpertise}>Chuyên môn: {masterInfo?.expertise}</Text>
                    </View>
                  </View>
                  
                  {/* Instructor Achievements */}
                  <View style={styles.achievementsContainer}>
                    {masterInfo?.achievements.map((achievement, index) => (
                      <View key={index} style={styles.achievementItem}>
                        <Ionicons 
                          name={index === 0 ? "videocam" : index === 1 ? "trophy" : "people"} 
                          size={20} 
                          color="#FFD700" 
                        />
                        <Text style={styles.achievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {/* See Less Button */}
                <TouchableOpacity 
                  style={styles.seeMoreButton}
                  onPress={() => setShowFullDescription(false)}
                >
                  <Text style={styles.seeMoreText}>thu gọn</Text>
                  <Ionicons name="chevron-up" size={16} color="#FFD700" />
                </TouchableOpacity>
              </>
            ) : (
              /* See More Button */
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setShowFullDescription(true)}
              >
                <Text style={styles.seeMoreText}>xem thêm</Text>
                <Ionicons name="chevron-down" size={16} color="#FFD700" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Price and Buy Button */}
          <View style={styles.buySection}>
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tổng cộng:</Text>
                <Text style={styles.price}>{courseDetails.price.toLocaleString()} VND</Text>
              </View>
            </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.buyButton}
                onPress={() => router.push({
                  pathname: '/(tabs)/course_payment',
                  params: {
                    courseId: courseDetails.id,
                    courseTitle: courseDetails.title,
                    coursePrice: courseDetails.price,
                    courseImage: courseDetails.image.uri
                  }
                })}
              >
                <Text style={styles.buyButtonText}>Mua</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Space at the bottom for tab bar */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Custom Tab Bar */}
        <CustomTabBar />
      </View>
    </ImageBackground>
  ) : (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Không thể tải thông tin khóa học</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  fixedHeader: {
    width: '100%',
    height: '230',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20
  },
  headerCartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginLeft: 25,
    marginRight: 10

  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 25,
    marginRight: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewCount: {
    color: '#fff',
    fontSize: 14,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  includesContainer: {
    flexDirection: 'column',
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  includeText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, 
  },
  learningText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  buySection: {
    padding: 16,
  },
  priceContainer: {
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceLabel: {
    fontSize: 18,
    color: '#fff',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buyButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#8B0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#8B0000',
    borderColor: '#fff',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructorContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructorImage: {
    width: 100,
    height: 250,
    borderRadius: 8,
    marginRight: 16,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  instructorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  instructorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructorBio: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 20,
  },
  instructorExpertise: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 20,
  },
  achievementsContainer: {
    marginTop: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  thumbnailImage: {
    width: '100%',
    height: 300, 
    resizeMode: 'cover',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  seeMoreText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 5,
  },
  masterSection: {
    marginTop: 20,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#8B0000',
    fontSize: 16,
    textAlign: 'center',
  }
});
