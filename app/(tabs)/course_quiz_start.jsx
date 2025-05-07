import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

// Responsive sizing utilities
const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;
const BASE_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
const scale = size => Math.round(BASE_SIZE * (size / 375));
const isIOS = Platform.OS === 'ios';

// Status bar height calculation
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' 
  ? (Platform.isPad ? 20 : StatusBar.currentHeight || 44) 
  : StatusBar.currentHeight || 0;

export default function CourseQuizStartScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);

  // Thêm hàm tính thời gian dựa trên số câu hỏi
  const calculateTimeLimit = (questionCount) => {
    if (!questionCount || questionCount <= 0) return 0; // 0 phút = không giới hạn
    if (questionCount <= 20) return 15;
    if (questionCount <= 40) return 30;
    if (questionCount <= 60) return 60;
    if (questionCount > 60) return "Không giới hạn thời gian";
    return 0; // 0 phút = không giới hạn
  };

  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xem bài kiểm tra');
      }

      // Tạo key duy nhất cho mỗi user và quiz
      const userQuizKey = `${token}_${courseId}_completed`;
      
      // Kiểm tra trạng thái hoàn thành từ AsyncStorage với key của user
      const completedQuizzes = await AsyncStorage.getItem(userQuizKey);
      if (completedQuizzes) {
        const quizzes = JSON.parse(completedQuizzes);
        setHasCompletedQuiz(!!quizzes);
      } else {
        setHasCompletedQuiz(false);
      }
      
      // Xóa cache cũ
      await AsyncStorage.removeItem(`quiz_${courseId}_data`);
      
      console.log(`Fetching quiz data for course: ${courseId}`);
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Quiz API response:', result);
      
      if (result.isSuccess && result.data) {
        console.log('Quiz Data:', result.data);
        console.log('Question Count Type:', typeof result.data.questionCount);
        console.log('Question Count Value:', result.data.questionCount);
        
        const quizData = {
          ...result.data,
          questionCount: result.data.questionCount
        };
        
        setQuizData(quizData);
        
        // Lưu vào cache
        await AsyncStorage.setItem(`quiz_${courseId}_data`, JSON.stringify(quizData));
        console.log('Saved to cache:', quizData);
        
        if (quizData.quizId) {
          setQuizId(quizData.quizId);
        }
        
        if (quizData.title) {
          setQuizTitle(quizData.title);
        }

        // Lưu questionCount vào AsyncStorage để sử dụng sau này
        if (quizData.questionCount) {
          await AsyncStorage.setItem(`quiz_${quizData.quizId}_questionCount`, quizData.questionCount.toString());
          console.log('Saved question count:', quizData.questionCount);
        }
      } else {
        setError(result.message || 'Không thể tải thông tin bài kiểm tra');
      }
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Thêm useFocusEffect để re-fetch dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, fetching quiz data...');
      fetchQuizData();
    }, [fetchQuizData])
  );

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
      console.error('Không có ID bài kiểm tra');
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

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={isIOS ? "light-content" : "dark-content"} 
          backgroundColor="#8B0000" 
          translucent={true}
        />
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
        <SafeAreaView style={{ backgroundColor: '#8B0000' }}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backButton}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin bài kiểm tra...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={isIOS ? "light-content" : "dark-content"} 
          backgroundColor="#8B0000" 
          translucent={true}
        />
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
        <SafeAreaView style={{ backgroundColor: '#8B0000' }}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack} 
              style={styles.backButton}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={scale(50)} color="#8B0000" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuizData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isIOS ? "light-content" : "dark-content"} 
        backgroundColor="#8B0000" 
        translucent={true}
      />
      
      {/* Status Bar Spacer */}
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
      
      {/* Header */}
      <SafeAreaView style={{ backgroundColor: '#8B0000' }}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      {/* Quiz Content */}
      <ScrollView 
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={scale(40)} color="#8B0000" />
          </View>
          <Text style={styles.quizTitle}>{quizTitle || 'Bài kiểm tra'}</Text>
          {hasCompletedQuiz && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={scale(20)} color="#4CAF50" />
              <Text style={styles.completedText}>Đã hoàn thành</Text>
            </View>
          )}
        </View>
        
        <View style={styles.quizInfoCard}>
          <Text style={styles.sectionHeading}>Mô tả</Text>
          <Text style={styles.quizDescription}>
            {quizData?.description || 'Chưa có mô tả cho bài kiểm tra này'}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionHeading}>Chi tiết</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={scale(20)} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>
                  {calculateTimeLimit(quizData?.questionCount) === 0 
                    ? 'Không giới hạn thời gian'
                    : `${calculateTimeLimit(quizData?.questionCount)} phút`}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="help-circle-outline" size={scale(20)} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Số câu hỏi</Text>
                <Text style={styles.detailValue}>
                  {quizData?.questionCount !== undefined && quizData?.questionCount !== null 
                    ? `${quizData.questionCount} câu` 
                    : 'Chưa xác định'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="trophy-outline" size={scale(20)} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Điểm cần đạt</Text>
                <Text style={styles.detailValue}>{quizData?.passingScore || '80%'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Hướng dẫn làm bài</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>Bạn có thể dùng nút Previous và Next để di chuyển giữa các câu hỏi</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>Kết quả sẽ được hiển thị ngay sau khi bạn hoàn thành bài kiểm tra</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Start Quiz Button */}
      <SafeAreaView style={{ backgroundColor: '#fff' }}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.startButton, hasCompletedQuiz && styles.retakeButton]}
            onPress={handleStartQuiz}
            disabled={!quizId}
          >
            <Text style={styles.startButtonText}>
              {hasCompletedQuiz ? 'Kiểm tra lại' : 'Bắt đầu làm bài'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
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
    paddingHorizontal: scale(20),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(16),
    color: '#8B0000',
    textAlign: 'center',
  },
  errorText: {
    marginTop: scale(16),
    marginBottom: scale(20),
    fontSize: scale(16),
    color: '#8B0000',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: scale(24),
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  retryText: {
    color: '#FFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: '#8B0000',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  backText: {
    fontSize: scale(16),
    fontWeight: '500',
    marginLeft: scale(8),
    color: '#fff',
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: scale(20),
  },
  quizHeader: {
    backgroundColor: '#fff',
    padding: scale(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: '#f8f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(15),
    ...Platform.select({
      ios: {
        shadowColor: '#8B0000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quizTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: scale(8),
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    marginTop: scale(8),
  },
  completedText: {
    fontSize: scale(14),
    color: '#4CAF50',
    marginLeft: scale(5),
    fontWeight: '500',
  },
  quizInfoCard: {
    backgroundColor: '#fff',
    margin: scale(15),
    borderRadius: scale(12),
    padding: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeading: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(12),
  },
  quizDescription: {
    fontSize: scale(16),
    color: '#666',
    marginBottom: scale(16),
    lineHeight: scale(22),
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: scale(20),
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: scale(15),
  },
  detailItem: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: scale(8),
  },
  detailTextContainer: {
    marginLeft: scale(10),
    flex: 1,
  },
  detailLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  detailValue: {
    fontSize: scale(15),
    fontWeight: '500',
    color: '#333',
  },
  instructionContainer: {
    backgroundColor: '#fff',
    margin: scale(15),
    borderRadius: scale(12),
    padding: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  instructionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(15),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale(12),
  },
  instructionNumber: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#8B0000',
    color: '#fff',
    textAlign: 'center',
    lineHeight: scale(24),
    fontSize: scale(14),
    fontWeight: 'bold',
    marginRight: scale(12),
    overflow: 'hidden',
  },
  instructionText: {
    fontSize: scale(15),
    color: '#555',
    flex: 1,
    lineHeight: scale(22),
  },
  buttonContainer: {
    padding: scale(15),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: '#8B0000',
    borderRadius: scale(8),
    paddingVertical: scale(15),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  startButtonText: {
    color: '#fff',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  retakeButton: {
    backgroundColor: '#4CAF50',
  },
});