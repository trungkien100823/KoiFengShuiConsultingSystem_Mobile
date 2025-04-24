import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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

export default function CourseQuizScreen() {
  const router = useRouter();
  const { 
    quizId = '04205955-CACE-4F8C-8',
    source = 'chapter', 
    courseId = '0AA77A49-CAFF-4F01-B' 
  } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [initialTimeInSeconds, setInitialTimeInSeconds] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [chaptersCompleted, setChaptersCompleted] = useState(false);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const [isTestMode, setIsTestMode] = useState(true);
  const [completedQuizzes, setCompletedQuizzes] = useState({});

  // Quiz data mapping
  const quizTitles = {
    '04205955-CACE-4F8C-8': 'Bài kiểm tra cuối khóa',
    'final-exam': 'Bài kiểm tra cuối khóa'
  };

  // Time limits in minutes
  const quizTimeLimits = {
    '04205955-CACE-4F8C-8': 30,
    'final-exam': 30
  };

  // At the top of your component, add this mapping
  const quizIdMapping = {
    'final-exam': '04205955-CACE-4F8C-8'
  };

  // Thêm useFocusEffect để re-fetch dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      // Reset state
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizCompleted(false);
      setScore(0);
      setLoading(true);
      setError(null);

      // Clear timer if it exists
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Fetch questions và khởi động lại timer
      const initializeQuiz = async () => {
        // Kiểm tra nếu đã có câu hỏi thì không fetch lại
        if (questions.length > 0) {
          setLoading(false);
          // Khởi động lại timer với câu hỏi có sẵn
          const timeLimit = calculateTimeLimit(questions.length);
          const timeLimitInSeconds = timeLimit * 60;
          
          if (timeLimit > 0) {
            setTimeRemaining(timeLimitInSeconds);
            setInitialTimeInSeconds(timeLimitInSeconds);
            startTimer();
          }
        } else {
          await fetchQuestions();
          // Khởi động lại timer sau khi có dữ liệu
          startTimer();
        }
      };

      initializeQuiz();

      // Cleanup when screen loses focus
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [quizId])
  );

  // Add a timeout function to wrap fetch calls
  const fetchWithTimeout = async (url, options, timeoutMs = API_CONFIG.timeout) => {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Create a timeout that aborts the fetch
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    try {
      // Race between fetch and timeout
      return await Promise.race([
        fetch(url, { ...options, signal }),
        timeoutPromise
      ]);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  // Initialize timer and reset state when quizId changes
  useEffect(() => {
    // Reset all quiz state when quizId changes
    setLoading(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setScore(0);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Fetch questions to get the correct time limit
    fetchQuestions();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  // Add useEffect to watch timeRemaining changes
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Only start timer if we have valid time remaining
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleQuizSubmission();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!timeRemaining && timeRemaining !== 0) {
      return "00:00";
    }
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cập nhật hàm startTimer để đảm bảo timer hoạt động đúng
  const startTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Chỉ start timer khi timeRemaining > 0
    if (timeRemaining > 0) {
      // Start new timer that counts down every second
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // When time runs out, clear timer and submit the quiz
            clearInterval(timerRef.current);
            handleQuizSubmission();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
  };

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra xem đã có câu hỏi hay chưa - nếu có rồi thì không cần báo lỗi
      const hasExistingQuestions = questions && questions.length > 0;
      
      if (!quizId) {
        throw new Error('Quiz ID not provided');
      }
      
      // Get auth token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('User authentication required');
      }
      
      // Make API request with the actual quizId
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/Question/quiz/${quizId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (result.isSuccess && Array.isArray(result.data) && result.data.length > 0) {
        // Initialize timer based on number of questions
        const questionCount = result.data.length;
        const timeLimit = calculateTimeLimit(questionCount);
        const timeLimitInSeconds = timeLimit * 60;
        
        // Process questions from API
        setQuestions(result.data);
        
        // Đảm bảo timeLimit > 0 trước khi set state
        if (timeLimit > 0) {
          setTimeRemaining(timeLimitInSeconds);
          setInitialTimeInSeconds(timeLimitInSeconds);
        } else {
          setTimeRemaining(0);
          setInitialTimeInSeconds(0);
        }
      } else if (Array.isArray(result.data) && result.data.length > 0) {
        // Nếu có dữ liệu mảng nhưng isSuccess là false, vẫn sử dụng dữ liệu đó
        const questionCount = result.data.length;
        const timeLimit = calculateTimeLimit(questionCount);
        const timeLimitInSeconds = timeLimit * 60;
        
        setQuestions(result.data);
        
        if (timeLimit > 0) {
          setTimeRemaining(timeLimitInSeconds);
          setInitialTimeInSeconds(timeLimitInSeconds);
        } else {
          setTimeRemaining(0);
          setInitialTimeInSeconds(0);
        }
      } else {
        // Nếu thực sự không có dữ liệu và chưa có câu hỏi
        if (!hasExistingQuestions) {
          throw new Error(result.message || 'Failed to load quiz questions');
        } 
        // Nếu đã có câu hỏi sẵn, không báo lỗi
        console.log('Không có dữ liệu mới, sử dụng câu hỏi đã có');
      }
    } catch (error) {
      // Kiểm tra xem đã có câu hỏi được tải chưa
      if (questions && questions.length > 0) {
        // Đã có câu hỏi, không hiển thị lỗi và sử dụng câu hỏi hiện có
        console.log('Sử dụng câu hỏi đã tải trước đó, không hiển thị lỗi');
        // Đặt error về null để đảm bảo không hiển thị lỗi
        setError(null);
      } else {
        // Chưa có câu hỏi, hiển thị lỗi
        setError(error.message || 'Failed to load quiz questions');
        
        // Chỉ ghi log lỗi khi không có câu hỏi (không hiển thị Alert)
        if (process.env.NODE_ENV === 'development') {
          console.log('Lỗi khi tải câu hỏi (chỉ hiển thị trong môi trường development):', error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fix handleAnswerSelect to work with the API response format
  const handleAnswerSelect = (answerId) => {
    // Update selected answers with the new selection
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerId
    }));
  };

  const calculateTimeLimit = (questionCount) => {
    if (!questionCount) return 0;
    if (questionCount <= 20) return 15;
    if (questionCount <= 40) return 30;
    if (questionCount <= 60) return 60;
    if (questionCount > 80) return "Không giới hạn thời gian";
    return 0;
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Navigate to specific question
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  };

  // Update the handleQuizSubmission function to use raw correct/total counts
  const handleQuizSubmission = async () => {
    try {
      // Stop timer
      clearInterval(timerRef.current);
      
      // Tính thời gian hoàn thành (giây)
      const timeSpentInSeconds = initialTimeInSeconds - timeRemaining;
      
      // Format answers for API submission
      const answerIds = Object.entries(selectedAnswers).map(([index, answerId]) => {
        return {
          answerId: answerId
        };
      });
      
      // Submit to API
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/RegisterCourse/submit-answers-by/${quizId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answerIds })
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.isSuccess && result.data) {
        // Use server provided results
        const apiResult = result.data;
        
        // Calculate percentage
        const percentage = Math.round((apiResult.correctAnswers / apiResult.totalQuestions) * 100);
    
        // Save completion status
        try {
          const completedQuizzes = JSON.parse(await AsyncStorage.getItem('completedQuizzes')) || {};
          completedQuizzes[quizId] = {
            completed: true,
            correctAnswers: apiResult.correctAnswers,
            totalQuestions: apiResult.totalQuestions,
            percentage: percentage,
            date: new Date().toISOString()
          };
          await AsyncStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
        } catch (storageError) {
          console.error('Error saving quiz completion:', storageError);
        }
        
        // Navigate to score screen with results from API
        router.push({
          pathname: '/(tabs)/course_score',
          params: {
            courseId: courseId,
            quizId: quizId,
            score: apiResult.correctAnswers.toString(),
            correctAnswers: apiResult.correctAnswers.toString(),
            totalQuestions: apiResult.totalQuestions.toString(),
            percentage: percentage.toString(),
            timeSpent: timeSpentInSeconds.toString()
          }
        });
      } else {
        // If API doesn't return usable results, calculate locally
        let correctAnswers = 0;
        const totalQuestions = questions.length;
        
        // Calculate score locally as fallback
        questions.forEach((question, index) => {
          const selectedAnswer = selectedAnswers[index];
          const correctAnswer = question.answers?.find(answer => answer.isCorrect);
          
          if (selectedAnswer && correctAnswer && selectedAnswer === correctAnswer.answerId) {
            correctAnswers++;
          }
        });
        
        // Calculate percentage
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Save completion status
        try {
          const completedQuizzes = JSON.parse(await AsyncStorage.getItem('completedQuizzes')) || {};
          completedQuizzes[quizId] = {
            completed: true,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            percentage: percentage,
            date: new Date().toISOString()
          };
          await AsyncStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
        } catch (storageError) {
          console.error('Error saving quiz completion:', storageError);
        }
      
        // Navigate to score screen with locally calculated results
        router.push({
          pathname: '/(tabs)/course_score',
          params: {
            courseId: courseId,
            quizId: quizId,
            score: correctAnswers.toString(),
            correctAnswers: correctAnswers.toString(),
            totalQuestions: totalQuestions.toString(),
            percentage: percentage.toString(),
            timeSpent: timeSpentInSeconds.toString()
          }
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert(
        'Lỗi khi nộp bài',
        'Có lỗi xảy ra khi nộp bài kiểm tra. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    }
  };

  // Check if all questions are answered
  const areAllQuestionsAnswered = () => {
    return Object.keys(selectedAnswers).length === questions.length;
  };

  // Handle back navigation
  const handleBack = () => {
    Alert.alert(
      "Thoát bài kiểm tra?",
      "Bạn có chắc muốn thoát? Tiến trình làm bài sẽ không được lưu.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Thoát", 
          style: "destructive",
          onPress: () => {
            // Clear timer if it's running
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            // Navigate back to quiz start screen with courseId
            router.replace({
              pathname: "/(tabs)/course_quiz_start",
              params: { 
                courseId: courseId,
                shouldRefresh: Date.now()
              }
            });
          }
        }
      ]
    );
  };

  // Add this function to handle reloading the quiz
  const handleReloadQuiz = () => {
    // Reset all quiz state
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    const initialTime = quizTimeLimits[quizId] * 60;
    setTimeRemaining(initialTime);
    setInitialTimeInSeconds(initialTime);
    setQuizCompleted(false);
    setScore(0);
    setQuestions([]);
    
    // Clear timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Show loading
    setLoading(true);
    
    // Fetch questions again
    fetchQuestions();
    
    // Scroll back to top if needed
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Add this function to reset all completion states
  const resetAllProgress = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Reset Progress",
        "This will reset all course and quiz progress. Are you sure?",
        [
          { 
            text: "Cancel", 
            style: "cancel" 
          },
          { 
            text: "Reset", 
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              
              // Clear completedLessons
              await AsyncStorage.removeItem('completedLessons');
              
              // Clear completedQuizzes
              await AsyncStorage.removeItem('completedQuizzes');
              
              // Reset local state
              setCompletedQuizzes({});
              
              // Show success message
              Alert.alert(
                "Reset Complete",
                "All course and quiz progress has been reset.",
                [{ text: "OK" }]
              );
              
              // If we're looking at completed quiz results, go back
              if (quizCompleted) {
                router.back();
              } else {
                // Otherwise refresh the current screen
                handleReloadQuiz();
              }
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting progress:', error);
      Alert.alert("Error", "Failed to reset progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push({
      pathname: '/(tabs)/course_score',
      params: {
        courseId: courseId,
        quizId: quizId,
        score: score.outOfTen,
        correctAnswers: score.correct,
        totalQuestions: score.questions,
        percentage: score.percentage,
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
              <Ionicons name="close" size={scale(24)} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{quizTitles[quizId] || 'Bài kiểm tra'}</Text>
            <View style={{ width: scale(24) }} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        </View>
      </View>
    );
  }

  // Empty questions handling
  if (!loading && (!questions || questions.length === 0)) {
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
              <Ionicons name="close" size={scale(24)} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{quizTitles[quizId] || 'Bài kiểm tra'}</Text>
            <View style={{ width: scale(24) }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={scale(60)} color="#8B0000" />
          <Text style={styles.emptyTitle}>Không có câu hỏi</Text>
          <Text style={styles.emptyText}>Không thể tải câu hỏi cho bài kiểm tra này. Vui lòng thử lại sau.</Text>
          <TouchableOpacity style={styles.returnButton} onPress={handleBack}>
            <Text style={styles.returnButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) {
      return <Text style={styles.errorText}>Question not found</Text>;
    }
    
    return (
      <View style={styles.questionWrapper}>
        <Text style={styles.questionText}>
          {currentQuestion.questionText || currentQuestion.question || "No question text"}
        </Text>
        
        {currentQuestion.answers && Array.isArray(currentQuestion.answers) ? (
          <View style={styles.answerContainer}>
            {currentQuestion.answers.map((answer, index) => (
              <TouchableOpacity
                key={answer.answerId}
                style={[
                  styles.answerOption,
                  selectedAnswers[currentQuestionIndex] === answer.answerId && styles.selectedAnswer
                ]}
                onPress={() => handleAnswerSelect(answer.answerId)}
              >
                <View style={[
                  styles.answerLabel, 
                  selectedAnswers[currentQuestionIndex] === answer.answerId && styles.selectedAnswerLabel
                ]}>
                  <Text style={[
                    styles.answerLabelText,
                    selectedAnswers[currentQuestionIndex] === answer.answerId && styles.selectedAnswerLabelText
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.answerOptionText,
                  selectedAnswers[currentQuestionIndex] === answer.answerId && styles.selectedAnswerText
                ]}>
                  {answer.optionText}
                </Text>
                {selectedAnswers[currentQuestionIndex] === answer.answerId && (
                  <Ionicons name="checkmark-circle" size={scale(22)} color="#4CAF50" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.answerContainer}>
            {currentQuestion.options && currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.answerOption,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswer
                ]}
                onPress={() => handleAnswerSelect(index)}
              >
                <View style={[
                  styles.answerLabel, 
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswerLabel
                ]}>
                  <Text style={[
                    styles.answerLabelText,
                    selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswerLabelText
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.answerOptionText,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswerText
                ]}>
                  {option}
                </Text>
                {selectedAnswers[currentQuestionIndex] === index && (
                  <Ionicons name="checkmark-circle" size={scale(22)} color="#4CAF50" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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
            <Ionicons name="close" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{quizTitles[quizId] || 'Bài kiểm tra'}</Text>
          <View style={{ width: scale(24) }} />
        </View>
      </SafeAreaView>
      
      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <View style={styles.timerInfo}>
          <Ionicons name="time-outline" size={scale(16)} color="#666" />
          <Text style={styles.timerText}>{formatTimeRemaining()}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${(currentQuestionIndex + 1) / questions.length * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>
      
      {/* Question Content */}
      <ScrollView 
        ref={scrollRef}
        style={styles.questionScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.questionNumber}>Câu hỏi {currentQuestionIndex + 1}</Text>
        {renderQuestion()}
      </ScrollView>
      
      {/* Question Indicators */}
      <View style={styles.indicatorsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.indicatorsContent}
          style={styles.indicatorsContainer}
        >
          {questions.map((_, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.indicatorDot,
                currentQuestionIndex === index && styles.currentIndicator,
                selectedAnswers[index] !== undefined && styles.answeredIndicator
              ]}
              onPress={() => goToQuestion(index)}
            >
              <Text style={[
                styles.indicatorText,
                currentQuestionIndex === index && styles.currentIndicatorText,
                selectedAnswers[index] !== undefined && styles.answeredIndicatorText
              ]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Navigation Controls */}
      <SafeAreaView style={{ backgroundColor: '#fff' }}>
        <View style={styles.navigationControls}>
          <TouchableOpacity 
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={scale(18)} 
              color={currentQuestionIndex === 0 ? "#ccc" : "#333"} 
            />
            <Text style={[
              styles.navButtonText,
              currentQuestionIndex === 0 && styles.disabledButtonText
            ]}>
              Câu trước
            </Text>
          </TouchableOpacity>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNextQuestion}
            >
              <Text style={styles.navButtonText}>Câu sau</Text>
              <Ionicons name="chevron-forward" size={scale(18)} color="#333" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.submitButton,
                !areAllQuestionsAnswered() && styles.disabledSubmitButton
              ]}
              onPress={handleQuizSubmission}
              disabled={!areAllQuestionsAnswered()}
            >
              <Text style={[
                styles.submitButtonText,
                !areAllQuestionsAnswered() && styles.disabledSubmitButtonText
              ]}>
                Nộp bài
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  emptyTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#333',
    marginTop: scale(16),
    marginBottom: scale(8),
  },
  emptyText: {
    fontSize: scale(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: scale(24),
    lineHeight: scale(22),
  },
  returnButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  returnButtonText: {
    color: '#fff',
    fontSize: scale(16),
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
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(20),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: scale(4),
    fontSize: scale(14),
    color: '#666',
    fontWeight: '500',
  },
  progressContainer: {
    flex: 1,
    height: scale(4),
    backgroundColor: '#e0e0e0',
    borderRadius: scale(2),
    marginHorizontal: scale(12),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: scale(2),
  },
  progressText: {
    fontSize: scale(14),
    color: '#666',
    fontWeight: '500',
  },
  questionScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: scale(16),
    paddingBottom: scale(40),
  },
  questionNumber: {
    fontSize: scale(16),
    color: '#8B0000',
    fontWeight: 'bold',
    marginBottom: scale(8),
  },
  questionWrapper: {
    marginBottom: scale(20),
  },
  questionText: {
    fontSize: scale(18),
    color: '#333',
    fontWeight: '500',
    marginBottom: scale(24),
    lineHeight: scale(26),
  },
  answerContainer: {
    marginBottom: scale(16),
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: scale(8),
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: scale(12),
    paddingRight: scale(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectedAnswer: {
    backgroundColor: '#f8f0f0',
    borderColor: '#8B0000',
  },
  answerLabel: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(12),
    marginRight: scale(12),
  },
  selectedAnswerLabel: {
    backgroundColor: '#8B0000',
  },
  answerLabelText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#666',
  },
  selectedAnswerLabelText: {
    color: '#fff',
  },
  answerOptionText: {
    fontSize: scale(16),
    color: '#333',
    flex: 1,
    lineHeight: scale(22),
  },
  selectedAnswerText: {
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: scale(8),
  },
  indicatorsWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  indicatorsContainer: {
    paddingVertical: scale(12),
  },
  indicatorsContent: {
    paddingHorizontal: scale(16),
  },
  indicatorDot: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(4),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currentIndicator: {
    backgroundColor: '#f8f0f0',
    borderColor: '#8B0000',
  },
  answeredIndicator: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  indicatorText: {
    fontSize: scale(14),
    color: '#666',
    fontWeight: '500',
  },
  currentIndicatorText: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  answeredIndicatorText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: isIOS ? scale(16) : scale(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: scale(16),
    color: '#333',
    fontWeight: '500',
    marginHorizontal: scale(4),
  },
  disabledButtonText: {
    color: '#ccc',
  },
  submitButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: scale(24),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  disabledSubmitButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  disabledSubmitButtonText: {
    color: '#999',
  },
  errorText: {
    color: '#8B0000',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginVertical: scale(16),
    textAlign: 'center',
  },
});