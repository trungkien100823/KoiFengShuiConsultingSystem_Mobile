import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);
const isIOS = Platform.OS === 'ios';

// Calculate status bar height
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' 
  ? (Platform.isPad ? 20 : StatusBar.currentHeight || 44) 
  : StatusBar.currentHeight || 0;

export default function CourseScoreScreen() {
  const router = useRouter();
  const { 
    quizId, 
    score, 
    source,
    totalQuestions,
    correctAnswers,
    timeSpent,
    percentage,
    courseId
  } = useLocalSearchParams();
  
  const [quizDetails, setQuizDetails] = useState(null);
  const [hasSharedResult, setHasSharedResult] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRatedBefore, setHasRatedBefore] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState(null);

  // Quiz data mapping
  const quizTitles = {
    'final-exam': 'Bài kiểm tra cuối khóa',
  };

  // Section titles
  const sectionTitles = {
    'final': 'Kết thúc khóa học',
  };
  
  // Thêm hàm format thời gian
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) {
      return "0:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Parse numeric values from params
  const numericScore = parseFloat(score || 0);
  const numericTotalQuestions = parseInt(totalQuestions || 0);
  const numericCorrectAnswers = parseInt(correctAnswers || 0);
  const numericTimeSpent = parseInt(timeSpent || 0);

  // Kiểm tra xem người dùng đã đánh giá khóa học chưa
  const checkPreviousRating = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token || !courseId) {
        setHasRatedBefore(false);
        setRating(0);
        return;
      }
      
      // Reset rating và hasRatedBefore trước khi bắt đầu kiểm tra
      setRating(0);
      setHasRatedBefore(false);
      
      // Add debug log
      console.log('Bắt đầu kiểm tra trạng thái đánh giá cho khóa học:', courseId);
      
      // Kiểm tra nếu đã có enrollCourseId lưu trong AsyncStorage
      try {
        const enrollCourseData = await AsyncStorage.getItem(`enrollCourse_${courseId}`);
        if (enrollCourseData) {
          const parsedData = JSON.parse(enrollCourseData);
          if (parsedData.enrollCourseId) {
            console.log('Đã tìm thấy enrollCourseId từ AsyncStorage:', parsedData.enrollCourseId);
            setEnrollCourseId(parsedData.enrollCourseId);
            
            // Sử dụng endpoint cụ thể thay vì getRegisterCourseById
            try {
              const enrollCourseResponse = await fetch(
                `${API_CONFIG.baseURL}/api/RegisterCourse/${parsedData.enrollCourseId}`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (enrollCourseResponse.ok) {
                const enrollCourseResult = await enrollCourseResponse.json();
                
                if (enrollCourseResult.isSuccess && enrollCourseResult.data) {
                  console.log('Đã lấy được thông tin đánh giá từ API RegisterCourse');
                  console.log('Giá trị rating:', enrollCourseResult.data.rating);
                  
                  if (enrollCourseResult.data.rating !== null && enrollCourseResult.data.rating !== undefined && enrollCourseResult.data.rating > 0) {
                    console.log('Người dùng đã đánh giá khóa học này');
                    setHasRatedBefore(true);
                    setRating(enrollCourseResult.data.rating);
                  } else {
                    console.log('Người dùng chưa đánh giá khóa học này');
                    setHasRatedBefore(false);
                    setRating(0); // Nếu rating là null, set thành 0
                  }
                  return; // Đã có dữ liệu, không cần gọi API khác
                }
              }
            } catch (enrollApiError) {
              console.log('Lỗi khi gọi API RegisterCourse:', enrollApiError);
            }
          }
        }
      } catch (storageError) {
        console.log('Lỗi khi đọc enrollCourseId từ AsyncStorage:', storageError);
      }
      
      // Gọi API để lấy thông tin đăng ký khóa học của người dùng
      try {
        const response = await fetch(
          `${API_CONFIG.baseURL}/api/RegisterCourse/get-enroll-course/${courseId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          console.log('Không thể kiểm tra đánh giá trước đó từ API get-enroll-course:', response.status);
          
          // Thử lấy thông tin từ API khóa học
          try {
            const courseResponse = await fetch(
              `${API_CONFIG.baseURL}/api/Course/get-details-for-mobile/${courseId}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (courseResponse.ok) {
              const courseResult = await courseResponse.json();
              
              if (courseResult.isSuccess && courseResult.data) {
                console.log('Đã lấy được thông tin khóa học');
                console.log('Giá trị customerRating:', courseResult.data.customerRating);
                
                if (courseResult.data.customerRating !== null && courseResult.data.customerRating !== undefined && courseResult.data.customerRating > 0) {
                  console.log('Người dùng đã đánh giá khóa học này (từ API khóa học)');
                  setHasRatedBefore(true);
                  setRating(courseResult.data.customerRating);
                } else {
                  console.log('Người dùng chưa đánh giá khóa học này (từ API khóa học)');
                  setHasRatedBefore(false);
                  setRating(0);
                }
                
                // Lưu enrollCourseId từ dữ liệu khóa học nếu có
                if (courseResult.data.enrollCourseId) {
                  setEnrollCourseId(courseResult.data.enrollCourseId);
                  
                  // Lưu vào AsyncStorage để sử dụng sau này
                  await AsyncStorage.setItem(`enrollCourse_${courseId}`, JSON.stringify({
                    enrollCourseId: courseResult.data.enrollCourseId
                  }));
                  
                  // Gọi API RegisterCourse trực tiếp
                  try {
                    const enrollResponse = await fetch(
                      `${API_CONFIG.baseURL}/api/RegisterCourse/${courseResult.data.enrollCourseId}`,
                      {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                    
                    if (enrollResponse.ok) {
                      const enrollResult = await enrollResponse.json();
                      
                      if (enrollResult.isSuccess && enrollResult.data) {
                        console.log('Đã lấy được thông tin từ API RegisterCourse');
                        console.log('Dữ liệu rating từ API RegisterCourse:', enrollResult.data.rating);
                        
                        if (enrollResult.data.rating !== null && enrollResult.data.rating !== undefined && enrollResult.data.rating > 0) {
                          console.log('Người dùng đã đánh giá khóa học này (từ API RegisterCourse qua enrollCourseId)');
                          setHasRatedBefore(true);
                          setRating(enrollResult.data.rating);
                        } else {
                          console.log('Người dùng chưa đánh giá khóa học này (từ API RegisterCourse qua enrollCourseId)');
                          setHasRatedBefore(false);
                          setRating(0); // Nếu rating là null, set thành 0
                        }
                        return; // Đã lấy được thông tin, không cần kiểm tra tiếp
                      }
                    }
                  } catch (enrollError) {
                    console.log('Lỗi khi gọi API RegisterCourse:', enrollError);
                  }
                }
              }
            }
          } catch (courseError) {
            console.log('Không thể lấy thông tin khóa học:', courseError);
          }
        } else {
          const result = await response.json();
          
          // Kiểm tra xem người dùng đã đăng ký khóa học chưa
          if (result.isSuccess && result.data) {
            console.log('Đã nhận dữ liệu từ get-enroll-course API');
            
            // Lưu enrollCourseId
            if (result.data.enrollCourseId) {
              setEnrollCourseId(result.data.enrollCourseId);
              
              // Lưu vào AsyncStorage để sử dụng sau này
              await AsyncStorage.setItem(`enrollCourse_${courseId}`, JSON.stringify({
                enrollCourseId: result.data.enrollCourseId
              }));
              
              // Gọi API RegisterCourse trực tiếp
              try {
                const enrollResponse = await fetch(
                  `${API_CONFIG.baseURL}/api/RegisterCourse/${result.data.enrollCourseId}`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (enrollResponse.ok) {
                  const enrollResult = await enrollResponse.json();
                  
                  if (enrollResult.isSuccess && enrollResult.data) {
                    console.log('Đã lấy được thông tin từ API RegisterCourse');
                    console.log('Dữ liệu rating từ API:', enrollResult.data.rating);
                    
                    if (enrollResult.data.rating !== null && enrollResult.data.rating !== undefined && enrollResult.data.rating > 0) {
                      console.log('Người dùng đã đánh giá khóa học này (từ API RegisterCourse)');
                      setHasRatedBefore(true);
                      setRating(enrollResult.data.rating);
                    } else {
                      console.log('Người dùng chưa đánh giá khóa học này (từ API RegisterCourse)');
                      setHasRatedBefore(false);
                      setRating(0); // Nếu rating là null, set thành 0
                    }
                    return; // Đã lấy được thông tin, không cần kiểm tra tiếp
                  }
                }
              } catch (enrollError) {
                console.log('Lỗi khi gọi API RegisterCourse:', enrollError);
              }
            }
            
            // Nếu không lấy được từ API RegisterCourse, thử dùng dữ liệu từ get-enroll-course
            if (result.data.rating !== null && result.data.rating !== undefined && result.data.rating > 0) {
              console.log('Người dùng đã đánh giá khóa học này (từ get-enroll-course API)');
              setHasRatedBefore(true);
              setRating(result.data.rating);
            } else {
              console.log('Người dùng chưa đánh giá khóa học này (từ get-enroll-course API)');
              setHasRatedBefore(false);
              setRating(0);
            }
          } else {
            console.log('Không tìm thấy dữ liệu đăng ký khóa học');
            setHasRatedBefore(false);
            setRating(0);
          }
        }
      } catch (apiError) {
        console.log('Lỗi khi gọi API RegisterCourse:', apiError);
      }
      
      console.log('Kết thúc kiểm tra đánh giá - hasRatedBefore:', hasRatedBefore, 'rating:', rating);
    } catch (error) {
      console.log('Lỗi kiểm tra đánh giá:', error);
      setHasRatedBefore(false);
      setRating(0);
    }
  }, [courseId]);

  // Sử dụng useEffect để kiểm tra đánh giá lần đầu khi component mount
  useEffect(() => {
    checkPreviousRating();
  }, [checkPreviousRating]);

  // Sử dụng useFocusEffect để kiểm tra lại đánh giá mỗi khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Course Score Screen focused - refreshing rating data');
      
      // Lấy token mới nhất để kiểm tra xem user đã thay đổi hay chưa
      const checkTokenAndRefresh = async () => {
        const currentToken = await AsyncStorage.getItem('accessToken');
        
        // Lấy token đã lưu trước đó để so sánh
        const previousToken = await AsyncStorage.getItem('previousRatingToken');
        
        // Nếu token khác với token đã lưu trước đó, hoặc chưa có token đã lưu
        // thì gọi lại API để lấy dữ liệu đánh giá mới
        if (currentToken !== previousToken) {
          console.log('Token đã thay đổi hoặc chưa được lưu, đang tải lại dữ liệu đánh giá');
          
          // Lưu token hiện tại để so sánh lần sau
          await AsyncStorage.setItem('previousRatingToken', currentToken || '');
          
          // Xóa cache enrollCourseId để đảm bảo lấy dữ liệu mới
          if (courseId) {
            await AsyncStorage.removeItem(`enrollCourse_${courseId}`);
          }
          
          // Gọi lại hàm kiểm tra đánh giá
          checkPreviousRating();
        } else {
          console.log('Token không thay đổi, không cần tải lại dữ liệu đánh giá');
        }
      };
      
      checkTokenAndRefresh();
      
      return () => {
        // Cleanup nếu cần
      };
    }, [checkPreviousRating, courseId])
  );

  useEffect(() => {
    const loadScoreData = async () => {
      try {
        // Use the score data directly from navigation params
        if (score && correctAnswers && totalQuestions) {
          const scoreDataObj = {
            score: parseFloat(score),
            correctAnswers: parseInt(correctAnswers),
            totalQuestions: parseInt(totalQuestions),
            percentage: parseInt(percentage) || 
              Math.round((parseInt(correctAnswers) / parseInt(totalQuestions)) * 100)
          };
          setScoreData(scoreDataObj);

          // Lưu trạng thái hoàn thành với key duy nhất cho mỗi user
          const token = await AsyncStorage.getItem('accessToken');
          if (token && courseId) {
            const userQuizKey = `${token}_${courseId}_completed`;
            await AsyncStorage.setItem(userQuizKey, JSON.stringify({
              completedAt: new Date().toISOString(),
              score: scoreDataObj
            }));
          }

          setIsLoading(false);
          return;
        }
        
        // Fallback to API call if params don't contain the data
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch(
          `${API_CONFIG.baseURL}/api/Quiz/result/${quizId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch score: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.isSuccess && result.data) {
          const apiResult = result.data;
          const scoreDataObj = {
            score: apiResult.totalScore,
            correctAnswers: apiResult.correctAnswers,
            totalQuestions: apiResult.totalQuestions,
            percentage: Math.round((apiResult.correctAnswers / apiResult.totalQuestions) * 100)
          };
          setScoreData(scoreDataObj);

          // Lưu trạng thái hoàn thành với key duy nhất cho mỗi user
          if (token && courseId) {
            const userQuizKey = `${token}_${courseId}_completed`;
            await AsyncStorage.setItem(userQuizKey, JSON.stringify({
              completedAt: new Date().toISOString(),
              score: scoreDataObj
            }));
          }
        } else {
          throw new Error('Invalid score data received');
        }
      } catch (error) {
        console.error('Error loading score:', error);
        setError('Failed to load your quiz results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadScoreData();
  }, [score, correctAnswers, totalQuestions, percentage]);

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
          lessonId: 'section1-lesson1',
          courseId: courseId
        }
      });
    } else {
      // Default return to course chapter
      router.replace({
        pathname: '/(tabs)/course_chapter',
        params: { 
          courseId: courseId,
          shouldRefresh: true
        }
      });
    }
  };

  // Handle sharing result
  const handleShareResult = async () => {
    try {
      const scoreText = scoreData
        ? `${scoreData.correctAnswers}/${scoreData.totalQuestions}`
        : `${correctAnswers}/${totalQuestions}`;
        
      const result = await Share.share({
        message: `Tôi vừa hoàn thành ${quizTitles[quizId]} với kết quả ${scoreText} trong ứng dụng Phong Thủy Cổ Học!`,
      });
      
      if (result.action === Share.sharedAction) {
        setHasSharedResult(true);
      }
    } catch (error) {
      console.log('Error sharing result:', error);
    }
  };

  // Mở modal đánh giá
  const openRatingModal = () => {
    // Đảm bảo rằng modal luôn hiển thị rating = 0 khi mở lần đầu
    if (!hasRatedBefore) {
      setRating(0);
    }
    setModalVisible(true);
  };

  // Đóng modal đánh giá
  const closeRatingModal = () => {
    setModalVisible(false);
  };

  // Chọn số sao
  const handleRatingPress = (value) => {
    setRating(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Gửi đánh giá
  const submitRating = async () => {
    try {
      // Kiểm tra xem người dùng đã chọn sao chưa
      if (rating <= 0) {
        Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
        return;
      }

      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để đánh giá khóa học');
        return;
      }

      // Chuẩn bị dữ liệu gửi lên
      const requestData = {
        courseId: courseId,
        rating: rating
      };

      // Thêm enrollCourseId nếu có
      if (enrollCourseId) {
        requestData.enrollCourseId = enrollCourseId;
      }

      // Sử dụng URL trực tiếp thay vì từ config để tránh lỗi undefined
      const baseUrl = API_CONFIG.baseURL;
      const endpoint = `${baseUrl}/api/Course/rate`;
      
      console.log('Gửi đánh giá với dữ liệu:', requestData);
      console.log('Endpoint:', endpoint);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          console.log('Lỗi khi gửi đánh giá. Status:', response.status);
          const errorText = await response.text();
          console.log('Response body:', errorText);
          throw new Error(`Lỗi khi gửi đánh giá: ${response.status}`);
        }

        const result = await response.json();
        console.log('Kết quả đánh giá:', result);

        if (result.isSuccess) {
          Alert.alert('Thành công', 'Đánh giá thành công!');
          setHasRatedBefore(true);
          closeRatingModal();
        } else {
          console.log('API trả về lỗi:', result.message);
          Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra khi đánh giá khóa học');
        }
      } catch (fetchError) {
        console.log('Lỗi fetch khi gửi đánh giá:', fetchError);
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.');
      }
    } catch (error) {
      console.error('Lỗi tổng thể khi đánh giá:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đánh giá khóa học');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if quiz was passed
  const passThreshold = 80; // 80% threshold for passing
  const isPassed = scoreData 
    ? (scoreData.correctAnswers / scoreData.totalQuestions) >= 0.8
    : (parseInt(correctAnswers) / parseInt(totalQuestions)) >= 0.8;

  // Render star component
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => handleRatingPress(i)}
          style={styles.starButton}
        >
          <Ionicons 
            name={i <= rating ? "star" : "star-outline"} 
            size={scale(40)} 
            color={i <= rating ? "#FFD700" : "#ccc"} 
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  // Modal content
  const renderModalContent = () => {
    return (
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Đánh giá khóa học</Text>
        <Text style={styles.modalSubtitle}>Hãy đánh giá trải nghiệm học tập của bạn</Text>
        
        <View style={styles.starsContainer}>
          {renderStars()}
        </View>
        
        <View style={styles.modalButtonsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={closeRatingModal}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              rating <= 0 && styles.disabledSubmitButton
            ]}
            onPress={submitRating}
            disabled={isSubmitting || rating <= 0}
          >
            <Text style={[
              styles.submitButtonText,
              rating <= 0 && styles.disabledSubmitButtonText
            ]}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.headerTitle}>Kết quả kiểm tra</Text>
        </View>
      </SafeAreaView>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quiz Info */}
        <View style={styles.quizInfoContainer}>
          <Text style={styles.quizTitle}>{quizTitles[quizId]}</Text>
          <Text style={styles.chapterName}>{sectionTitles[getCurrentSection()]}</Text>
        </View>
        
        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <View style={[
            styles.scoreCircle, 
            isPassed ? styles.scoreCirclePassed : styles.scoreCircleFailed
          ]}>
            <Text style={styles.scoreText}>
              {scoreData ? `${scoreData.percentage}%` : `${percentage}%`}
            </Text>
          </View>
          
          <View style={styles.resultSummary}>
            <Text style={[
              styles.resultStatus, 
              isPassed ? styles.passedText : styles.failedText
            ]}>
              {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
            </Text>
            <Text style={styles.resultDescription}>
              {isPassed 
                ? 'Chúc mừng! Bạn đã hoàn thành bài kiểm tra thành công.' 
                : 'Bạn cần đạt tối thiểu 80% câu đúng để vượt qua bài kiểm tra này.'}
            </Text>
          </View>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons 
              name="checkmark-circle" 
              size={scale(24)} 
              color="#4CAF50" 
              style={styles.statIcon} 
            />
            <Text style={styles.statValue}>
              {scoreData 
                ? `${scoreData.correctAnswers}/${scoreData.totalQuestions}` 
                : `${correctAnswers}/${totalQuestions}`}
            </Text>
            <Text style={styles.statLabel}>Câu trả lời đúng</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons 
              name="time-outline" 
              size={scale(24)} 
              color="#FF9800" 
              style={styles.statIcon} 
            />
            <Text style={styles.statValue}>
              {formatTime(numericTimeSpent)}
            </Text>
            <Text style={styles.statLabel}>Thời gian hoàn thành</Text>
          </View>
        </View>
        
        {/* Achievement Badge */}
        {quizId === 'final-exam' && isPassed && (
          <View style={styles.achievementBadge}>
            <Image 
              source={require('../../assets/images/certificate.png')} 
              style={styles.certificateIcon}
              resizeMode="contain"
            />
            <Text style={styles.achievementText}>Chứng chỉ đã mở khóa!</Text>
          </View>
        )}
        
        {/* Feedback Section */}
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
      <SafeAreaView style={styles.actionButtonsWrapper}>
        <View style={styles.actionButtonsContainer}>
          <View style={styles.buttonGroup}>
            {!hasRatedBefore && (
              <TouchableOpacity 
                style={styles.rateButton}
                onPress={openRatingModal}
                activeOpacity={0.7}
              >
                <Text style={styles.rateButtonText}>Đánh giá</Text>
                <Ionicons name="star" size={scale(20)} color="#fff" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.continueButton,
                !hasRatedBefore ? { flex: 1, marginLeft: scale(8) } : { flex: 1 }
              ]}
              onPress={handleReturnToCourse}
              activeOpacity={0.7}
            >
              <Text style={styles.continueButtonText}>Tiếp tục học</Text>
              <Ionicons name="arrow-forward-circle" size={scale(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Modal Đánh giá */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeRatingModal}
      >
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: '#8B0000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: scale(16),
  },
  quizInfoContainer: {
    alignItems: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
  },
  quizTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: scale(4),
  },
  chapterName: {
    fontSize: scale(16),
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: scale(24),
  },
  scoreCircle: {
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    borderWidth: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  scoreCirclePassed: {
    borderColor: '#4CAF50',
  },
  scoreCircleFailed: {
    borderColor: '#F44336',
  },
  scoreText: {
    fontSize: scale(42),
    fontWeight: 'bold',
    color: '#333',
  },
  resultSummary: {
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  resultStatus: {
    fontSize: scale(28),
    fontWeight: 'bold',
    marginBottom: scale(8),
  },
  passedText: {
    color: '#4CAF50',
  },
  failedText: {
    color: '#F44336',
  },
  resultDescription: {
    fontSize: scale(16),
    color: '#555',
    textAlign: 'center',
    lineHeight: scale(22),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: scale(10),
    marginVertical: scale(20),
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: scale(10),
    padding: scale(16),
    alignItems: 'center',
    width: width / 2 - scale(25),
    marginBottom: scale(15),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIcon: {
    marginBottom: scale(8),
  },
  statValue: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(4),
  },
  statLabel: {
    fontSize: scale(14),
    color: '#666',
    textAlign: 'center',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    marginHorizontal: scale(20),
    marginTop: scale(10),
    justifyContent: 'center',
  },
  certificateIcon: {
    width: scale(32),
    height: scale(32),
    marginRight: scale(10),
  },
  achievementText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#FF9800',
  },
  feedbackContainer: {
    paddingHorizontal: scale(20),
    marginVertical: scale(16),
  },
  feedbackTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(8),
  },
  feedbackText: {
    fontSize: scale(15),
    color: '#555',
    lineHeight: scale(22),
  },
  actionButtonsWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButtonsContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: scale(14),
    paddingHorizontal: scale(20),
    borderRadius: scale(30),
    flex: 0.8,
    marginRight: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  rateButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginRight: scale(8),
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: scale(14),
    paddingHorizontal: scale(20),
    borderRadius: scale(30),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginRight: scale(8),
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    marginBottom: scale(8),
    color: '#333',
  },
  modalSubtitle: {
    fontSize: scale(16),
    color: '#666',
    marginBottom: scale(20),
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: scale(20),
  },
  starButton: {
    padding: scale(5),
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: scale(20),
  },
  cancelButton: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: scale(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: scale(16),
  },
  submitButton: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    backgroundColor: '#8B0000',
    flex: 1,
    marginLeft: scale(10),
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  disabledRateButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  disabledSubmitButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  disabledSubmitButtonText: {
    color: '#999',
  },
});
