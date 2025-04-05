import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function CourseChapterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Get courseId from params without default fallback
  const { courseId } = params;
  
  const [courseInfo, setCourseInfo] = useState({
    courseName: '',
    rating: '',
    author: '',
    description: ''
  });
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [effectiveCourseId, setEffectiveCourseId] = useState(null);
  const navigation = useNavigation();

  // Load completion data from storage
  useEffect(() => {
    const loadCompletionData = async () => {
      try {
        // Load completed lessons
        const savedLessons = await AsyncStorage.getItem('completedLessons');
        if (savedLessons) {
          setCompletedLessons(JSON.parse(savedLessons));
        }
        
        // Load completed quizzes
        const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
        if (savedQuizzes) {
          setCompletedQuizzes(JSON.parse(savedQuizzes));
        }
      } catch (error) {
        console.log('Error loading completion data:', error);
      }
    };
    
    loadCompletionData();
  }, []);

  // Update the useEffect that initializes courseId
  useEffect(() => {
    const initCourseId = async () => {
      // First check if we have a courseId from params
      if (params.courseId) {
        // Log what we received from params
        console.log('Received courseId from params:', params.courseId);
        const cleanCourseId = String(params.courseId).trim();
        console.log('Using courseId from params:', cleanCourseId);
        setEffectiveCourseId(cleanCourseId);
        return;
      }
      
      // If no courseId in params, try to get the last viewed course from storage
      try {
        const lastCourseId = await AsyncStorage.getItem('lastViewedCourseId');
        if (lastCourseId) {
          console.log('Using last viewed courseId from storage:', lastCourseId);
          setEffectiveCourseId(lastCourseId);
          return;
        }
      } catch (err) {
        console.error('Error getting last viewed course:', err);
      }
      
      console.log('No courseId found, cannot load course');
      Alert.alert('Thông báo', 'Không thể tìm thấy khóa học. Vui lòng thử lại.');
      router.back();
    };
    
    initCourseId();
  }, [params.courseId]);

  // Fetch course and chapters when courseId changes
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) {
        console.log('No courseId provided, cannot fetch course data');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      console.log('Fetching course data for courseId:', courseId);
      
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }
        
        // 1. Fetch course details
        const courseResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Course/get-course/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Course details response:', courseResponse.data);
        
        if (courseResponse.data?.isSuccess && courseResponse.data.data) {
          const courseData = courseResponse.data.data;
          
          // Set course info
          setCourseInfo({
            courseName: courseData.courseName || '',
            rating: courseData.rating?.toString() || '',
            author: courseData.author || '',
            description: courseData.description || ''
          });
          
          // Set registered status
          setIsRegistered(courseData.isRegistered || false);
          
          // Set quiz ID if available
          if (courseData.quizId) {
            setQuizId(courseData.quizId);
          }
          
          // 2. Fetch chapters for this course
          await fetchChapters(courseId, token);
        } else {
          console.error('Failed to fetch course:', courseResponse.data?.message);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);
  
  // Separate function to fetch chapters
  const fetchChapters = async (courseId, token) => {
    try {
      console.log('Fetching chapters for courseId:', courseId);
      
      const chaptersResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/Chapter/get-all-chapters-by-courseId`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            id: courseId
          }
        }
      );
      
      console.log('Chapters response:', chaptersResponse.data);
      
      if (chaptersResponse.data?.isSuccess && chaptersResponse.data.data) {
        setChapters(chaptersResponse.data.data);
        return true;
      } else {
        console.error('Failed to fetch chapters:', chaptersResponse.data?.message);
        return false;
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return false;
    }
  };
  
  // Navigate to video when selecting a chapter
  const navigateToChapter = (chapter) => {
    if (!chapter || !chapter.chapterId) {
      console.error('Invalid chapter object', chapter);
      return;
    }
    
    console.log('Navigating to chapter:', chapter.chapterId);
    
    router.push({
      pathname: '/(tabs)/course_video',
      params: {
        chapterId: chapter.chapterId,
        courseId: courseId
      }
    });
  };
  
  // Navigate to quiz
  const navigateToQuiz = () => {
    if (!quizId) {
      console.error('No quiz ID available');
      return;
    }
    
    console.log('Navigating to quiz:', quizId);
    
    router.push({
      pathname: '/(tabs)/course_quiz_start',
      params: {
        quizId: quizId,
        courseId: courseId
      }
    });
  };
  
  // Check if all chapters are completed
  const checkAllChaptersCompleted = () => {
    if (!chapters || chapters.length === 0) return false;
    
    return chapters.every(chapter => 
      completedLessons[chapter.chapterId] === true
    );
  };

  // Fix the handleBackNavigation function error
  const handleBackNavigation = () => {
    if (params.source === 'your_paid_courses') {
      router.push('/(tabs)/your_paid_courses');
    } else {
      router.push('/(tabs)/courses');
    }
  };

  const toggleChapter = async (chapter) => {
    try {
      // Validate we have a valid chapter object
      if (!chapter) {
        console.error('Invalid chapter object:', chapter);
        return;
      }
      
      // Handle expanding chapter section
      if (expandedChapter === chapter.chapterId) {
        setExpandedChapter(null);
      } else {
        setExpandedChapter(chapter.chapterId);
      }
      
      // Make sure we have a valid chapterId before proceeding
      if (!chapter.chapterId) {
        console.error('Invalid chapter ID - chapterId is undefined');
        Alert.alert(
          'Lỗi',
          'Không thể tải thông tin chương học. Vui lòng thử lại sau.'
        );
        return;
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem video');
        router.push('/login');
        return;
      }

      console.log('Navigating to chapter:', chapter.chapterId);
      
      // Navigate to video
      router.push({
        pathname: '/(tabs)/course_video',
        params: {
          chapterId: chapter.chapterId,
          courseId: courseId // Make sure courseId is valid here
        }
      });

    } catch (error) {
      console.error('Error in toggleChapter:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải thông tin chương học. Vui lòng thử lại sau.'
      );
    }
  };
  
  const navigateToLesson = (lessonId) => {
    router.push({
      pathname: '/(tabs)/course_video',
      params: { lessonId }
    });
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalLessons = 9; // Total number of lessons in the course
    const completedCount = Object.values(completedLessons).filter(Boolean).length;
    return Math.round((completedCount / totalLessons) * 100);
  };

  // Then update the renderFinalExamButton function to use this check
  const renderFinalExamButton = () => {
    const allChaptersCompleted = checkAllChaptersCompleted();
    
    return (
      <TouchableOpacity 
        style={[
          styles.finalExamContainer,
          !allChaptersCompleted && styles.disabledExamContainer
        ]}
        onPress={() => {
          if (!isRegistered) {
            Alert.alert(
              "Đăng ký khóa học",
              "Bạn cần đăng ký khóa học để làm bài kiểm tra cuối khóa.",
              [{ text: "OK" }]
            );
            return;
          }
          
          if (!allChaptersCompleted) {
            Alert.alert(
              "Hoàn thành khóa học",
              "Bạn cần hoàn thành tất cả các bài học trước khi làm bài kiểm tra cuối khóa.",
              [{ text: "OK" }]
            );
            return;
          }
          
          // If registered and all chapters completed, navigate to quiz
          router.push({
            pathname: '/(tabs)/course_quiz_start',
            params: { 
              courseId: effectiveCourseId
            }
          });
        }}
      >
        <View style={styles.finalExamContent}>
          <View style={styles.finalExamIconContainer}>
            <Ionicons name="document-text" size={24} color="#fff" />
          </View>
          <View style={styles.finalExamTextContainer}>
            <Text style={styles.finalExamTitle}>Bài kiểm tra cuối khóa</Text>
            <Text style={styles.finalExamDescription}>
              {allChaptersCompleted 
                ? "Kiểm tra kiến thức của bạn"
                : "Hoàn thành tất cả bài học để mở khóa"}
            </Text>
          </View>
          <View style={styles.finalExamStatus}>
            {completedQuizzes[quizId] ? (
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            ) : allChaptersCompleted ? (
              <Ionicons name="chevron-forward-circle" size={28} color="#fff" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#aaa" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackNavigation} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Course Title and Rating */}
        <View style={styles.titleContainer}>
          <Text style={styles.courseTitle}>
            {courseInfo.courseName || params.courseName || 'Introduction to Feng Shui'}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              {courseInfo.rating || params.courseRating || '4.5'}
            </Text>
            <View style={styles.starsContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star-half" size={16} color="#FFD700" />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Main Course Image */}
          <Image 
            source={
              params.courseImage 
                ? { uri: params.courseImage }
                : require('../../assets/images/koi_image.jpg')
            }
            style={styles.fishImage}
            resizeMode="cover"
          />
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description:</Text>
            <Text style={styles.descriptionText}>
              {courseInfo.description || params.courseDescription || 'Phong thủy là một trong những học thuyết cổ xưa của phương Đông, nghiên cứu về sự ảnh hưởng của hướng gió, dòng nước, địa hình và các yếu tố tự nhiên đến đời sống con người. Phong thủy không chỉ áp dụng trong xây dựng nhà cửa, bố trí nội thất mà còn trong kinh doanh, sức khỏe và vận mệnh cá nhân, giúp cân bằng năng lượng và thu hút tài lộc, may mắn.'}
            </Text>
          </View>

          {/* Course Chapters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course chapters</Text>
            
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : chapters.length > 0 ? (
              chapters.map((chapter, index) => (
                <TouchableOpacity 
                  key={chapter.chapterId}
                  style={[
                    styles.chapterContainer,
                    expandedChapter === chapter.chapterId && styles.expandedChapter,
                    chapter.status === 'Done' && styles.completedChapter
                  ]}
                  onPress={() => toggleChapter(chapter)}
                >
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterNumber}>Chapter {index + 1}</Text>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Ionicons 
                      name={expandedChapter === chapter.chapterId ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  {expandedChapter === chapter.chapterId && (
                    <View style={styles.lessonList}>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => toggleChapter(chapter)}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>{chapter.description || "Video lesson"}</Text>
                        <View style={styles.durationContainer}>
                          <Ionicons name="time-outline" size={16} color="#fff" />
                          <Text style={styles.durationText}>{chapter.duration || "10:00"}</Text>
                        </View>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <>
                {/* Chapter 1 */}
                <TouchableOpacity 
                  style={[
                    styles.chapterContainer,
                    expandedChapter === 1 && styles.expandedChapter
                  ]}
                  onPress={() => toggleChapter({chapterId: 1, title: "Phong thủy cơ bản"})}
                >
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterNumber}>Chapter 1</Text>
                    <Text style={styles.chapterTitle}>Phong thủy cơ bản</Text>
                    <Ionicons 
                      name={expandedChapter === 1 ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  {expandedChapter === 1 && (
                    <View style={styles.lessonList}>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section1-lesson1')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>1. Giới thiệu về Phong thủy cổ học</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section1-lesson2')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>2. Ngũ hành: Kim, Mộc, Thủy, Hỏa, Thổ</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section1-lesson3')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>3. Âm dương và tứ tượng</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
                
                {/* Chapter 2 */}
                <TouchableOpacity 
                  style={[
                    styles.chapterContainer,
                    expandedChapter === 2 && styles.expandedChapter
                  ]}
                  onPress={() => toggleChapter({chapterId: 2, title: "Cách xem hướng"})}
                >
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterNumber}>Chapter 2</Text>
                    <Text style={styles.chapterTitle}>Cách xem hướng</Text>
                    <Ionicons 
                      name={expandedChapter === 2 ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  {expandedChapter === 2 && (
                    <View style={styles.lessonList}>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section2-lesson1')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>1. Bát quái và phương vị</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section2-lesson2')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>2. Xác định hướng nhà và phòng</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section2-lesson3')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>3. Hướng tốt cho từng mệnh</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
                
                {/* Chapter 3 */}
                <TouchableOpacity 
                  style={[
                    styles.chapterContainer,
                    expandedChapter === 3 && styles.expandedChapter
                  ]}
                  onPress={() => toggleChapter({chapterId: 3, title: "Thủy mạch trong phong thủy"})}
                >
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterNumber}>Chapter 3</Text>
                    <Text style={styles.chapterTitle}>Thủy mạch trong phong thủy</Text>
                    <Ionicons 
                      name={expandedChapter === 3 ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  {expandedChapter === 3 && (
                    <View style={styles.lessonList}>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section3-lesson1')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>1. Vai trò của thủy trong phong thủy</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.lessonItem}
                        onPress={() => navigateToLesson('section3-lesson2')}
                      >
                        <Image 
                          source={require('../../assets/images/default-avatar.png')} 
                          style={styles.lessonThumbnail}
                        />
                        <Text style={styles.lessonTitle}>2. Hồ cá Koi và phong thủy</Text>
                        <Ionicons name="play" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            {/* Final Exam */}
            {renderFinalExamButton()}
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
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
    backgroundColor: 'rgba(100, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#fff',
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  fishImage: {
    width: width,
    height: width * 0.7,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#fff',
    lineHeight: 20,
  },
  chapterContainer: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  chapterNumber: {
    color: '#fff',
    marginRight: 12,
    fontWeight: 'bold',
  },
  chapterTitle: {
    color: '#fff',
    flex: 1,
    fontWeight: 'bold',
  },
  chapterDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  durationText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
  lessonList: {
    padding: 8,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  lessonThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#444',
  },
  lessonTitle: {
    color: '#fff',
    flex: 1,
    marginRight: 12,
    fontSize: 14,
  },

  registerButton: {
    backgroundColor: '#8B0000',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',

  },
  finalExamContainer: {
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f8f0f0',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  finalExamContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  finalExamIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalExamTextContainer: {
    flex: 1,
  },
  finalExamTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  finalExamDescription: {
    color: '#fff',
    fontSize: 14,
  },
  finalExamStatus: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedChapter: {
    backgroundColor: 'rgba(0, 128, 0, 0.3)',
  },
  completedIcon: {
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  disabledExamContainer: {
    opacity: 0.7,
  },
});
