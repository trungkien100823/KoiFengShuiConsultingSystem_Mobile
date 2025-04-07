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
import { Video, Audio, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Thêm các mã thông báo API response
const API_RESPONSE_MESSAGES = {
  PROCEED_TO_QUIZ_SUCCESS: "PROCEED_TO_QUIZ_SUCCESS",
  CHAPTER_ALREADY_COMPLETED: "CHAPTER_ALREADY_COMPLETED",
  REGISTER_COURSE_NOT_FOUND: "REGISTER_COURSE_NOT_FOUND",
  CHAPTER_UPDATED_PROGRESS_SUCCESS: "CHAPTER_UPDATED_PROGRESS_SUCCESS"
};

// Replace the optimizeCloudinaryUrlForIOS function with this more comprehensive version
const optimizeCloudinaryUrlForIOS = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Clean up the URL
  let cleanUrl = url.trim();
  
  // Force HTTPS
  if (cleanUrl.startsWith('http:')) {
    cleanUrl = cleanUrl.replace('http:', 'https:');
  }
  
  // For iOS, we need to use very specific parameters for best compatibility
  if (Platform.OS === 'ios' && cleanUrl.includes('cloudinary.com')) {
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex !== -1) {
      // These parameters work better on iOS:
      // f_mp4 - Force MP4 format
      // vc_h264 - Use H.264 video codec (most compatible)
      // q_auto - Automatic quality
      const transformedUrl = 
        cleanUrl.substring(0, uploadIndex) + 
        '/upload/f_mp4,vc_h264,q_auto/' + 
        cleanUrl.substring(uploadIndex + 8);
      
      console.log('iOS-optimized Cloudinary URL:', transformedUrl);
      return transformedUrl;
    }
  }
  
  return cleanUrl;
};

// Add this function if it doesn't exist
const isValidVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmedUrl = url.trim();
  return trimmedUrl.startsWith('http') && 
    (trimmedUrl.endsWith('.mp4') || 
     trimmedUrl.endsWith('.mov') || 
     trimmedUrl.endsWith('.m4v') ||
     trimmedUrl.includes('cloudinary.com'));
};

// And this function for cache busting
const addCacheBuster = (url) => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
};

// Update the VideoWithFallback component to properly forward refs
const VideoWithFallback = React.forwardRef(({ source, ...props }, ref) => {
  if (Platform.OS === 'ios') {
    console.log('Using iOS-optimized video player');
    return (
      <View style={{flex: 1, backgroundColor: '#000'}}>
        <Video
          ref={ref}
          {...props}
          source={{
            uri: source.uri.replace('/upload/', '/upload/f_mp4,vc_h264/'),
            headers: source.headers,
          }}
        />
      </View>
    );
  }
  
  return <Video ref={ref} {...props} source={source} />;
});

// First, create a separate VideoPlayer component outside of the main component
// This will prevent re-renders from the parent component affecting the video

const VideoPlayer = React.memo(({ videoUrl, onComplete }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.playerContainer}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{
          uri: videoUrl,
          headers: { 'Cache-Control': 'no-cache' }
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        isLooping={false}
        volume={1.0}
        playsInSilentModeIOS={true}
        ignoreSilentSwitch="ignore"
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            setLoading(false);
            if (status.didJustFinish) {
              onComplete && onComplete();
            }
          }
        }}
        onError={(error) => {
          console.error('Video error:', error);
          setLoading(false);
          setError(true);
        }}
      />
      
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải video...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>Không thể tải video. Vui lòng thử lại sau.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(false);
              setLoading(true);
              if (videoRef.current) {
                videoRef.current.loadAsync(
                  { uri: videoUrl },
                  { shouldPlay: true }
                );
              }
            }}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

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
  const [completedQuizzes, setCompletedQuizzes] = useState({});
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
            } else if (response.data.message === "CHAPTER_ALREADY_COMPLETED") {
              // Chapter hiện tại đã hoàn thành
              console.log('Chapter đã hoàn thành theo thông báo từ server');
              setIsCompleted(true);
              
              // Cập nhật AsyncStorage
              const savedLessons = await AsyncStorage.getItem('completedLessons');
              let lessonsObj = savedLessons ? JSON.parse(savedLessons) : {};
              lessonsObj[chapterId] = true;
              await AsyncStorage.setItem('completedLessons', JSON.stringify(lessonsObj));
              setCompletedLessons(lessonsObj);
            }
          }
        } else if (response.data.message === "CHAPTER_ALREADY_COMPLETED") {
          // Chapter hiện tại đã hoàn thành
          console.log('Chapter đã hoàn thành theo thông báo từ server');
          setIsCompleted(true);
          
          // Cập nhật AsyncStorage
          const savedLessons = await AsyncStorage.getItem('completedLessons');
          let lessonsObj = savedLessons ? JSON.parse(savedLessons) : {};
          lessonsObj[chapterId] = true;
          await AsyncStorage.setItem('completedLessons', JSON.stringify(lessonsObj));
          setCompletedLessons(lessonsObj);
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

      console.log('Đang tải dữ liệu cho chapter:', chapterId);
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Chapter/get-chapter/${chapterId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.isSuccess && response.data.data) {
        let videoUrl = response.data.data.video;
        console.log('Raw video URL from API:', videoUrl);
        
        // Clean up the URL
        if (videoUrl) {
          videoUrl = videoUrl.trim();
        }
        
        // Validate video URL
        if (!isValidVideoUrl(videoUrl)) {
          console.warn('Invalid video URL from API:', videoUrl);
        }
        
        // Fix for iOS - Force HTTPS
        if (Platform.OS === 'ios' && videoUrl && videoUrl.startsWith('http:')) {
          videoUrl = videoUrl.replace('http:', 'https:');
        }
        
        // Store chapter data with processed URL
        const chapterData = {
          ...response.data.data,
          video: videoUrl,
          videoWithCacheBuster: isValidVideoUrl(videoUrl) ? addCacheBuster(videoUrl) : null
        };
        
        setChapterData(chapterData);
        
        // Cập nhật trạng thái chapter
        if (response.data.data.status) {
          setChapterStatus(response.data.data.status);
        }
        
        // Kiểm tra nếu chapter đã hoàn thành
        if (response.data.data.status === "Done") {
          setIsCompleted(true);
        }

      } else {
        throw new Error(response.data?.message || 'Failed to fetch chapter data');
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error);
      setVideoError(true);
      setVideoErrorMessage('Không thể tải thông tin chương học. Vui lòng thử lại sau.');
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
  
  // Xử lý khi video phát hoàn tất
  const onPlaybackStatusUpdate = (status) => {
    if (!status || !status.durationMillis) return;

    // Chỉ hiện alert khi:
    // 1. Video đã chạy hết (positionMillis = durationMillis)
    // 2. Chapter đang ở trạng thái InProgress
    // 3. Chapter chưa hoàn thành (chapterStatus !== "Done")
    if (status.positionMillis === status.durationMillis && 
        chapterStatus === "InProgress") {
      updateProgress();
    }
  };

  // Handle video progress update
  const updateProgress = async () => {
    if (chapterStatus === "Done") return;

    Alert.alert(
      "Hoàn thành bài học",
      "Bạn đã hoàn thành bài học này. Xác nhận để lưu tiến độ?",
      [
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) return;

              const customerData = await AsyncStorage.getItem('customerInfo');
              if (!customerData) return;

              const customerInfo = JSON.parse(customerData);
              const customerId = customerInfo.customerId;

              if (!customerId) return;

              const response = await axios.put(
                `${API_CONFIG.baseURL}${API_CONFIG.endpoints.updateProccessCourse.replace('{chapterId}', chapterId)}`,
                {
                  customerId: customerId,
                  chapterId: chapterId
                },
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (response.data?.isSuccess) {
                setChapterStatus("Done");
                Alert.alert("Thành công", "Đã cập nhật tiến độ học tập", [
                  {
                    text: "OK",
                    onPress: () => {
                      // Chuyển về màn hình course_chapter sau khi nhấn OK
                      router.push({
                        pathname: '/(tabs)/course_chapter',
                        params: { 
                          courseId,
                          shouldRefresh: Date.now() // Thêm tham số này để trigger refresh màn hình chapter
                        }
                      });
                    }
                  }
                ]);
              }
            } catch (error) {
              console.error('Lỗi khi cập nhật tiến độ:', error);
              Alert.alert("Lỗi", "Không thể cập nhật tiến độ. Vui lòng thử lại sau.");
            }
          }
        },
        {
          text: "Hủy",
          style: "cancel"
        }
      ]
    );
  };

  const handleBack = () => {
    router.push({
      pathname: '/(tabs)/course_chapter',
      params: { courseId }
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
    
    // For iOS, ensure we use HTTPS
    if (Platform.OS === 'ios' && rawUrl.startsWith('http:')) {
      rawUrl = rawUrl.replace('http:', 'https:');
    }
    
    // Add cache buster
    const processedUrl = rawUrl + '?cb=' + Date.now();
    
    // Log the URL only once
    console.log(`[${Platform.OS}] Processing video URL:`, processedUrl);
    
    // If on iOS, show the HTTPS note only once
    if (Platform.OS === 'ios' && !hasShownIOSNote.current) {
      console.log('Note: iOS requires HTTPS for media playback by default.');
      hasShownIOSNote.current = true;
    }
    
    // Set the URL to state
    setVideoUrl(processedUrl);
    setVideoLoaded(false);
    
  }, [chapterData]);

  // Function to render the video player or error message
  const renderVideoComponent = (videoUrl) => {
    // Kiểm tra và xử lý URL video
    let processedUrl = videoUrl;
    if (Platform.OS === 'ios') {
      processedUrl = optimizeCloudinaryUrlForIOS(videoUrl);
    }
    processedUrl = addCacheBuster(processedUrl);

    return (
      <View style={styles.mainContainer}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={{
              uri: processedUrl,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            isLooping={false}
            volume={1.0}
            playsInSilentModeIOS={true}
            ignoreSilentSwitch="ignore"
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                setLoading(false);
                if (status.didJustFinish) {
                  updateProgress();
                }
              }
            }}
            onLoad={() => {
              setLoading(false);
              setVideoLoaded(true);
            }}
            onError={(error) => {
              console.error('Video error:', error);
              setLoading(false);
              setVideoError(true);
            }}
          />

          {loading && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Đang tải video...</Text>
            </View>
          )}

          {videoError && (
            <View style={styles.overlay}>
              <Text style={styles.errorText}>Không thể tải video. Vui lòng thử lại sau.</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={retryVideo}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Function to render content list items
  const renderChapterItem = ({ item, index }) => {
    const isCurrentChapter = item.chapterId === chapterId;
    
    // Kiểm tra xem chương đã hoàn thành chưa từ state completedLessons
    // Đảm bảo rằng việc hiển thị dấu tích xanh luôn phản ánh đúng trạng thái
    const isChapterCompleted = completedLessons[item.chapterId] === true;
    
    return (
      <TouchableOpacity 
        style={[
          styles.chapterButton,
          isCurrentChapter && styles.currentChapterButton,
          isChapterCompleted && styles.completedChapterButton
        ]}
        onPress={() => navigateToChapter(item)}
      >
        <View style={styles.chapterButtonContent}>
          <View style={styles.chapterInfo}>
            <Text style={[
              styles.chapterNumber, 
              isCurrentChapter && styles.currentChapterText
            ]}>
              Chapter {index + 1}
            </Text>
            <Text style={[
              styles.chapterTitle, 
              isCurrentChapter && styles.currentChapterText
            ]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View style={styles.chapterStatus}>
            {isCurrentChapter ? (
              <View style={styles.currentIndicator}>
                <Ionicons name="play" size={16} color="#fff" />
              </View>
            ) : isChapterCompleted ? (
              <View style={styles.completedIndicator}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
            ) : (
              <View style={styles.incompleteIndicator}>
                <Ionicons name="lock-open" size={14} color="#999" />
              </View>
            )}
          </View>
        </View>
        <Text style={styles.chapterDuration}>
          {item.duration || '10:00'}
        </Text>
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
      
      console.log('Đã tạo URL video mới với cache buster:', newUrlWithCacheBuster);
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

  // Hook to handle screen navigation
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - preparing video');
      
      // When screen gains focus, reset retry count to enable fresh start
      setRetryCount(0);
      setVideoError(false);
      
      return () => {
        console.log('Navigating away - stopping video playback');
        // Any additional cleanup needed when screen loses focus
      };
    }, [])
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

  // Function to update progress to the server
  const updateProgressToServer = async () => {
    try {
      // Kiểm tra xem video đã xem đủ chưa
      if (!status?.positionMillis || !status?.durationMillis || 
          (status.positionMillis / status.durationMillis) < 0.9) {
        console.log('Video chưa xem đủ 90%, không cập nhật tiến trình');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('Không có token, không thể cập nhật tiến trình');
        return;
      }

      console.log('Cập nhật tiến trình cho chapter:', chapterId);
      
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

      if (response.data?.isSuccess) {
        console.log('Cập nhật tiến trình thành công:', response.data);
        
        // Cập nhật trạng thái hoàn thành trong local storage
        const completedLessons = await AsyncStorage.getItem('completedLessons');
        let lessonsObj = completedLessons ? JSON.parse(completedLessons) : {};
        lessonsObj[chapterId] = true;
        await AsyncStorage.setItem('completedLessons', JSON.stringify(lessonsObj));
        
        // Cập nhật state
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tiến trình:', error);
    }
  };

  // Reset alert status when chapter changes
  useEffect(() => {
    setHasShownAlert(false);
    if (chapterId) {
      // Kiểm tra nếu chapter đã hoàn thành trước đó thì cập nhật trạng thái isCompleted
      const checkIsCompleted = async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          // Nếu muốn kiểm tra chính xác hơn, có thể gửi truy vấn kiểm tra trạng thái chapter
          // nhưng vì không có API riêng, ta sẽ dùng dữ liệu cục bộ
          
          const savedLessons = await AsyncStorage.getItem('completedLessons');
          if (savedLessons) {
            const parsedLessons = JSON.parse(savedLessons);
            // Nếu chapter đã hoàn thành trong local storage, cập nhật trạng thái
            if (parsedLessons[chapterId] === true) {
              console.log('Chapter đã hoàn thành trước đó trong local storage:', chapterId);
              setIsCompleted(true);
              
              // Cập nhật lại toàn bộ danh sách bài học đã hoàn thành từ local
              setCompletedLessons(parsedLessons);
            }
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra trạng thái hoàn thành:', error);
        }
      };
      checkIsCompleted();
    }
  }, [chapterId]);

  // Load và lưu dữ liệu bài học đã hoàn thành
  const loadCompletedLessons = useCallback(async () => {
    try {
      if (!chapterId) return false;
      
      // Kiểm tra xem đã hoàn thành chưa để tránh load nhiều lần
      if (isCompleted) {
        console.log('Chapter này đã được đánh dấu là hoàn thành, bỏ qua việc load lại');
        return false;
      }
      
      const savedLessons = await AsyncStorage.getItem('completedLessons');
      if (!savedLessons) {
        console.log('Không có dữ liệu completedLessons trong AsyncStorage');
        return false;
      }
      
      // Tránh log liên tục dữ liệu quá lớn
      console.log('Đang tải dữ liệu completedLessons từ AsyncStorage...');
      
      const parsedLessons = JSON.parse(savedLessons);
      console.log('Chapter hiện tại:', chapterId, 'Trạng thái hoàn thành:', parsedLessons[chapterId]);
      setCompletedLessons(parsedLessons);
      
      // Kiểm tra nếu chapter hiện tại đã hoàn thành
      if (parsedLessons[chapterId]) {
        setIsCompleted(true);
        console.log('Chapter này đã được đánh dấu là hoàn thành');
      } else {
        setIsCompleted(false);
        console.log('Chapter này chưa được đánh dấu là hoàn thành');
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bài học đã hoàn thành:', error);
      return false;
    }
  }, [chapterId, isCompleted]);
  
  // Thêm hàm đánh dấu hoàn thành riêng cho chapter
  const markChapterAsCompleted = useCallback(async () => {
    try {
      if (!chapterId) return false;
      
      console.log('Đánh dấu Chapter ' + chapterId + ' là đã hoàn thành');
      
      // Đọc dữ liệu hiện tại
      let savedLessons = await AsyncStorage.getItem('completedLessons');
      const completedData = savedLessons ? JSON.parse(savedLessons) : {};
      
      // Đánh dấu chapter hiện tại là đã hoàn thành
      completedData[chapterId] = true;
      
      // Lưu lại vào AsyncStorage
      await AsyncStorage.setItem('completedLessons', JSON.stringify(completedData));
      
      // Cập nhật state
      setCompletedLessons(completedData);
      setIsCompleted(true);
      
      console.log('Đã đánh dấu Chapter ' + chapterId + ' là đã hoàn thành và lưu vào AsyncStorage');
      return true;
    } catch (error) {
      console.error('Lỗi khi đánh dấu chapter là đã hoàn thành:', error);
      return false;
    }
  }, [chapterId]);

  // Load data on component mount
  useEffect(() => {
    // Đảm bảo chỉ chạy khi có các giá trị cần thiết
    if (!router || !chapterId) return;
    
    let isMounted = true;
    const loadData = async () => {
      console.log('Video screen mounted - Loading data for chapterId:', chapterId);
      
      if (isMounted) {
        // Reset các state
        setIsCompleted(false);
        setHasShownAlert(false);
        setShowBackConfirmation(false);
        
        // Load video và course data
        await loadChapterDetails();
        
        // Fetch course content if courseId is available
        if (courseId) {
          await fetchCourseChapters(courseId, null, chapterId);
        }
        
        // Load trạng thái hoàn thành (chỉ load 1 lần)
        await loadCompletedLessons();
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (videoRef.current) {
        console.log('Video component unmounting - cleaning up');
        try {
          videoRef.current.unloadAsync();
        } catch (error) {
          console.error('Error unloading video:', error);
        }
      }
    };
  // Loại bỏ loadCompletedLessons khỏi dependency array để tránh render lặp
  }, [chapterId, courseId, router]);

  // Thêm hàm xóa thủ công tiến độ khóa học
  const resetCourseProgress = useCallback(async () => {
    try {
      if (!courseId) {
        Alert.alert("Lỗi", "Không thể xác định ID khóa học");
        return;
      }
      
      Alert.alert(
        "Xóa tiến độ khóa học",
        "Bạn có chắc chắn muốn xóa tiến độ khóa học này không? Hành động này không thể hoàn tác.",
        [
          {
            text: "Hủy",
            style: "cancel"
          },
          {
            text: "Xóa tiến độ",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                // Xóa dữ liệu hoàn thành của các chapter trong khóa học này
                const completedLessons = await AsyncStorage.getItem('completedLessons');
                if (completedLessons) {
                  let lessonsData = JSON.parse(completedLessons);
                  
                  // Xóa chapter hiện tại
                  if (chapterId) {
                    delete lessonsData[chapterId];
                  }
                  
                  // Xóa tất cả các chapter thuộc khóa học này
                  if (courseContent && courseContent.length > 0) {
                    courseContent.forEach(chapter => {
                      if (chapter.chapterId) {
                        delete lessonsData[chapter.chapterId];
                      }
                    });
                  }
                  
                  await AsyncStorage.setItem('completedLessons', JSON.stringify(lessonsData));
                  setCompletedLessons(lessonsData);
                  setIsCompleted(false);
                }
                
                // Xóa tiến độ của khóa học
                const progress = await AsyncStorage.getItem('courseProgress');
                if (progress) {
                  let progressData = JSON.parse(progress);
                  delete progressData[courseId];
                  await AsyncStorage.setItem('courseProgress', JSON.stringify(progressData));
                  setCurrentProgress(0);
                }
                
                // Xóa trạng thái hoàn thành của khóa học
                const completedCourses = await AsyncStorage.getItem('completedCourses');
                if (completedCourses) {
                  let coursesData = JSON.parse(completedCourses);
                  delete coursesData[courseId];
                  await AsyncStorage.setItem('completedCourses', JSON.stringify(coursesData));
                }
                
                // Hiển thị thông báo thành công
                Alert.alert(
                  "Đã xóa tiến độ",
                  "Tiến độ khóa học đã được xóa thành công. Bạn có thể bắt đầu lại từ đầu.",
                  [{ text: "OK" }]
                );
                
                // Tải lại dữ liệu trang
                loadChapterDetails();
                if (courseId) {
                  fetchCourseChapters(courseId, null, chapterId);
                }
              } catch (error) {
                console.error('Lỗi khi xóa tiến độ khóa học:', error);
                Alert.alert(
                  "Lỗi",
                  "Không thể xóa tiến độ khóa học. Vui lòng thử lại sau.",
                  [{ text: "OK" }]
                );
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi xóa tiến độ khóa học:', error);
    }
  }, [courseId, chapterId, courseContent, setCompletedLessons, setIsCompleted, setCurrentProgress]);

  // Thêm useEffect để lấy status của chapter khi màn hình được load
  useEffect(() => {
    const fetchChapterStatus = async () => {
      if (!enrollCourseId || !chapterId) return;
      
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) return;

        // Lấy thông tin user hiện tại
        const userData = await AsyncStorage.getItem('userData');
        const currentUser = userData ? JSON.parse(userData) : null;
        if (!currentUser) return;

        const response = await axios.get(
          `${API_CONFIG.baseURL}/api/RegisterCourse/get-enroll-chapters-by/${enrollCourseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.isSuccess && response.data.data) {
          const chapters = response.data.data;
          const currentChapter = chapters.find(c => c.chapterId === chapterId);
          if (currentChapter) {
            // Chỉ set status Done nếu chapter thuộc về user hiện tại
            const isDone = currentChapter.customerId === currentUser.id && currentChapter.status === "Done";
            setChapterStatus(isDone ? "Done" : "InProgress");
            setIsCompleted(isDone);
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái chapter:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapterStatus();
  }, [enrollCourseId, chapterId]);

  // Load chapter data when chapterId changes
  useEffect(() => {
    if (chapterId) {
      fetchChapterData();
    }
  }, [chapterId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.headerTitle}>
            {chapterData?.title || 'Đang tải...'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Video Container */}
      <View style={styles.mainContainer}>
        <View style={styles.videoWrapper}>
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
        {chapterData && (
          <ScrollView style={styles.infoContainer}>
            <View style={styles.chapterInfoContainer}>
              <Text style={styles.chapterTitle}>
                {chapterData.title || 'Không có tiêu đề'}
              </Text>
              
              <View style={styles.chapterMetaInfo}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.metaText}>
                    {chapterData.duration || '00:45:00'}
                  </Text>
                </View>
              </View>

              {chapterData.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>Mô tả:</Text>
                  <Text style={styles.descriptionText}>
                    {chapterData.description}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  chapterInfoContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chapterMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#666',
  },
  descriptionContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  descriptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    color: '#fff',
  },
  chapterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chapterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  chapterNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chapterTitle: {
    fontSize: 16,
    color: '#666',
  },
  chapterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incompleteIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterDuration: {
    fontSize: 14,
    color: '#666',
  },
  currentChapterButton: {
    backgroundColor: '#f0f0f0',
  },
  completedChapterButton: {
    backgroundColor: '#e0e0e0',
  },
  currentChapterText: {
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  infoContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
