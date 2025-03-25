import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Share,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CourseScoreScreen() {
  const router = useRouter();
  const { 
    quizId = 'section1-quiz', 
    score = '0', 
    source = 'chapter',
    totalQuestions = '10',
    correctAnswers = '0',
    timeSpent = '0'
  } = useLocalSearchParams();
  
  const [quizDetails, setQuizDetails] = useState(null);
  const [hasSharedResult, setHasSharedResult] = useState(false);

  // Quiz data mapping
  const quizTitles = {
    'final-exam': 'Bài kiểm tra cuối khóa',
  };

  // Section titles
  const sectionTitles = {
    'final': 'Kết thúc khóa học',
  };
  
  // Parse numeric values from params
  const numericScore = parseFloat(score);
  const numericTotalQuestions = parseInt(totalQuestions);
  const numericCorrectAnswers = parseInt(correctAnswers);
  const numericTimeSpent = parseInt(timeSpent);

  useEffect(() => {
    // Load quiz data from AsyncStorage
    const loadQuizData = async () => {
      try {
        const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
        if (savedQuizzes) {
          const quizzes = JSON.parse(savedQuizzes);
          setQuizDetails(quizzes[quizId]);
        }
      } catch (error) {
        console.log('Error loading quiz data:', error);
      }
    };
    
    loadQuizData();
    
    // Haptic feedback for achievement
    if (numericScore >= 7) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [quizId]);

  // Get section title based on quiz ID
  const getCurrentSection = () => {
    return 'final';
  };

  // Handle return to course
  const handleReturnToCourse = () => {
    if (source === 'video') {
      // If quiz was launched from video screen, return to the video screen
      router.replace({
        pathname: '/(tabs)/course_video',
        params: { 
          lessonId: 'section1-lesson1'
        }
      });
    } else {
      // Default return to course chapter
      router.replace('/(tabs)/course_chapter');
    }
  };

  // Handle sharing result
  const handleShareResult = async () => {
    try {
      const result = await Share.share({
        message: `Tôi vừa hoàn thành ${quizTitles[quizId]} với điểm số ${numericScore.toFixed(1)}/10 trong ứng dụng Phong Thủy Cổ Học!`,
      });
      
      if (result.action === Share.sharedAction) {
        setHasSharedResult(true);
      }
    } catch (error) {
      console.log('Error sharing result:', error);
    }
  };

  // Check if quiz was passed
  const passThreshold = quizId === 'final-exam' ? 8.0 : 7.0;
  const isPassed = numericScore >= passThreshold;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kết quả kiểm tra</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Quiz Info */}
        <View style={styles.quizInfoContainer}>
          <Text style={styles.quizTitle}>{quizTitles[quizId]}</Text>
          <Text style={styles.chapterName}>{sectionTitles[getCurrentSection()]}</Text>
        </View>
        
        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, isPassed ? styles.scoreCirclePassed : styles.scoreCircleFailed]}>
            <Text style={styles.scoreText}>{numericScore.toFixed(1)}</Text>
            <Text style={styles.scoreMax}>/10</Text>
          </View>
          
          <View style={styles.resultSummary}>
            <Text style={[styles.resultStatus, isPassed ? styles.passedText : styles.failedText]}>
              {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
            </Text>
            <Text style={styles.resultDescription}>
              {isPassed 
                ? 'Chúc mừng! Bạn đã hoàn thành bài kiểm tra thành công.' 
                : `Bạn cần đạt tối thiểu ${passThreshold} điểm để vượt qua bài kiểm tra này.`}
            </Text>
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.statIcon} />
            <Text style={styles.statValue}>{numericCorrectAnswers}/{numericTotalQuestions}</Text>
            <Text style={styles.statLabel}>Câu trả lời đúng</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#FF9800" style={styles.statIcon} />
            <Text style={styles.statValue}>{numericTimeSpent} phút</Text>
            <Text style={styles.statLabel}>Thời gian hoàn thành</Text>
          </View>
          
          {quizId === 'final-exam' && isPassed && (
            <View style={styles.achievementBadge}>
              <Image 
                source={require('../../assets/images/certificate.png')} 
                style={styles.certificateIcon}
              />
              <Text style={styles.achievementText}>Chứng chỉ đã mở khóa!</Text>
            </View>
          )}
        </View>
        
        {/* Feedback */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>Đánh giá</Text>
          <Text style={styles.feedbackText}>
            {isPassed 
              ? 'Bạn đã thể hiện sự hiểu biết tốt về phong thủy. Tiếp tục phát huy kiến thức của bạn bằng cách thực hành và áp dụng vào thực tế.'
              : 'Đừng nản lòng! Hãy xem lại bài học và thử lại. Một số khái niệm phong thủy có thể cần thời gian để nắm vững.'}
          </Text>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton, hasSharedResult && styles.disabledButton]}
          onPress={handleShareResult}
          disabled={hasSharedResult}
        >
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>
            {hasSharedResult ? 'Đã chia sẻ' : 'Chia sẻ kết quả'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.returnButton]}
          onPress={handleReturnToCourse}
        >
          <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Tiếp tục học</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  quizInfoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  chapterName: {
    fontSize: 16,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCirclePassed: {
    borderColor: '#4CAF50',
  },
  scoreCircleFailed: {
    borderColor: '#F44336',
  },
  scoreText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreMax: {
    fontSize: 20,
    color: '#555',
  },
  resultSummary: {
    alignItems: 'center',
  },
  resultStatus: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  passedText: {
    color: '#4CAF50',
  },
  failedText: {
    color: '#F44336',
  },
  resultDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginVertical: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: width / 2 - 25,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    width: width - 40,
    justifyContent: 'center',
  },
  certificateIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  feedbackContainer: {
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
  },
  shareButton: {
    backgroundColor: '#8B0000',
    opacity: 0.8,
  },
  returnButton: {
    backgroundColor: '#8B0000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
