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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { courseId, courseData, source, orderStatus } = useLocalSearchParams();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [masterInfo, setMasterInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Thêm hàm handleBack
  const handleBack = () => {
    if (source === 'your_paid_courses') {
      router.push('/(tabs)/your_paid_courses');
    } else {
      router.push('/(tabs)/courses');
    }
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
      setIsLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getCourseById.replace('{id}', courseId)}`;
      
      const response = await axios.get(url, config);

      if (response.data?.isSuccess) {
        const courseData = response.data.data;

        const processedCourse = {
          id: courseData.courseId,
          title: courseData.courseName,
          image: courseData.imageUrl ? { uri: courseData.imageUrl } : require('../../assets/images/koi_image.jpg'),

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
        
        setCourseDetails(processedCourse);

        // Nếu có masterId thì mới gọi API lấy thông tin master
        if (courseData.masterId) {
          try {
            
            const masterResponse = await axios.get(
              `${API_CONFIG.baseURL}/api/Master/${courseData.masterId}`,
              config
            );


            if (masterResponse.data?.isSuccess) {
              const masterData = masterResponse.data.data;
              
              setMasterInfo({
                name: masterData.masterName ?? 'Chưa có tên',
                title: masterData.title ?? 'Master',
                rating: masterData.rating ?? 4.0,
                bio: masterData.biography ?? 'Chưa có thông tin',
                experience: masterData.experience ?? 'Chưa cập nhật',
                expertise: masterData.expertise ?? 'Chưa cập nhật',
                image: masterData.imageUrl ? { uri: masterData.imageUrl } : require('../../assets/images/koi_image.jpg'),
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
    } catch (error) {
      console.error('Lỗi:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin khóa học');
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm kiểm tra xem có hiển thị nút mua hay không
  const shouldShowBuyButton = () => {
    // Nếu đến từ màn hình your_paid_courses với trạng thái Pending hoặc PendingConfirm thì ẩn nút mua
    if (source === 'your_paid_courses') {
      if (orderStatus === 'Pending' || orderStatus === 'PendingConfirm') {
        return false;
      }
    }
    return true;
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
        
        {/* Premium Header Design */}
        <SafeAreaView style={styles.fixedHeader}>
          <LinearGradient
            colors={['#8B0000', '#4A0404']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Top Navigation Bar */}
            <View style={styles.topRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
              >
                <Ionicons name="chevron-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              
              <View style={styles.categoryContainer}>
                <LinearGradient
                  colors={['rgba(139, 0, 0, 0.9)', 'rgba(74, 4, 4, 0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.categoryPill}
                >
                  <Ionicons name="bookmark" size={16} color="#FFD700" />
                  <Text style={styles.categoryText}>{courseDetails.categoryName}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Course Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {courseDetails.title}
              </Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                {/* Rating Container */}
                <View style={styles.ratingBox}>
                  <View style={styles.ratingHeader}>
                    <Ionicons name="star" size={18} color="#FFD700" />
                    <Text style={styles.ratingValue}>
                      {courseDetails.rating ? courseDetails.rating.toFixed(1) : '0.0'}
                    </Text>
                  </View>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= courseDetails.rating
                            ? "star"
                            : star - 0.5 <= courseDetails.rating
                            ? "star-half"
                            : "star-outline"
                        }
                        size={12}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.statsDivider} />

                {/* Enrollment Container */}
                <View style={styles.enrollmentBox}>
                  <View style={styles.enrollmentHeader}>
                    <Ionicons name="people" size={18} color="#FFD700" />
                    <Text style={styles.enrollmentValue}>
                      {courseDetails.enrolledStudents}
                    </Text>
                  </View>
                  <Text style={styles.enrollmentLabel}>Học viên</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          
          {/* Curved Bottom Edge */}
          <View style={styles.headerCurve} />
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
            <Text style={styles.sectionTitle}>Khóa học bao gồm:</Text>
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
                  <LinearGradient
                    colors={['rgba(139, 0, 0, 0.2)', 'rgba(139, 0, 0, 0.05)']}
                    style={styles.masterGradient}
                  >
                    <View style={styles.masterHeader}>
                      <Ionicons name="school" size={24} color="#FFD700" />
                      <Text style={styles.masterHeaderTitle}>Thông tin giảng viên</Text>
                    </View>

                    <View style={styles.instructorContainer}>
                      <View style={styles.instructorImageContainer}>
                        <Image source={masterInfo?.image} style={styles.instructorImage} />
                        <View style={styles.instructorBadge}>
                          <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
                        </View>
                      </View>

                      <View style={styles.instructorInfo}>
                        <Text style={styles.instructorName}>{masterInfo?.name}</Text>
                        <View style={styles.titleContainer}>
                          <Ionicons name="ribbon" size={16} color="#FFD700" />
                          <Text style={styles.instructorTitle}>{masterInfo?.title}</Text>
                        </View>

                        <View style={styles.instructorRating}>
                          <Text style={styles.ratingNumber}>{masterInfo?.rating}</Text>
                          <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={
                                  star <= masterInfo?.rating
                                    ? "star"
                                    : star - 0.5 <= masterInfo?.rating
                                    ? "star-half"
                                    : "star-outline"
                                }
                                size={14}
                                color="#FFD700"
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.bioSection}>
                      <Text style={styles.bioTitle}>Giới thiệu</Text>
                      <Text style={styles.instructorBio}>{masterInfo?.bio}</Text>
                    </View>

                    <View style={styles.expertiseSection}>
                      <Text style={styles.expertiseTitle}>Chuyên môn</Text>
                      <Text style={styles.instructorExpertise}>{masterInfo?.expertise}</Text>
                    </View>

                    <View style={styles.achievementsContainer}>
                      <Text style={styles.achievementsTitle}>Thành tựu</Text>
                      {masterInfo?.achievements.map((achievement, index) => (
                        <View key={index} style={styles.achievementItem}>
                          <View style={styles.achievementIcon}>
                            <Ionicons 
                              name={index === 0 ? "time" : "trophy"} 
                              size={20} 
                              color="#FFD700" 
                            />
                          </View>
                          <Text style={styles.achievementText}>{achievement}</Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </View>
                
                {/* See Less Button */}
                <TouchableOpacity 
                  style={styles.seeMoreButton}
                  onPress={() => setShowFullDescription(false)}
                >
                  <Text style={styles.seeMoreText}>Thu gọn</Text>
                  <Ionicons name="chevron-up" size={16} color="#FFD700" />
                </TouchableOpacity>
              </>
            ) : (
              /* See More Button */
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setShowFullDescription(true)}
              >
                <Text style={styles.seeMoreText}>Xem thêm</Text>
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
            
            {shouldShowBuyButton() && (
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
            )}
          </View>
          
          {/* Space at the bottom for tab bar */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Custom Tab Bar */}
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
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  fixedHeader: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  categoryContainer: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  categoryText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.7,
  },
  titleSection: {
    paddingHorizontal: 20,
  },
  courseTitle: {
    fontSize: Math.round(width * 0.065),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.8,
    lineHeight: Math.round(width * 0.085),
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratingBox: {
    flex: 1,
    alignItems: 'center',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  statsDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
  },
  enrollmentBox: {
    flex: 1,
    alignItems: 'center',
  },
  enrollmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  enrollmentValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  enrollmentLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  headerCurve: {
    height: 24,
    backgroundColor: '#4A0404',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginTop: -24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  scrollContent: {
    flex: 1,
    paddingTop: 15,
  },
  thumbnailImage: {
    width: '92%',
    height: Math.round(width * 0.6),
    resizeMode: 'cover',
    alignSelf: 'center',
    borderRadius: 25,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  section: {
    padding: '6%',
    marginBottom: '4%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 25,
    margin: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sectionTitle: {
    fontSize: Math.round(width * 0.05),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: '5%',
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
    paddingLeft: '4%',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  includesContainer: {
    width: '100%',
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.15)',
    padding: '5%',
    borderRadius: 18,
    marginBottom: '4%',
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  includeText: {
    color: '#FFFFFF',
    fontSize: Math.round(width * 0.038),
    marginLeft: '3%',
    flex: 1,
    letterSpacing: 0.5,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: '5%',
    borderRadius: 18,
    marginBottom: '4%',
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  learningText: {
    color: '#FFFFFF',
    fontSize: Math.round(width * 0.038),
    flex: 1,
    lineHeight: Math.round(width * 0.055),
    letterSpacing: 0.5,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: Math.round(width * 0.038),
    lineHeight: Math.round(width * 0.058),
    marginBottom: '4%',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  masterSection: {
    marginTop: '6%',
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.3)',
  },
  masterGradient: {
    padding: '6%',
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 12,
  },
  masterHeaderTitle: {
    fontSize: Math.round(width * 0.045),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  instructorContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructorImageContainer: {
    position: 'relative',
  },
  instructorImage: {
    width: Math.round(width * 0.28),
    height: Math.round(width * 0.28),
    borderRadius: Math.round(width * 0.14),
    borderWidth: 3,
    borderColor: '#8B0000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  instructorBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B0000',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  instructorInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  instructorName: {
    fontSize: Math.round(width * 0.045),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructorTitle: {
    fontSize: Math.round(width * 0.038),
    color: '#FFD700',
    marginLeft: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  instructorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingNumber: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: Math.round(width * 0.038),
  },
  starsContainer: {
    flexDirection: 'row',
  },
  bioSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  bioTitle: {
    fontSize: Math.round(width * 0.04),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  instructorBio: {
    color: '#FFFFFF',
    fontSize: Math.round(width * 0.038),
    lineHeight: Math.round(width * 0.055),
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  expertiseSection: {
    backgroundColor: 'rgba(139, 0, 0, 0.15)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  expertiseTitle: {
    fontSize: Math.round(width * 0.04),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  achievementsContainer: {
    marginTop: 15,
  },
  achievementsTitle: {
    fontSize: Math.round(width * 0.04),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.3)',
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: Math.round(width * 0.035),
    letterSpacing: 0.5,
  },
  buySection: {
    padding: '6%',
    backgroundColor: 'rgba(0, 0, 0, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  priceContainer: {
    marginBottom: '5%',
    backgroundColor: 'rgba(139, 0, 0, 0.12)',
    padding: '5%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.25)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: Math.round(width * 0.042),
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: Math.round(width * 0.07),
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    width: '100%',
  },
  buyButton: {
    backgroundColor: '#8B0000',
    paddingVertical: Math.round(width * 0.045),
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: Math.round(width * 0.048),
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '4%',
    marginTop: '3%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  seeMoreText: {
    color: '#FFD700',
    fontSize: Math.round(width * 0.035),
    fontWeight: 'bold',
    marginRight: '2%',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: Math.round(width * 0.04),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
