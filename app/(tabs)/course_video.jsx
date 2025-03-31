import React, { useState, useRef, useEffect } from 'react';
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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, Audio, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';

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

  // Set up audio
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
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

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
    setStatus(playbackStatus);
    if (playbackStatus.isLoaded && loading) {
      setLoading(false);
    }
    
    if (playbackStatus.isLoaded && 
        playbackStatus.positionMillis > 0 && 
        playbackStatus.positionMillis === playbackStatus.durationMillis &&
        !isCompleted) {
      setIsCompleted(true);
    }
  };

  const updateProgress = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
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

      console.log('API Response:', response.data);

      if (response.data?.isSuccess) {
        console.log('Cập nhật tiến độ thành công:', response.data.message);
        
        // Update completedLessons
        const updatedLessons = { 
          ...completedLessons, 
          [params.chapterId]: true 
        };
        setCompletedLessons(updatedLessons);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('completedLessons', JSON.stringify(updatedLessons));
      } else {
        console.error('Lỗi cập nhật tiến độ:', response.data?.message);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API cập nhật tiến độ:', error.response?.data || error);
    }
  };

  const navigateToChapter = (chapter) => {
    router.push({
      pathname: '/(tabs)/course_video',
      params: {
        chapterId: chapter.chapterId,
        courseId: courseId
      }
    });
  };

  const navigateToQuiz = () => {
    // Navigate to quiz start screen first
    router.push({
      pathname: '/(tabs)/course_quiz_start',
      params: { 
        courseId: courseId
      }
    });
  };

  // Function to retry loading the video
  const retryVideo = () => {
    if (retryCount < 3) {
      setVideoError(false);
      setVideoErrorMessage('');
      setLoading(true);
      setRetryCount(retryCount + 1);
      
      // Unload and reload the video
      if (videoRef.current) {
        videoRef.current.unloadAsync().then(() => {
          // Force reload by creating a new video URL with cache buster
          if (chapterData && chapterData.video) {
            const cacheBuster = Date.now();
            const videoUrl = chapterData.video.includes('?') 
              ? `${chapterData.video}&cb=${cacheBuster}`
              : `${chapterData.video}?cb=${cacheBuster}`;
              
            // Update chapter data with new URL
            setChapterData({
              ...chapterData,
              videoWithCacheBuster: videoUrl
            });
          }
        });
      }
    } else {
      Alert.alert(
        'Không thể phát video',
        'Đã thử lại nhiều lần nhưng không thành công. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
        [{ text: 'OK' }]
      );
    }
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
          <TouchableOpacity style={styles.retryButton} onPress={retryVideo}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Video
        ref={videoRef}
        style={styles.video}
        source={{
          uri: chapterData?.videoWithCacheBuster || chapterData?.video || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Fallback to a known working video
        }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoadStart={() => {
          setLoading(true);
          console.log('Bắt đầu tải video từ:', chapterData?.videoWithCacheBuster || chapterData?.video);
        }}
        onLoad={(status) => {
          setLoading(false);
          console.log('Video đã tải xong, thông tin:', status);
        }}
        onError={(error) => {
          console.error('Lỗi phát video:', error);
          setLoading(false);
          setVideoError(true);
          setVideoErrorMessage(`Không thể phát video. Lỗi: ${error}`);
        }}
      />
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
    aspectRatio: 16/9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
