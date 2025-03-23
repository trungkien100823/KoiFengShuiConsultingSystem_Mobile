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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function CourseQuizStartScreen() {
  const router = useRouter();
  const { quizId = 'section1-quiz', source = 'chapter' } = useLocalSearchParams();
  const [completedQuizzes, setCompletedQuizzes] = useState({});

  // Quiz data mapping
  const quizTitles = {
    'section1-quiz': 'Kiểm tra kiến thức cơ bản phong thủy',
    'section2-quiz': 'Kiểm tra hướng và bát quái',
    'section3-quiz': 'Kiểm tra kiến thức về thủy mạch',
    'final-exam': 'Bài kiểm tra cuối khóa',
  };

  // Section titles
  const sectionTitles = {
    'section1': 'Phong thủy cơ bản',
    'section2': 'Cách xem hướng',
    'section3': 'Thủy mạch trong phong thủy',
    'final': 'Kết thúc khóa học',
  };

  // Quiz details mapping
  const quizDetails = {
    'section1-quiz': {
      description: 'Bài kiểm tra này sẽ đánh giá kiến thức của bạn về các nguyên lý cơ bản của phong thủy, bao gồm ngũ hành, âm dương và tứ tượng.',
      timeLimit: '10 phút',
      questions: 10,
      passingScore: '70%',
      attempts: 'Không giới hạn',
      requirements: 'Hoàn thành tất cả các bài học trong Chương 1'
    },
    'section2-quiz': {
      description: 'Kiểm tra hiểu biết của bạn về hướng nhà, bát quái và cách xác định vị trí tốt cho đồ đạc trong nhà.',
      timeLimit: '15 phút',
      questions: 15,
      passingScore: '75%',
      attempts: 'Không giới hạn',
      requirements: 'Hoàn thành tất cả các bài học trong Chương 2'
    },
    'section3-quiz': {
      description: 'Đánh giá kiến thức của bạn về vai trò của nước trong phong thủy, thủy mạch và cách bố trí hồ cá trong nhà.',
      timeLimit: '12 phút',
      questions: 12,
      passingScore: '80%',
      attempts: 'Không giới hạn',
      requirements: 'Hoàn thành tất cả các bài học trong Chương 3'
    },
    'final-exam': {
      description: 'Bài kiểm tra cuối khóa sẽ đánh giá toàn bộ kiến thức bạn đã học trong khóa Phong thủy cổ học, bao gồm các kiến thức từ cả 3 chương.',
      timeLimit: '30 phút',
      questions: 30,
      passingScore: '80%',
      attempts: '3 lần',
      requirements: 'Hoàn thành tất cả các bài học và bài kiểm tra trong khóa học'
    }
  };

  // Get current section from quizId
  const getCurrentSection = () => {
    if (quizId === 'final-exam') {
      return 'final';
    }
    const sectionMatch = quizId.match(/section(\d+)/);
    return sectionMatch ? `section${sectionMatch[1]}` : 'section1';
  };
  
  const currentSection = getCurrentSection();

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
    router.push("/(tabs)/course_chapter");
  };

  // Start the quiz
  const handleStartQuiz = () => {
    router.push({
      pathname: '/(tabs)/course_quiz',
      params: { quizId, source }
    });
  };

  const currentQuizDetails = quizDetails[quizId] || quizDetails['section1-quiz'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Same style as course_video.jsx */}
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
          <Text style={styles.quizTitle}>{quizTitles[quizId]}</Text>
          {completedQuizzes[quizId] && (
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
        >
          <Text style={styles.startButtonText}>
            {completedQuizzes[quizId] ? 'Làm lại bài kiểm tra' : 'Bắt đầu bài kiểm tra'}
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
