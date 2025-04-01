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
  const { courseId = '0AA77A49-CAFF-4F01-B', source, courseName, courseDescription, courseImage, courseRating } = useLocalSearchParams();
  const [expandedChapter, setExpandedChapter] = useState(false);
  const [completedLessons, setCompletedLessons] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(null);
  const navigation = useNavigation();
  const [isRegistered, setIsRegistered] = useState(true);
  const [courseInfo, setCourseInfo] = useState({
    courseName: '',
    rating: '',
    author: '',
    description: ''
  });
  const [quizId, setQuizId] = useState(null);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load completed lessons
        const savedLessons = await AsyncStorage.getItem('completedLessons');
        if (savedLessons) {
          const parsedLessons = JSON.parse(savedLessons);
          setCompletedLessons(parsedLessons);
        }
        
        // Load completed quizzes
        const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
        if (savedQuizzes) {
          setCompletedQuizzes(JSON.parse(savedQuizzes));
        }
      } catch (error) {
        console.log('Error loading user data', error);
      }
    };
    
    loadUserData();
  }, []);

  // Modify your existing useEffect to fetch both course details and chapters
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId) {
          console.log('CourseId not found, using fallback data');
          setChapters(getFallbackChapters());
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        
        // Log the courseId to help debug
        console.log('Fetching data for courseId:', courseId);
        
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem nội dung khóa học');
          router.push('/login');
          return;
        }

        // 1. Fetch course details
        try {
          const courseDetailsResponse = await axios.get(
            `${API_CONFIG.baseURL}/api/Course/get-course/${courseId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Course details API response:', courseDetailsResponse.data);

          if (courseDetailsResponse.data?.isSuccess && courseDetailsResponse.data?.data) {
            const courseData = courseDetailsResponse.data.data;
            setCourseInfo({
              courseName: courseData.courseName || 'Introduction to Feng Shui',
              rating: courseData.rating?.toString() || '4.5',
              author: courseData.author || 'Sensei Tanaka',
              description: courseData.description || 'Khóa học cơ bản về phong thủy và ứng dụng trong đời sống hàng ngày.'
            });
            
            // Set quizId from course data or use a default
            setQuizId(courseData.quizId || `${courseId}-final-quiz`);
          }
        } catch (courseError) {
          console.error('Error fetching course details:', courseError);
        }

        // 2. Fetch chapters
        await fetchChapters();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setChapters(getFallbackChapters());
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Màn hình Chapter được focus - Tải lại dữ liệu');
      fetchChapters();
    });

    return unsubscribe;
  }, [navigation]);

  // If you need a temporary solution before API updates, you can set a default value
  useEffect(() => {
    // Default quiz ID if not available from API
    if (!quizId) {
      setQuizId(`${courseId}-final-quiz`);
    }
  }, [courseId, quizId]);


  //const handleBackNavigation = () => {
  //  if (source === 'your_paid_courses') {
  //    router.push('/(tabs)/your_paid_courses');
  //  } else {
  //    router.back();
  //  }
 // };

  const toggleChapter = async (chapter) => {
    try {
      if (expandedChapter === chapter.chapterId) {
        setExpandedChapter(null);
      } else {
        setExpandedChapter(chapter.chapterId);
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem video');
        router.push('/login');
        return;
      }

      // No need to check API first, just navigate to video
      router.push({
        pathname: '/(tabs)/course_video',
        params: {
          chapterId: chapter.chapterId,
          courseId: courseId
        }
      });

    } catch (error) {
      console.error('Error:', error);
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

  // Navigate to a quiz
  const navigateToQuiz = (quizId) => {
    router.push({
      pathname: '/(tabs)/course_quiz',
      params: { 
        quizId: '04205955-CACE-4F8C-8',
        courseId: courseId
      }
    });
  };

  const getFallbackChapters = () => {
    return [
      {
        chapterId: 'chapter-1',
        title: 'Phong thủy cơ bản',
        status: 'Done',
        description: 'Các khái niệm cơ bản về phong thủy cổ học',
        courseId: courseId,
        videoUrl: 'https://example.com/video1.mp4'
      },
      {
        chapterId: 'chapter-2',
        title: 'Cách xem hướng',
        status: 'InProgress',
        description: 'Các kỹ thuật xác định và phân tích hướng trong phong thủy',
        courseId: courseId,
        videoUrl: 'https://example.com/video2.mp4'
      },
      {
        chapterId: 'chapter-3',
        title: 'Thủy mạch trong phong thủy',
        status: 'NotStarted',
        description: 'Vai trò của nước và dòng chảy trong phong thủy',
        courseId: courseId,
        videoUrl: 'https://example.com/video3.mp4'
      }
    ];
  };

  // Add this function to check if all chapters are completed
  const checkAllChaptersCompleted = () => {
    if (!chapters || chapters.length === 0) return false;
    
    // Check if every chapter has been completed
    const allCompleted = chapters.every(chapter => 
      completedLessons[chapter.chapterId] === true
    );
    
    return allCompleted;
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
              courseId: courseId
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

  const fetchChapters = async () => {
    try {
      if (!courseId) {
        console.log('CourseId not found, using fallback data');
        setChapters(getFallbackChapters());
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem nội dung khóa học');
        router.push('/login');
        return;
      }

      console.log('Fetching chapters for courseId:', courseId);
      
      // Use the correct API endpoint
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getAllChaptersByCourseId}`, 
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

      console.log('Chapters API Response:', response.data);

      if (response.data?.isSuccess) {
        setChapters(response.data.data);
      } else {
        console.warn('API returned unsuccessful result, using fallback data');
        setChapters(getFallbackChapters());
      }
      
    } catch (error) {
      console.error('Error fetching chapters:', error);
      console.log('Using fallback data');
      setChapters(getFallbackChapters());
    } finally {
      setIsLoading(false);
    }
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
            {courseInfo.courseName || courseName || 'Introduction to Feng Shui'}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              {courseInfo.rating || courseRating || '4.5'}
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
              courseImage 
                ? { uri: courseImage }
                : require('../../assets/images/koi_image.jpg')
            }
            style={styles.fishImage}
            resizeMode="cover"
          />
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description:</Text>
            <Text style={styles.descriptionText}>
              {courseInfo.description || courseDescription || 'Phong thủy là một trong những học thuyết cổ xưa của phương Đông, nghiên cứu về sự ảnh hưởng của hướng gió, dòng nước, địa hình và các yếu tố tự nhiên đến đời sống con người. Phong thủy không chỉ áp dụng trong xây dựng nhà cửa, bố trí nội thất mà còn trong kinh doanh, sức khỏe và vận mệnh cá nhân, giúp cân bằng năng lượng và thu hút tài lộc, may mắn.'}
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
