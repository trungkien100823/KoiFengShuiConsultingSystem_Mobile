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

const { width } = Dimensions.get('window');

export default function CourseVideoScreen() {
  const router = useRouter();
  const { lessonId = 'section1-lesson1' } = useLocalSearchParams();
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('course');
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [userSeeking, setUserSeeking] = useState(false);
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const navigationTimeoutRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Map of lesson titles by ID
  const lessonTitles = {
    'section1-lesson1': 'Giới thiệu về Phong thủy cổ học',
    'section1-lesson2': 'Ngũ hành: Kim, Mộc, Thủy, Hỏa, Thổ',
    'section1-lesson3': 'Âm dương và tứ tượng',
    'section2-lesson1': 'Phân tích hướng nhà',
    'section2-lesson2': 'Bát quái và phương vị',
    'section2-lesson3': 'Định hướng đồ đạc trong nhà',
    'section3-lesson1': 'Ý nghĩa của nước trong phong thủy',
    'section3-lesson2': 'Thủy mạch và quẻ Khảm',
    'section3-lesson3': 'Cá Koi trong phong thủy cổ học',
  };

  // Map section IDs to their titles
  const sectionTitles = {
    'section1': 'Phong thủy cơ bản',
    'section2': 'Cách xem hướng',
    'section3': 'Thủy mạch trong phong thủy',
  };

  // Lesson ordering for navigation
  const lessonOrder = [
    'section1-lesson1',
    'section1-lesson2',
    'section1-lesson3',
    'section2-lesson1',
    'section2-lesson2',
    'section2-lesson3',
    'section3-lesson1',
    'section3-lesson2',
    'section3-lesson3',
  ];

  // Get current section from lessonId
  const getCurrentSection = () => {
    const sectionMatch = lessonId.match(/section(\d+)/);
    return sectionMatch ? `section${sectionMatch[1]}` : 'section1';
  };
  
  const currentSection = getCurrentSection();

  // Lesson completion tracking
  const [completedLessons, setCompletedLessons] = useState({
    'section1-lesson1': false,
    'section1-lesson2': false,
    'section1-lesson3': false,
    'section2-lesson1': false,
    'section2-lesson2': false,
    'section2-lesson3': false,
    'section3-lesson1': false,
    'section3-lesson2': false,
    'section3-lesson3': false,
  });

  // Load completion data from storage
  useEffect(() => {
    const loadCompletionData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('completedLessons');
        if (savedData) {
          setCompletedLessons(JSON.parse(savedData));
        }
      } catch (error) {
        console.log('Error loading completion data', error);
      }
    };

    loadCompletionData();
  }, []);

  // Load completed quizzes data
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('completedQuizzes');
        if (savedData) {
          setCompletedQuizzes(JSON.parse(savedData));
        }
      } catch (error) {
        console.log('Error loading quiz completion data:', error);
      }
    };
    
    loadQuizData();
  }, []);

  // Better loading state management
  useEffect(() => {
    // Reset loading state when lessonId changes
    setLoading(true);
    
    // Set a timeout to avoid infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000); // Force loading to end after 5 seconds
    
    return () => clearTimeout(loadingTimeout);
  }, [lessonId]);

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
        console.log('Error setting audio mode', error);
      }
    };
    
    setupAudio();
    
    // Clean up function
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  // Reset and play video when lessonId changes
  useEffect(() => {
    let isMounted = true;
    
    const resetAndPlayVideo = async () => {
      if (!videoRef.current || !isMounted) return;
      
      try {
        // Reset to beginning and play
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
        
        // Safety measure to ensure loading ends
        if (isMounted) setLoading(false);
      } catch (error) {
        console.log('Error resetting/playing video:', error);
        if (isMounted) setLoading(false);
      }
    };
    
    resetAndPlayVideo();
    setVideoCompleted(false);
    
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Handle back button
  const handleBack = () => {
    router.push('/(tabs)/course_chapter');
  };

  // Find next lesson
  const getNextLesson = (currentLessonId) => {
    const currentIndex = lessonOrder.indexOf(currentLessonId);
    if (currentIndex < lessonOrder.length - 1) {
      return lessonOrder[currentIndex + 1];
    }
    return null; // No more lessons
  };

  // Navigate to a specific lesson
  const navigateToLesson = (newLessonId) => {
    // Reset video state for new lesson
    setVideoCompleted(false);
    
    // Navigate to the new lesson
    router.replace({
      pathname: '/(tabs)/course_video',
      params: { lessonId: newLessonId }
    });
  };

  // Navigate to a quiz
  const navigateToQuiz = (quizId) => {
    router.push({
      pathname: '/(tabs)/course_quiz_start',
      params: { quizId, source: 'video' }
    });
  };

  // Format time (seconds to mm:ss)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Toggle lesson completion
  const toggleCompletion = async (id) => {
    const newCompletedLessons = {
      ...completedLessons,
      [id]: !completedLessons[id],
    };
    
    setCompletedLessons(newCompletedLessons);
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('completedLessons', JSON.stringify(newCompletedLessons));
    } catch (error) {
      console.log('Error saving completion data', error);
    }
  };

  // Handle video status update
  const handlePlaybackStatusUpdate = async (playbackStatus) => {
    setStatus(playbackStatus);
    
    // End loading when video is loaded
    if (playbackStatus.isLoaded && loading) {
      setLoading(false);
    }
    
    // End loading if there's an error
    if (playbackStatus.error && loading) {
      console.log('Video playback error:', playbackStatus.error);
      setLoading(false);
    }
    
    // Detect user seeking/scrubbing
    if (playbackStatus.isLoaded && playbackStatus.didJustSeek) {
      setUserSeeking(true);
      // Reset the seeking flag after a short delay
      setTimeout(() => {
        setUserSeeking(false);
      }, 1000);
    }
    
    // Check if video is 90% complete
    if (
      playbackStatus.isLoaded && 
      playbackStatus.durationMillis && 
      playbackStatus.positionMillis &&
      !videoCompleted &&
      playbackStatus.positionMillis > (playbackStatus.durationMillis * 0.9) &&
      !userSeeking && // Only proceed if user is not seeking
      playbackStatus.isPlaying && // Only proceed if video is actually playing
      !isNavigatingRef.current // Prevent multiple navigations
    ) {
      // Mark video as completed
      setVideoCompleted(true);
      isNavigatingRef.current = true;
      
      const newCompletedLessons = {
        ...completedLessons,
        [lessonId]: true
      };
      
      setCompletedLessons(newCompletedLessons);
      
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem('completedLessons', JSON.stringify(newCompletedLessons));
        console.log(`Lesson ${lessonId} marked as completed`);
        
        // Add a small delay before navigation to prevent conflicts with player controls
        navigationTimeoutRef.current = setTimeout(() => {
          // Check if there's a next lesson
          const nextLessonId = getNextLesson(lessonId);
          if (nextLessonId) {
            // Directly navigate to next lesson without notification
            navigateToLesson(nextLessonId);
          } else {
            // All lessons completed, go back to course chapter
            router.push('/(tabs)/course_chapter');
          }
          isNavigatingRef.current = false;
        }, 300); // Small delay to finish current UI interactions
      } catch (error) {
        console.log('Error saving completion data', error);
        isNavigatingRef.current = false;
      }
    }
  };

  // Set custom controls to better handle seeking
  const customVideoControls = {
    onSeekStarted: () => {
      setUserSeeking(true);
    },
    onSeekCompleted: () => {
      setTimeout(() => {
        setUserSeeking(false);
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.sectionTitle}>
            {`Chapter ${currentSection.replace('section', '')}: ${sectionTitles[currentSection]}`}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={require('../../assets/images/test.mp4')}
          useNativeControls={true}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          volume={1.0}
          isMuted={false}
          shouldPlay={true}
          posterSource={require('../../assets/images/test.mp4')}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={(error) => {
            console.log('Video loading error:', error);
            setLoading(false);
          }}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        )}
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'course' ? styles.activeTab : {}]}
          onPress={() => setActiveTab('course')}
        >
          <Text style={[styles.tabText, activeTab === 'course' ? styles.activeTabText : {}]}>Course content</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discussion' ? styles.activeTab : {}]}
          onPress={() => setActiveTab('discussion')}
        >
          <Text style={[styles.tabText, activeTab === 'discussion' ? styles.activeTabText : {}]}>Discussion</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.contentSection}>
        {activeTab === 'course' ? (
          <View style={styles.contentList}>
            {/* Section 1 */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, styles.borderTop]}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionHeaderText}>Chapter 1: {sectionTitles.section1}</Text>
                  <Text style={styles.sectionMeta}>3 Videos • 25 min</Text>
                </View>
                <View style={styles.completionIndicator}>
                  <Ionicons 
                    name={completedLessons['section1-lesson1'] && 
                          completedLessons['section1-lesson2'] && 
                          completedLessons['section1-lesson3'] ? 
                          "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={completedLessons['section1-lesson1'] && 
                          completedLessons['section1-lesson2'] && 
                          completedLessons['section1-lesson3'] ? 
                          "#4CAF50" : "#aaa"} 
                  />
                </View>
              </View>
              
              {/* Lesson 1 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section1-lesson1')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section1-lesson1' ? {fontWeight: 'bold'} : {}
                  ]}>
                    1. {lessonTitles['section1-lesson1']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 8 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section1-lesson1'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section1-lesson1'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section1-lesson1');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Lesson 2 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section1-lesson2')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section1-lesson2' ? {fontWeight: 'bold'} : {}
                  ]}>
                    2. {lessonTitles['section1-lesson2']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 9 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section1-lesson2'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section1-lesson2'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section1-lesson2');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Lesson 3 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section1-lesson3')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section1-lesson3' ? {fontWeight: 'bold'} : {}
                  ]}>
                    3. {lessonTitles['section1-lesson3']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 8 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section1-lesson3'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section1-lesson3'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section1-lesson3');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Chapter 1 Quiz */}
              <TouchableOpacity 
                style={[styles.lesson, styles.quizLesson]}
                onPress={() => navigateToQuiz('section1-quiz')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>
                    <Ionicons name="document-text-outline" size={16} color="#8B0000" /> Kiểm tra Chapter 1
                  </Text>
                  <Text style={styles.lessonMeta}>Quiz • 10 questions</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedQuizzes['section1-quiz'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedQuizzes['section1-quiz'] ? "#4CAF50" : "#aaa"}
                  />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Section 2 */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, styles.borderTop]}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionHeaderText}>Chapter 2: {sectionTitles.section2}</Text>
                  <Text style={styles.sectionMeta}>3 Videos • 22 min</Text>
                </View>
                <View style={styles.completionIndicator}>
                  <Ionicons 
                    name={completedLessons['section2-lesson1'] && 
                          completedLessons['section2-lesson2'] && 
                          completedLessons['section2-lesson3'] ? 
                          "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={completedLessons['section2-lesson1'] && 
                          completedLessons['section2-lesson2'] && 
                          completedLessons['section2-lesson3'] ? 
                          "#4CAF50" : "#aaa"} 
                  />
                </View>
              </View>
              
              {/* Lesson 1 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section2-lesson1')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section2-lesson1' ? {fontWeight: 'bold'} : {}
                  ]}>
                    1. {lessonTitles['section2-lesson1']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 8 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section2-lesson1'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section2-lesson1'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section2-lesson1');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Lesson 2 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section2-lesson2')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section2-lesson2' ? {fontWeight: 'bold'} : {}
                  ]}>
                    2. {lessonTitles['section2-lesson2']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 7 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section2-lesson2'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section2-lesson2'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section2-lesson2');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Lesson 3 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section2-lesson3')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section2-lesson3' ? {fontWeight: 'bold'} : {}
                  ]}>
                    3. {lessonTitles['section2-lesson3']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 7 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section2-lesson3'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section2-lesson3'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section2-lesson3');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Chapter 2 Quiz */}
              <TouchableOpacity 
                style={[styles.lesson, styles.quizLesson]}
                onPress={() => navigateToQuiz('section2-quiz')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>
                    <Ionicons name="document-text-outline" size={16} color="#8B0000" /> Kiểm tra Chapter 2
                  </Text>
                  <Text style={styles.lessonMeta}>Quiz • 15 questions</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedQuizzes['section2-quiz'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedQuizzes['section2-quiz'] ? "#4CAF50" : "#aaa"}
                  />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Section 3 */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, styles.borderTop]}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionHeaderText}>Chapter 3: {sectionTitles.section3}</Text>
                  <Text style={styles.sectionMeta}>3 Videos • 29 min</Text>
                </View>
                <View style={styles.completionIndicator}>
                  <Ionicons 
                    name={completedLessons['section3-lesson1'] && 
                          completedLessons['section3-lesson2'] && 
                          completedLessons['section3-lesson3'] ? 
                          "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={completedLessons['section3-lesson1'] && 
                          completedLessons['section3-lesson2'] && 
                          completedLessons['section3-lesson3'] ? 
                          "#4CAF50" : "#aaa"} 
                  />
                </View>
              </View>
              
              {/* Lesson 1 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section3-lesson1')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section3-lesson1' ? {fontWeight: 'bold'} : {}
                  ]}>
                    1. {lessonTitles['section3-lesson1']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 10 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section3-lesson1'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section3-lesson1'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section3-lesson1');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Lesson 2 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section3-lesson2')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section3-lesson2' ? {fontWeight: 'bold'} : {}
                  ]}>
                    2. {lessonTitles['section3-lesson2']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 9 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section3-lesson2'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section3-lesson2'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section3-lesson2');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Lesson 3 */}
              <TouchableOpacity 
                style={styles.lesson}
                onPress={() => navigateToLesson('section3-lesson3')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lessonId === 'section3-lesson3' ? {fontWeight: 'bold'} : {}
                  ]}>
                    3. {lessonTitles['section3-lesson3']}
                  </Text>
                  <Text style={styles.lessonMeta}>Video • 10 min</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedLessons['section3-lesson3'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedLessons['section3-lesson3'] ? "#4CAF50" : "#aaa"}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompletion('section3-lesson3');
                    }}
                  />
                </View>
              </TouchableOpacity>
              
              {/* Chapter 3 Quiz */}
              <TouchableOpacity 
                style={[styles.lesson, styles.quizLesson]}
                onPress={() => navigateToQuiz('section3-quiz')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>
                    <Ionicons name="document-text-outline" size={16} color="#8B0000" /> Kiểm tra Chapter 3
                  </Text>
                  <Text style={styles.lessonMeta}>Quiz • 12 questions</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedQuizzes['section3-quiz'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedQuizzes['section3-quiz'] ? "#4CAF50" : "#aaa"}
                  />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Final Exam */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, styles.finalExamHeader]}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionHeaderText}>Final Examination</Text>
                  <Text style={styles.sectionMeta}>Comprehensive • 30 questions</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.lesson, styles.finalExamLesson]}
                onPress={() => navigateToQuiz('final-exam')}
              >
                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonTitle, styles.finalExamTitle]}>
                    <Ionicons name="trophy-outline" size={16} color="#8B0000" /> Bài kiểm tra cuối khóa
                  </Text>
                  <Text style={styles.lessonMeta}>30 minutes • Passing score: 80%</Text>
                </View>
                <View style={styles.checkboxContainer}>
                  <Ionicons 
                    name={completedQuizzes['final-exam'] ? "checkbox-outline" : "square-outline"}
                    size={24} 
                    color={completedQuizzes['final-exam'] ? "#4CAF50" : "#aaa"}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.discussionContainer}>
            <Text style={styles.emptyStateText}>No discussion posts yet. Be the first to post!</Text>
          </View>
        )}
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
  sectionTitle: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '500',
  },
  videoContainer: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#000',
    position: 'relative',
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
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8b0000',
  },
  tabText: {
    color: '#777',
    fontSize: 16,
  },
  activeTabText: {
    color: '#8b0000',
    fontWeight: '500',
  },
  contentSection: {
    flex: 1,
  },
  contentList: {
    flex: 1,
  },
  section: {
    paddingVertical: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    position: 'relative',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10
  },
  sectionMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  completionIndicator: {
    marginLeft: 10,
    marginRight: 5,
    marginTop: 5,
  },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  lessonMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  checkboxContainer: {
    padding: 5,
  },
  discussionContainer: {
    flex: 1,
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
  quizLesson: {
    backgroundColor: '#f9f2f2',
  },
  finalExamHeader: {
    backgroundColor: '#f8f0f0',
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
    marginTop: 20,
  },
  finalExamLesson: {
    backgroundColor: '#f8f0f0',
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  finalExamTitle: {
    fontWeight: '600',
  }
});
