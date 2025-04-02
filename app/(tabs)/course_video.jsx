import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, Audio, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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

const VideoPlayer = React.memo(({ videoUrl, onComplete, autoResetOnFocus = true }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const hasLoaded = useRef(false);
  const currentPositionRef = useRef(0);
  
  // Handle screen focus and blur
  useFocusEffect(
    useCallback(() => {
      console.log('Video screen focused');
      
      // When screen comes into focus, reload video if needed
      if (videoRef.current && hasLoaded.current) {
        if (autoResetOnFocus) {
          // Reset to beginning and play
          videoRef.current.setPositionAsync(0)
            .then(() => videoRef.current.playAsync())
            .catch(e => console.log('Error resetting video position:', e));
        } else {
          // Resume from last position
          videoRef.current.playAsync()
            .catch(e => console.log('Error playing video:', e));
        }
      }
      
      // Cleanup function called when screen loses focus
      return () => {
        console.log('Video screen blurred - stopping video');
        if (videoRef.current) {
          // Save current position
          if (videoRef.current.getStatusAsync) {
            videoRef.current.getStatusAsync()
              .then(status => {
                if (status.isLoaded) {
                  currentPositionRef.current = status.positionMillis;
                }
              })
              .catch(e => console.log('Error getting video status:', e));
          }
          
          // Pause playback
          videoRef.current.pauseAsync()
            .catch(e => console.log('Error pausing video:', e));
        }
      };
    }, [autoResetOnFocus])
  );
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log('Video component unmounting - cleaning up');
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(e => console.log('Error unloading:', e));
      }
    };
  }, []);
  
  const handleLoad = (status) => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      setLoading(false);
      console.log('Video loaded successfully:', status);
    }
  };
  
  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      // Update position for potential resume
      currentPositionRef.current = status.positionMillis;
      
      // Check for completion
      if (status.didJustFinish) {
        onComplete && onComplete();
      }
    }
  };
  
  const handleError = (error) => {
    console.error('Video error:', error);
    setLoading(false);
    setError(true);
    
    if (Platform.OS === 'ios' && error.error?.domain === 'NSURLErrorDomain') {
      switch (error.error?.code) {
        case -1001: 
          setErrorMessage('Kết nối video quá chậm. Vui lòng kiểm tra mạng của bạn.');
          break;
        case -1008:
          setErrorMessage('Không thể kết nối đến máy chủ video. Vui lòng thử lại sau.');
          break;
        case -1009:
          setErrorMessage('Không có kết nối mạng. Vui lòng kiểm tra kết nối internet.');
          break;
        default:
          setErrorMessage('Lỗi phát video. Vui lòng thử lại sau.');
      }
    } else {
      setErrorMessage('Không thể tải video. Vui lòng thử lại sau.');
    }
  };
  
  const handleRetry = () => {
    setError(false);
    setLoading(true);
    hasLoaded.current = false;
    
    if (videoRef.current) {
      videoRef.current.unloadAsync()
        .then(() => {
          setTimeout(() => {
            videoRef.current.loadAsync(
              { uri: videoUrl + '&retry=' + Date.now() },
              { shouldPlay: true },
              false
            );
          }, 500);
        })
        .catch(err => console.log('Error during retry:', err));
    }
  };
  
  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <Video
        ref={videoRef}
        style={{flex: 1}}
        source={{
          uri: videoUrl,
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        isLooping={false}
        volume={1.0}
        playsInSilentModeIOS={true}
        ignoreSilentSwitch="ignore"
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {loading && (
        <View style={{...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{color: '#fff', marginTop: 10}}>Đang tải video...</Text>
        </View>
      )}
      
      {error && (
        <View style={{...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000'}}>
          <Ionicons name="alert-circle" size={48} color="#dc3545" />
          <Text style={{color: '#fff', textAlign: 'center', margin: 20}}>{errorMessage}</Text>
          <TouchableOpacity 
            style={{flexDirection: 'row', backgroundColor: '#007bff', padding: 12, borderRadius: 4, alignItems: 'center'}}
            onPress={handleRetry}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={{color: '#fff', marginLeft: 8}}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default function CourseVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { chapterId, courseId } = params;
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [chapterData, setChapterData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'discussion'
  const [completedLessons, setCompletedLessons] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [lessonId, setLessonId] = useState(params.lessonId);
  const [courseContent, setCourseContent] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  
  // Add new state variables for video error handling
  const [videoError, setVideoError] = useState(false);
  const [videoErrorMessage, setVideoErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Add a useRef to store the processed video URL to prevent unnecessary recalculations
  const processedVideoUrlRef = useRef(null);

  // Add these refs at the top of your component
  const hasLoggedVideoUrl = useRef(false);
  const currentVideoUrl = useRef('');

  // Add this state to track if video should auto-play
  const [shouldAutoPlay, setShouldAutoPlay] = useState(true);

  // Add this ref to track if we've already shown the iOS note
  const hasShownIOSNote = useRef(false);

  // Add this ref to track the processed URL for the current render cycle
  const currentRenderCycleUrl = useRef('');

  // Add these state variables at the top of your component
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Add this near your other useRef declarations
  const isInitialMount = useRef(true);
  const isVideoPlaying = useRef(false);

  // Load completion data from storage
  useEffect(() => {
    const loadCompletionData = async () => {
      try {
        // Load completed lessons
        const savedLessons = await AsyncStorage.getItem('completedLessons');
        if (savedLessons) {
          setCompletedLessons(JSON.parse(savedLessons));
        }
        
        // Load completed quizzes
        const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
        if (savedQuizzes) {
          setCompletedQuizzes(JSON.parse(savedQuizzes));
        }
      } catch (error) {
        console.log('Error loading completion data', error);
      }
    };
    
    loadCompletionData();
  }, []);

  // Modify the audio setup useEffect to properly handle navigation
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log('Lỗi cài đặt audio:', error);
      }
    };
    
    setupAudio();
    
    // This cleanup function runs when navigating away from the page
    return () => {
      console.log('Navigating away - stopping video playback');
      if (videoRef.current) {
        try {
          // Stop playback when leaving the screen
          videoRef.current.pauseAsync().catch(err => console.log('Error pausing video:', err));
          videoRef.current.setPositionAsync(0).catch(err => console.log('Error resetting position:', err));
        } catch (err) {
          console.log('Error in video cleanup:', err);
        }
      }
    };
  }, []);

  // Fetch chapter data
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!chapterId) {
        console.log('No chapterId provided, cannot fetch chapter data');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching chapter data for chapterId:', chapterId);
        
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }

        // 1. Fetch chapter details
        const response = await axios.get(
          `${API_CONFIG.baseURL}/api/Chapter/get-chapter/${chapterId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Chapter response:', response.data);

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
          
          // Use courseId from chapter if not provided in params
          const effectiveCourseId = courseId || response.data.data.courseId;
          
          // 2. Fetch all chapters for this course
          if (effectiveCourseId) {
            await fetchCourseChapters(effectiveCourseId, token, chapterId);
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

    fetchChapterData();
  }, [chapterId, courseId]);
  
  // Fetch all chapters for the course
  const fetchCourseChapters = async (courseId, token, currentChapterId) => {
    try {
      console.log('Fetching all chapters for courseId:', courseId);
      
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Chapter/get-all-chapters-by-courseId`,
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
      
      console.log('All chapters response:', response.data);
      
      if (response.data?.isSuccess && response.data.data) {
        const chapters = response.data.data;
        setCourseContent(chapters);
        
        // Find current chapter index
        const index = chapters.findIndex(ch => ch.chapterId === currentChapterId);
        if (index !== -1) {
          setCurrentChapterIndex(index);
        }
      }
    } catch (error) {
      console.error('Error fetching course chapters:', error);
    }
  };
  
  // Update progress when video is completed
  const updateProgress = async () => {
    if (!chapterId) {
      console.log('No chapterId available, cannot update progress');
      return;
    }
    
    try {
      console.log('Updating progress for chapter:', chapterId);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('No token found, cannot update progress');
        return;
      }
      
      // Call API to update progress
      try {
        const response = await axios.put(
          `${API_CONFIG.baseURL}/api/RegisterCourse/${chapterId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Progress update API Response:', response.data);
        
        if (response.data?.isSuccess) {
          console.log('Progress updated successfully');
        } else {
          console.warn('Backend returned error but we will save locally:', response.data?.message);
        }
      } catch (apiError) {
        console.warn('API error but continuing with local save:', apiError.message);
      }
      
      // Save progress locally
      console.log('Saving progress locally for chapter:', chapterId);
      const updatedLessons = { 
        ...completedLessons, 
        [chapterId]: true 
      };
      setCompletedLessons(updatedLessons);
      
      await AsyncStorage.setItem('completedLessons', JSON.stringify(updatedLessons));
      
      // Check if this was the last chapter and if all chapters are complete
      if (courseContent.length > 0) {
        const isLastChapter = currentChapterIndex === courseContent.length - 1;
        
        if (isLastChapter) {
          const allChaptersCompleted = checkAllChaptersCompleted(updatedLessons);
          if (allChaptersCompleted) {
            setTimeout(() => {
              Alert.alert(
                "Khóa học hoàn thành!",
                "Bạn đã hoàn thành tất cả các bài học. Bạn có muốn làm bài kiểm tra cuối khóa không?",
                [
                  { text: "Để sau", style: "cancel" },
                  { text: "Làm ngay", onPress: () => navigateToQuiz() }
                ]
              );
            }, 1000);
          }
        } else {
          // Offer to navigate to next chapter
          const nextChapter = courseContent[currentChapterIndex + 1];
          if (nextChapter) {
            setTimeout(() => {
              Alert.alert(
                "Chương học hoàn thành!",
                "Bạn có muốn tiếp tục với chương tiếp theo không?",
                [
                  { text: "Để sau", style: "cancel" },
                  { text: "Tiếp tục", onPress: () => navigateToChapter(nextChapter) }
                ]
              );
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error in updateProgress:', error);
      
      // Still try to update local storage
      try {
        const updatedLessons = { 
          ...completedLessons, 
          [chapterId]: true 
        };
        setCompletedLessons(updatedLessons);
        await AsyncStorage.setItem('completedLessons', JSON.stringify(updatedLessons));
      } catch (storageError) {
        console.error('Failed to save local progress:', storageError);
      }
    }
  };
  
  // Check if all chapters are completed
  const checkAllChaptersCompleted = (currentCompletedLessons) => {
    if (!courseContent || courseContent.length === 0) return false;
    
    return courseContent.every(chapter => 
      currentCompletedLessons[chapter.chapterId] === true
    );
  };
  
  // Navigate to next chapter
  const navigateToChapter = (chapter) => {
    if (!chapter || !chapter.chapterId) {
      console.error('Invalid chapter object', chapter);
      return;
    }
    
    setShouldAutoPlay(true);
    
    router.push({
      pathname: '/(tabs)/course_video',
      params: {
        chapterId: chapter.chapterId,
        courseId: courseId || chapter.courseId,
        autoPlay: 'true'
      }
    });
  };
  
  // Navigate to quiz
  const navigateToQuiz = () => {
    router.push({
      pathname: '/(tabs)/course_quiz_start',
      params: {
        courseId: courseId || chapterData?.courseId,
        source: 'video_completion'
      }
    });
  };
  
  // Handle playback status updates
  const handlePlaybackStatusUpdate = (playbackStatus) => {
    // Only update if there's a significant change to avoid re-render loops
    if (
      playbackStatus.isLoaded && 
      (
        // Only update on these specific conditions
        !status.isLoaded || 
        playbackStatus.didJustFinish ||
        Math.abs(playbackStatus.positionMillis - (status.positionMillis || 0)) > 5000 ||
        (playbackStatus.isPlaying !== status.isPlaying && isVideoPlaying.current !== playbackStatus.isPlaying)
      )
    ) {
      // Update our ref to track if video is playing
      isVideoPlaying.current = playbackStatus.isPlaying;
      
      // Only update state for significant changes
      setStatus(prevStatus => ({
        ...prevStatus,
        isLoaded: playbackStatus.isLoaded,
        didJustFinish: playbackStatus.didJustFinish,
        isPlaying: playbackStatus.isPlaying,
        positionMillis: playbackStatus.positionMillis,
      }));
    }
    
    // Track video completion separately from state updates
    if (
      playbackStatus.isLoaded &&
      playbackStatus.didJustFinish &&
      !playbackStatus.isLooping
    ) {
      console.log('Video playback completed');
      updateProgress();
    }
  };

  const handleBack = async () => {
    if (isCompleted) {
      await updateProgress();
    }
    router.push({
      pathname: '/(tabs)/course_chapter',
      params: { courseId: courseId || chapterData?.courseId }
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
  const renderVideoPlayer = () => {
    // If no chapter data, show loading
    if (!chapterData) {
      return (
        <View style={{width: '100%', height: '100%', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }

    // Check if we already have a processed URL in the ref
    if (processedVideoUrlRef.current && 
        processedVideoUrlRef.current.originalUrl === chapterData.video &&
        currentRenderCycleUrl.current === processedVideoUrlRef.current.processedUrl) {
      // We've already processed this URL in this render cycle, use the cached URL
      return renderVideoComponent(processedVideoUrlRef.current.processedUrl);
    }
    
    // Reset logged state when processing a new URL
    hasLoggedVideoUrl.current = false;

    // Get the video URL with better validation
    let videoUrl = chapterData?.videoWithCacheBuster || chapterData?.video;
    const originalUrl = videoUrl;
    
    // Check if URL is valid
    if (!isValidVideoUrl(videoUrl)) {
      console.error('Invalid video URL:', videoUrl);
      // Use specific formats that work well on iOS
      videoUrl = Platform.OS === 'ios'
        ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
        : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }
    
    // For iOS, make sure we use an HTTPS URL
    if (Platform.OS === 'ios' && videoUrl.startsWith('http:')) {
      videoUrl = videoUrl.replace('http:', 'https:');
    }
    
    // Add cache buster if not already added
    if (!videoUrl.includes('cb=')) {
      videoUrl = addCacheBuster(videoUrl);
    }
    
    // Log the URL only once when it's first processed in this render cycle
    if (currentRenderCycleUrl.current !== videoUrl) {
      console.log(`[${Platform.OS}] Using video URL:`, videoUrl);
      currentRenderCycleUrl.current = videoUrl;
      
      // Show iOS note only once per component mount
      if (Platform.OS === 'ios' && !hasShownIOSNote.current) {
        console.log('Note: iOS requires HTTPS for media playback by default. Verify HTTPS is working or add NSAllowsArbitraryLoads in Info.plist');
        hasShownIOSNote.current = true;
      }
    }
    
    currentVideoUrl.current = videoUrl;
    
    // Cache the processed URL to prevent unnecessary recalculations
    processedVideoUrlRef.current = {
      originalUrl: originalUrl,
      processedUrl: videoUrl
    };

    return renderVideoComponent(videoUrl);
  };

  // Update the MemoizedVideo component to properly forward the ref and handle loading
  const MemoizedVideo = React.memo(React.forwardRef((props, ref) => {
    const { videoUrl, onLoad, onError, onPlaybackStatusUpdate, onLoadStart, shouldAutoPlay } = props;
    
    return (
      <Video
        ref={ref}
        style={[styles.video, {position: 'absolute', top: 0, left: 0, bottom: 0, right: 0}]}
        source={{
          uri: videoUrl,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: false,
          overrideFileExtensionAndroid: 'mp4'
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={shouldAutoPlay}
        isLooping={false}
        volume={1.0}
        isMuted={false}
        rate={1.0}
        playsInSilentLockedModeIOS={true}
        ignoreSilentSwitch="ignore"
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }));

  // Update the renderVideoComponent function to properly use refs
  const renderVideoComponent = (videoUrl) => {
    return (
      <View style={{width: '100%', height: '100%', backgroundColor: '#000'}}>
        <MemoizedVideo 
          ref={videoRef}
          videoUrl={videoUrl}
          shouldAutoPlay={shouldAutoPlay}
          onPlaybackStatusUpdate={(status) => {
            // Only update status if playback status changes significantly
            if (
              status.isLoaded && 
              (!videoLoaded || status.didJustFinish)
            ) {
              setStatus(status);
              
              // Track video completion
              if (status.didJustFinish && !status.isLooping) {
                updateProgress();
              }
            }
          }}
          onLoadStart={() => {
            if (!loading) setLoading(true);
          }}
          onLoad={(status) => {
            setLoading(false);
            
            // Only handle load logic once
            if (!videoLoaded) {
              console.log(`[${Platform.OS}] Video loaded successfully`);
              setVideoLoaded(true);
              
              // Give the video component time to initialize fully
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.playAsync().catch(err => 
                    console.log('Error playing video:', err)
                  );
                }
              }, 500);
            }
          }}
          onError={(error) => {
            console.error(`[${Platform.OS}] Video error:`, error);
            setLoading(false);
            setVideoError(true);
            setVideoErrorMessage('Không thể tải video. Vui lòng thử lại sau.');
          }}
        />
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{color: '#fff', marginTop: 10}}>Đang tải video...</Text>
          </View>
        )}
      </View>
    );
  };

  // Function to render content list items
  const renderChapterItem = ({ item, index }) => {
    const isCurrentChapter = item.chapterId === params.chapterId;
    const isCompleted = completedLessons[item.chapterId];
    
    return (
      <TouchableOpacity
        style={[
          styles.contentItem,
          isCurrentChapter && styles.currentContentItem
        ]}
        onPress={() => navigateToChapter(item)}
      >
        <View style={styles.contentItemInfo}>
          <Text style={styles.contentItemTitle}>
            {index + 1}. {item.title}
          </Text>
          <Text style={styles.contentItemMeta}>
            {item.duration || '10:00'}
          </Text>
        </View>
        <View style={styles.contentItemStatus}>
          {isCurrentChapter ? (
            <View style={styles.currentCircle}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
          ) : isCompleted ? (
            <View style={styles.completedCircle}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
          ) : (
            <View style={styles.incompleteCircle}>
              <Ionicons name="lock-closed" size={14} color="#999" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Function to retry loading the video
  const retryVideo = () => {
    setVideoError(false);
    setVideoErrorMessage('');
    setRetryCount(prevCount => prevCount + 1);
    // Reset URL cache to force a new fetch
    processedVideoUrlRef.current = null;
    // Force a re-render
    setLoading(true);
    // Re-fetch chapter data
    fetchChapterData();
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
      
      {/* Video Player */}
      <View style={styles.videoContainer}>
        {chapterData?.video && (
          <VideoPlayer 
            videoUrl={optimizeCloudinaryUrlForIOS(chapterData.video) + '?cb=' + Date.now()} 
            onComplete={updateProgress}
            autoResetOnFocus={true}
          />
        )}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
              <TouchableOpacity 
          style={[styles.tab, activeTab === 'content' && styles.activeTab]}
          onPress={() => setActiveTab('content')}
        >
          <Text style={[styles.tabText, activeTab === 'content' && styles.activeTabText]}>
            Course content
                  </Text>
              </TouchableOpacity>
              <TouchableOpacity 
          style={[styles.tab, activeTab === 'discussion' && styles.activeTab]}
          onPress={() => setActiveTab('discussion')}
        >
          <Text style={[styles.tabText, activeTab === 'discussion' && styles.activeTabText]}>
            Discussion
                  </Text>
              </TouchableOpacity>
            </View>
            
      {/* Content */}
      {activeTab === 'content' ? (
        <View style={styles.contentContainer}>
          {courseContent.length > 0 ? (
            <FlatList
              data={courseContent}
              renderItem={renderChapterItem}
              keyExtractor={item => item.chapterId}
              ListHeaderComponent={() => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Phong Thủy Cổ Học
                  </Text>
                  <Text style={styles.sectionMeta}>
                    {courseContent.length} Videos • {courseContent.reduce((total, chapter) => {
                      const durationMatch = chapter.duration?.match(/(\d+):(\d+)/);
                      return total + (durationMatch ? parseInt(durationMatch[1]) : 10);
                    }, 0)} min
                  </Text>
                </View>
              )}
              ListFooterComponent={() => (
              <TouchableOpacity 
                  style={styles.quizItem}
                  onPress={navigateToQuiz}
                >
                  <View style={styles.contentItemInfo}>
                    <Text style={styles.contentItemTitle}>
                      Final Quiz
                  </Text>
                    <Text style={styles.contentItemMeta}>
                      20 questions • 30 min
                  </Text>
                </View>
                  <View style={styles.contentItemStatus}>
                    {completedQuizzes['final-exam'] ? (
                      <View style={styles.completedCircle}>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                </View>
                    ) : (
                      <View style={styles.incompleteCircle}>
                        <Ionicons name="help" size={16} color="#999" />
                </View>
                    )}
                </View>
              </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
            </View>
                  )}
                </View>
      ) : (
        <View style={styles.discussionContainer}>
          <Text style={styles.discussionText}>Discussion feature coming soon</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '500',
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#8B0000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  discussionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  discussionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  contentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  currentContentItem: {
    backgroundColor: '#f5f8ff',
  },
  contentItemInfo: {
    flex: 1,
  },
  contentItemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  contentItemMeta: {
    fontSize: 12,
    color: '#666',
  },
  contentItemStatus: {
    width: 24,
    height: 24,
    marginLeft: 12,
  },
  completedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incompleteCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quizItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  videoErrorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  videoErrorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
});
