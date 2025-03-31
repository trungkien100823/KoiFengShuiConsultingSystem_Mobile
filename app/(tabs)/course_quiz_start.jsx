import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

const { width } = Dimensions.get('window');

export default function CourseQuizStartScreen() {
  const router = useRouter();
  const { courseId, source } = useLocalSearchParams();
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');

  // Section titles
  const sectionTitles = {
    'final': 'Kết thúc khóa học',
  };

  // Default quiz details (fallback if API fails)
  const defaultQuizDetails = {
    description: 'Bài kiểm tra cuối khóa sẽ đánh giá toàn bộ kiến thức bạn đã học trong khóa học.',
    timeLimit: '30 phút',
    questions: 30,
    passingScore: '80%',
    attempts: '3 lần',
    requirements: 'Hoàn thành tất cả các bài học trong khóa học'
  };

  // Get current section from quizId
  const getCurrentSection = () => {
    return 'final';
  };
  
  const currentSection = getCurrentSection();

  // Fetch quiz data from API
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Get the auth token
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('Vui lòng đăng nhập để xem bài kiểm tra');
        }
        
        console.log(`Fetching quiz for course: ${courseId}`);
        
        const response = await fetch(
          `${API_CONFIG.baseURL}/api/Quiz/by-course/${courseId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const result = await response.json();
        console.log('Quiz API response:', result);
        
        if (result.isSuccess && result.data) {
          setQuizData(result.data);
          
          // Extract quizId and title
          if (result.data.quizId) {
            setQuizId(result.data.quizId);
            console.log('Found quiz ID:', result.data.quizId);
          }
          
          if (result.data.title) {
            setQuizTitle(result.data.title);
            console.log('Quiz title:', result.data.title);
          }
        } else {
          console.error('API returned error:', result.message);
          setError(result.message || 'Failed to fetch quiz data');
        }
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to connect to server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchQuizData();
    } else {
      console.error('No courseId provided');
      setError('Missing course information');
      setLoading(false);
    }
  }, [courseId]);

  // Load completed quizzes on mount
  useEffect(() => {
    const loadCompletionData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('completedQuizzes');
        if (savedData) {
          setCompletedQuizzes(JSON.parse(savedData));
        }
      } catch (error) {
        console.log('Error loading quiz completion data', error);
      }
    };

    loadCompletionData();
  }, []);

  // Handle back button
  const handleBack = () => {
    router.push({
      pathname: "/(tabs)/course_chapter",
      params: { courseId }
    });
  };

  // Start the quiz
  const handleStartQuiz = () => {
    if (!quizId) {
      console.error('No quiz ID available');
      return;
    }
    
    router.push({
      pathname: '/(tabs)/course_quiz',
      params: { 
        quizId: quizId,
        courseId: courseId 
      }
    });
  };

  // Get quiz title from API data or fallback
  const getQuizTitle = () => {
    if (quizTitle) {
      return quizTitle;
    }
    return 'Bài kiểm tra cuối khóa';
  };

  // Get quiz details (combining API data with default structure)
  const getQuizDetails = () => {
    return {
      description: quizData?.description || defaultQuizDetails.description,
      timeLimit: defaultQuizDetails.timeLimit,
      questions: defaultQuizDetails.questions,
      passingScore: defaultQuizDetails.passingScore,
      attempts: defaultQuizDetails.attempts,
      requirements: defaultQuizDetails.requirements
    };
  };

  const currentQuizDetails = getQuizDetails();

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin bài kiểm tra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.sectionTitle}>
            {`Chapter ${currentSection.replace('section', '')}: ${sectionTitles[currentSection]}`}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Quiz Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.quizHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={40} color="#8B0000" />
          </View>
          <Text style={styles.quizTitle}>{getQuizTitle()}</Text>
          {quizId && completedQuizzes[quizId] && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedText}>Đã hoàn thành</Text>
            </View>
          )}
        </View>
        
        <View style={styles.quizInfoCard}>
          <Text style={styles.sectionHeading}>Mô tả</Text>
          <Text style={styles.description}>{currentQuizDetails.description}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionHeading}>Chi tiết</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{currentQuizDetails.timeLimit}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Số câu hỏi</Text>
                <Text style={styles.detailValue}>{currentQuizDetails.questions}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="trophy-outline" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Điểm đạt</Text>
                <Text style={styles.detailValue}>{currentQuizDetails.passingScore}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="repeat-outline" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Số lần làm</Text>
                <Text style={styles.detailValue}>{currentQuizDetails.attempts}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionHeading}>Yêu cầu</Text>
          <View style={styles.requirementContainer}>
            <Ionicons name="alert-circle-outline" size={20} color="#8B0000" />
            <Text style={styles.requirementText}>{currentQuizDetails.requirements}</Text>
          </View>
        </View>
        
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Hướng dẫn làm bài</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>Trả lời tất cả các câu hỏi trong thời gian quy định</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>Bạn có thể dùng nút Previous và Next để di chuyển giữa các câu hỏi</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>Kết quả sẽ được hiển thị ngay sau khi bạn hoàn thành bài kiểm tra</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Start Quiz Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartQuiz}
          disabled={!quizId}
        >
          <Text style={styles.startButtonText}>
            {quizId && completedQuizzes[quizId] ? 'Làm lại bài kiểm tra' : 'Bắt đầu bài kiểm tra'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B0000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
  },
  quizHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 5,
  },
  quizInfoCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    width: '48%',
  },
  detailTextContainer: {
    marginLeft: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  requirementText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  instructionContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B0000',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  decorativeImage: {
    width: width - 30,
    height: 150,
    alignSelf: 'center',
    marginVertical: 20,
    opacity: 0.6,
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
