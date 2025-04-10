import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Thêm enum ChapterStatus ở đầu file, sau phần import
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

// Component ProgressBar để hiển thị tiến độ khóa học
const ProgressBar = ({ progress, width = '100%', height = 8 }) => {
  return (
    <View style={[styles.progressBarContainer, { width, height }]}>
      <View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${progress}%`,
            backgroundColor: progress === 100 ? '#4CAF50' : '#007bff'
          }
        ]} 
      />
    </View>
  );
};

export default function CourseChapterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params?.courseId;
  console.log('CourseChapterScreen - Received params:', params);
  
  const [courseInfo, setCourseInfo] = useState({
    courseName: '',
    rating: '',
    author: '',
    description: '',
    totalChapters: 0,
    totalQuestions: 0,
    totalDuration: '00:00:00',
    enrollCourseId: null
  });
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [effectiveCourseId, setEffectiveCourseId] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isFreeCourse, setIsFreeCourse] = useState(false);
  const navigation = useNavigation();

  // Thêm ref để kiểm soát số lần load
  const hasLoadedData = useRef(false);
  const lastLoadTime = useRef(0);

  // Thêm ref để kiểm soát việc gọi API
  const hasCheckedRegistration = useRef(false);
  const hasCheckedCompletion = useRef(false);

  // Thêm state để kiểm soát việc refresh
  const [refreshing, setRefreshing] = useState(false);

  // Thêm state để kiểm soát request
  const [isLoadingRef] = useState({ current: false });
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const REQUEST_DEBOUNCE_TIME = 1000; // 1 giây

  // Load completion data from AsyncStorage
  const loadCompletionData = async () => {
    const currentTime = Date.now();
    if (currentTime - lastLoadTime.current < 3000) {
      console.log('Đã tải dữ liệu tiến độ gần đây, bỏ qua');
      return;
    }
    lastLoadTime.current = currentTime;
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('Không tìm thấy token, không thể tải dữ liệu tiến độ');
        return;
      }

      // Lấy enrollCourseId từ API hoặc state
      const enrollCourseId = courseInfo.enrollCourseId;
      if (!enrollCourseId) {
        console.log('Không tìm thấy enrollCourseId, không thể tải dữ liệu tiến độ');
        return;
      }

      // Load completed lessons từ AsyncStorage
      const completedLessons = await AsyncStorage.getItem('completedLessons');
      if (completedLessons) {
        const lessonsData = JSON.parse(completedLessons);
        
        // Lọc các chapter đã hoàn thành dựa trên enrollCourseId
        const completedChapters = chapters.filter(chapter => {
          const lessonKey = `${enrollCourseId}_${chapter.chapterId}`;
          return lessonsData[lessonKey]?.completed === true;
        });

        // Cập nhật tiến độ dựa trên số chapter đã hoàn thành
        const progress = Math.round((completedChapters.length / chapters.length) * 100);
        setCurrentProgress(progress);

        // Lưu tiến độ vào AsyncStorage
        const savedProgress = await AsyncStorage.getItem('courseProgress');
        let progressObj = savedProgress ? JSON.parse(savedProgress) : {};
        progressObj[courseId] = progress;
        await AsyncStorage.setItem('courseProgress', JSON.stringify(progressObj));
      }

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tiến độ:', error);
    }
  };
  
  // Hàm tải dữ liệu hoàn thành từ bộ nhớ cục bộ
  const loadLocalCompletionData = async () => {
    try {
      console.log('Đang tải dữ liệu hoàn thành từ bộ nhớ cục bộ');
      
      // Load completed chapters
      const savedChapters = await AsyncStorage.getItem('completedLessons');
      if (savedChapters) {
        const parsedChapters = JSON.parse(savedChapters);
        setCompletedLessons(parsedChapters);
      }
      
      // Load completed quizzes
      const savedQuizzes = await AsyncStorage.getItem('completedQuizzes');
      if (savedQuizzes) {
        setCompletedQuizzes(JSON.parse(savedQuizzes));
      }
      
      // Load course progress - ưu tiên giá trị từ API nếu có
      const savedProgress = await AsyncStorage.getItem('courseProgress');
      if (savedProgress && courseId) {
        const progress = JSON.parse(savedProgress);
        if (progress[courseId] !== undefined) {
          setCurrentProgress(progress[courseId]);
          
          // Nếu tiến độ là 100%, đánh dấu khóa học đã hoàn thành
          if (progress[courseId] === 100) {
            setCourseCompleted(true);
          }
        }
      }
      
      // Kiểm tra nếu tất cả chapter đã hoàn thành (từ completedLessons hoặc status = "Done")
      // thì cập nhật tiến độ 100% luôn
      if (chapters && chapters.length > 0) {
        const allCompleted = chapters.every(chapter => 
          completedLessons[chapter.chapterId] === true || chapter.status === "Done"
        );
        
        if (allCompleted) {
          console.log('Tất cả chapter đã hoàn thành, tự động cập nhật tiến độ 100%');
          setCurrentProgress(100);
          setCourseCompleted(true);
          
          // Lưu tiến độ 100% vào AsyncStorage
          const savedProgress = await AsyncStorage.getItem('courseProgress');
          let progressObj = savedProgress ? JSON.parse(savedProgress) : {};
          progressObj[courseId] = 100;
          await AsyncStorage.setItem('courseProgress', JSON.stringify(progressObj));
        }
      }
      
      // Load course completion data
      const completedCoursesData = await AsyncStorage.getItem('completedCourses');
      if (completedCoursesData && courseId) {
        const completedCourses = JSON.parse(completedCoursesData);
        if (completedCourses[courseId]) {
          setCourseCompleted(true);
        }
      }
      
      // Load course data to check if it's free
      const courseData = await AsyncStorage.getItem('courseDetails');
      if (courseData) {
        const courses = JSON.parse(courseData);
        if (courseId && courses[courseId]) {
          setIsFreeCourse(courses[courseId].isFree === true);
        }
      }

      // Tính toán lại tiến độ học tập để hiển thị
      calculateProgress();
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu cục bộ:', error);
    }
  };

  // Sửa lại useFocusEffect
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadData = async () => {
        if (!isActive) return;
        
        if (!courseId) {
          console.log('CourseChapterScreen - No courseId available');
          setIsLoading(false);
          return;
        }
        
        setRefreshing(true);
        try {
          const token = await AsyncStorage.getItem('accessToken');
          if (!token) {
            console.log('Không có token');
            setRefreshing(false);
            return;
          }

          console.log('CourseChapterScreen - Fetching course details for courseId:', courseId);
          
          // Gọi API lấy thông tin khóa học
          const courseResponse = await axios.get(
            `${API_CONFIG.baseURL}/api/Course/get-details-for-mobile/${courseId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Kết quả API get-details-for-mobile:', JSON.stringify(courseResponse.data, null, 2));

          if (courseResponse.data?.isSuccess && courseResponse.data.data) {
            const courseData = courseResponse.data.data;
            console.log('EnrollCourseId từ API:', courseData.enrollCourseId);

            // Lưu thông tin khóa học vào state với kiểm tra null/undefined
            setCourseInfo({
              courseName: courseData.courseName || 'Chưa có tên khóa học',
              rating: courseData.rating ? courseData.rating.toString() : null,
              author: courseData.author || 'Chưa có tác giả',
              description: courseData.description || 'Chưa có mô tả',
              totalChapters: courseData.totalChapters || 0,
              totalQuestions: courseData.totalQuestions || 0,
              totalDuration: courseData.totalDuration || '00:00:00',
              enrollCourseId: courseData.enrollCourseId,
              imageUrl: courseData.imageUrl || null,
              price: courseData.price || 0,
              enrolledStudents: courseData.enrolledStudents || 0,
              categoryName: courseData.categoryName || 'Chưa phân loại'
            });

            // Kiểm tra đăng ký khóa học
            const hasEnrollCourseId = !!courseData.enrollCourseId;
            setIsRegistered(hasEnrollCourseId);
            console.log('Trạng thái đăng ký:', hasEnrollCourseId ? 'Đã đăng ký' : 'Chưa đăng ký');

            if (hasEnrollCourseId) {
              console.log('Người dùng đã đăng ký khóa học, lấy danh sách enrollchapters');
              await fetchChapters(courseId, token, courseData.enrollCourseId);
            } else {
              console.log('Người dùng chưa đăng ký khóa học này');
              setChapters([]);
              setCurrentProgress(0);
            }
          } else {
            console.log('Không lấy được thông tin khóa học:', courseResponse.data?.message);
            Alert.alert(
              "Lỗi",
              "Không thể tải thông tin khóa học. Vui lòng thử lại sau.",
              [{ text: "Đóng" }]
            );
          }
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu:', error);
          if (error.response) {
            console.log('Chi tiết lỗi:', {
              status: error.response.status,
              data: error.response.data
            });
          }
          Alert.alert(
            "Lỗi",
            "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.",
            [{ text: "Đóng" }]
          );
        } finally {
          if (isActive) {
            setRefreshing(false);
          }
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [courseId])
  );

  // Sửa lại fetchChapters để chỉ lấy thông tin cần thiết
  const fetchChapters = async (courseId, token, enrollCourseId) => {
    try {
      if (!enrollCourseId) {
        console.log('fetchChapters - Không có enrollCourseId, không thể lấy danh sách chapter');
        return false;
      }

      console.log('Đang gọi API get-enroll-chapters-by với enrollCourseId:', enrollCourseId);
      const enrollChaptersResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/RegisterCourse/get-enroll-chapters-by/${enrollCourseId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (enrollChaptersResponse.data?.isSuccess && enrollChaptersResponse.data.data) {
        const enrollChapters = enrollChaptersResponse.data.data;
        console.log('Kết quả API enrollChapters:', enrollChaptersResponse.data);

        if (Array.isArray(enrollChapters)) {
          const formattedChapters = enrollChapters.map(enrollChapter => ({
            chapterId: enrollChapter.chapterId,
            title: enrollChapter.chapterName,
            status: enrollChapter.status || "InProgress",
            enrollChapterId: enrollChapter.enrollChapterId,
            customerId: enrollChapter.customerId,
            enrollCourseId: enrollChapter.enrollCourseId,
            orderNumber: enrollChapter.orderNumber
          }));

          // Sắp xếp chapter theo orderNumber
          formattedChapters.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

          console.log('Danh sách chapter đã format:', formattedChapters);
          setChapters(formattedChapters);

          // Tính toán tiến độ dựa trên số chapter đã hoàn thành
          const completedChapters = formattedChapters.filter(chapter => chapter.status === "Done");
          const progress = formattedChapters.length > 0 
            ? Math.round((completedChapters.length / formattedChapters.length) * 100)
            : 0;
          setCurrentProgress(progress);
          
          return true;
        } else {
          console.log('Dữ liệu chapter không phải là mảng:', enrollChapters);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách enrollchapter:', error);
      return false;
    }
  };
  
  // Sửa lại useEffect kiểm tra đăng ký
  useEffect(() => {
    const checkRegistration = async () => {
      if (!courseId || !chapters || chapters.length === 0 || hasCheckedRegistration.current) return;
      
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('Không tìm thấy token, không thể kiểm tra đăng ký');
          return;
        }
        
        // Đánh dấu đã kiểm tra đăng ký
        hasCheckedRegistration.current = true;
        
        // Lấy chapterId đầu tiên của khóa học để kiểm tra
        const firstChapterId = chapters[0]?.chapterId;
        if (!firstChapterId) {
          console.log('Không tìm thấy chapter đầu tiên, không thể kiểm tra đăng ký');
          return;
        }
        
        console.log('Kiểm tra đăng ký khóa học bằng chapterId đầu tiên:', firstChapterId);
        
        try {
          // Gọi API lấy thông tin chapter để kiểm tra đăng ký
          const chapterResponse = await axios.get(
            `${API_CONFIG.baseURL}/api/Chapter/get-chapter/${firstChapterId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (chapterResponse.data?.isSuccess) {
            setIsRegistered(true);
          } else {
            setIsRegistered(false);
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra đăng ký khóa học:', error);
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra đăng ký khóa học:', error);
      }
    };

    if (courseId && chapters && chapters.length > 0 && !hasCheckedRegistration.current) {
      checkRegistration();
    }
  }, [courseId, chapters]);

  // Thêm useEffect để kiểm tra và cập nhật trạng thái hoàn thành khi chapters thay đổi
  useEffect(() => {
    // Kiểm tra nếu tất cả chapter có status = "Done"
    if (chapters && chapters.length > 0) {
      const allDone = chapters.every(chapter => chapter.status === "Done");
      
      if (allDone) {
        console.log('Tất cả chapter có status = "Done", tự động cập nhật tiến độ 100%');
        
        // Cập nhật state
        setCurrentProgress(100);
        setCourseCompleted(true);
        
        // Lưu trạng thái vào AsyncStorage
        (async () => {
          try {
            // Lưu tiến độ 100%
            const savedProgress = await AsyncStorage.getItem('courseProgress');
            let progressObj = savedProgress ? JSON.parse(savedProgress) : {};
            progressObj[courseId] = 100;
            await AsyncStorage.setItem('courseProgress', JSON.stringify(progressObj));
            
            // Lưu trạng thái hoàn thành khóa học
            const completedCourses = await AsyncStorage.getItem('completedCourses');
            let coursesObj = completedCourses ? JSON.parse(completedCourses) : {};
            coursesObj[courseId] = {
              completedAt: new Date().toISOString(),
              percentage: 100
            };
            await AsyncStorage.setItem('completedCourses', JSON.stringify(coursesObj));
            
            console.log('Đã lưu trạng thái hoàn thành khóa học vào AsyncStorage');
          } catch (error) {
            console.error('Lỗi khi lưu trạng thái hoàn thành:', error);
          }
        })();
      }
    }
  }, [chapters, courseId]);

  // Sửa lại handleChapterClick để lấy chapterId từ chapter được chọn và gọi API get-chapter trước khi chuyển màn hình
  const handleChapterClick = async (chapter) => {
    if (!chapter || !chapter.chapterId) {
      console.log('Chapter không hợp lệ');
      return;
    }

    console.log('Người dùng nhấn vào chapter:', chapter);

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert(
          "Yêu cầu đăng nhập",
          "Vui lòng đăng nhập để tiếp tục.",
          [
            { text: "Đóng" },
            { 
              text: "Đăng nhập", 
              onPress: () => router.push('/login')
            }
          ]
        );
        return;
      }

      // Gọi API get-chapter để lấy thông tin video
      try {
        console.log('Đang gọi API get-chapter với chapterId:', chapter.chapterId);
        const chapterResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Chapter/get-chapter/${chapter.chapterId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Kết quả API get-chapter:', chapterResponse.data);

        if (chapterResponse.data?.isSuccess && chapterResponse.data.data) {
          const chapterData = chapterResponse.data.data;
          
          // Chuyển đến trang video với đầy đủ thông tin cần thiết
          router.push({
            pathname: '/course_video',
            params: {
              courseId: courseId,
              chapterId: chapter.chapterId,
              enrollCourseId: chapter.enrollCourseId,
              enrollChapterId: chapter.enrollChapterId,
              videoUrl: chapterData.videoUrl,
              chapterName: chapter.chapterName,
              status: chapter.status
            }
          });
        } else {
          Alert.alert("Lỗi", "Không thể tải thông tin bài học");
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin chapter:', error);
        Alert.alert("Lỗi", "Không thể tải thông tin bài học");
      }
    } catch (error) {
      console.error('Lỗi khi xử lý chapter click:', error);
      Alert.alert(
        "Lỗi",
        "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        [{ text: "Đóng" }]
      );
    }
  };

  const navigateToLesson = (lessonId, chapterId) => {
    // Tìm enrollCourseId từ các nguồn khác nhau
    let enrollCourseId = '';
    
    // Thử lấy từ courseInfo
    if (courseInfo && courseInfo.enrollCourseId) {
      enrollCourseId = courseInfo.enrollCourseId;
    } 
    // Thử lấy từ chapter
    else if (chapters && chapters.length > 0) {
      const chapter = chapters.find(c => c.chapterId === chapterId);
      if (chapter && chapter.enrollCourseId) {
        enrollCourseId = chapter.enrollCourseId;
      }
    }
    // Thử lấy từ localStorage
    else {
      (async () => {
        try {
          const savedRegStatus = await AsyncStorage.getItem('registeredCourses');
          const registeredCourses = savedRegStatus ? JSON.parse(savedRegStatus) : {};
          if (registeredCourses[courseId]?.enrollCourseId) {
            enrollCourseId = registeredCourses[courseId].enrollCourseId;
          }
        } catch (error) {
          console.error('Lỗi khi lấy enrollCourseId từ localStorage:', error);
        }
      })();
    }
    
    console.log('Chuyển hướng đến lesson với enrollCourseId:', enrollCourseId);
    
    router.push({
      pathname: '/(tabs)/course_video',
      params: { 
        lessonId,
        chapterId: chapterId,
        courseId: courseId,
        enrollCourseId: enrollCourseId
      }
    });
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!chapters || chapters.length === 0) return 0;
    
    const totalChapters = chapters.length;
    const completedCount = chapters.filter(chapter => 
      chapter.status === EnrollChapterStatus.Done
    ).length;
    
    return Math.round((completedCount / totalChapters) * 100);
  };

  // Navigate to quiz
  const navigateToQuiz = () => {
    if (!courseId) {
      console.error('No courseId available');
      return;
    }
    
    console.log('Navigating to quiz for course:', courseId);
    
    router.push({
      pathname: '/(tabs)/course_quiz_start',
      params: {
        courseId: courseId
      }
    });
  };
  
  // Check if all chapters are completed
  const checkAllChaptersCompleted = () => {
    if (!chapters || chapters.length === 0) return false;
    
    // Chỉ trả về true khi TẤT CẢ chapter có status là Done
    const allDone = chapters.every(chapter => chapter.status === EnrollChapterStatus.Done);
    
    console.log('Kiểm tra hoàn thành khóa học:', {
      allDone,
      currentProgress,
      chapters: chapters.map(c => ({id: c.chapterId, status: c.status}))
    });
    
    return allDone;
  };

  // Then update the renderFinalExamButton function to use this check
  const renderFinalExamButton = () => {
    const allChaptersCompleted = checkAllChaptersCompleted();
    
    return (
      <TouchableOpacity 
        style={[
          styles.finalExamContainer,
          !allChaptersCompleted && styles.disabledExamContainer
        ]}
        onPress={() => {
          console.log('Button Bài kiểm tra cuối khóa được nhấn');
          console.log('Trạng thái đăng ký:', isRegistered);
          console.log('Đã hoàn thành tất cả chương:', allChaptersCompleted);
          console.log('Phần trăm từ API:', currentProgress);
          
          if (!isRegistered) {
            Alert.alert(
              "Đăng ký khóa học",
              "Bạn cần đăng ký khóa học để làm bài kiểm tra cuối khóa.",
              [{ text: "OK" }]
            );
            return;
          }

          if (!allChaptersCompleted) {
            Alert.alert(
              "Hoàn thành khóa học",
              "Bạn cần hoàn thành tất cả các chương học (có tích xanh) trước khi làm bài kiểm tra cuối khóa.",
              [{ text: "OK" }]
            );
            return;
          }
          
          // Chỉ cho phép làm quiz khi đã hoàn thành tất cả chapter
          router.push({
            pathname: '/(tabs)/course_quiz_start',
            params: { 
              courseId: courseId
            }
          });
        }}
      >
        <View style={styles.finalExamContent}>
          <View style={styles.finalExamIconContainer}>
            <Ionicons name="document-text" size={24} color="#fff" />
          </View>
          <View style={styles.finalExamTextContainer}>
            <Text style={styles.finalExamTitle}>Bài kiểm tra cuối khóa</Text>
            <Text style={styles.finalExamDescription}>
              {allChaptersCompleted 
                ? "Kiểm tra kiến thức của bạn"
                : "Hoàn thành tất cả chương học để mở khóa"}
            </Text>
            {!allChaptersCompleted && (
              <View style={styles.progressBarWrapper}>
                <ProgressBar progress={currentProgress} />
                <Text style={styles.progressPercentage}>{currentProgress}%</Text>
              </View>
            )}
          </View>
          <View style={styles.finalExamStatus}>
            {allChaptersCompleted ? (
              <Ionicons name="chevron-forward-circle" size={28} color="#fff" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#aaa" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Fix the handleBackNavigation function error
  const handleBackNavigation = () => {
    if (params.source === 'your_paid_courses') {
      router.push('/(tabs)/your_paid_courses');
    } else {
      router.push('/(tabs)/courses');
    }
  };

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
              setIsLoading(true);
              try {
                // Xóa dữ liệu hoàn thành của các chapter trong khóa học
                const completedLessons = await AsyncStorage.getItem('completedLessons');
                if (completedLessons) {
                  let lessonsData = JSON.parse(completedLessons);
                  
                  // Xóa tất cả các chapter thuộc khóa học này
                  if (chapters && chapters.length > 0) {
                    chapters.forEach(chapter => {
                      if (chapter.chapterId) {
                        delete lessonsData[chapter.chapterId];
                      }
                    });
                  }
                  
                  await AsyncStorage.setItem('completedLessons', JSON.stringify(lessonsData));
                  setCompletedLessons(lessonsData);
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
                  setCourseCompleted(false);
                }
                
                // Hiển thị thông báo thành công
                Alert.alert(
                  "Đã xóa tiến độ",
                  "Tiến độ khóa học đã được xóa thành công. Bạn có thể bắt đầu lại từ đầu.",
                  [{ text: "OK" }]
                );
                
              } catch (error) {
                console.error('Lỗi khi xóa tiến độ khóa học:', error);
                Alert.alert(
                  "Lỗi",
                  "Không thể xóa tiến độ khóa học. Vui lòng thử lại sau.",
                  [{ text: "OK" }]
                );
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi xóa tiến độ khóa học:', error);
    }
  }, [courseId, chapters]);

  // Sửa lại renderChapterList để chỉ hiển thị số Chapter và ChapterName
  const renderChapterList = useCallback(() => {
    if (!chapters || chapters.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.noContentText}>
            {isRegistered 
              ? "Không có dữ liệu chương học"
              : "Vui lòng đăng ký khóa học để xem nội dung"}
          </Text>
        </View>
      );
    }
    
    return chapters.map((chapter, index) => {
      const isCompleted = chapter.status === "Done";
      
      return (
        <TouchableOpacity 
          key={chapter.chapterId}
          style={[
            styles.chapterItem,
            isCompleted ? styles.completedChapter : styles.inProgressChapter
          ]}
          onPress={() => handleChapterClick(chapter)}
        >
          <View style={styles.chapterContent}>
            <View style={styles.chapterMainInfo}>
              <Text style={styles.chapterTitle}>
                Chapter {index + 1}: {chapter.title}
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="time" size={24} color="#FFA500" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  }, [chapters, isRegistered, handleChapterClick]);

  // Sửa lại phần hiển thị thông tin khóa học
  const renderCourseInfo = () => {
    return (
      <>
        <View style={styles.titleContainer}>
          <Text style={styles.courseTitle}>
            {courseInfo.courseName || 'Chưa có tên khóa học'}
          </Text>
          {courseInfo.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                {courseInfo.rating}
              </Text>
              <View style={styles.starsContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Ionicons name="star" size={16} color="#FFD700" />
                <Ionicons name="star" size={16} color="#FFD700" />
                <Ionicons name="star" size={16} color="#FFD700" />
                <Ionicons name="star-half" size={16} color="#FFD700" />
              </View>
            </View>
          )}
        </View>

        <ScrollView style={styles.content}>
          {refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <>
              <Image 
                source={
                  courseInfo.imageUrl 
                    ? { uri: courseInfo.imageUrl }
                    : require('../../assets/images/koi_image.jpg')
                }
                style={styles.fishImage}
                resizeMode="cover"
              />
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin khóa học:</Text>
                <Text style={styles.descriptionText}>
                  {courseInfo.description || 'Chưa có mô tả'}
                </Text>
                
                {/* Thông tin tổng quát về khóa học */}
                <View style={styles.courseStatsContainer}>
                  {courseInfo.totalChapters != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="list" size={18} color="#FFD700" />
                      <Text style={styles.statText}>
                        {courseInfo.totalChapters} chương
                      </Text>
                    </View>
                  )}
                  
                  {courseInfo.totalQuestions != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="help-circle" size={18} color="#FFD700" />
                      <Text style={styles.statText}>
                        {courseInfo.totalQuestions} câu hỏi
                      </Text>
                    </View>
                  )}
                  
                  {courseInfo.totalDuration && (
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={18} color="#FFD700" />
                      <Text style={styles.statText}>
                        {courseInfo.totalDuration}
                      </Text>
                    </View>
                  )}

                  {courseInfo.enrolledStudents != null && (
                    <View style={styles.statItem}>
                      <Ionicons name="people" size={18} color="#FFD700" />
                      <Text style={styles.statText}>
                        {courseInfo.enrolledStudents} học viên
                      </Text>
                    </View>
                  )}
                </View>

                {!isRegistered && courseInfo.price != null && (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                      Giá: {courseInfo.price.toLocaleString()} VNĐ
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nội dung khóa học</Text>
                {renderChapterList()}
              </View>
              
              {/* Final Exam */}
              {renderFinalExamButton()}
            </>
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackNavigation} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {renderCourseInfo()}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(100, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: '#fff',
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  fishImage: {
    width: width,
    height: width * 0.7,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#fff',
    lineHeight: 20,
  },
  chapterItem: {
    backgroundColor: 'rgba(139, 0, 0, 0.7)',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  completedChapter: {
    backgroundColor: 'rgba(0, 100, 0, 0.7)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  inProgressChapter: {
    backgroundColor: 'rgba(139, 0, 0, 0.7)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  chapterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterMainInfo: {
    flex: 1,
    marginRight: 10,
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: '#8B0000',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  finalExamContainer: {
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#8B0000',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ff9999',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  finalExamContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  finalExamIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  finalExamTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  finalExamTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  finalExamDescription: {
    color: '#f8f8f8',
    fontSize: 14,
    marginBottom: 6,
  },
  finalExamStatus: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flex: 1,
  },
  progressPercentage: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    flex: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  disabledExamContainer: {
    opacity: 0.85,
  },
  noContentText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  courseStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    backgroundColor: 'rgba(100, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  priceText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

