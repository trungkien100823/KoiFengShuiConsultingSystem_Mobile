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

  // Fetch chapter data
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
          // Kiểm tra URL video có hợp lệ không
          const videoUrl = response.data.data.video;
          console.log('Video URL từ API:', videoUrl);
          
          if (!videoUrl) {
            throw new Error('Không tìm thấy URL video');
          }

          setChapterData(response.data.data);
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
      } else {
        console.error('Lỗi cập nhật tiến độ:', response.data?.message);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API cập nhật tiến độ:', error.response?.data || error);
    }
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
        {chapterData?.video ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={{
              uri: chapterData.video,
            }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onLoadStart={() => {
              setLoading(true);
              console.log('Bắt đầu tải video từ:', chapterData.video);
            }}
            onLoad={(status) => {
              setLoading(false);
              console.log('Video đã tải xong, thông tin:', status);
            }}
            onError={(error) => {
              console.error('Lỗi phát video:', error);
              setLoading(false);
              Alert.alert(
                'Lỗi',
                'Không thể phát video. Vui lòng thử lại sau.'
              );
            }}
          />
        ) : null}
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        )}
      </View>
      
      {/* Content */}
      <ScrollView style={styles.contentSection}>
        <View style={styles.chapterInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.chapterTitle}>{chapterData?.title}</Text>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </View>
          <Text style={styles.chapterDescription}>{chapterData?.description}</Text>
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.durationText}>{chapterData?.duration}</Text>
          </View>
        </View>
      </ScrollView>
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
  contentSection: {
    flex: 1,
    padding: 15,
  },
  chapterInfo: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  chapterDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  }
});
