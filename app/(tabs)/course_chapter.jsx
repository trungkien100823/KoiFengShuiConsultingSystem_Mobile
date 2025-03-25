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

const { width } = Dimensions.get('window');

export default function CourseChapterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [expandedChapter, setExpandedChapter] = useState(false);
  const [completedLessons, setCompletedLessons] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChapter, setCurrentChapter] = useState(null);

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

  // Thêm useEffect để gọi API
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        if (!params.courseId) {
          throw new Error('Không tìm thấy thông tin khóa học');
        }
        
        setIsLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem nội dung khóa học');
          router.push('/login');
          return;
        }

        const response = await axios.get(
          `${API_CONFIG.baseURL}/api/Chapter/get-all-chapters-by-courseId`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: {
              id: params.courseId
            }
          }
        );

        console.log('API Response:', response.data);

        if (response.data?.isSuccess) {
          setChapters(response.data.data);
        } else {
          throw new Error(response.data?.message || 'Không thể tải danh sách chương');
        }

      } catch (error) {
        console.error('Error fetching chapters:', error);
        Alert.alert(
          'Lỗi',
          'Không thể tải danh sách chương học. Vui lòng thử lại sau.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapters();
  }, [params.courseId]);

  const handleBackNavigation = () => {
    if (params.source === 'your_paid_courses') {
      router.push('/(tabs)/your_paid_courses');
    } else {
      router.back();
    }
  };

  const toggleChapter = async (chapter) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem video');
        router.push('/login');
        return;
      }

      if (chapter.status === 'Done') {
        Alert.alert(
          'Thông báo',
          'Bạn đã hoàn thành chương học này, bạn có muốn xem lại?',
          [
            {
              text: 'Không',
              style: 'cancel'
            },
            {
              text: 'Có',
              onPress: () => {
                router.push({
                  pathname: '/(tabs)/course_video',
                  params: {
                    chapterId: chapter.chapterId,
                    courseId: params.courseId
                  }
                });
              }
            }
          ]
        );
        return;
      }

      // Nếu chưa hoàn thành thì chuyển thẳng đến trang video
      router.push({
        pathname: '/(tabs)/course_video',
        params: {
          chapterId: chapter.chapterId,
          courseId: params.courseId
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
      pathname: '/(tabs)/course_quiz_start',
      params: { quizId, source: 'chapter' }
    });
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
            {params.courseName || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học'}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{params.courseRating || '4.8'}</Text>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star-half" size={16} color="#FFD700" />
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
              {params.courseDescription || 'Phong thủy là một trong những học thuyết cổ xưa của phương Đông, nghiên cứu về sự ảnh hưởng của hướng gió, dòng nước, địa hình và các yếu tố tự nhiên đến đời sống con người. Phong thủy không chỉ áp dụng trong xây dựng nhà cửa, bố trí nội thất mà còn trong kinh doanh, sức khỏe và vận mệnh cá nhân, giúp cân bằng năng lượng và thu hút tài lộc, may mắn.'}
            </Text>
          </View>

          {/* Course Chapters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course chapters</Text>
            
            {/* Chapter 1 */}
            <TouchableOpacity 
              style={[
                styles.chapterContainer,
                expandedChapter === 1 && styles.expandedChapter
              ]}
              onPress={() => toggleChapter(1)}
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
              onPress={() => toggleChapter(2)}
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

            
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : chapters.length > 0 ? (
              chapters.map((chapter, index) => (
                <TouchableOpacity 
                  key={chapter.chapterId}
                  style={[
                    styles.chapterContainer,
                    chapter.status === 'Done' && styles.completedChapter
                  ]}
                  onPress={() => toggleChapter(chapter)}
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
              ))
            ) : (
              <Text style={styles.noDataText}>Không có chương học nào</Text>
            )}
            
            {/* Final Exam */}
            <View style={styles.finalExamContainer}>
              <TouchableOpacity 
                style={styles.finalExamContent}
                onPress={() => {
                  if (isRegistered) {
                    router.push({
                      pathname: '/(tabs)/course_quiz_start',
                      params: { 
                        quizId: 'final-exam', 
                        source: 'chapter',
                        courseId: '0AA77A49-CAFF-4F01-B'  // Add the courseId parameter
                      }
                    });
                  } else {
                    // Show registration message if not registered
                    Alert.alert(
                      "Đăng ký khóa học",
                      "Bạn cần đăng ký khóa học để làm bài kiểm tra cuối khóa.",
                      [{ text: "OK" }]
                    );
                  }
                }}
              >
                <View style={styles.finalExamIconContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#fff" />
                </View>
                <View style={styles.finalExamTextContainer}>
                  <Text style={styles.finalExamTitle}>Bài kiểm tra cuối khóa</Text>
                  <Text style={styles.finalExamDescription}>Kiểm tra toàn bộ kiến thức từ khóa học</Text>
                </View>
                <View style={styles.finalExamStatus}>
                  {completedQuizzes['final-exam'] ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
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
  },
  ratingText: {
    color: '#fff',
    marginRight: 4,
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
    marginRight: 12,
  },
  finalExamTextContainer: {
    flex: 1,
  },
  finalExamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  finalExamDescription: {
    fontSize: 14,
    color: '#666',
  },
  finalExamStatus: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
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
});
