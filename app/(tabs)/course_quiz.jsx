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
  const { quizId = 'section1-quiz', source = 'chapter' } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  // Quiz data mapping
  const quizTitles = {
    'section1-quiz': 'Kiểm tra kiến thức cơ bản phong thủy',
    'section2-quiz': 'Kiểm tra hướng và bát quái',
    'section3-quiz': 'Kiểm tra kiến thức về thủy mạch',
    'final-exam': 'Bài kiểm tra cuối khóa',
  };

  // Time limits in minutes
  const quizTimeLimits = {
    'section1-quiz': 10,
    'section2-quiz': 15,
    'section3-quiz': 12,
    'final-exam': 30,
  };

  // Chapter 1 Quiz Questions: Basic Feng Shui Concepts
  const section1Questions = [
    {
      question: 'Phong thủy bắt nguồn từ quốc gia nào?',
      options: ['Ấn Độ', 'Trung Quốc', 'Nhật Bản', 'Hàn Quốc'],
      correctAnswer: 1
    },
    {
      question: 'Ngũ hành trong phong thủy bao gồm những yếu tố nào?',
      options: ['Lửa, Nước, Đất, Không khí, Năng lượng', 'Kim, Mộc, Thủy, Hỏa, Thổ', 'Ánh sáng, Bóng tối, Gió, Lửa, Nước', 'Mặt trời, Mặt trăng, Sao, Đất, Biển'],
      correctAnswer: 1
    },
    {
      question: 'Thuật ngữ "Phong Thủy" có nghĩa là gì?',
      options: ['Vận may và hạnh phúc', 'Hài hòa và cân bằng', 'Gió và Nước', 'Âm và Dương'],
      correctAnswer: 2
    },
    {
      question: 'Yếu tố nào sau đây KHÔNG thuộc Ngũ hành?',
      options: ['Kim', 'Mộc', 'Thổ', 'Phong'],
      correctAnswer: 3
    },
    {
      question: 'Học thuyết Âm-Dương được sử dụng trong phong thủy như thế nào?',
      options: [
        'Để tạo ra sự cân bằng giữa các yếu tố đối lập',
        'Chỉ để trang trí',
        'Chỉ áp dụng cho các không gian bên ngoài',
        'Chỉ liên quan đến màu sắc'
      ],
      correctAnswer: 0
    },
    {
      question: 'Ngũ hành Thủy tương sinh với ngũ hành nào?',
      options: ['Kim', 'Mộc', 'Thổ', 'Hỏa'],
      correctAnswer: 1
    },
    {
      question: 'Đâu là biểu tượng may mắn phổ biến trong phong thủy?',
      options: ['Cá chép', 'Chim đại bàng', 'Hổ', 'Gấu'],
      correctAnswer: 0
    },
    {
      question: 'Theo phong thủy, vị trí nào trong nhà được coi là vị trí quyền lực?',
      options: ['Phòng ngủ', 'Nhà bếp', 'Ghế sofa', 'Ghế chủ trong phòng làm việc hoặc bàn ăn'],
      correctAnswer: 3
    },
    {
      question: 'Đồng hồ treo tường trong phong thủy có ý nghĩa gì?',
      options: [
        'Biểu tượng của sự giàu có',
        'Biểu tượng của thời gian và nhịp sống',
        'Không có ý nghĩa đặc biệt',
        'Chỉ nên treo ở hướng Nam'
      ],
      correctAnswer: 1
    },
    {
      question: 'Tứ Tượng trong phong thủy bao gồm những gì?',
      options: [
        'Xuân, Hạ, Thu, Đông',
        'Đông, Tây, Nam, Bắc',
        'Thái Dương, Thái Âm, Thiếu Dương, Thiếu Âm',
        'Sáng, Trưa, Chiều, Tối'
      ],
      correctAnswer: 2
    }
  ];

  // Chapter 2 Quiz Questions: Directions and Bagua
  const section2Questions = [
    {
      question: 'Bát quái đồ trong phong thủy có bao nhiêu khu vực?',
      options: ['6', '8', '9', '12'],
      correctAnswer: 1
    },
    {
      question: 'Hướng nào sau đây không thuộc về Tứ chính?',
      options: ['Bắc', 'Nam', 'Đông', 'Đông Nam'],
      correctAnswer: 3
    },
    {
      question: 'Hướng nào được coi là hướng may mắn cho người mệnh Hỏa?',
      options: ['Bắc', 'Nam', 'Đông', 'Tây'],
      correctAnswer: 1
    },
    {
      question: 'La bàn Lạc Ban được sử dụng để làm gì trong phong thủy?',
      options: [
        'Tìm hướng đi du lịch',
        'Xác định hướng và năng lượng của một không gian',
        'Định hướng xây nhà theo thiên văn',
        'Xác định tuổi của công trình'
      ],
      correctAnswer: 1
    },
    {
      question: 'Theo Bát quái, khu vực nào liên quan đến sự giàu có và thịnh vượng?',
      options: ['Tây Nam', 'Đông Nam', 'Bắc', 'Nam'],
      correctAnswer: 1
    },
    {
      question: 'Phương vị nào trong nhà nên đặt những vật có tính chất nước theo Bát quái?',
      options: ['Bắc', 'Đông', 'Nam', 'Tây'],
      correctAnswer: 0
    },
    {
      question: 'Hướng nào được coi là hướng may mắn cho người mệnh Thủy?',
      options: ['Bắc', 'Nam', 'Đông Bắc', 'Tây Bắc'],
      correctAnswer: 0
    },
    {
      question: 'Khu vực nào của Bát quái liên quan đến hôn nhân và các mối quan hệ?',
      options: ['Tây Nam', 'Đông Nam', 'Đông Bắc', 'Tây Bắc'],
      correctAnswer: 0
    },
    {
      question: 'Trong Bát quái, phương vị nào tượng trưng cho sự nghiệp?',
      options: ['Bắc', 'Nam', 'Đông', 'Tây'],
      correctAnswer: 0
    },
    {
      question: 'Theo phong thủy, hướng giường ngủ nên?',
      options: [
        'Luôn hướng về phía Đông để đón ánh mặt trời',
        'Luôn hướng về phía Nam để hút vận may',
        'Tránh đặt chân giường hướng thẳng vào cửa ra vào',
        'Luôn hướng về phía Tây để tránh xui rủi'
      ],
      correctAnswer: 2
    }
  ];

  // Chapter 3 Quiz Questions: Water Element in Feng Shui
  const section3Questions = [
    {
      question: 'Trong phong thủy, nước tượng trưng cho điều gì?',
      options: ['Sức mạnh', 'Sự giàu có và thịnh vượng', 'Sự thanh lọc', 'Tất cả các đáp án trên'],
      correctAnswer: 3
    },
    {
      question: 'Đặt hồ cá ở đâu trong nhà được cho là tốt nhất cho sự thịnh vượng?',
      options: ['Phía trước nhà', 'Phía sau nhà', 'Phòng ngủ', 'Nhà bếp'],
      correctAnswer: 0
    },
    {
      question: 'Màu sắc nào của cá Koi được cho là mang lại may mắn về tài chính?',
      options: ['Đỏ', 'Đen', 'Vàng/Cam', 'Trắng'],
      correctAnswer: 2
    },
    {
      question: 'Nên đặt bao nhiêu con cá trong bể cá phong thủy?',
      options: ['8 con', '9 con', 'Số lẻ con', 'Bất kỳ số nào'],
      correctAnswer: 1
    },
    {
      question: 'Theo phong thủy, đặt thác nước mini trong nhà có tác dụng gì?',
      options: [
        'Tăng cường năng lượng tích cực',
        'Làm thanh lọc không khí',
        'Gia tăng lưu chuyển năng lượng',
        'Tất cả các đáp án trên'
      ],
      correctAnswer: 3
    },
    {
      question: 'Thủy mạch trong phong thủy là gì?',
      options: [
        'Dòng chảy của nước ngầm dưới đất',
        'Dòng chảy của nước xung quanh công trình',
        'Dòng năng lượng vô hình giống như nước',
        'Tất cả các đáp án trên'
      ],
      correctAnswer: 2
    },
    {
      question: 'Phong thủy nào bị coi là xấu cho một ngôi nhà?',
      options: [
        'Nhà nằm giữa hai con đường tạo thành hình chữ Y',
        'Nhà có sông nhỏ chảy quanh',
        'Nhà có hồ nước phía trước',
        'Nhà có suối nhỏ phía sau'
      ],
      correctAnswer: 0
    },
    {
      question: 'Số lượng cá Koi lý tưởng trong một hồ phong thủy là?',
      options: ['7', '8', '9', '10'],
      correctAnswer: 2
    },
    {
      question: 'Hướng nào thích hợp nhất để đặt một hồ nước trong vườn theo phong thủy?',
      options: ['Đông hoặc Đông Nam', 'Bắc', 'Tây Nam', 'Tây hoặc Tây Bắc'],
      correctAnswer: 0
    },
    {
      question: 'Hiện tượng "Nước chảy Tài vào" trong phong thủy có nghĩa là gì?',
      options: [
        'Nước trong nhà phải luôn chảy',
        'Hướng chảy của nước nên vào trong nhà, không phải ra ngoài',
        'Sự lưu thông của nước tượng trưng cho sự lưu thông của tài lộc',
        'Nước mưa phải được thu gom và lưu trữ'
      ],
      correctAnswer: 2
    }
  ];

  // Final Exam Questions: Comprehensive
  const finalExamQuestions = [
    // Basic concepts
    {
      question: 'Thuyết Âm Dương trong phong thủy có nguồn gốc từ đâu?',
      options: ['Kinh Dịch', 'Kinh Phật', 'Đạo Giáo', 'Nho Giáo'],
      correctAnswer: 0
    },
    {
      question: 'Trong phong thủy, "Long Huyệt" là gì?',
      options: [
        'Mạch nước ngầm dưới đất',
        'Vị trí lý tưởng để xây nhà hoặc đặt mộ',
        'Hình dáng giống rồng của núi',
        'Hướng của gió thịnh vượng'
      ],
      correctAnswer: 1
    },
    // Elements and interactions
    {
      question: 'Trong Ngũ hành, yếu tố nào khắc chế Kim?',
      options: ['Thủy', 'Hỏa', 'Mộc', 'Thổ'],
      correctAnswer: 1
    },
    {
      question: 'Khi một căn phòng có quá nhiều năng lượng Hỏa, nên thêm yếu tố nào để cân bằng?',
      options: ['Kim', 'Mộc', 'Thủy', 'Thổ'],
      correctAnswer: 2
    },
    // Directions and bagua
    {
      question: 'Hướng Đông trong Bát quái tượng trưng cho điều gì?',
      options: ['Sự nghiệp', 'Gia đình', 'Sức khỏe', 'Sự giàu có'],
      correctAnswer: 1
    },
    {
      question: 'Khu vực "Phúc Đức" trong Bát quái phong thủy nằm ở hướng nào?',
      options: ['Đông Bắc', 'Tây Nam', 'Tây Bắc', 'Đông Nam'],
      correctAnswer: 2
    },
    // Practical applications
    {
      question: 'Khi bàn làm việc đặt hợp phong thủy, nên?',
      options: [
        'Đặt áp lưng vào tường và nhìn thấy cửa ra vào',
        'Đặt cạnh cửa sổ để đón ánh sáng',
        'Đặt gần cửa ra vào để thuận tiện',
        'Đặt giữa phòng để tạo cảm giác rộng rãi'
      ],
      correctAnswer: 0
    },
    {
      question: 'Vị trí nào trong nhà không nên đặt gương theo phong thủy?',
      options: [
        'Đối diện cửa chính',
        'Trong phòng khách',
        'Trong phòng tắm',
        'Trên tường phòng ngủ'
      ],
      correctAnswer: 0
    },
    // Water element
    {
      question: 'Cá Koi màu đen trong phong thủy tượng trưng cho điều gì?',
      options: [
        'Sự giàu có',
        'Sự bảo vệ khỏi năng lượng xấu',
        'Thành công trong sự nghiệp',
        'Tình yêu và hạnh phúc'
      ],
      correctAnswer: 1
    },
    {
      question: 'Khi đặt đài phun nước trong nhà, nơi lý tưởng nhất là?',
      options: [
        'Ngay lối vào nhà',
        'Ở góc Đông Nam của nhà',
        'Trong phòng ngủ',
        'Gần cửa sổ có nhiều ánh sáng'
      ],
      correctAnswer: 1
    },
    // Advanced concepts
    {
      question: 'Lý thuyết "Tam Nguyên Cửu Vận" trong phong thủy đề cập đến điều gì?',
      options: [
        'Ba loại năng lượng tích cực',
        'Chín chu kỳ năng lượng thay đổi theo thời gian',
        'Ba yếu tố chính trong phong thủy',
        'Chín hướng cơ bản'
      ],
      correctAnswer: 1
    },
    {
      question: 'Trong phong thủy mộ táng, "Huyền Không Phi Tinh" được sử dụng để xác định điều gì?',
      options: [
        'Thời điểm tốt nhất để mai táng',
        'Vị trí năng lượng tốt và xấu theo thời gian',
        'Loại đất thích hợp cho mộ',
        'Hướng của mộ phần'
      ],
      correctAnswer: 1
    },
    // Symbolic meanings
    {
      question: 'Tượng rùa trong phong thủy tượng trưng cho điều gì?',
      options: [
        'Sự thịnh vượng',
        'Tuổi thọ và sự ổn định',
        'Sự khôn ngoan',
        'Sự bảo vệ gia đình'
      ],
      correctAnswer: 1
    },
    {
      question: 'Cây tre trong phong thủy có ý nghĩa gì?',
      options: [
        'Sự mạnh mẽ và linh hoạt',
        'Sự giàu có',
        'Sự thanh lọc',
        'Tình yêu lãng mạn'
      ],
      correctAnswer: 0
    },
    // Practical feng shui
    {
      question: 'Khu vực nào trong nhà nên TRÁNH đặt nhiều cây xanh?',
      options: ['Phòng khách', 'Phòng ngủ', 'Nhà bếp', 'Hành lang'],
      correctAnswer: 1
    },
    {
      question: 'Vật dụng nào không nên có trong phòng ngủ theo phong thủy?',
      options: [
        'Gương đối diện giường',
        'Tranh phong cảnh yên bình',
        'Đèn ngủ nhỏ',
        'Thảm tròn'
      ],
      correctAnswer: 0
    },
    // Historical context
    {
      question: 'Ai được coi là cha đẻ của phong thủy?',
      options: ['Lão Tử', 'Khổng Tử', 'Chu Công', 'Quách Phác'],
      correctAnswer: 3
    },
    {
      question: 'Thời kỳ nào phong thủy được phát triển mạnh nhất ở Trung Quốc?',
      options: ['Thời Tần', 'Thời Hán', 'Thời Đường', 'Thời Tống'],
      correctAnswer: 3
    },
    // Modern applications
    {
      question: 'Trong phong thủy hiện đại, các thiết bị điện tử nên được đặt ở đâu trong phòng ngủ?',
      options: [
        'Gần giường để tiện sử dụng',
        'Đối diện giường để xem TV',
        'Càng xa giường càng tốt',
        'Không quan trọng vị trí'
      ],
      correctAnswer: 2
    },
    {
      question: 'Phong thủy hiện đại cho văn phòng làm việc khuyên điều gì về màn hình máy tính?',
      options: [
        'Nên đặt gần cửa sổ để tận dụng ánh sáng tự nhiên',
        'Nên đặt xa cửa ra vào',
        'Không nên quay lưng ra cửa khi sử dụng máy tính',
        'Nên đặt máy tính ở vị trí trung tâm của bàn'
      ],
      correctAnswer: 2
    }
  ];

  // Select questions based on quiz ID
  const getQuestions = () => {
    switch(quizId) {
      case 'section1-quiz':
        return section1Questions;
      case 'section2-quiz':
        return section2Questions;
      case 'section3-quiz':
        return section3Questions;
      case 'final-exam':
        return finalExamQuestions;
      default:
        return section1Questions;
    }
  };

  const questions = getQuestions();

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
  }, [quizId]); // Add quizId as a dependency so the effect runs when it changes

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

  // Calculate score
  const calculateScore = () => {
    let correctCount = 0;
    
    Object.keys(selectedAnswers).forEach(questionIndex => {
      if (parseInt(selectedAnswers[questionIndex]) === questions[parseInt(questionIndex)].correctAnswer) {
        correctCount++;
      }
    });
    
    // Calculate score out of 10
    return (correctCount / questions.length) * 10;
  };

  // Handle quiz submission
  const handleQuizSubmission = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalScore = calculateScore();
    setScore(finalScore);
    setQuizCompleted(true);
    
    // Calculate correct answers
    const correctAnswersCount = Object.keys(selectedAnswers).filter(questionIndex => 
      parseInt(selectedAnswers[questionIndex]) === questions[parseInt(questionIndex)].correctAnswer
    ).length;
    
    // Calculate time spent in minutes
    const timeSpentMinutes = quizTimeLimits[quizId] - Math.ceil(timeRemaining/60);
    
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

  // Handle return to course
  const handleReturnToCourse = () => {
    if (source === 'video') {
      // If quiz was launched from video screen, return to the video screen
      router.replace({
        pathname: '/(tabs)/course_video',
        params: { 
          // If quiz is section-specific, extract section and return to corresponding lesson
          lessonId: quizId.includes('section') ? 
            `${quizId.split('-')[0]}-lesson1` : 'section1-lesson1'
        }
      });
    } else {
      // Default return to course chapter
      router.replace('/(tabs)/course_chapter');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải bài kiểm tra...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Quiz Header */}
      <View style={styles.header}>
        {!quizCompleted && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.quizTitle}>{quizTitles[quizId]}</Text>
        {!quizCompleted && (
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={20} color="#8B0000" />
            <Text style={styles.timerText}>{formatTimeRemaining()}</Text>
          </View>
        )}
      </View>
      
      {/* Quiz Content or Results */}
      {quizCompleted ? (
        <View style={styles.container}>
          <Text>Quiz Completed</Text>
        </View>
      ) : (
        <>
          {/* Question Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Câu hỏi {currentQuestionIndex + 1}/{questions.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          {/* Question and Answers */}
          <ScrollView 
            ref={scrollRef}
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
          >
            <Text style={styles.questionText}>
              {questions[currentQuestionIndex].question}
            </Text>
            
            {questions[currentQuestionIndex].options.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.answerOption,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswer
                ]}
                onPress={() => handleAnswerSelection(currentQuestionIndex, index)}
              >
                <View style={[
                  styles.answerCircle,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswerCircle
                ]}>
                  <Text style={[
                    styles.answerCircleText,
                    selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswerCircleText
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.answerText,
                  selectedAnswers[currentQuestionIndex] === index && styles.selectedAnswerText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Question Navigation */}
          <View style={styles.questionNavContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questionDotsContainer}>
              {questions.map((_, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.questionDot,
                    currentQuestionIndex === index && styles.activeQuestionDot,
                    selectedAnswers[index] !== undefined && styles.answeredQuestionDot
                  ]}
                  onPress={() => goToQuestion(index)}
                >
                  <Text style={[
                    styles.questionDotText,
                    (currentQuestionIndex === index || selectedAnswers[index] !== undefined) && styles.activeQuestionDotText
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Navigation Buttons */}
          <View style={styles.navButtonsContainer}>
            <TouchableOpacity 
              style={[styles.navButton, styles.prevButton, currentQuestionIndex === 0 && styles.disabledButton]}
              onPress={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons name="chevron-back" size={24} color={currentQuestionIndex === 0 ? "#ccc" : "#8B0000"} />
              <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledButtonText]}>
                Câu trước
              </Text>
            </TouchableOpacity>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <TouchableOpacity 
                style={[styles.navButton, styles.submitButton]}
                onPress={handleQuizSubmission}
              >
                <Text style={styles.submitButtonText}>Nộp bài</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNextQuestion}
              >
                <Text style={styles.navButtonText}>Câu tiếp</Text>
                <Ionicons name="chevron-forward" size={24} color="#8B0000" />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
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
    backgroundColor: '#fff',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B0000',
    borderRadius: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 26,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAnswer: {
    backgroundColor: '#f8f0f0',
    borderColor: '#8B0000',
  },
  answerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  selectedAnswerCircle: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  answerCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  selectedAnswerCircleText: {
    color: '#fff',
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 24,
  },
  selectedAnswerText: {
    fontWeight: '500',
  },
  questionNavContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  questionDotsContainer: {
    flexDirection: 'row',
  },
  questionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  activeQuestionDot: {
    backgroundColor: '#8B0000',
  },
  answeredQuestionDot: {
    backgroundColor: '#f8f0f0',
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  questionDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeQuestionDotText: {
    color: '#fff',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  prevButton: {
    backgroundColor: '#f5f5f5',
  },
  nextButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B0000',
  },
  disabledButtonText: {
    color: '#aaa',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});