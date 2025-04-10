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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

const { width } = Dimensions.get('window');

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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin bài kiểm tra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
      
      {/* Quiz Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.quizHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={40} color="#8B0000" />
          </View>
          <Text style={styles.quizTitle}>{quizTitle || 'Bài kiểm tra'}</Text>
          {hasCompletedQuiz && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedText}>Đã hoàn thành</Text>
            </View>
          )}
        </View>
        
        <View style={styles.quizInfoCard}>
          <Text style={styles.sectionHeading}>Mô tả</Text>
          <Text style={styles.quizDescription}>{quizData?.description || 'Chưa có mô tả cho bài kiểm tra này'}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionHeading}>Chi tiết</Text>
          {console.log('Current quizData:', quizData)}
          {console.log('Question count:', quizData?.questionCount)}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
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
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Số câu hỏi</Text>
                <Text style={styles.detailValue}>
                  {quizData?.questionCount !== undefined && quizData?.questionCount !== null ? `${quizData.questionCount} câu` : 'Chưa xác định'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="trophy-outline" size={20} color="#666" />
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
  backText: {
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
  quizDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B0000',
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
  retakeButton: {
    backgroundColor: '#4CAF50',
  },
});
