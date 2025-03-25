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

const { width, height } = Dimensions.get('window');

export default function CourseQuizScreen() {
  const router = useRouter();
  const { quizId = 'final-exam', source = 'chapter', courseId = '0AA77A49-CAFF-4F01-B' } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  // Quiz data mapping
  const quizTitles = {
    'final-exam': 'Bài kiểm tra cuối khóa',
  };

  // Time limits in minutes
  const quizTimeLimits = {
    'final-exam': 30,
  };

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        // Fetch questions by quizId
        const response = await fetch(`http://192.168.31.148:5261/api/Question/quiz/${quizId}`);
        const result = await response.json();
        
        if (result.isSuccess && result.data) {
          console.log('Questions fetched:', result.data);
          
          // Process each question and fetch its answers
          const questionsWithAnswers = await Promise.all(result.data.map(async (question) => {
            try {
              // Fetch answers for this question
              const answersResponse = await fetch(`http://192.168.31.148:5261/api/Answer/get-by/${question.questionId}/questionId`);
              const answersResult = await answersResponse.json();
              
              if (answersResult.isSuccess && answersResult.data) {
                // Sort answers to ensure they appear in the same order as database
                const sortedAnswers = answersResult.data.sort((a, b) => {
                  return new Date(a.create_At) - new Date(b.create_At);
                });
                
                // Find the index of the correct answer
                const correctAnswerIndex = sortedAnswers.findIndex(answer => answer.is_Correct === true);
                
                return {
                  questionId: question.questionId,
                  question: question.question_Text,
                  questionType: question.question_Type,
                  options: sortedAnswers.map(answer => answer.option_Text),
                  optionTypes: sortedAnswers.map(answer => answer.option_Type),
                  correctAnswer: correctAnswerIndex !== -1 ? correctAnswerIndex : 0,
                  point: parseFloat(question.point) || 1,
                  answers: sortedAnswers
                };
              } else {
                // If no answers found, use default
                return {
                  questionId: question.questionId,
                  question: question.question_Text,
                  questionType: question.question_Type,
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
                  optionTypes: ['Text', 'Text', 'Text', 'Text'],
                  correctAnswer: 0,
                  point: parseFloat(question.point) || 1,
                  answers: []
                };
              }
            } catch (error) {
              console.error('Error fetching answers for question', question.questionId, error);
              return {
                questionId: question.questionId,
                question: question.question_Text,
                questionType: question.question_Type,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                optionTypes: ['Text', 'Text', 'Text', 'Text'],
                correctAnswer: 0,
                point: parseFloat(question.point) || 1,
                answers: []
              };
            }
          }));
          
          setQuestions(questionsWithAnswers);
        } else {
          // If API fails, use default questions
          console.error('Error loading questions:', result.message);
          setQuestions(getFallbackQuestions());
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setQuestions(getFallbackQuestions());
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [quizId]);

  // Fallback questions if API fails
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
        question: 'Trong Ngũ hành, yếu tố nào khắc chế Kim?',
        questionType: 'Multiple Choice',
        options: ['Thủy', 'Hỏa', 'Mộc', 'Thổ'],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 1,
        point: 1
      },
      {
        questionId: 'fallback-4',
        question: 'Khi một căn phòng có quá nhiều năng lượng Hỏa, nên thêm yếu tố nào để cân bằng?',
        questionType: 'Multiple Choice',
        options: ['Kim', 'Mộc', 'Thủy', 'Thổ'],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 2,
        point: 1
      },
      {
        questionId: 'fallback-5',
        question: 'Hướng Đông trong Bát quái tượng trưng cho điều gì?',
        questionType: 'Multiple Choice',
        options: ['Sự nghiệp', 'Gia đình', 'Sức khỏe', 'Sự giàu có'],
        optionTypes: ['Text', 'Text', 'Text', 'Text'],
        correctAnswer: 1,
        point: 1
      }
    ];
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

  // Handle answer selection
  const handleAnswerSelection = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
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

  // Handle quiz submission
  const handleQuizSubmission = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Prepare selected answer IDs for submission
    const selectedAnswerIds = [];
    
    Object.keys(selectedAnswers).forEach(questionIndex => {
      const qIndex = parseInt(questionIndex);
      const question = questions[qIndex];
      const userAnswerIndex = parseInt(selectedAnswers[qIndex]);
      
      // If answers are available from API
      if (question.answers && question.answers.length > 0) {
        // Get the answerId from the selected answer
        const answerId = question.answers[userAnswerIndex]?.answerId;
        if (answerId) {
          selectedAnswerIds.push({
            answerId: answerId
          });
        }
      }
    });
    
    // Calculate time spent in minutes
    const timeSpentMinutes = quizTimeLimits[quizId] - Math.ceil(timeRemaining/60);
    
    try {
      setLoading(true);
      
      // Submit answers to API
      const response = await fetch(`http://192.168.31.148:5261/api/RegisterCourse/submit-answers-by/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answerIds: selectedAnswerIds
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result) {
        // Get score and other data from API response
        const finalScore = result.score || calculateScore(); // Use API score if available, otherwise calculate locally
        setScore(finalScore);
        setQuizCompleted(true);
        
        // Get count of correct answers from API or calculate locally
        const correctAnswersCount = result.correctAnswers || countCorrectAnswers();
        
        // Save completion status
        try {
          const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
          const completedQuizzes = savedQuizzes ? JSON.parse(savedQuizzes) : {};
          
          completedQuizzes[quizId] = {
            completed: true,
            score: finalScore,
            date: new Date().toISOString()
          };
          
          await AsyncStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
          
          // Navigate to score screen
          router.replace({
            pathname: '/(tabs)/course_score',
            params: {
              quizId,
              source,
              score: finalScore.toString(),
              totalQuestions: questions.length.toString(),
              correctAnswers: correctAnswersCount.toString(),
              timeSpent: timeSpentMinutes.toString()
            }
          });
        } catch (error) {
          console.log('Error saving quiz completion', error);
          Alert.alert('Lỗi', 'Không thể lưu kết quả bài kiểm tra');
        }
      } else {
        console.error('Error submitting answers:', result);
        Alert.alert('Lỗi', 'Không thể gửi câu trả lời. Vui lòng thử lại.');
        
        // If API submission fails, still allow continuing with locally calculated score
        handleLocalScoreSubmission(timeSpentMinutes);
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      
      // If API submission fails, still allow continuing with locally calculated score
      handleLocalScoreSubmission(timeSpentMinutes);
    } finally {
      setLoading(false);
    }
  };

  // Calculate score locally (fallback if API fails)
  const calculateScore = () => {
    let totalPoints = 0;
    
    Object.keys(selectedAnswers).forEach(questionIndex => {
      const qIndex = parseInt(questionIndex);
      const question = questions[qIndex];
      const userAnswerIndex = parseInt(selectedAnswers[qIndex]);
      
      // If there are answers from API and user selected the correct one
      if (question.answers && question.answers.length > 0) {
        if (question.answers[userAnswerIndex]?.is_Correct) {
          totalPoints += question.point;
        }
      } else {
        // Fallback using correctAnswer index
        if (userAnswerIndex === question.correctAnswer) {
          totalPoints += question.point;
        }
      }
    });
    
    // Calculate score out of 10
    const maxPossiblePoints = questions.reduce((total, q) => total + (q.point || 1), 0);
    return (totalPoints / maxPossiblePoints) * 10;
  };

  // Count correct answers locally (fallback if API fails)
  const countCorrectAnswers = () => {
    let correctAnswersCount = 0;
    
    Object.keys(selectedAnswers).forEach(questionIndex => {
      const qIndex = parseInt(questionIndex);
      const question = questions[qIndex];
      const userAnswerIndex = parseInt(selectedAnswers[qIndex]);
      
      // If there are answers from API and user selected the correct one
      if (question.answers && question.answers.length > 0) {
        if (question.answers[userAnswerIndex]?.is_Correct) {
          correctAnswersCount++;
        }
      } else {
        // Fallback using correctAnswer index
        if (userAnswerIndex === question.correctAnswer) {
          correctAnswersCount++;
        }
      }
    });
    
    return correctAnswersCount;
  };

  // Handle local score submission (if API fails)
  const handleLocalScoreSubmission = async (timeSpentMinutes) => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setQuizCompleted(true);
    
    // Calculate correct answers
    const correctAnswersCount = countCorrectAnswers();
    
    // Save completion status
    try {
      const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
      const completedQuizzes = savedQuizzes ? JSON.parse(savedQuizzes) : {};
      
      completedQuizzes[quizId] = {
        completed: true,
        score: finalScore,
        date: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
      
      // Navigate to score screen
      router.replace({
        pathname: '/(tabs)/course_score',
        params: {
          quizId,
          source,
          score: finalScore.toString(),
          totalQuestions: questions.length.toString(),
          correctAnswers: correctAnswersCount.toString(),
          timeSpent: timeSpentMinutes.toString()
        }
      });
    } catch (error) {
      console.log('Error saving quiz completion', error);
      Alert.alert('Lỗi', 'Không thể lưu kết quả bài kiểm tra');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quizTitles[quizId]}</Text>
        <View style={{ width: 24 }} />
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
        <Text style={styles.questionText}>{questions[currentQuestionIndex]?.question || "Không có câu hỏi"}</Text>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {questions[currentQuestionIndex]?.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestionIndex] === index && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelection(currentQuestionIndex, index)}
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
        </View>
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
});