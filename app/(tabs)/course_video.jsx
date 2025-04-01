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

export default function CourseVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [chapterData, setChapterData] = useState(null);
  const [courseId, setCourseId] = useState(params.courseId);
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

  // Add this useFocusEffect to handle focus/blur events
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen comes into focus
      console.log('Screen focused - preparing video');
      
      // Prepare for playback when screen is focused
      if (videoRef.current) {
        try {
          // After a delay to ensure everything is ready
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.setPositionAsync(0)
                .then(() => {
                  if (shouldAutoPlay) {
                    videoRef.current.playAsync();
                  }
                })
                .catch(err => console.log('Error preparing video on focus:', err));
            }
          }, 500);
        } catch (err) {
          console.log('Error in focus effect:', err);
        }
      }
      
      // This runs when the screen loses focus (navigating away)
      return () => {
        console.log('Screen blurred - stopping video');
        if (videoRef.current) {
          try {
            videoRef.current.pauseAsync()
              .catch(err => console.log('Error pausing on blur:', err));
          } catch (err) {
            console.log('Error in blur cleanup:', err);
          }
        }
      };
    }, [shouldAutoPlay])
  );

  // Fetch chapter data and course content
  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem video');
          router.push('/login');
          return;
        }

        if (!params.chapterId) {
          throw new Error('Không tìm thấy thông tin chương học');
        }

        // Fetch current chapter
        const response = await axios.get(
          `${API_CONFIG.baseURL}/api/Chapter/get-chapter/${params.chapterId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Chapter response:', response.data);

        // Add detailed logging about the video URL
        if (response.data?.isSuccess && response.data.data) {
          const videoUrl = response.data.data.video;
          console.log('Raw video URL from API:', videoUrl, 'Type:', typeof videoUrl);
          
          if (videoUrl === 'string' || !videoUrl || typeof videoUrl !== 'string') {
            console.warn('Backend returned invalid video URL. This is likely a backend issue.');
          }
          }

        if (response.data?.isSuccess) {
          setChapterData(response.data.data);
          setCourseId(response.data.data.courseId);
          
          // Now fetch all chapters for this course to show in the content list
          const courseResponse = await axios.get(
            `${API_CONFIG.baseURL}/api/Chapter/get-all-chapters-by-courseId`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: {
                id: response.data.data.courseId
              }
            }
          );
          
          if (courseResponse.data?.isSuccess) {
            const chapters = courseResponse.data.data;
            setCourseContent(chapters);
            
            // Find current chapter index
            const index = chapters.findIndex(ch => ch.chapterId === params.chapterId);
            if (index !== -1) {
              setCurrentChapterIndex(index);
            }
          }
        } else {
          throw new Error(response.data?.message || 'Không thể tải thông tin chương học');
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        Alert.alert(
          'Lỗi',
          'Không thể tải video bài học. Vui lòng thử lại sau.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [params.chapterId]);

  // Add this to useEffect for chapter data to trigger auto-play when data loads
  useEffect(() => {
    if (chapterData && videoRef.current) {
      // Auto-play when chapter data is loaded
      try {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.playAsync();
          }
        }, 1000); // Small delay to ensure video is ready
      } catch (err) {
        console.log('Error auto-playing video:', err);
      }
    }
  }, [chapterData]);

  const handleBack = async () => {
    if (isCompleted) {
      await updateProgress();
    }
    router.push({
      pathname: '/(tabs)/course_chapter',
      params: { courseId: courseId || chapterData?.courseId }
    });
  };

  const handlePlaybackStatusUpdate = (playbackStatus) => {
    // Only update status if it's substantially different to prevent re-render loops
    if (
      playbackStatus.isLoaded && 
      (!status.isLoaded || 
       Math.abs(playbackStatus.positionMillis - status.positionMillis) > 1000 ||
       playbackStatus.isPlaying !== status.isPlaying)
    ) {
    setStatus(playbackStatus);
    }
    
    // Set loading state only once
    if (playbackStatus.isLoaded && loading) {
      setLoading(false);
    }
    
    // Check completion only when we're near the end to prevent multiple triggers
    if (playbackStatus.isLoaded && 
        playbackStatus.positionMillis > 0 && 
        !isCompleted &&
        playbackStatus.durationMillis > 0 &&
        playbackStatus.positionMillis >= playbackStatus.durationMillis * 0.95) {
      setIsCompleted(true);
      updateProgress().catch(err => console.error("Error updating progress:", err));
    }
  };

  const updateProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Check if we have a valid chapterId
      if (!params.chapterId) {
        console.error('Missing chapterId for progress update');
        return;
      }
      
      console.log('Updating progress for chapter:', params.chapterId);
      
      // Try to update on backend
      try {
        const response = await axios.put(
          `${API_CONFIG.baseURL}/api/RegisterCourse/${params.chapterId}`,
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
          console.log('Cập nhật tiến độ thành công:', response.data.message);
        } else {
          console.warn('Backend returned error but we will save locally:', response.data?.message);
        }
      } catch (apiError) {
        console.warn('API error but continuing with local save:', apiError.message);
      }
      
      // Save progress locally regardless of API success/failure
      console.log('Saving progress locally for chapter:', params.chapterId);
      const updatedLessons = { 
        ...completedLessons, 
        [params.chapterId]: true 
      };
      setCompletedLessons(updatedLessons);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('completedLessons', JSON.stringify(updatedLessons));
      
      // Check if this is the last chapter in the course
      if (courseContent.length > 0) {
        const isLastChapter = currentChapterIndex === courseContent.length - 1;
        
        // If this is the last chapter, check if all chapters are completed
        if (isLastChapter) {
          const allChaptersCompleted = checkAllChaptersCompleted(updatedLessons);
          
          if (allChaptersCompleted) {
            // If all chapters are completed, navigate to quiz start
            console.log('All chapters completed! Navigating to quiz start...');
            
            // Add a small delay to ensure the UI updates are complete
            setTimeout(() => {
              Alert.alert(
                "Khóa học hoàn thành!",
                "Bạn đã hoàn thành tất cả các bài học. Bạn có muốn làm bài kiểm tra cuối khóa không?",
                [
                  {
                    text: "Để sau",
                    style: "cancel"
                  },
                  { 
                    text: "Làm ngay", 
                    onPress: () => navigateToQuiz()
                  }
                ]
              );
            }, 1000);
          }
        } else {
          // If not the last chapter, automatically navigate to the next chapter
          const nextChapter = courseContent[currentChapterIndex + 1];
          if (nextChapter) {
            console.log('Chapter completed! Navigating to next chapter:', nextChapter.title);
            
            // Add a small delay to ensure the UI updates are complete
            setTimeout(() => {
              Alert.alert(
                "Chương học hoàn thành!",
                "Bạn có muốn tiếp tục với chương tiếp theo không?",
                [
                  {
                    text: "Để sau",
                    style: "cancel"
                  },
                  { 
                    text: "Tiếp tục", 
                    onPress: () => navigateToChapter(nextChapter)
                  }
                ]
              );
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error in updateProgress function:', error);
      
      // Always try to update local storage even if there's an error
      try {
        const updatedLessons = { 
          ...completedLessons, 
          [params.chapterId]: true 
        };
        setCompletedLessons(updatedLessons);
        await AsyncStorage.setItem('completedLessons', JSON.stringify(updatedLessons));
      } catch (storageError) {
        console.error('Failed to save local progress:', storageError);
      }
    }
  };

  // Add a function to check if all chapters are completed
  const checkAllChaptersCompleted = (currentCompletedLessons) => {
    if (!courseContent || courseContent.length === 0) return false;
    
    return courseContent.every(chapter => 
      currentCompletedLessons[chapter.chapterId] === true
    );
  };

  const navigateToChapter = (chapter) => {
    // Set auto-play for the next chapter
    setShouldAutoPlay(true);
    
    router.push({
      pathname: '/(tabs)/course_video',
      params: {
        chapterId: chapter.chapterId,
        courseId: courseId,
        autoPlay: 'true' // Add this to signal auto-play
      }
    });
  };

  const navigateToQuiz = () => {
    // Save quiz start time to track time spent
    const startTime = new Date().getTime();
    AsyncStorage.setItem('quizStartTime', startTime.toString())
      .catch(err => console.error('Error saving quiz start time:', err));
    
    // Navigate to quiz start screen
    router.push({
      pathname: '/(tabs)/course_quiz_start',
      params: { 
        courseId: courseId,
        source: 'video_completion'
      }
    });
  };

  // Function to retry loading the video
  const retryVideo = () => {
    setVideoError(false);
    setVideoErrorMessage('');
    setRetryCount(prev => prev + 1);
    
    // Re-mount the video component
    setLoading(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.loadAsync({
          uri: chapterData?.videoWithCacheBuster || chapterData?.video || 
          'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(err => {
          console.error('Error reloading video:', err);
          setVideoError(true);
          setVideoErrorMessage('Không thể tải lại video. Vui lòng thử lại sau.');
        });
      }
    }, 500);
  };

  // Function to render the video player or error message
  const renderVideoPlayer = () => {
    if (videoError) {
      return (
        <View style={styles.videoErrorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e53935" />
          <Text style={styles.videoErrorText}>
            {videoErrorMessage || 'Không thể phát video. Vui lòng thử lại.'}
          </Text>
          <Text style={styles.videoErrorSubtext}>
            Đang sử dụng video thay thế. Chúng tôi sẽ sớm khắc phục lỗi này.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryVideo}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // If we already processed the URL and it hasn't changed, use the cached version
    if (processedVideoUrlRef.current && 
        processedVideoUrlRef.current.originalUrl === (chapterData?.video || "")) {
      
      // Only log if the URL has changed
      if (currentVideoUrl.current !== processedVideoUrlRef.current.processedUrl) {
        console.log('Using cached video URL:', processedVideoUrlRef.current.processedUrl);
        currentVideoUrl.current = processedVideoUrlRef.current.processedUrl;
        hasLoggedVideoUrl.current = true;
      }
      
      // For iOS, make sure we use an HTTPS URL if possible
      let videoUrl = processedVideoUrlRef.current.processedUrl;
      if (Platform.OS === 'ios' && videoUrl.startsWith('http:')) {
        videoUrl = videoUrl.replace('http:', 'https:');
      }
      
      return (
        <View style={{width: '100%', height: '100%'}}>
          <Video
            ref={videoRef}
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
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onLoadStart={() => {
              if (!loading) setLoading(true);
            }}
            onLoad={(status) => {
              setLoading(false);
              // Only log once when the video is loaded
              if (!hasLoggedVideoUrl.current) {
                console.log(`[${Platform.OS}] Video loaded:`, status);
                hasLoggedVideoUrl.current = true;
              }
              
              // Reset position to beginning and then auto-play if needed
              if (videoRef.current) {
                try {
                  videoRef.current.setPositionAsync(0)
                    .then(() => {
                      // After resetting position, start playing if autoplay is enabled
                      if (shouldAutoPlay) {
                        videoRef.current.playAsync();
                      }
                    })
                    .catch(err => console.log('Error resetting video position on load:', err));
                } catch (err) {
                  console.log('Error when setting video position on load:', err);
                }
              }
            }}
            onError={(error) => {
              console.error(`[${Platform.OS}] Video error:`, error);
              setLoading(false);
              setVideoError(true);
              setVideoErrorMessage('Không thể tải lại video. Vui lòng thử lại sau.');
            }}
          />
        </View>
      );
    }

    // Reset logged state when processing a new URL
    hasLoggedVideoUrl.current = false;

    // Get the video URL with better validation
    let videoUrl = chapterData?.videoWithCacheBuster || chapterData?.video;
    const originalUrl = videoUrl;
    
    // Check if URL is valid (not just "string" or other invalid format)
    const isValidUrl = (url) => {
      if (!url) return false;
      
      // Check if it's just the string "string" or other common placeholder
      if (url === "string" || url === "url" || url === "null" || url === "undefined") {
        return false;
      }
      
      // Check for basic URL pattern
      try {
        // Allow relative URLs by adding base if needed
        if (url.startsWith('/')) {
          url = API_CONFIG.baseURL + url;
        }
        
        return /^(http|https):\/\/[^ "]+$/.test(url);
      } catch (e) {
        return false;
      }
    };
    
    // Fallback to a default video if URL is invalid
    if (!isValidUrl(videoUrl)) {
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
    
    // Try to add cache buster to avoid caching issues 
    try {
      // Add a cache buster parameter to the URL
      const separator = videoUrl.includes('?') ? '&' : '?';
      videoUrl = `${videoUrl}${separator}cb=${Date.now()}`;
    } catch (e) {
      console.error('Error adding cache buster:', e);
    }
    
    // Log the URL only once when it's first processed
    console.log(`[${Platform.OS}] Using video URL:`, videoUrl);
    currentVideoUrl.current = videoUrl;
    
    // Cache the processed URL to prevent unnecessary recalculations
    processedVideoUrlRef.current = {
      originalUrl: originalUrl,
      processedUrl: videoUrl
    };

    return (
      <View style={{width: '100%', height: '100%', backgroundColor: '#000'}}>
        <Video
          ref={videoRef}
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
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={() => {
            if (!loading) setLoading(true);
          }}
          onLoad={(status) => {
            setLoading(false);
            console.log(`[${Platform.OS}] Video loaded:`, status);
            
            // Reset position to beginning and then auto-play if needed
            if (videoRef.current) {
              try {
                videoRef.current.setPositionAsync(0)
                  .then(() => {
                    // After resetting position, start playing if autoplay is enabled
                    if (shouldAutoPlay) {
                      videoRef.current.playAsync();
                    }
                  })
                  .catch(err => console.log('Error resetting video position on load:', err));
              } catch (err) {
                console.log('Error when setting video position on load:', err);
              }
            }
          }}
          onError={(error) => {
            console.error(`[${Platform.OS}] Video error:`, error);
            setLoading(false);
            setVideoError(true);
            setVideoErrorMessage('Không thể tải lại video. Vui lòng thử lại sau.');
          }}
        />
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
        {chapterData ? renderVideoPlayer() : null}
        {loading && !videoError && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
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
