import React, { useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');

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

  // Modify getFallbackQuestions to provide good quality questions
  const getFallbackQuestions = () => {
    return [
      {
        questionId: 'fallback-1',
      question: 'Thuyết Âm Dương trong phong thủy có nguồn gốc từ đâu?',
        questionType: 'Multiple Choice',
      options: ['Kinh Dịch', 'Kinh Phật', 'Đạo Giáo', 'Nho Giáo'],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 0,
        point: 1
    },
    {
        questionId: 'fallback-2',
      question: 'Trong phong thủy, "Long Huyệt" là gì?',
        questionType: 'Multiple Choice',
      options: [
        'Mạch nước ngầm dưới đất',
        'Vị trí lý tưởng để xây nhà hoặc đặt mộ',
        'Hình dáng giống rồng của núi',
        'Hướng của gió thịnh vượng'
      ],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 1,
        point: 1
      },
      {
        questionId: 'fallback-3',
        question: 'Trong phong thủy, mệnh "Kim" thường hợp với màu gì nhất?',
        questionType: 'Multiple Choice',
        options: ['Đỏ', 'Xanh lục', 'Trắng', 'Đen'],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 2,
        point: 1
      },
      {
        questionId: 'fallback-4',
        question: 'Hiện tượng "Sát khí" trong phong thủy thường do đâu tạo ra?',
        questionType: 'Multiple Choice',
      options: [
          'Góc nhọn chỉ thẳng vào cửa chính',
          'Cây xanh quanh nhà',
          'Hồ nước trước nhà',
          'Đèn chiếu sáng'
        ],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 0,
        point: 1
      },
      {
        questionId: 'fallback-5',
        question: 'Việc sắp xếp nội thất theo phong thủy có ý nghĩa gì?',
        questionType: 'Multiple Choice',
      options: [
          'Chỉ để trang trí cho đẹp',
          'Tạo sự cân bằng năng lượng trong không gian sống',
          'Theo quy định xây dựng',
          'Không có ý nghĩa đặc biệt'
        ],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 1,
        point: 1
      }
    ];
  };

  // Modify your useEffect to explicitly call fetchQuestions
  useEffect(() => {
    // Set chapters as completed without checking API
    setChaptersCompleted(true);
    
    // Explicitly call fetchQuestions
    fetchQuestions();
  }, []);

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

  // Add this function after the fetchQuestions function
  const startTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start new timer that counts down every second
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // When time runs out, clear timer and submit the quiz
          clearInterval(timerRef.current);
          handleQuizSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fix handleAnswerSelect to work with the API response format
  const handleAnswerSelect = (answerId) => {
    // Update selected answers with the new selection
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerId
    }));
  };

  // Make sure we're correctly processing the questions from the API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!quizId) {
        throw new Error('Quiz ID not provided');
      }
      
      // Get auth token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('User authentication required');
      }
      
      console.log(`Fetching questions for quiz: ${quizId}`);
      
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Questions API response:', result);
      
      if (result.isSuccess && Array.isArray(result.data)) {
        // Initialize timer based on number of questions
        const questionCount = result.data.length;
        // Allow approximately 1 minute per question, minimum 10 minutes
        const timeInMinutes = Math.max(10, Math.min(questionCount, 30));
        setTimeRemaining(timeInMinutes * 60);
        
        // Process questions from API
        setQuestions(result.data);
        
        // Start the timer
        startTimer();
      } else {
        console.error('API returned invalid data format:', result);
        throw new Error('Invalid quiz data received');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.message || 'Failed to load quiz questions');
      
      // Use fallback for development if needed
      if (isTestMode) {
        console.log('Using fallback questions due to error');
        const fallbackQuestions = getFallbackQuestions();
        setQuestions(fallbackQuestions);
        setTimeRemaining(30 * 60); // 30 minutes
        startTimer();
      }
    } finally {
      setLoading(false);
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
    
    // Set new timer
    setTimeRemaining(quizTimeLimits[quizId] * 60); // Convert minutes to seconds
    setLoading(false);

    // Start timer
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

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId, questions.length]); // Add questions.length as a dependency

  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
      
      // Format answers for API submission
      const answerIds = Object.entries(selectedAnswers).map(([index, answerId]) => {
        return {
          answerId: answerId
        };
      });
      
      console.log('Submitting answers to API:', { answerIds });
      
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
      console.log('Quiz submission response:', result);
      
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
            percentage: percentage.toString()
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
            percentage: percentage.toString()
          }
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert(
        'Submission Error',
        'There was a problem submitting your quiz. Please try again.',
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
          onPress: () => router.push('/(tabs)/course_chapter')
        }
      ]
    );
  };

  // Add this function to handle reloading the quiz
  const handleReloadQuiz = () => {
    // Reset all quiz state
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeRemaining(quizTimeLimits[quizId] * 60);
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty questions handling
  if (!loading && (!questions || questions.length === 0)) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{quizTitles[quizId]}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#8B0000" />
          <Text style={styles.emptyTitle}>Không có câu hỏi</Text>
          <Text style={styles.emptyText}>Không thể tải câu hỏi cho bài kiểm tra này. Vui lòng thử lại sau.</Text>
          <TouchableOpacity style={styles.returnButton} onPress={handleBack}>
            <Text style={styles.returnButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Quiz state:', {
    questionsLength: questions.length,
    loading,
    error,
    currentIndex: currentQuestionIndex
  });

  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) {
      return <Text style={styles.errorText}>Question not found</Text>;
    }
    
    // Add debug log to see question structure
    console.log('Current question structure:', JSON.stringify(currentQuestion));
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion.questionText || currentQuestion.question || "No question text"}
        </Text>
        
        {/* Check if answers exists before mapping */}
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
                <Text style={styles.answerOptionLabel}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={styles.answerOptionText}>
                  {answer.optionText}
                </Text>
                {selectedAnswers[currentQuestionIndex] === answer.answerId && (
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Fallback for when answers array is missing or different format
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
                <Text style={styles.answerOptionLabel}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={styles.answerOptionText}>
                  {option}
                </Text>
                {selectedAnswers[currentQuestionIndex] === index && (
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
      </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{quizTitles[quizId]}</Text>
          
          {isTestMode && (
            <View style={styles.testControlsContainer}>
              <TouchableOpacity 
                style={styles.reloadButton}
                onPress={handleReloadQuiz}
              >
                <Ionicons name="refresh" size={22} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetAllProgress}
              >
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {/* Timer Bar */}
          <View style={styles.timerContainer}>
        <View style={styles.timerInfo}>
          <Ionicons name="time-outline" size={16} color="#666" />
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
        contentContainerStyle={styles.questionContainer}
        showsVerticalScrollIndicator={false}
          >
        <Text style={styles.questionNumber}>Câu hỏi {currentQuestionIndex + 1}</Text>
        {renderQuestion()}
            
        {/* Options */}
        {/* <View style={styles.optionsContainer}>
          {questions[currentQuestionIndex]?.options?.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                styles.optionButton,
                selectedAnswers[currentQuestionIndex] === index && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(index)}
              >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionDot,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedDot
                ]}>
                  <Text style={[
                    styles.optionLetter,
                    selectedAnswers[currentQuestionIndex] === index && styles.selectedOptionLetter
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.optionText,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </View>
              </TouchableOpacity>
            ))}
        </View> */}
          </ScrollView>
          
      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
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
          
        <View style={styles.navigationControls}>
            <TouchableOpacity 
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
              onPress={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
            <Ionicons 
              name="chevron-back" 
              size={18} 
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
              <Ionicons name="chevron-forward" size={18} color="#333" />
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
      </View>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  returnButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  questionScrollView: {
    flex: 1,
  },
  questionContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  questionNumber: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  selectedOption: {
    backgroundColor: '#f8f0f0',
    borderColor: '#8B0000',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedDot: {
    backgroundColor: '#8B0000',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedOptionLetter: {
    color: '#fff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '500',
  },
  navigationContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 16, // Add extra padding for iOS safe area
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#ccc',
  },
  submitButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledSubmitButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledSubmitButtonText: {
    color: '#999',
  },
  indicatorsContainer: {
    paddingHorizontal: 12,
  },
  indicatorsContent: {
    paddingHorizontal: 4,
  },
  indicatorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
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
    fontSize: 14,
    color: '#666',
  },
  currentIndicatorText: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  answeredIndicatorText: {
    color: '#4CAF50',
  },
  reloadButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#444',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  errorText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  questionContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  answerContainer: {
    marginBottom: 16,
  },
  answerOption: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedAnswer: {
    backgroundColor: '#f8f0f0',
    borderColor: '#8B0000',
  },
  answerOptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    padding: 16,
  },
  answerOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
});