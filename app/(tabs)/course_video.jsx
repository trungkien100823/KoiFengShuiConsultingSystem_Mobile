import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;
const BASE_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
const scale = size => Math.round(BASE_SIZE * (size / 375));
const isIOS = Platform.OS === 'ios';

// Define this constant with your other constants 
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 
  (Platform.isPad ? 20 : 44) : 
  StatusBar.currentHeight || 0;

// Thêm các mã thông báo API response
const API_RESPONSE_MESSAGES = {
  PROCEED_TO_QUIZ_SUCCESS: "PROCEED_TO_QUIZ_SUCCESS",
  CHAPTER_ALREADY_COMPLETED: "CHAPTER_ALREADY_COMPLETED",
  REGISTER_COURSE_NOT_FOUND: "REGISTER_COURSE_NOT_FOUND",
  CHAPTER_UPDATED_PROGRESS_SUCCESS: "CHAPTER_UPDATED_PROGRESS_SUCCESS"
};

const isValidVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('mediadelivery.net');
};

const getDirectVideoUrl = (url) => {
  try {
    if (!url) return null;
    
    // Convert iframe.mediadelivery.net URLs to direct CDN URLs
    if (url.includes('iframe.mediadelivery.net/embed')) {
      // Extract the video ID parts from the URL
      const match = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-zA-Z0-9-]+)/);
      if (match && match.length === 3) {
        const videoId = match[2];
        
        // Use hardcoded library ID with video ID
        return `https://vz-2fab5d8b-8fd.b-cdn.net/${videoId}/playlist.m3u8`;
      }
    }
    
    return url;
  } catch (error) {
    console.error('Error getting direct video URL:', error);
    return url;
  }
};

// Hàm xử lý URL video
const processVideoUrl = (url) => {
  if (!url) return null;
  
  // Convert iframe.mediadelivery.net URLs to direct CDN URLs
  if (url.includes('iframe.mediadelivery.net/embed')) {
    // Extract the video ID parts from the URL
    const match = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-zA-Z0-9-]+)/);
    if (match && match.length === 3) {
      const videoId = match[2];
      
      // Use hardcoded library ID with video ID
      return `https://vz-2fab5d8b-8fd.b-cdn.net/${videoId}/playlist.m3u8`;
    }
  }
  
  // Ensure HTTPS but don't add cache buster
  let processedUrl = url;
  if (processedUrl.startsWith('http:')) {
    processedUrl = processedUrl.replace('http:', 'https:');
  }
  
  return processedUrl;
};

const VideoPlayer = ({ videoUrl, onComplete, videoRef }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoStatus, setVideoStatus] = useState(null);
  const hasShownCompletionAlert = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Clean and normalize the URL
  const processedVideoUrl = useMemo(() => {
    if (!videoUrl) return null;
    
    // Clean and normalize the URL
    let url = videoUrl.trim();
    
    // Convert to direct CDN URL if it's from mediadelivery.net
    if (url.includes('iframe.mediadelivery.net/embed')) {
      const match = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-zA-Z0-9-]+)/);
      if (match && match.length === 3) {
        const videoId = match[2];
        
        // Use hardcoded library ID with video ID
        url = `https://vz-2fab5d8b-8fd.b-cdn.net/${videoId}/playlist.m3u8`;
      }
    }
    
    // Ensure HTTPS but don't add cache buster
    if (url.startsWith('http:')) {
      url = url.replace('http:', 'https:');
    }
    
    return url;
  }, [videoUrl]);

  // Reset when URL changes
  useEffect(() => {
    // Reset all state variables on URL change
    hasShownCompletionAlert.current = false;
    retryCount.current = 0;
    setError(false);
    setLoading(true);
    
    // Unload any previous video first
    if (videoRef.current) {
      videoRef.current.unloadAsync().then(() => {
        // After unloading, wait a moment then load the new video
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.loadAsync(
              { uri: processedVideoUrl },
              { shouldPlay: true },
              false
            ).catch(err => {
              console.error('Error in initial video load:', err);
            });
          }
        }, 300); // Small delay to ensure unload completes
      }).catch(error => {
        console.error('Error unloading previous video:', error);
      });
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [videoUrl, processedVideoUrl]);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = (status) => {
    setVideoStatus(status);
    
    // Only mark as complete when video is actually finished
    if (status.isLoaded && status.didJustFinish && !hasShownCompletionAlert.current) {
      console.log('Video playback completed, updating completion status');
      hasShownCompletionAlert.current = true;
      onComplete && onComplete();
    }
  };

  // Function to retry loading the video
  const handleRetry = async () => {
    if (retryCount.current >= maxRetries) {
      setError(true);
      setErrorMessage('Maximum retry attempts reached. Please check your internet connection or try again later.');
      return;
    }

    retryCount.current += 1;
    console.log(`Retrying video playback (${retryCount.current}/${maxRetries})...`);
    
    setError(false);
    setLoading(true);
    
    if (videoRef.current) {
      try {
        await videoRef.current.unloadAsync();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add a new cache buster on each retry
        const retryCacheBuster = `_retry=${Date.now()}`;
        const retryUrl = processedVideoUrl.includes('?') 
          ? `${processedVideoUrl}&${retryCacheBuster}` 
          : `${processedVideoUrl}?${retryCacheBuster}`;
        
        console.log('Retrying with URL:', retryUrl);
        
        await videoRef.current.loadAsync(
          { uri: retryUrl },
          { shouldPlay: true },
          false
        );
      } catch (err) {
        console.error('Error reloading video:', err);
        setError(true);
        setLoading(false);
        setErrorMessage(`Failed to reload video: ${err.message}`);
      }
    }
  };

  if (!processedVideoUrl) {
    return (
      <View style={styles.videoWrapper}>
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Waiting for video source...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        key={`video-${processedVideoUrl}`}
        ref={videoRef}
        style={styles.video}
        source={{
          uri: processedVideoUrl,
          headers: {
            'Accept': '*/*',
            'User-Agent': Platform.select({
              ios: 'AppleCoreMedia/1.0.0',
              android: 'ExoPlayer'
            })
          }
        }}
        useNativeControls={true}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        posterSource={{ uri: 'https://via.placeholder.com/640x360/000000/FFFFFF?text=Loading+Video' }}
        usePoster={true}
        volume={1.0}
        rate={1.0}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoadStart={() => {
          console.log('Video load started');
          setLoading(true);
          setError(false);
        }}
        onLoad={() => {
          console.log('Video loaded');
          setLoading(false);
          setError(false);
        }}
        onError={(error) => {
          console.error('Video loading error:', error);
          setError(true);
          setLoading(false);
          setErrorMessage(`Unable to load video: ${error}`);
        }}
      />

      {loading && (
        <View style={[styles.overlay, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {error ? 'Retrying...' : 'Loading video...'}
          </Text>
          {retryCount.current > 0 && (
            <Text style={styles.retryText}>
              Attempt {retryCount.current}/{maxRetries}
            </Text>
          )}
        </View>
      )}

      {error && !loading && (
        <View style={[styles.overlay, styles.errorOverlay]}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {retryCount.current < maxRetries && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>
                Retry ({retryCount.current}/{maxRetries})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// Cache dữ liệu để tránh tải lại quá nhiều lần
const loadedUserIds = new Set();
const loadedCourseIds = new Set();

// Thay đổi enum để khớp với backend
const EnrollChapterStatus = {
  InProgress: "InProgress",
  Done: "Done"
};

// Hàm helper để chuyển đổi status thành text hiển thị
const getStatusDisplayText = (status) => {
  switch (status) {
    case EnrollChapterStatus.InProgress:
      return "Đang học";
    case EnrollChapterStatus.Done:
      return "Đã hoàn thành";
    default:
      return "Đang học";
  }
};

// Hàm helper để lấy màu cho status
const getStatusColor = (status) => {
  switch (status) {
    case EnrollChapterStatus.InProgress:
      return "#007AFF";
    case EnrollChapterStatus.Done:
      return "#4CAF50";
    default:
      return "#007AFF";
  }
};

// Hàm helper để lấy icon cho status
const getStatusIcon = (status) => {
  switch (status) {
    case EnrollChapterStatus.Done:
      return <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />;
    case EnrollChapterStatus.InProgress:
      return <Ionicons name="time" size={20} color="#007AFF" />;
    default:
      return <Ionicons name="time" size={20} color="#007AFF" />;
  }
};

export default function CourseVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { courseId, chapterId, enrollCourseId } = params;
  const [chapterData, setChapterData] = useState(null);
  const [courseContent, setCourseContent] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isFreeCourse, setIsFreeCourse] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [videoErrorMessage, setVideoErrorMessage] = useState('');
  const [hasShownAlert, setHasShownAlert] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [status, setStatus] = useState({});
  const [activeTab, setActiveTab] = useState('content');
  const [lessonId, setLessonId] = useState(params.lessonId);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(params.autoPlay === 'true');
  const videoRef = useRef(null);
  const hasShownIOSNote = useRef(false);
  const lastProgressUpdate = useRef(Date.now());
  const isVideoPlaying = useRef(false);
  const processedVideoUrlRef = useRef(null);
  const currentRenderCycleUrl = useRef(null);
  const hasLoggedVideoUrl = useRef(false);
  const currentVideoUrl = useRef('');
  const isInitialMount = useRef(true);
  const lastDataLoadTime = useRef(0);
  const [chapterStatus, setChapterStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Thêm biến để kiểm soát việc hiển thị alert
  const hasShownCompletionAlert = useRef(false);

  // Thêm biến quản lý thời gian tải dữ liệu
  let lastLoadTime = 0;

  // Hàm để tải dữ liệu hoàn thành từ AsyncStorage và từ server
  const loadCompletionData = async () => {
    if (!chapterId || !courseId) {
      console.error('Thiếu chapterId hoặc courseId để tải dữ liệu');
      return;
    }
    
    try {
      console.log('Bắt đầu tải dữ liệu chapter từ server...');
      // 1. Kiểm tra token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error('Không tìm thấy token, không thể tải dữ liệu từ server');
        return;
      }
      
      // Tải dữ liệu từ server trước
      try {
        console.log('Gửi request đến API để kiểm tra trạng thái hoàn thành, chapter hiện tại:', chapterId);
        const response = await axios.get(
          `${API_CONFIG.baseURL}/api/RegisterCourse/get-enroll-chapters-by/${enrollCourseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Kết quả từ server:', JSON.stringify(response.data));
        
        if (response.data?.isSuccess) {
          // 2. Lấy dữ liệu chương đã hoàn thành từ server
          const serverData = response.data.data;
          
          if (serverData) {
            // Cập nhật tiến độ từ server
            if (serverData.percentage !== undefined) {
              console.log('Tiến độ từ server:', serverData.percentage);
              
              // Lưu tiến độ mới vào AsyncStorage
              const savedProgress = await AsyncStorage.getItem('courseProgress');
              let progressObj = savedProgress ? JSON.parse(savedProgress) : {};
              progressObj[courseId] = serverData.percentage;
              await AsyncStorage.setItem('courseProgress', JSON.stringify(progressObj));
              
              // Cập nhật state
              setCurrentProgress(serverData.percentage);
            }
            
            // Xử lý dữ liệu chapter hoàn thành
            if (serverData.completedChapters) {
              let completedChaptersData = serverData.completedChapters;
              console.log('Danh sách chapter đã hoàn thành từ server:', typeof completedChaptersData, completedChaptersData);
              
              const newCompletedLessons = {};
              
              // Xử lý dữ liệu chapter hoàn thành dựa vào kiểu dữ liệu
              if (Array.isArray(completedChaptersData)) {
                // Nếu là mảng
                completedChaptersData.forEach(id => {
                  if (id) newCompletedLessons[id] = true;
                });
              } else if (typeof completedChaptersData === 'string') {
                // Nếu là chuỗi, thử parse JSON
                try {
                  const chaptersArray = JSON.parse(completedChaptersData);
                  if (Array.isArray(chaptersArray)) {
                    chaptersArray.forEach(id => {
                      if (id) newCompletedLessons[id] = true;
                    });
                  } else if (chaptersArray && typeof chaptersArray === 'object') {
                    // Nếu là object
                    Object.keys(chaptersArray).forEach(key => {
                      if (chaptersArray[key] === true) newCompletedLessons[key] = true;
                    });
                  }
                } catch (e) {
                  // Nếu không phải JSON, có thể là danh sách id phân cách bởi dấu phẩy
                  const chapterIds = completedChaptersData.split(',').map(id => id.trim());
                  chapterIds.forEach(id => {
                    if (id) newCompletedLessons[id] = true;
                  });
                }
              } else if (typeof completedChaptersData === 'number' || /^\d+$/.test(completedChaptersData)) {
                // Nếu là số hoặc chuỗi số
                const id = completedChaptersData.toString();
                newCompletedLessons[id] = true;
              }
              
              console.log('Chapter đã hoàn thành sau khi xử lý:', Object.keys(newCompletedLessons));
              
              // Lưu vào AsyncStorage
              await AsyncStorage.setItem('completedLessons', JSON.stringify(newCompletedLessons));
              
              // Cập nhật state 
              setCompletedLessons(newCompletedLessons);
              
              // Kiểm tra xem chapter hiện tại đã hoàn thành chưa
              if (newCompletedLessons[chapterId]) {
                console.log('Chapter hiện tại đã hoàn thành theo dữ liệu từ server');
                setIsCompleted(true);
              } else {
                console.log('Chapter hiện tại chưa hoàn thành theo dữ liệu từ server');
                setIsCompleted(false);
              }
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu từ server:', error);
        
        // Nếu server lỗi, thử lấy dữ liệu từ local
        // Tải dữ liệu từ AsyncStorage
        console.log('Đang thử lấy dữ liệu từ local...');
        
        // 3. Kiểm tra dữ liệu hoàn thành hiện có trong AsyncStorage
        const savedLessons = await AsyncStorage.getItem('completedLessons');
        if (savedLessons) {
          try {
            const lessonsObj = JSON.parse(savedLessons);
            setCompletedLessons(lessonsObj);
            console.log('Tải dữ liệu chapter hoàn thành từ local:', Object.keys(lessonsObj));
            
            // Kiểm tra xem chapter hiện tại đã hoàn thành chưa
            if (lessonsObj[chapterId]) {
              console.log('Chapter hiện tại đã hoàn thành theo dữ liệu local');
              setIsCompleted(true);
            }
          } catch (e) {
            console.error('Lỗi khi parse dữ liệu completedLessons từ local:', e);
          }
        }
        
        // 4. Tải tiến độ khóa học từ local
        const savedProgress = await AsyncStorage.getItem('courseProgress');
        if (savedProgress) {
          try {
            const progressObj = JSON.parse(savedProgress);
            if (progressObj[courseId] !== undefined) {
              console.log('Tiến độ từ local:', progressObj[courseId]);
              setCurrentProgress(progressObj[courseId]);
            }
          } catch (e) {
            console.error('Lỗi khi parse dữ liệu courseProgress từ local:', e);
          }
        }
      }
    } catch (e) {
      console.error('Lỗi tổng thể khi tải dữ liệu hoàn thành:', e);
      setRetryCount(prev => prev + 1);
    }
  };

  // Load completion data from storage
  useEffect(() => {
    if (courseId) {
      loadCompletionData();
    }
  }, [courseId, chapterId]);

  // Fetch chapter data
  const fetchChapterData = async () => {
    if (!chapterId) {
      console.log('Không có chapterId, không thể tải dữ liệu');
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('Không có token, không thể tải dữ liệu');
        setLoading(false);
        return;
      }

      console.log('Đang gọi API get-chapter với chapterId:', chapterId);
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Chapter/get-chapter/${chapterId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response from API:', response.data);

      if (response.data?.isSuccess && response.data.data) {
        const videoUrl = response.data.data.video;
        console.log('Video URL from API:', videoUrl);
        
        setChapterData(response.data.data);
      } else {
        console.warn('API response not successful:', response.data);
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all chapters for the course
  const fetchCourseChapters = async (courseId, token, currentChapterId) => {
    if (!courseId) {
      console.warn('No courseId provided to fetchCourseChapters');
      return;
    }

    try {
      console.log('Fetching all chapters for courseId:', courseId);
      
      // Lấy token nếu chưa có
      if (!token) {
        token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.error('Không có token, không thể lấy dữ liệu enrollChapters');
          return;
        }
      }
      
      // Trước tiên, lấy enrollCourseId từ thông tin khóa học đã đăng ký
      let enrollCourseId = null;
      try {
        const registerCourseResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Course/get-course/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (registerCourseResponse.data?.isSuccess && registerCourseResponse.data.data) {
          // Lấy enrollCourseId từ response
          enrollCourseId = registerCourseResponse.data.data.enrollCourseId;
          console.log('Đã lấy được enrollCourseId:', enrollCourseId);
        }
      } catch (error) {
        console.error('Lỗi khi lấy enrollCourseId:', error);
      }
      
      // Nếu không có enrollCourseId từ API, thử tìm từ local storage
      if (!enrollCourseId) {
        console.log('Không có enrollCourseId từ API, thử tìm từ local storage');
        try {
          // Kiểm tra trong registeredCourses
          const registeredCourses = await AsyncStorage.getItem('registeredCourses');
          if (registeredCourses) {
            const coursesObj = JSON.parse(registeredCourses);
            if (coursesObj[courseId] && coursesObj[courseId].enrollCourseId) {
              enrollCourseId = coursesObj[courseId].enrollCourseId;
              console.log('Tìm thấy enrollCourseId từ localStorage:', enrollCourseId);
            }
          }
        } catch (error) {
          console.error('Lỗi khi tìm enrollCourseId từ localStorage:', error);
        }
      }
      
      // Nếu tìm được enrollCourseId, gọi API lấy danh sách chapter đã đăng ký
      if (enrollCourseId) {
        console.log('Sử dụng API mới với enrollCourseId:', enrollCourseId);
        const response = await axios.get(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getEnrollChaptersByEnrollCourseId.replace('{enrollCourseId}', enrollCourseId)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('EnrollChapters response từ API:', response.data);
        
        if (response.data?.isSuccess && response.data.data) {
          // Chuyển đổi dữ liệu enrollChapter thành định dạng chapter
          const enrollChapters = response.data.data;
          
          if (Array.isArray(enrollChapters) && enrollChapters.length > 0) {
            // Chuyển đổi định dạng
            const formattedChapters = enrollChapters.map(enrollChapter => ({
              chapterId: enrollChapter.chapterId,
              title: enrollChapter.chapterName,
              status: enrollChapter.status,
              enrollChapterId: enrollChapter.enrollChapterId,
              customerId: enrollChapter.customerId,
              enrollCourseId: enrollChapter.enrollCourseId,
              // Thêm các trường khác nếu cần
              duration: "10:00" // Giá trị mặc định hoặc có thể để trống
            }));
            
            // Cập nhật state
            setCourseContent(formattedChapters);
            
            // Cập nhật trạng thái hoàn thành dựa trên status = "Done"
            const newCompletedLessons = {};
            enrollChapters.forEach(enrollChapter => {
              if (enrollChapter.status === "Done") {
                newCompletedLessons[enrollChapter.chapterId] = true;
              }
            });
            setCompletedLessons(prevState => ({...prevState, ...newCompletedLessons}));
            
            // Find current chapter index
            const index = formattedChapters.findIndex(ch => ch.chapterId === currentChapterId);
            if (index !== -1) {
              setCurrentChapterIndex(index);
            } else {
              console.warn('Current chapter not found in course content');
            }
            
            // Lưu enrollCourseId vào bộ nhớ cục bộ để sử dụng sau này
            try {
              const registeredCourses = await AsyncStorage.getItem('registeredCourses');
              let coursesObj = registeredCourses ? JSON.parse(registeredCourses) : {};
              if (coursesObj[courseId]) {
                coursesObj[courseId].enrollCourseId = enrollCourseId;
                await AsyncStorage.setItem('registeredCourses', JSON.stringify(coursesObj));
                console.log('Đã lưu enrollCourseId vào localStorage');
              }
            } catch (error) {
              console.error('Lỗi khi lưu enrollCourseId vào localStorage:', error);
            }
            
            console.log('Đã chuyển đổi dữ liệu từ enrollChapters thành chapters:', formattedChapters);
            return;
          }
        }
      }
      
      // Nếu không có enrollCourseId hoặc không thể lấy dữ liệu từ API mới,
      // thử gọi API cũ để lấy danh sách chapter cơ bản và hiển thị UI
      console.log('Không tìm thấy enrollCourseId hoặc lỗi API, sử dụng API cũ như fallback');
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getAllChaptersByCourseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            id: courseId
          }
        }
      );
      
      console.log('Chapters response từ API cũ:', response.data);
      
      if (response.data?.isSuccess && response.data.data) {
        const chapters = response.data.data;
        
        if (Array.isArray(chapters) && chapters.length > 0) {
          // Chuyển đổi dữ liệu để tương thích với định dạng hiển thị
          const formattedChapters = chapters.map(chapter => ({
            chapterId: chapter.chapterId,
            title: chapter.title || chapter.chapterName,
            status: EnrollChapterStatus.InProgress, // Mặc định là InProgress
            duration: chapter.duration || "10:00"
          }));
          
          setCourseContent(formattedChapters);
          
          // Find current chapter index
          const index = formattedChapters.findIndex(ch => ch.chapterId === currentChapterId);
          if (index !== -1) {
            setCurrentChapterIndex(index);
          } else {
            console.warn('Current chapter not found in course content');
          }
          
          console.log('Đã chuyển đổi dữ liệu từ chapters thành formattedChapters:', formattedChapters);
        } else {
          console.warn('No chapters found for this course');
          setCourseContent([]);
        }
      } else {
        console.warn('Failed to fetch course chapters:', response.data?.message);
      }
    } catch (error) {
      console.error('Error fetching course chapters:', error);
      // Không đặt state lỗi vì đây không phải lỗi nghiêm trọng
    }
  };
  
  // Load và lưu dữ liệu bài học đã hoàn thành
  const loadCompletedLessons = useCallback(async () => {
    try {
      if (!chapterId) return false;
      
      // Lấy trạng thái từ params trước
      const currentStatus = params.status;
      console.log('Trạng thái chapter từ params:', currentStatus);
      
      // Nếu chapter đã hoàn thành trong params, không cần kiểm tra AsyncStorage
      if (currentStatus === "Done") {
        console.log('Chapter đã hoàn thành theo params');
        setIsCompleted(true);
        return true;
      }
      
      // Nếu chưa hoàn thành, kiểm tra AsyncStorage
      const savedLessons = await AsyncStorage.getItem('completedLessons');
      if (!savedLessons) {
        console.log('Không có dữ liệu completedLessons trong AsyncStorage');
        setIsCompleted(false);
        return false;
      }
      
      const parsedLessons = JSON.parse(savedLessons);
      console.log('Chapter hiện tại:', chapterId, 'Trạng thái hoàn thành:', parsedLessons[chapterId]);
      
      // Cập nhật trạng thái hoàn thành
      setIsCompleted(parsedLessons[chapterId] === true);
      
      return parsedLessons[chapterId] === true;
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bài học đã hoàn thành:', error);
      setIsCompleted(false);
      return false;
    }
  }, [chapterId, params.status]);

  // Xử lý khi video phát hoàn tất
  const onPlaybackStatusUpdate = (status) => {
    if (!status || !status.durationMillis) return;

    // Kiểm tra điều kiện hiển thị alert đơn giản hơn
    if (status.didJustFinish && 
        !isCompleted &&
        !hasShownCompletionAlert.current) {
      console.log('Video đã chạy hết, hiển thị alert cập nhật tiến độ');
      console.log('Trạng thái chapter:', {
        isCompleted,
        hasShownAlert: hasShownCompletionAlert.current,
        chapterId,
        status: params.status
      });
      hasShownCompletionAlert.current = true;
      updateProgress();
    }
  };

  // Handle video progress update
  const updateProgress = async () => {
    // Only update if video was actually watched
    if (params.status === "Done" || isCompleted) {
      console.log('Chapter already completed, no need to update progress');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        return;
      }

      // Show loading indicator
      setLoading(true);

      console.log('Sending progress update request...');
      const response = await axios.put(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.updateProccessCourse.replace('{chapterId}', chapterId)}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API response:', response.data);

      if (response.data?.isSuccess) {
        // Update local state to reflect completion
        setChapterStatus("Done");
        
        // Also update the completedLessons state
        setCompletedLessons(prev => ({
          ...prev,
          [chapterId]: true
        }));
        
        // Save to localStorage for persistence
        try {
          const savedLessons = await AsyncStorage.getItem('completedLessons');
          const lessonsObj = savedLessons ? JSON.parse(savedLessons) : {};
          lessonsObj[chapterId] = true;
          await AsyncStorage.setItem('completedLessons', JSON.stringify(lessonsObj));
        } catch (err) {
          console.error('Error saving completion status:', err);
        }
        
        // Show success message and navigate
        Alert.alert(
          "Thành công",
          "Tiến độ của bạn đã được cập nhật",
          [
            {
              text: "OK",
              onPress: () => {
                console.log('Navigating back to chapter screen...');
                router.replace({
                  pathname: '/(tabs)/course_chapter',
                  params: { 
                    courseId: courseId,
                    shouldRefresh: Date.now()
                  }
                });
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          "Lỗi",
          response.data?.message || "Không thể cập nhật tiến độ",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật tiến độ. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.replace({
      pathname: '/(tabs)/course_chapter',
      params: { 
        courseId: courseId,
        shouldRefresh: Date.now()
      }
    });
  };

  // Process the video URL once when chapterData changes
  useEffect(() => {
    if (!chapterData?.video) {
      return;
    }
    
    // Get the raw video URL
    let rawUrl = chapterData.video;
    
    // Clean up the URL
    if (rawUrl) {
      rawUrl = rawUrl.trim();
    }
    
    // Convert to direct CDN URL if it's from mediadelivery.net
    if (rawUrl.includes('iframe.mediadelivery.net/embed')) {
      const match = rawUrl.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-zA-Z0-9-]+)/);
      if (match && match.length === 3) {
        const videoId = match[2];
        
        // Use hardcoded library ID with video ID
        rawUrl = `https://vz-2fab5d8b-8fd.b-cdn.net/${videoId}/playlist.m3u8`;
      }
    }
    
    // For iOS, ensure we use HTTPS but don't add cache buster
    if (Platform.OS === 'ios' && rawUrl.startsWith('http:')) {
      rawUrl = rawUrl.replace('http:', 'https:');
    }
    
    // Set the URL to state
    setVideoUrl(rawUrl);
    setVideoLoaded(false);
  }, [chapterData]);

  // Function to render the video player or error message
  const renderVideoComponent = (videoUrl) => {
    if (!videoUrl) {
      return (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>No video URL available</Text>
        </View>
      );
    }
    
    return (
      <VideoPlayer 
        videoUrl={videoUrl} 
        onComplete={updateProgress}
        videoRef={videoRef}
      />
    );
  };

  // Function to render content list items
  const renderChapterItem = ({ item, index }) => {
    const isCurrentChapter = item.chapterId === chapterId;
    
    // Only consider a chapter completed if it's explicitly marked as "Done" or in completedLessons
    const isChapterCompleted = item.status === "Done" || completedLessons[item.chapterId] === true;
    
    return (
      <TouchableOpacity 
        style={[
          styles.chapterItem,
          isCurrentChapter && styles.currentChapterItem,
          isChapterCompleted && styles.completedChapterItem
        ]}
        onPress={() => navigateToChapter(item)}
        disabled={isCurrentChapter}
      >
        <View style={styles.chapterItemContent}>
          <Text style={styles.chapterNumber}>
            Chương {index + 1}
          </Text>
          <Text style={styles.chapterItemTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        
        <View style={[
          styles.chapterIndicator,
          isCurrentChapter && styles.currentIndicator,
          isChapterCompleted && styles.completedIndicator
        ]}>
          {isCurrentChapter ? (
            <Ionicons name="play" size={16} color="#FFF" />
          ) : isChapterCompleted ? (
            <Ionicons name="checkmark" size={16} color="#FFF" />
          ) : (
            <Ionicons name="lock-open" size={16} color="#666" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Xử lý lỗi và thử lại video
  const retryVideo = () => {
    console.log('Đang thử lại video...');
    
    // Reset các state liên quan đến video
    setVideoError(false);
    setVideoLoaded(false);
    setHasShownAlert(false);
    
    // Tạo một URL mới với cache buster
    if (chapterData && chapterData.video) {
      const newUrlWithCacheBuster = addCacheBuster(chapterData.video);
      
      // Cập nhật dữ liệu chapter với URL mới
      setChapterData(prevData => ({
        ...prevData,
        videoWithCacheBuster: newUrlWithCacheBuster
      }));
    }
    
    // Tăng số lần retry
    setRetryCount(prev => prev + 1);
    
    // Mô phỏng việc tải lại dữ liệu chapter nếu đã retry nhiều lần
    if (retryCount >= 2) {
      if (chapterId && courseId) {
        console.log('Đã thử lại nhiều lần, tải lại dữ liệu chapter từ server...');
        fetchCourseChapters(courseId, null, chapterId);
      }
    }
  };

  // Enhanced useFocusEffect to completely refresh the page and restart video
  useFocusEffect(
    useCallback(() => {
      console.log('Screen gained focus - completely refreshing video content');
      
      // Reset all state
      setVideoError(false);
      setVideoLoaded(false);
      hasShownCompletionAlert.current = false;
      setChapterData(null); // Clear chapter data to force a complete refresh
      
      // Reset all related references
      currentVideoUrl.current = '';
      hasLoggedVideoUrl.current = false;
      
      // Force reload chapter data with a slight delay
      setTimeout(() => {
        if (chapterId) {
          console.log('Reloading chapter data and video from scratch');
          fetchChapterData();
        }
      }, 300);
      
      // When user navigates away
      return () => {
        console.log('Screen lost focus - fully stopping and unloading video');
        
        // Fully stop and unload the video when leaving
        if (videoRef.current) {
          try {
            // Chain these promises to ensure operations complete in sequence
            (async () => {
              try {
                await videoRef.current.pauseAsync();
                await videoRef.current.stopAsync();
                await videoRef.current.unloadAsync();
                console.log('Video successfully stopped and unloaded');
              } catch (e) {
                console.log('Error in video cleanup sequence:', e);
              }
            })();
          } catch (error) {
            console.log('Error initiating video cleanup:', error);
          }
        }
      };
    }, [chapterId])
  );

  // Reload data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Video screen gained focus - refreshing completion status');
      
      // Reload completion status
      if (chapterId) {
        loadCompletedLessons();
      }
      
      return () => {
        // Cleanup when screen loses focus
        console.log('Video screen lost focus');
      };
    }, [chapterId, loadCompletedLessons])
  );

  // Load chapter data when chapterId changes
  useEffect(() => {
    if (chapterId) {
      fetchChapterData();
    }
  }, [chapterId]);

  // Thêm useEffect để dừng video khi component unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }
    };
  }, []);

  // Thêm useFocusEffect để dừng video khi màn hình mất focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (videoRef.current) {
          videoRef.current.stopAsync();
        }
      };
    }, [])
  );

  // Thêm useEffect để reset hasShownCompletionAlert khi chuyển chapter
  useEffect(() => {
    // Reset when chapter changes
    hasShownCompletionAlert.current = false;
    
    // Check if chapter is already completed from previous data
    if (chapterId) {
      loadCompletedLessons();
    }
  }, [chapterId]);

  const handleVideoComplete = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        return;
      }

      console.log('Đang gửi request cập nhật tiến độ...');
      const response = await axios.put(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.updateProccessCourse.replace('{chapterId}', chapterId)}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Kết quả từ API:', response.data);

      if (response.data?.isSuccess) {
        // Hiển thị thông báo thành công và chuyển hướng
        Alert.alert(
          "Thành công",
          "Đã cập nhật tiến độ học tập",
          [
            {
              text: "OK",
              onPress: () => {
                console.log('Đang chuyển về màn hình chapter...');
                router.replace({
                  pathname: '/(tabs)/course_chapter',
                  params: { 
                    courseId: courseId,
                    shouldRefresh: Date.now()
                  }
                });
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          "Lỗi",
          response.data?.message || "Không thể cập nhật tiến độ",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tiến độ:', error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật tiến độ. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    }
  };

  const navigateToChapter = (chapter) => {
    // Check if the chapter is already completed
    const isAlreadyCompleted = chapter.status === "Done" || completedLessons[chapter.chapterId] === true;
    
    if (isAlreadyCompleted) {
      // Show alert to user
      Alert.alert(
        "Bài học đã hoàn thành",
        "Bạn đã hoàn thành bài học này. Bạn có muốn học bài học khác không?",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to course chapters screen when OK is pressed
              router.replace({
                pathname: '/(tabs)/course_chapter',
                params: { 
                  courseId: courseId,
                  shouldRefresh: Date.now()
                }
              });
            }
          }
        ]
      );
      return;
    }
    
    // Continue with normal navigation for non-completed chapters
    if (videoRef.current) {
      videoRef.current.stopAsync().catch(e => console.log('Error stopping video:', e));
    }
    
    // Reset completion alert flag when navigating
    hasShownCompletionAlert.current = false;
    
    router.replace({
      pathname: '/(tabs)/course_video',
      params: {
        courseId,
        chapterId: chapter.chapterId,
        enrollCourseId,
        status: chapter.status, // Pass the current status without modifying it
        shouldRefresh: Date.now()
      }
    });
  };

  // Add this to the useEffect that runs when chapterData changes (around line 1180)
  useEffect(() => {
    // ... existing code
    
    // Show alert when loading an already completed chapter
    if (chapterData && (isCompleted || params.status === "Done")) {
      Alert.alert(
        "Bài học đã hoàn thành",
        "Bạn đã hoàn thành bài học này. Nếu muốn học nội dung mới, vui lòng chọn bài học khác.",
        [{ text: "OK" }]
      );
    }
  }, [chapterData, isCompleted, params.status]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#8B0000" 
        translucent={true}
      />
      
      {/* Status Bar Spacer */}
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
      
      {/* Enhanced Header */}
      <SafeAreaView style={{ backgroundColor: '#8B0000' }}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton}
            hitSlop={{ top: 15, left: 15, bottom: 15, right: 15 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {chapterData?.title || 'Đang tải bài học...'}
            </Text>
            
          </View>
        </View>
      </SafeAreaView>
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Video Player Container */}
        <View style={styles.videoContainer}>
          {chapterData?.video ? (
            renderVideoComponent(chapterData.video)
          ) : (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Đang tải video...</Text>
            </View>
          )}
        </View>

        {/* Chapter Information */}
        <ScrollView 
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {chapterData && (
            <>
              {/* Chapter Title and Progress */}
              <View style={styles.chapterInfoCard}>
                <View style={styles.chapterHeaderRow}>
                  <Ionicons name="play-circle" size={24} color="#8B0000" />
                  <Text style={styles.chapterTitle}>
                    {chapterData.title || 'Không có tiêu đề'}
                  </Text>
                </View>
                
                
                
                {/* Chapter Description */}
                {chapterData.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>Mô tả bài học:</Text>
                    <Text style={styles.descriptionText}>
                      {chapterData.description}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Course Navigation */}
              {courseContent && courseContent.length > 0 && (
                <View style={styles.navigationCard}>
                  <View style={styles.navigationHeader}>
                    <Ionicons name="list" size={20} color="#8B0000" />
                    <Text style={styles.navigationTitle}>Nội dung khóa học</Text>
                  </View>
                  
                  <View style={styles.chaptersContainer}>
                    {courseContent.map((item, index) => {
                      const isCurrentChapter = item.chapterId === chapterId;
                      const isChapterCompleted = item.status === "Done" || completedLessons[item.chapterId] === true;
                      
                      return (
                        <TouchableOpacity 
                          key={item.chapterId}
                          style={[
                            styles.chapterItem,
                            isCurrentChapter && styles.currentChapterItem,
                            isChapterCompleted && styles.completedChapterItem
                          ]}
                          onPress={() => navigateToChapter(item)}
                          disabled={isCurrentChapter}
                          activeOpacity={0.7}
                        >
                          <View style={styles.chapterItemLeft}>
                            <View style={[
                              styles.chapterIndicator,
                              isCurrentChapter && styles.currentIndicator,
                              isChapterCompleted && styles.completedIndicator
                            ]}>
                              {isCurrentChapter ? (
                                <Ionicons name="play" size={16} color="#FFF" />
                              ) : isChapterCompleted ? (
                                <Ionicons name="checkmark" size={16} color="#FFF" />
                              ) : (
                                <Ionicons name="lock-open" size={16} color="#666" />
                              )}
                            </View>
                          </View>
                          
                          <View style={styles.chapterItemContent}>
                            <Text style={styles.chapterNumber}>
                              Chương {index + 1}
                            </Text>
                            <Text style={[
                              styles.chapterItemTitle,
                              isCurrentChapter && styles.currentChapterTitle,
                              isChapterCompleted && styles.completedChapterTitle
                            ]} numberOfLines={2}>
                              {item.title}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
        
        {/* Bottom Action Bar */}
        {!isCompleted && chapterData && (
          <SafeAreaView style={{ backgroundColor: '#FFF' }}>
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={updateProgress}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.completeButtonText}>
                  Đánh dấu hoàn thành
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#8B0000',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: scale(12),
  },
  headerTitle: {
    fontSize: Math.min(scale(18), 22),
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(4),
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedText: {
    fontSize: scale(12),
    color: '#FFF',
    marginLeft: scale(4),
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: scale(14),
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: scale(14),
    textAlign: 'center',
    marginHorizontal: scale(20),
    marginVertical: scale(12),
    lineHeight: scale(20),
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: scale(24),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    marginTop: scale(12),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  retryText: {
    color: '#FFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: width * 0.04,
    paddingBottom: height * 0.08,
  },
  chapterInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  chapterTitle: {
    fontSize: Math.min(scale(17), 22),
    fontWeight: 'bold',
    color: '#222',
    marginLeft: scale(8),
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    alignSelf: 'flex-start',
    marginBottom: scale(16),
  },
  completedStatus: {
    backgroundColor: '#4CAF50',
  },
  inProgressStatus: {
    backgroundColor: '#007AFF',
  },
  statusText: {
    color: '#FFF',
    fontSize: scale(12),
    fontWeight: '600',
    marginLeft: scale(4),
  },
  descriptionContainer: {
    marginTop: scale(8),
    backgroundColor: '#F9F9FA',
    padding: scale(12),
    borderRadius: scale(10),
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  descriptionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#333',
    marginBottom: scale(8),
  },
  descriptionText: {
    fontSize: scale(14),
    color: '#555',
    lineHeight: scale(22),
  },
  navigationCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    padding: scale(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: scale(12),
  },
  navigationTitle: {
    fontSize: Math.min(scale(16), 20),
    fontWeight: 'bold',
    color: '#222',
    marginLeft: scale(8),
  },
  chaptersContainer: {
    marginTop: scale(8),
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
    backgroundColor: '#F9F9F9',
    borderRadius: scale(12),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chapterItemLeft: {
    padding: scale(10),
  },
  currentChapterItem: {
    backgroundColor: 'rgba(139, 0, 0, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  completedChapterItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  chapterItemContent: {
    flex: 1,
    padding: scale(10),
    paddingLeft: 0,
  },
  chapterNumber: {
    fontSize: scale(12),
    color: '#666',
    marginBottom: scale(4),
    fontWeight: '500',
  },
  chapterItemTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#333',
    lineHeight: scale(20),
  },
  currentChapterTitle: {
    color: '#8B0000',
  },
  completedChapterTitle: {
    color: '#4CAF50',
  },
  chapterIndicator: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#DEDEDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentIndicator: {
    backgroundColor: '#8B0000',
  },
  completedIndicator: {
    backgroundColor: '#4CAF50',
  },
  actionBar: {
    padding: scale(16),
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  completeButton: {
    backgroundColor: '#8B0000',
    borderRadius: scale(30),
    paddingVertical: scale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B0000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: Math.min(scale(16), 18),
    fontWeight: 'bold',
    marginLeft: scale(8),
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});
