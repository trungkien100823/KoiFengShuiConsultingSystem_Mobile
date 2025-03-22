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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function CourseChapterScreen() {
  const router = useRouter();
  const [expandedChapter, setExpandedChapter] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [completedLessons, setCompletedLessons] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [lastLesson, setLastLesson] = useState('section1-lesson1');

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check registration status
        const registrationStatus = await AsyncStorage.getItem('courseRegistered');
        setIsRegistered(registrationStatus === 'true');
        
        // Load completed lessons
        const savedLessons = await AsyncStorage.getItem('completedLessons');
        if (savedLessons) {
          const parsedLessons = JSON.parse(savedLessons);
          setCompletedLessons(parsedLessons);
          
          // Find the last lesson or next uncompleted lesson
          const lessonOrder = [
            'section1-lesson1',
            'section1-lesson2',
            'section1-lesson3',
            'section2-lesson1',
            'section2-lesson2',
            'section2-lesson3',
            'section3-lesson1',
            'section3-lesson2',
            'section3-lesson3',
          ];
          
          // Find the last completed lesson or the first uncompleted one
          let lastCompletedIndex = -1;
          for (let i = 0; i < lessonOrder.length; i++) {
            if (parsedLessons[lessonOrder[i]]) {
              lastCompletedIndex = i;
            }
          }
          
          // Set next lesson to be the one after last completed or first if none completed
          const nextLessonIndex = lastCompletedIndex < lessonOrder.length - 1 ? 
            lastCompletedIndex + 1 : 0;
          setLastLesson(lessonOrder[nextLessonIndex]);
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

  const handleBackNavigation = () => {
    router.back();
  };

  const toggleChapter = (chapterNumber) => {
    setExpandedChapter(expandedChapter === chapterNumber ? null : chapterNumber);
  };
  
  const handleRegisterOrContinue = async () => {
    if (!isRegistered) {
      // First-time registration
      try {
        await AsyncStorage.setItem('courseRegistered', 'true');
        setIsRegistered(true);
        
        // Navigate to first lesson
        router.push({
          pathname: '/(tabs)/course_video',
          params: { lessonId: 'section1-lesson1' }
        });
      } catch (error) {
        console.log('Error saving registration', error);
        Alert.alert('Error', 'Failed to register for the course. Please try again.');
      }
    } else {
      // Continue from last position
      router.push({
        pathname: '/(tabs)/course_video',
        params: { lessonId: lastLesson }
      });
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
          <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Course Title and Rating */}
        <View style={styles.titleContainer}>
          <Text style={styles.courseTitle}>Đại Đạo Chỉ Giản - Phong Thủy Cổ Học</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>4.8</Text>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star-half" size={16} color="#FFD700" />
            <Text style={styles.ratingCount}>(128 ratings)</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Main Fish Image */}
          <Image 
            source={require('../../assets/images/koi_image.jpg')}
            style={styles.fishImage}
            resizeMode="cover"
          />
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description:</Text>
            <Text style={styles.descriptionText}>
              Phong thủy là một trong những Phong Thủy Cổ Học Lượng đạo cho học viên có thể hiểu rõ về tất cả các khía cạnh thực hành trong phong thủy, giúp bạn vượt qua khó khăn và tận hưởng cuộc sống tốt đẹp hơn. Khóa học được giảng dạy bởi Thầy Sư Nguyễn Trung Mạnh, một trong những chuyên gia hàng đầu về phong thủy tại Việt Nam. Thầy đã có hơn 20 năm kinh nghiệm và đã giúp đỡ vô số người thông qua việc áp dụng các nguyên tắc phong thủy cổ học.
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
                  
                  {/* Chapter 1 Quiz */}
                  <TouchableOpacity 
                    style={[styles.lessonItem, styles.quizItem]}
                    onPress={() => navigateToQuiz('section1-quiz')}
                  >
                    <Image 
                      source={require('../../assets/images/default-avatar.png')} 
                      style={styles.lessonThumbnail}
                    />
                    <Text style={styles.lessonTitle}>Kiểm tra kiến thức cơ bản phong thủy</Text>
                    <Ionicons name="document-text" size={24} color="#fff" />
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
                  
                  {/* Chapter 2 Quiz */}
                  <TouchableOpacity 
                    style={[styles.lessonItem, styles.quizItem]}
                    onPress={() => navigateToQuiz('section2-quiz')}
                  >
                    <Image 
                      source={require('../../assets/images/default-avatar.png')} 
                      style={styles.lessonThumbnail}
                    />
                    <Text style={styles.lessonTitle}>Kiểm tra hướng và bát quái</Text>
                    <Ionicons name="document-text" size={24} color="#fff" />
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
              onPress={() => toggleChapter(3)}
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
                  
                  {/* Chapter 3 Quiz */}
                  <TouchableOpacity 
                    style={[styles.lessonItem, styles.quizItem]}
                    onPress={() => navigateToQuiz('section3-quiz')}
                  >
                    <Image 
                      source={require('../../assets/images/default-avatar.png')} 
                      style={styles.lessonThumbnail}
                    />
                    <Text style={styles.lessonTitle}>Kiểm tra kiến thức về thủy mạch</Text>
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Final Exam */}
            <TouchableOpacity 
              style={styles.finalExamContainer}
              onPress={() => navigateToQuiz('final-exam')}
            >
              <View style={styles.finalExamContent}>
                <View style={styles.finalExamIconContainer}>
                  <Ionicons name="trophy-outline" size={24} color="#fff" />
                </View>
                <View style={styles.finalExamTextContainer}>
                  <Text style={styles.finalExamTitle}>Bài kiểm tra cuối khóa</Text>
                  <Text style={styles.finalExamDescription}>
                    Hoàn thành khóa học và nhận chứng chỉ
                  </Text>
                </View>
                <View style={styles.finalExamStatus}>
                  {completedQuizzes['final-exam'] ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color="#8B0000" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Register/Continue Button */}
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegisterOrContinue}
          >
            <Text style={styles.registerButtonText}>
              {isRegistered ? `Continue (${calculateProgress()}% complete)` : 'Register'}
            </Text>
          </TouchableOpacity>
          
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
  cartButton: {
    padding: 8,
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
  ratingCount: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
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
  expandedChapter: {
    backgroundColor: '#660000',
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
  quizItem: {
    backgroundColor: 'rgba(139, 0, 0, 0.7)', // Darker red for quiz items
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
});
