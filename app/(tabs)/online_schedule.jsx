import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SelectList } from 'react-native-dropdown-select-list';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { consultingAPI, availableTimeSlots } from '../../constants/consulting';

// Define utility functions at the module level so they're accessible everywhere
const formatDateString = (date) => {
  if (typeof date === 'string') {
    return date; // Already a string, return as is
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayName = (date) => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
};

// Hàm chuyển đổi thời gian từ string "HH:MM" hoặc "HH:MM:SS" sang số phút
const timeToMinutes = (timeStr) => {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

// Hàm chuyển số phút thành string thời gian "HH:MM"
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Format date for display (DD/MM/YYYY)
const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  
  // Check if dateString is in YYYY-MM-DD format (from API)
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } 
  // Check if dateString is in MM/DD/YYYY format (from internal selection)
  else if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // Convert MM/DD/YYYY to DD/MM/YYYY for display
      return `${parts[1]}/${parts[0]}/${parts[2]}`;
    }
  }
  
  // Return original format if no conversion needed
  return dateString;
};

// Fix the SimpleDatePicker component to properly format dates
const SimpleDatePicker = ({ onSelectDate, selectedDate }) => {
  const [dates, setDates] = useState([]);
  
  useEffect(() => {
    // Generate dates for the next 30 days with complete information
    const generateDates = () => {
      const datesArray = [];
      const today = new Date();
      
      for (let i = 1; i < 30; i++) { // Bắt đầu từ i = 1 để bỏ qua ngày hiện tại
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        datesArray.push({
          dateString: `${month}/${day}/${year}`, // Store as MM/DD/YYYY
          formattedDay: day,  // For display
          formattedMonth: month, // For display
          formattedYear: year, // For display
          day: day,
          month: month,
          year: year,
          dayName: getDayName(date),
          fullDate: date // Store the full date object
        });
      }
      
      return datesArray;
    };
    
    setDates(generateDates());
  }, []);
  
  return (
    <View style={styles.datePickerContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={dates}
        keyExtractor={(item) => item.dateString}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dateItem,
              selectedDate === item.dateString && styles.selectedDateItem
            ]}
            onPress={() => onSelectDate(item)}
          >
            <Text style={[
              styles.dayName,
              selectedDate === item.dateString && styles.selectedDateText
            ]}>
              {item.dayName}
            </Text>
            <Text style={[
              styles.dayNumber,
              selectedDate === item.dateString && styles.selectedDateText
            ]}>
              {item.day}
            </Text>
            <Text style={[
              styles.monthText,
              selectedDate === item.dateString && styles.selectedDateText
            ]}>
              {item.day}/{item.month}/{item.year}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Thêm biến môi trường để xử lý API
const API_TIMEOUT = 15000; // 15 giây timeout
const MAX_RETRIES = 3; // Tối đa 3 lần thử lại
const RETRY_DELAY = 2000; // 2 giây giữa các lần thử lại

// Tạo instance Axios có cấu hình sẵn để sử dụng xuyên suốt
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeoutDuration || API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Thay thế hàm kiểm tra kết nối mạng bằng hàm đơn giản hơn
const isConnected = () => {
  // Giả định là luôn kết nối mạng
  return true;
};

// Sửa lại interceptor của apiClient
apiClient.interceptors.response.use(
  response => response,
  async error => {
    console.log('API Error:', error.message);
    
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.log('Có thể là lỗi kết nối, tiếp tục thử lại bằng lựa chọn khác');
    }
    
    return Promise.reject(error);
  }
);

export default function OnlineScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerInfo = params?.customerInfo ? JSON.parse(params.customerInfo) : null;
  const packageInfo = params?.packageInfo ? JSON.parse(params.packageInfo) : null;
  
  // Thêm ref để theo dõi API đã được gọi chưa
  const apiCalledRef = useRef(false);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dates, setDates] = useState([]);
  const [allDates, setAllDates] = useState([]); // Store all generated dates
  
  // Thêm state mới cho lịch master
  const [masterSchedules, setMasterSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState({});
  const [unavailableTimes, setUnavailableTimes] = useState({});
  const [useFallbackData, setUseFallbackData] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Thêm biến để kiểm soát các lần fetch API
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 1000; // 2 giây giữa các lần fetch

  // Theo dõi thay đổi masterId
  const prevMasterIdRef = useRef(null);

  // Thêm state để theo dõi chế độ debug
  const [debugMode, setDebugMode] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Thêm state mới để lưu trữ danh sách Master và số lượng Master
  const [allMasters, setAllMasters] = useState([]);
  const [masterCount, setMasterCount] = useState(0);

  // Cập nhật useFocusEffect để re-fetch dữ liệu mỗi khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      // Reset các state về giao diện
      setSelectedDate(null);
      setSelectedDateObj(null);
      setSelectedStartTime(null);
      setSelectedEndTime(null);
      setCurrentMonth(new Date().getMonth());
      setCurrentYear(new Date().getFullYear());
      
      // Xóa dữ liệu đã lưu trong AsyncStorage nếu có
      AsyncStorage.removeItem('onlineBookingDate');
      AsyncStorage.removeItem('onlineBookingStartTime');
      AsyncStorage.removeItem('onlineBookingEndTime');
      
      // Re-fetch dữ liệu lịch trình
      const initializeData = async () => {
        // Reset state và load dữ liệu mới
        setLoadingSchedules(true);
        setMasterSchedules([]);
        setUnavailableDates({});
        setUnavailableTimes({});
        
        // Lấy thông tin lịch dựa trên việc có chọn Master hay không
        if (customerInfo?.masterId) {
          // Trường hợp 1: Có chọn Master
          fetchMasterSchedules(customerInfo.masterId);
        } else {
          // Trường hợp 2: Không chọn Master
          fetchAllMastersInfo();
        }
      };
      
      // Gọi hàm khởi tạo dữ liệu
      initializeData();
      
      return () => {
        // Cleanup function (nếu cần)
      };
    }, [customerInfo?.masterId])
  );

  // Sửa useEffect để không sử dụng kiểm tra kết nối mạng
  useEffect(() => {
    const initializeData = async () => {
      // Reset state và load dữ liệu mới khi masterId thay đổi
      setLoadingSchedules(true);
      setMasterSchedules([]);
      setUnavailableDates({});
      setUnavailableTimes({});
      
      // Lấy thông tin lịch dựa trên việc có chọn Master hay không
      if (customerInfo?.masterId) {
        // Trường hợp 1: Có chọn Master
        fetchMasterSchedules(customerInfo.masterId);
      } else {
        // Trường hợp 2: Không chọn Master
        fetchAllMastersInfo();
      }
    };
    
    initializeData();
  }, [customerInfo?.masterId]);

  // Hàm lấy lịch của master đã chọn - cải tiến cơ chế gọi API
  const fetchMasterSchedules = async (masterId) => {
    if (!masterId) {
      console.error('MasterId không hợp lệ');
      Alert.alert("Lỗi", "Không tìm thấy thông tin Master");
      return;
    }
    
    setLoadingSchedules(true);
    let retryCount = 0;
    
    const tryFetchSchedules = async () => {
      try {
        // Lấy URL chuẩn từ API_CONFIG
        const url = API_CONFIG.endpoints.getSchedulesByMaster.replace('{id}', masterId);
        const fullUrl = `${API_CONFIG.baseURL}${url}`;
        
        // Sử dụng axios thay vì fetch để dễ debug hơn
        const response = await apiClient.get(url);
        const responseData = response.data;
        
        // Xử lý response theo cấu trúc mới từ API backend
        if (responseData) {
          // Kiểm tra nếu response có cấu trúc standard (isSuccess, data, message)
          if (responseData.hasOwnProperty('isSuccess') && responseData.hasOwnProperty('data')) {
            // Xác nhận API call thành công
            if (responseData.isSuccess && Array.isArray(responseData.data)) {
              // Lưu dữ liệu vào cache để sử dụng lần sau nếu không có kết nối
              try {
                await AsyncStorage.setItem(`master_schedule_${masterId}`, JSON.stringify(responseData.data));
              } catch (cacheError) {
                console.log('Lỗi khi lưu cache:', cacheError);
              }
              
              setMasterSchedules(responseData.data);
              processScheduleDataForSelectedMaster(responseData.data, masterId);
            } else {
              // API trả về không thành công
              console.warn(`API trả về không thành công: ${responseData.message || 'Không rõ lỗi'}`);
              await handleFetchFailure(masterId);
            }
          } else if (Array.isArray(responseData)) {
            // Xử lý trường hợp API trả về trực tiếp là mảng (cấu trúc cũ)
            // Lưu dữ liệu vào cache để sử dụng lần sau nếu không có kết nối
            try {
              await AsyncStorage.setItem(`master_schedule_${masterId}`, JSON.stringify(responseData));
            } catch (cacheError) {
              console.log('Lỗi khi lưu cache:', cacheError);
            }
            
            setMasterSchedules(responseData);
            processScheduleDataForSelectedMaster(responseData, masterId);
          } else {
            // Cấu trúc không phù hợp
            console.warn('Không lấy được lịch master (cấu trúc response không hợp lệ)');
            await handleFetchFailure(masterId);
          }
        } else {
          console.warn('Không lấy được lịch master (response trống)');
          await handleFetchFailure(masterId);
        }
      } catch (error) {
        console.error('Lỗi khi lấy lịch master:', error.message, error);
        
        // Nếu lỗi là do mạng hoặc timeout, thử lại
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Đang thử lại lần ${retryCount}/${MAX_RETRIES}...`);
          
          // Tăng timeout mỗi lần retry
          setTimeout(() => {
            tryFetchSchedules();
          }, RETRY_DELAY * retryCount);
          
          return;
        }
        
        // Nếu đã thử hết số lần hoặc lỗi khác, sử dụng dữ liệu cache hoặc dữ liệu dự phòng
        await handleFetchFailure(masterId);
      } finally {
        if (retryCount >= MAX_RETRIES) {
          setLoadingSchedules(false);
        }
      }
    };
    
    // Hàm xử lý khi không thể lấy dữ liệu từ API
    const handleFetchFailure = async (masterId) => {
      try {
        // Thử lấy dữ liệu từ cache
        const cachedData = await AsyncStorage.getItem(`master_schedule_${masterId}`);
        if (cachedData) {
          console.log('Sử dụng dữ liệu cache');
          const parsedData = JSON.parse(cachedData);
          setMasterSchedules(parsedData);
          processScheduleDataForSelectedMaster(parsedData, masterId);
          return;
        }
      } catch (cacheError) {
        console.log('Lỗi khi đọc cache:', cacheError);
      }
      
      // Nếu không có cache, sử dụng dữ liệu dự phòng
      console.log('Sử dụng dữ liệu dự phòng');
      const fallbackData = FALLBACK_SCHEDULE_DATA.filter(item => item.masterId === masterId);
      setMasterSchedules(fallbackData);
      processScheduleDataForSelectedMaster(fallbackData, masterId);
      setLoadingSchedules(false);
    };
    
    // Bắt đầu quá trình lấy dữ liệu
    tryFetchSchedules();
  };

  // Get today's actual date
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthActual = today.getMonth();
  const currentYearActual = today.getFullYear();

  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar dates
  const generateCalendarDates = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const dates = [];
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      dates.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(i);
    }
    
    return dates;
  };

  // Sửa đổi startTimeOptions để chỉ có 4 khung giờ cố định
  const startTimeOptions = [
    {key: '07:00', value: '07:00', endTime: '09:15', label: '07:00 - 09:15'},
    {key: '09:30', value: '09:30', endTime: '11:45', label: '09:30 - 11:45'},
    {key: '12:30', value: '12:30', endTime: '14:45', label: '12:30 - 14:45'},
    {key: '15:00', value: '15:00', endTime: '17:15', label: '15:00 - 17:15'},
  ];

  // Cập nhật hàm getAvailableStartTimes để trả về tất cả khung giờ (bao gồm cả khung giờ đã bận)
  const getAvailableStartTimes = () => {
    if (!selectedDateObj) return startTimeOptions.map(time => ({ ...time, isAvailable: true }));
    
    const formattedDate = formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day));
    
    // Sử dụng hàm generateStartTimeOptions để lấy danh sách các khung giờ bắt đầu với trạng thái khả dụng
    return generateStartTimeOptions(formattedDate, customerInfo?.masterId || null);
  };

  // Hàm isTimeOverlap để kiểm tra hai khoảng thời gian có chồng lấp nhau không
  const isTimeOverlap = (startTime1, endTime1, startTime2, endTime2) => {
    if (!startTime1 || !endTime1 || !startTime2 || !endTime2) return false;
    
    // Chuyển đổi chuỗi thời gian sang số phút trong ngày để dễ so sánh
    const getMinutes = (timeStr) => {
      try {
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          return hours * 60 + minutes;
        }
        return 0;
      } catch (error) {
        console.error('Lỗi khi phân tích chuỗi thời gian:', timeStr, error);
        return 0;
      }
    };
    
    // Chuẩn hóa chuỗi thời gian, đảm bảo chỉ lấy phần giờ:phút
    const normalizeTimeString = (timeStr) => {
      if (!timeStr) return '00:00';
      return timeStr.substring(0, 5);
    };
    
    const start1 = getMinutes(normalizeTimeString(startTime1));
    const end1 = getMinutes(normalizeTimeString(endTime1));
    const start2 = getMinutes(normalizeTimeString(startTime2));
    const end2 = getMinutes(normalizeTimeString(endTime2));
    
    // Kiểm tra chồng lấp: một khoảng thời gian bắt đầu trước khi khoảng kia kết thúc
    return (start1 < end2 && start2 < end1);
  };

  // Cập nhật hàm generateStartTimeOptions để xử lý rõ ràng các lịch Offline
  const generateStartTimeOptions = (selectedDate, selectedMasterId = null) => {
    if (!selectedDate) return [];
    
    // Kiểm tra xem ngày đã chọn có trong danh sách ngày không khả dụng không
    if (unavailableDates[selectedDate]) {
      return [];
    }
    
    // Lấy ngày hiện tại và kiểm tra xem ngày đã chọn có phải là ngày trong quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < today) {
      return [];
    }
    
    // Lấy danh sách bookings cho ngày đã chọn
    const bookingsForDay = unavailableTimes[selectedDate] || [];
    
    // Debug: Log các loại lịch cho ngày đã chọn
    if (debugMode) {
      console.log(`[Debug] Các loại lịch cho ngày ${selectedDate}:`, 
        bookingsForDay.map(b => ({time: `${b.startTime}-${b.endTime}`, type: b.type})));
    }
    
    // Kiểm tra từng khung giờ cố định
    const timeOptions = startTimeOptions.map(timeOption => {
      const startTime = `${timeOption.key}:00`;
      const endTime = `${timeOption.endTime}:00`;
      
      // Kiểm tra xem slot này có bị trùng với booking nào không
      let isBooked = false;
      let isUnavailable = false;
      let bookingInfo = null;
      
      // Kiểm tra nếu đây là ngày hiện tại và khung giờ đã qua
      const now = new Date();
      const isToday = selectedDateObj.toDateString() === now.toDateString();
      
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeHour = parseInt(timeOption.key.split(':')[0], 10);
        
        if (timeHour < currentHour || (timeHour === currentHour && currentMinute > 0)) {
          isUnavailable = true;
        }
      }
      
      for (const booking of bookingsForDay) {
        if (!booking.startTime || !booking.endTime) continue;
        
        // Kiểm tra trường hợp đặc biệt cho Workshop
        if (booking.type === "Workshop") {
          // Nếu là Workshop buổi sáng và slot này thuộc buổi sáng
          if ((booking.isFirstHalf && (timeOption.key === '07:00' || timeOption.key === '09:30')) ||
              // Hoặc là Workshop buổi chiều và slot này thuộc buổi chiều
              (booking.isSecondHalf && (timeOption.key === '12:30' || timeOption.key === '15:00'))) {
            
            if (customerInfo?.masterId) {
              // Trường hợp 1: Có chọn Master
              isUnavailable = true;
              break;
            }
          }
          continue;
        }
        
        // Kiểm tra trường hợp lịch Offline rõ ràng
        if (booking.type === "Offline" || booking.type === "BookingOffline") {
          // Nếu thời gian trùng nhau với slot hiện tại
          if (isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
            // Nếu cùng một master hoặc không chọn master cụ thể
            if (booking.isSameMaster || !customerInfo?.masterId) {
              isUnavailable = true;
              break;
            }
          }
          continue;
        }
        
        // Kiểm tra trường hợp đã bị block cho tất cả Master
        if (booking.type === 'BlockedForAllMasters') {
          if (timeOption.key === booking.startTime.substring(0, 5)) {
            isUnavailable = true;
            break;
          }
          continue;
        }
        
        // Kiểm tra nếu thời gian trùng nhau
        if (isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
          const bookingType = booking.type || "";
          
          // Xử lý theo loại lịch và thông tin master
          if (bookingType === "Online") {
            if (booking.isSameMaster) {
              // Nếu là cùng master và loại Online -> slot này đã được đặt
              isBooked = true;
              bookingInfo = booking;
              break;
            } 
          } else if (bookingType === "Workshop" || bookingType === "BookingOffline" || bookingType === "Offline") {
            // Workshop, BookingOffline, Offline -> luôn đánh dấu là không khả dụng
            isUnavailable = true;
            break;
          } else {
            // Các loại lịch khác hoặc không có type
            isUnavailable = true;
            break;
          }
        }
      }
      
      return {
        ...timeOption,
        value: timeOption.key,
        isAvailable: !isBooked && !isUnavailable,
        isBooked: isBooked,
        isUnavailable: isUnavailable,
        bookingId: bookingInfo?.bookingId || null,
        type: bookingInfo?.type || null,
        startTimeFormatted: timeOption.key,
        endTimeFormatted: timeOption.endTime
      };
    });
    
    // THÊM MỚI: Kiểm tra nếu tất cả các khung giờ đều không khả dụng
    // thì đánh dấu ngày này là không khả dụng trong unavailableDates
    const allTimeSlotsUnavailable = timeOptions.every(timeOption => 
      !timeOption.isAvailable || timeOption.isBooked || timeOption.isUnavailable
    );
    
    if (allTimeSlotsUnavailable) {
      if (debugMode) {
        console.log(`[Debug] Phát hiện ngày ${selectedDate} không còn khung giờ khả dụng nào, đánh dấu ngày này là không khả dụng`);
      }
      
      // Cập nhật state để đánh dấu ngày không khả dụng
      setUnavailableDates(prev => ({
        ...prev,
        [selectedDate]: true
      }));
      
      // Lưu vào AsyncStorage để giữ lại trạng thái này
      try {
        const currentUnavailableDates = { ...unavailableDates, [selectedDate]: true };
        AsyncStorage.setItem('unavailableDates', JSON.stringify(currentUnavailableDates));
      } catch (error) {
        console.error('Lỗi khi lưu unavailableDates vào AsyncStorage:', error);
      }
    }
    
    return timeOptions;
  };

  // Hàm để lấy màu sắc dựa vào loại lịch
  const getSlotColor = (timeOption) => {
    if (timeOption.isBooked) {
      // Nếu là lịch Online, hiển thị màu xám giống như slot không khả dụng
      return { background: ['#E0E0E0', '#CCCCCC'], text: '#999999' };
    } 
    else if (!timeOption.isAvailable) {
      return { background: ['#E0E0E0', '#CCCCCC'], text: '#999999' };
    }
    else if (selectedStartTime === timeOption.key) {
      return { background: ['#8B0000', '#600000'], text: '#FFFFFF' };
    }
    return { background: ['#F8F8F8', '#F0F0F0'], text: '#333333' };
  };

  // Thêm hàm để hiển thị thông tin debug khung giờ khi chạm vào nó
  const showTimeSlotDebugInfo = (timeOption) => {
    if (!debugMode) return;
    
    const formattedDate = selectedDateObj ? 
      formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day)) :
      null;
      
    if (!formattedDate || !unavailableTimes[formattedDate]) {
      console.log(`[Debug] Không có dữ liệu lịch cho ngày ${formattedDate}`);
      return;
    }
    
    const slots = unavailableTimes[formattedDate];
    console.log(`[Debug] Chi tiết slot ${timeOption.key} - Ngày ${formattedDate}:`);
    console.log(`- Trạng thái: ${timeOption.isAvailable ? 'Khả dụng' : 'Không khả dụng'}`);
    console.log(`- Đã đặt: ${timeOption.isBooked ? 'Có' : 'Không'}`);
    console.log(`- Loại lịch: ${timeOption.type || 'Không xác định'}`);
    console.log(`- Master đã chọn: ${customerInfo?.masterId || 'Không có'}`);
    
    // Kiểm tra xem slot này có khớp với slot nào đã đặt không
    const matchingSlots = slots.filter(slot => {
      const slotStart = slot.startTime.substring(0, 5);
      const slotEnd = slot.endTime.substring(0, 5);
      
      // Kiểm tra các điều kiện chồng lấp
      const timeMinutes = timeToMinutes(timeOption.key);
      const endTimeMinutes = timeMinutes + 60;
      const slotStartMinutes = timeToMinutes(slotStart);
      const slotEndMinutes = timeToMinutes(slotEnd);
      
      const exactStartMatch = slotStart === timeOption.key;
      const exactEndMatch = minutesToTime(endTimeMinutes) === slotEnd;
      const startOverlapsSlot = timeMinutes >= slotStartMinutes && timeMinutes < slotEndMinutes;
      const endOverlapsSlot = endTimeMinutes > slotStartMinutes && endTimeMinutes <= slotEndMinutes;
      const surroundsSlot = timeMinutes <= slotStartMinutes && endTimeMinutes >= slotEndMinutes;
      
      return exactStartMatch || exactEndMatch || startOverlapsSlot || endOverlapsSlot || surroundsSlot;
    });
    
    if (matchingSlots.length > 0) {
      console.log(`- Chồng lấp với ${matchingSlots.length} slots:`);
      matchingSlots.forEach((slot, index) => {
        const isSameMaster = slot.isSameMaster || false;
        const masterIds = slot.masterId ? Array.isArray(slot.masterId) ? 
                          slot.masterId.join(', ') : slot.masterId : 'Không xác định';
        
        console.log(`  ${index + 1}. ${slot.startTime} - ${slot.endTime}`);
        console.log(`     Master: ${masterIds}`);
        console.log(`     Loại lịch: ${slot.type || 'Không xác định'}`);
        console.log(`     Cùng master đã chọn: ${isSameMaster ? 'Có' : 'Không'}`);
      });
      
      
      // Hiển thị cảnh báo nếu có slot cùng master mà không bị vô hiệu hóa
      const hasSameMasterSlot = matchingSlots.some(slot => slot.isSameMaster);
      if (hasSameMasterSlot && timeOption.isAvailable) {
        console.warn(`[CẢNH BÁO] Slot ${timeOption.key} có chồng lấp với lịch cùng master nhưng vẫn được đánh dấu là khả dụng!`);
      }
    } else {
      console.log(`- Không chồng lấp với slot nào đã đặt`);
    }
    
    // Hiển thị thông báo dễ hiểu cho người dùng nếu cần
    if (timeOption.isBooked) {
      const typeDisplay = timeOption.type === 'Online' ? 'tư vấn Online' : 
                        timeOption.type === 'Workshop' ? 'Workshop' : 
                        timeOption.type || 'không xác định';
                        
      Alert.alert(
        "Thông tin khung giờ",
        `Khung giờ ${timeOption.key} đã được đặt trước.\nLoại lịch: ${typeDisplay}`
      );
    } else if (!timeOption.isAvailable) {
      // Tìm loại lịch gây ảnh hưởng
      const conflictingType = matchingSlots.length > 0 ? 
                            matchingSlots[0].type || 'không xác định' : 
                            'không xác định';
                            
      Alert.alert(
        "Thông tin khung giờ",
        `Khung giờ ${timeOption.key} không khả dụng.\nLý do: Đã có lịch ${conflictingType} trong khung giờ này.`
      );
    } else {
      Alert.alert(
        "Thông tin khung giờ",
        `Khung giờ ${timeOption.key} khả dụng để đặt lịch.`
      );
    }
  };

  // Thêm các hàm hỗ trợ bị thiếu
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    date = new Date(date);
    date.setHours(0, 0, 0, 0);
    
    return date < today;
  };

  // Thêm hàm handleStartTimeChange để xử lý khi người dùng chọn khung giờ
  const handleStartTimeChange = (startTime, endTime) => {
    // Đảm bảo startTime có định dạng đúng
    const formattedStartTime = startTime.includes(':00') ? startTime.substring(0, 5) : startTime;
    setSelectedStartTime(formattedStartTime);
    
    // Sử dụng endTime mới từ khung giờ cố định
    const formattedEndTime = endTime.includes(':00') ? endTime.substring(0, 5) : endTime;
    setSelectedEndTime(formattedEndTime);
    
    if (debugMode) {
      console.log(`[Debug] Đã chọn khung giờ: ${formattedStartTime} - ${formattedEndTime}`);
    }
  };
  
  // Thêm hàm handleSubmit để xử lý khi người dùng nhấn nút xác nhận đặt lịch
  const handleSubmit = async () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      Alert.alert("Thông báo", "Vui lòng chọn đầy đủ ngày và giờ");
      return;
    }

    try {
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để tiếp tục");
        router.push('/(tabs)/login');
        return;
      }

      // Format ngày tháng theo chuẩn ISO
      const bookingDate = new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day);
      // Thêm 12 giờ để tránh vấn đề múi giờ
      bookingDate.setHours(12, 0, 0, 0);
      const formattedDate = bookingDate.toISOString().split('T')[0];

      // Tạo dữ liệu booking
      const bookingData = {
        bookingDate: formattedDate,
        startTime: `${selectedStartTime}:00`,
        endTime: `${selectedEndTime}:00`,
        masterId: customerInfo?.masterId || null,
        customerName: customerInfo?.name || '',
        customerEmail: customerInfo?.email || '',
        customerPhone: customerInfo?.phone || '',
        description: customerInfo?.description || '',
        type: 'Online',
        status: 'Pending',
        isOnline: true,
        isActive: true,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString()
      };

      console.log('Booking data:', bookingData);

      // Gọi API tạo booking
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Booking/create`,
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response:', response.data);

      if (response.data && response.data.isSuccess) {
        const bookingId = response.data.data.bookingOnlineId;
        const price = response.data.data.price;
        console.log('BookingId before redirect:', bookingId);
        console.log('Price from response:', price);
        
        // Hiển thị thông báo thành công
        Alert.alert(
          "Thành công",
          "Đặt lịch thành công! Vui lòng thanh toán để hoàn tất.",
          [
            {
              text: "Xác nhận",
              onPress: () => {
                // Chuyển đến màn hình thanh toán với thông tin booking
                router.push({
                  pathname: '/(tabs)/online_checkout',
                  params: { 
                    bookingId: bookingId,
                    customerInfo: JSON.stringify(customerInfo),
                    scheduleInfo: JSON.stringify({
                      date: formattedDate,
                      startTime: selectedStartTime,
                      endTime: selectedEndTime,
                      price: price
                    })
                  }
                });
              }
            }
          ]
        );
      } else {
        throw new Error(response.data?.message || 'Không thể tạo booking');
      }
    } catch (error) {
      console.error('Lỗi khi tạo booking:', error);
      console.error('Chi tiết lỗi:', error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại."
      );
    }
  };
  
  // Thêm hàm selectDate để xử lý khi người dùng chọn ngày
  const selectDate = (day) => {
    const dateString = `${currentMonth + 1}/${day}/${currentYear}`;
    const isoDate = formatDateString(new Date(currentYear, currentMonth, day));
    
    setSelectedDate(dateString);
    setSelectedDateObj({
      day: day,
      month: currentMonth + 1,
      year: currentYear
    });
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    
    if (debugMode) {
      console.log(`[Debug] Đã chọn ngày: ${dateString} (ISO: ${isoDate})`);
      
      // Kiểm tra dữ liệu lịch cụ thể cho ngày đã chọn
      const bookingsForDay = unavailableTimes[isoDate] || [];
      console.log(`[Debug] Dữ liệu lịch cho ngày ${isoDate}:`, JSON.stringify(bookingsForDay, null, 2));
      
      // Kiểm tra đặc biệt cho lịch Online
      const onlineBookings = bookingsForDay.filter(booking => booking.type === "Online");
      console.log(`[Debug] Lịch Online cho ngày ${isoDate}:`, JSON.stringify(onlineBookings, null, 2));
      
      // Kiểm tra lịch Workshop
      const workshopBookings = bookingsForDay.filter(booking => booking.type === "Workshop");
      console.log(`[Debug] Lịch Workshop cho ngày ${isoDate}:`, JSON.stringify(workshopBookings, null, 2));
    }
  };

  // Định nghĩa thời gian dịch vụ mặc định (60 phút)
  const serviceTime = 60;

  // Thêm hàm để kiểm tra loại kết nối mạng
  const logDebugInfo = () => {
    if (debugMode) {
      console.log('Thông tin debug:');
      console.log('API URL:', API_CONFIG.baseURL);
      console.log('Master ID:', customerInfo?.masterId);
      console.log('Timeout:', API_CONFIG.timeoutDuration || API_TIMEOUT);
    }
  };

  // Thêm hàm processScheduleDataForSelectedMaster vào đây để có thể truy cập state
  const processScheduleDataForSelectedMaster = (scheduleData, masterId) => {
    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
      console.log('Không có dữ liệu lịch để xử lý');
      setLoadingSchedules(false);
      return;
    }

    // Tạo các đối tượng để lưu trữ ngày và thời gian không khả dụng
    const unavailableDatesMap = {};
    const unavailableTimesMap = {};
    
    // Khởi tạo đối tượng để theo dõi từng khung giờ cho mỗi ngày
    const timeSlotsByDate = {};
    
    if (debugMode) {
      console.log(`[Debug] processScheduleDataForSelectedMaster - Tổng số lịch: ${scheduleData.length}`);
      console.log(`[Debug] processScheduleDataForSelectedMaster - masterId: ${masterId}`);
    }
    
    // Xử lý từng mục lịch
    scheduleData.forEach(schedule => {
      if (!schedule.date) return;
      
      const scheduleDate = schedule.date.split('T')[0]; // Lấy phần ngày từ ISO date
      const currentMasterId = schedule.masterId ? schedule.masterId.trim() : '';
      const selectedMasterId = masterId ? masterId.trim() : '';
      const isSameMaster = currentMasterId === selectedMasterId;
      
      if (debugMode && schedule.type === 'Online') {
        console.log(`[Debug] Xử lý lịch Online - Date: ${scheduleDate}, Time: ${schedule.startTime}-${schedule.endTime}`);
        console.log(`[Debug] masterId từ lịch: "${currentMasterId}" (${currentMasterId.length} ký tự)`);
        console.log(`[Debug] masterId được chọn: "${selectedMasterId}" (${selectedMasterId.length} ký tự)`);
        console.log(`[Debug] isSameMaster: ${isSameMaster}`);
        
        // Kiểm tra chi tiết từng ký tự trong chuỗi để tìm lỗi khi so sánh
        for (let i = 0; i < Math.max(currentMasterId.length, selectedMasterId.length); i++) {
          const char1 = i < currentMasterId.length ? currentMasterId.charCodeAt(i) : null;
          const char2 = i < selectedMasterId.length ? selectedMasterId.charCodeAt(i) : null;
          if (char1 !== char2) {
            console.log(`[Debug] Khác nhau tại vị trí ${i}: '${currentMasterId[i]}' (${char1}) vs '${selectedMasterId[i]}' (${char2})`);
          }
        }
      }
      
      // Khởi tạo cấu trúc theo dõi khung giờ cho ngày này nếu chưa có
      if (!timeSlotsByDate[scheduleDate]) {
        timeSlotsByDate[scheduleDate] = {
          '07:00': { isAvailable: true },
          '09:30': { isAvailable: true },
          '12:30': { isAvailable: true },
          '15:00': { isAvailable: true }
        };
      }
      
      // Lịch Offline không có thời gian cụ thể: Đánh dấu cả ngày là không khả dụng
      if ((schedule.type === "Offline" || schedule.type === "BookingOffline") && 
          (!schedule.startTime || !schedule.endTime)) {
        unavailableDatesMap[scheduleDate] = true;
        
        // Đánh dấu tất cả khung giờ của ngày này là không khả dụng
        Object.keys(timeSlotsByDate[scheduleDate]).forEach(slot => {
          timeSlotsByDate[scheduleDate][slot].isAvailable = false;
        });
        
        // Log thông tin debug
        if (debugMode) {
          console.log(`[Debug] Đánh dấu ngày ${scheduleDate} là không khả dụng do có lịch Offline cả ngày`);
        }
        return; // Tiếp tục với mục lịch tiếp theo
      }
      
      // Xử lý các loại lịch khác (Online, Workshop...) hoặc lịch Offline có thời gian cụ thể
      // Thêm lịch vào unavailableTimesMap
      if (!unavailableTimesMap[scheduleDate]) {
        unavailableTimesMap[scheduleDate] = [];
      }
      
      // Lưu thông tin lịch
      const scheduleInfo = {
        masterScheduleId: schedule.masterScheduleId,
        masterId: currentMasterId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        type: schedule.type || 'Unknown',
        isSameMaster: isSameMaster,
        isFirstHalf: schedule.startTime && ['07:00:00', '09:30:00'].includes(schedule.startTime),
        isSecondHalf: schedule.startTime && ['12:30:00', '15:00:00'].includes(schedule.startTime)
      };
      
      // Thêm thông tin vào danh sách thời gian không khả dụng
      unavailableTimesMap[scheduleDate].push(scheduleInfo);
      
      // Cập nhật trạng thái khả dụng của các khung giờ
      if (isSameMaster || !selectedMasterId) {
        if (schedule.type === "Workshop") {
          // Workshop buổi sáng
          if (scheduleInfo.isFirstHalf) {
            timeSlotsByDate[scheduleDate]['07:00'].isAvailable = false;
            timeSlotsByDate[scheduleDate]['09:30'].isAvailable = false;
          }
          // Workshop buổi chiều
          else if (scheduleInfo.isSecondHalf) {
            timeSlotsByDate[scheduleDate]['12:30'].isAvailable = false;
            timeSlotsByDate[scheduleDate]['15:00'].isAvailable = false;
          }
        } 
        else if (schedule.startTime) {
          // Kiểm tra và cập nhật từng khung giờ
          const startTimePart = schedule.startTime.substring(0, 5);
          if (startTimePart === '07:00') {
            timeSlotsByDate[scheduleDate]['07:00'].isAvailable = false;
          } else if (startTimePart === '09:30') {
            timeSlotsByDate[scheduleDate]['09:30'].isAvailable = false;
          } else if (startTimePart === '12:30') {
            timeSlotsByDate[scheduleDate]['12:30'].isAvailable = false;
          } else if (startTimePart === '15:00') {
            timeSlotsByDate[scheduleDate]['15:00'].isAvailable = false;
          }
        }
      }
    });
    
    // Sau khi xử lý tất cả lịch, kiểm tra xem có ngày nào tất cả khung giờ đều không khả dụng không
    Object.keys(timeSlotsByDate).forEach(date => {
      const slots = timeSlotsByDate[date];
      const allSlotsUnavailable = Object.values(slots).every(slot => !slot.isAvailable);
      
      if (allSlotsUnavailable) {
        unavailableDatesMap[date] = true;
        if (debugMode) {
          console.log(`[Debug] Đánh dấu ngày ${date} là không khả dụng do tất cả khung giờ đều đã bận`);
        }
      }
    });
    
    // Cập nhật state
    setUnavailableDates(unavailableDatesMap);
    setUnavailableTimes(unavailableTimesMap);
    setLoadingSchedules(false);
    
    // Log debug thông tin 
    if (debugMode) {
      console.log(`[Debug] Các ngày không khả dụng:`, Object.keys(unavailableDatesMap));
      console.log(`[Debug] Tổng số ngày không khả dụng: ${Object.keys(unavailableDatesMap).length}`);
      
      // In ra chi tiết các lịch Online
      Object.keys(unavailableTimesMap).forEach(date => {
        const onlineBookings = unavailableTimesMap[date].filter(b => b.type === 'Online');
        if (onlineBookings.length > 0) {
          console.log(`[Debug] Lịch Online ngày ${date}:`, JSON.stringify(onlineBookings, null, 2));
        }
      });
    }
  };

  // Thêm hàm fetchAllMastersInfo vào đây để có thể truy cập state
  const fetchAllMastersInfo = async () => {
    try {
      setLoadingSchedules(true);
      
      // Khởi tạo danh sách master và lịch trình trống
      let mastersList = [];
      let schedulesData = [];
      let hasDisplayedMasterSuccess = false;
      
      // BƯỚC 1: Lấy danh sách Master
      try {
        // Cách 1: Thử lấy từ consultingAPI
        try {
          const mastersResponse = await consultingAPI.getAllConsultants();
          if (Array.isArray(mastersResponse) && mastersResponse.length > 0) {
            mastersList = mastersResponse;
            hasDisplayedMasterSuccess = true;
          }
        } catch (error) {
          // Không ghi log lỗi ở đây, chỉ thử cách tiếp theo
        }
        
        // Nếu chưa lấy được Master, thử cách khác
        if (mastersList.length === 0) {
          // Cách 2: Thử lấy trực tiếp từ API nếu consultingAPI thất bại
          try {
            // Thử với nhiều endpoint có thể có
            const endpoints = [
              '/api/Master/get-all',
              '/api/Master/getall',
              '/api/Master'
            ];
            
            for (const endpoint of endpoints) {
              try {
                const response = await apiClient.get(endpoint);
                
                if (response.data) {
                  if (response.data.isSuccess && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    mastersList = response.data.data;
                    hasDisplayedMasterSuccess = true;
                    break;
                  } else if (Array.isArray(response.data) && response.data.length > 0) {
                    mastersList = response.data;
                    hasDisplayedMasterSuccess = true;
                    break;
                  }
                }
              } catch (endpointError) {
                // Không ghi log lỗi cho từng endpoint riêng lẻ
              }
            }
          } catch (directApiError) {
            // Không ghi log lỗi ở đây
          }
        }
        
        // Kiểm tra xem đã lấy được danh sách master chưa
        if (!mastersList.length) {
          console.log('Không thể lấy danh sách Master từ API, không có Master nào khả dụng');
        }
        
        // Cập nhật state với danh sách master
        setAllMasters(mastersList);
        setMasterCount(mastersList.length);
        
      } catch (masterError) {
        // Chỉ ghi log lỗi nếu không lấy được Master nào
        if (!hasDisplayedMasterSuccess) {
          console.error('Lỗi khi lấy thông tin Master:', masterError.message);
        }
      }
      
      // BƯỚC 2: Lấy lịch của tất cả Master
      let hasDisplayedScheduleSuccess = false;
      
      try {
        // Cách 1: Thử lấy tất cả lịch qua API chung
        const possibleEndpoints = [
          API_CONFIG.endpoints.getAllSchedulesForMobile,
          '/api/MasterSchedule/get-schedules-for-mobile',
          '/api/MasterSchedule/get-all-schedules',
          '/api/MasterSchedule/getall'
        ].filter(endpoint => endpoint); // Lọc các endpoint undefined
        
        let schedulesFound = false;
        
        for (const endpoint of possibleEndpoints) {
          try {
            const response = await apiClient.get(endpoint);
            
            if (response.data) {
              if (response.data.isSuccess && Array.isArray(response.data.data)) {
                schedulesData = response.data.data;
                schedulesFound = true;
                hasDisplayedScheduleSuccess = true;
                break;
              } else if (Array.isArray(response.data)) {
                schedulesData = response.data;
                schedulesFound = true;
                hasDisplayedScheduleSuccess = true;
                break;
              }
            }
          } catch (endpointError) {
            // Không ghi log lỗi cho từng endpoint riêng lẻ - chỉ thử endpoint tiếp theo
          }
        }
        
        // Cách 2: Nếu không lấy được qua API chung, thử lấy lịch cho từng Master
        if (!schedulesFound && mastersList.length > 0) {
          console.log('Đang sử dụng phương án dự phòng: lấy lịch của từng master');
          
          const allSchedules = [];
          for (const master of mastersList) {
            if (master.id) {
              try {
                // Tìm endpoint phù hợp
                let masterSchedulesUrl;
                if (API_CONFIG.endpoints.getSchedulesByMaster) {
                  masterSchedulesUrl = API_CONFIG.endpoints.getSchedulesByMaster.replace('{id}', master.id);
                } else {
                  masterSchedulesUrl = `/api/MasterSchedule/get-by-master/${master.id}`;
                }
                
                const response = await apiClient.get(masterSchedulesUrl);
                
                if (response.data) {
                  if (response.data.isSuccess && Array.isArray(response.data.data)) {
                    allSchedules.push(...response.data.data);
                  } else if (Array.isArray(response.data)) {
                    allSchedules.push(...response.data);
                  }
                }
              } catch (error) {
                // Không ghi log lỗi cho từng Master riêng lẻ
              }
            }
          }
          
          if (allSchedules.length > 0) {
            schedulesData = allSchedules;
            hasDisplayedScheduleSuccess = true;
          }
        }
        
        // Nếu không lấy được dữ liệu, thông báo cho người dùng
        if (!schedulesData.length) {
          console.log('Không thể lấy lịch từ API. Tất cả các ngày và khung giờ sẽ được hiển thị là khả dụng.');
        }
        
      } catch (schedulesError) {
        // Chỉ ghi log lỗi nếu không lấy được dữ liệu lịch nào
        if (!hasDisplayedScheduleSuccess) {
          console.error('Lỗi khi lấy lịch trình:', schedulesError.message);
        }
      }
      
      // Xử lý dữ liệu lịch trình dù có hay không
      setMasterSchedules(schedulesData);
      processScheduleDataForAllMasters(schedulesData, mastersList);
      
      setLoadingSchedules(false);
    } catch (error) {
      console.error('Lỗi tổng thể khi lấy thông tin lịch:', error.message);
      setLoadingSchedules(false);
      
      // Đảm bảo UI luôn hiển thị, ngay cả khi có lỗi
      setMasterSchedules([]);
      processScheduleDataForAllMasters([], []);
    }
  };

  // Thêm hàm xử lý lịch trình cho tất cả Master
  const processScheduleDataForAllMasters = (schedulesData, mastersList) => {
    // Đảm bảo các tham số input là mảng
    schedulesData = Array.isArray(schedulesData) ? schedulesData : [];
    mastersList = Array.isArray(mastersList) ? mastersList : [];
    
    const masterCount = mastersList.length || 0;
    const unavailableDatesMap = {};
    const unavailableTimesMap = {};
    
    // Nếu không có dữ liệu lịch hoặc không có master, không có ngày/khung giờ nào bị vô hiệu hóa
    if (schedulesData.length === 0 || mastersList.length === 0) {
      console.log('Không có dữ liệu lịch hoặc không có master, tất cả ngày và khung giờ sẽ khả dụng');
      setUnavailableDates({});
      setUnavailableTimes({});
      setLoadingSchedules(false);
      return;
    }

    // Khởi tạo bộ đếm cho các khung giờ bị chiếm mỗi ngày
    const timeSlotCounts = {};
    
    // Khởi tạo danh sách các ngày có lịch Offline
    const offlineDates = new Set();
    
    // TẠO CẤU TRÚC DỮ LIỆU MỚI ĐỂ THEO DÕI TÌNH TRẠNG CỦA TỪNG MASTER TRONG MỖI KHUNG GIỜ
    // Cấu trúc: masterBusyByDay[ngày][khung giờ][masterId] = true/false
    const masterBusyByDay = {};
    
    // Bước 1: Xử lý từng mục lịch để xác định các khung giờ bận của từng Master
    schedulesData.forEach(schedule => {
      if (!schedule.date || !schedule.masterId) return;
      
      const scheduleDate = schedule.date.split('T')[0]; // Lấy phần ngày từ ISO date
      const masterId = schedule.masterId;
      
      // Khởi tạo cấu trúc theo dõi cho ngày này nếu chưa có
      if (!masterBusyByDay[scheduleDate]) {
        masterBusyByDay[scheduleDate] = {
          '07:00': {},
          '09:30': {},
          '12:30': {},
          '15:00': {}
        };
      }
      
      // Khởi tạo cấu trúc cho mỗi ngày nếu chưa có trong timeSlotCounts
      if (!timeSlotCounts[scheduleDate]) {
        timeSlotCounts[scheduleDate] = {
          '07:00': { count: 0, masterIds: new Set() },
          '09:30': { count: 0, masterIds: new Set() },
          '12:30': { count: 0, masterIds: new Set() },
          '15:00': { count: 0, masterIds: new Set() }
        };
      }
      
      // Khởi tạo cấu trúc cho mỗi ngày nếu chưa có trong unavailableTimesMap
      if (!unavailableTimesMap[scheduleDate]) {
        unavailableTimesMap[scheduleDate] = [];
      }
      
      // XỬ LÝ LỊCH OFFLINE (CẢ NGÀY)
      if ((schedule.type === "Offline" || schedule.type === "BookingOffline") && 
          (!schedule.startTime || !schedule.endTime)) {
        // Đánh dấu ngày này có lịch Offline
        offlineDates.add(scheduleDate);
        
        // Đánh dấu Master này bận cả ngày
        Object.keys(masterBusyByDay[scheduleDate]).forEach(timeSlot => {
          masterBusyByDay[scheduleDate][timeSlot][masterId] = true;
        });
      }
      
      // XỬ LÝ LỊCH CÓ KHUNG GIỜ CỤ THỂ
      if (schedule.startTime) {
        const startTimePart = schedule.startTime.substring(0, 5);
        
        // XỬ LÝ WORKSHOP - WORKSHOP BẬN CẢ BUỔI
        if (schedule.type === "Workshop") {
          // Workshop buổi sáng
          if (startTimePart === '07:00' || startTimePart === '09:30') {
            // Đánh dấu cả 2 khung giờ buổi sáng
            masterBusyByDay[scheduleDate]['07:00'][masterId] = true;
            masterBusyByDay[scheduleDate]['09:30'][masterId] = true;
          }
          // Workshop buổi chiều
          else if (startTimePart === '12:30' || startTimePart === '15:00') {
            // Đánh dấu cả 2 khung giờ buổi chiều
            masterBusyByDay[scheduleDate]['12:30'][masterId] = true;
            masterBusyByDay[scheduleDate]['15:00'][masterId] = true;
          }
        } 
        // XỬ LÝ CÁC LOẠI LỊCH KHÁC
        else {
          // Xác định khung giờ bị ảnh hưởng
          if (startTimePart === '07:00') {
            masterBusyByDay[scheduleDate]['07:00'][masterId] = true;
          } else if (startTimePart === '09:30') {
            masterBusyByDay[scheduleDate]['09:30'][masterId] = true;
          } else if (startTimePart === '12:30') {
            masterBusyByDay[scheduleDate]['12:30'][masterId] = true;
          } else if (startTimePart === '15:00') {
            masterBusyByDay[scheduleDate]['15:00'][masterId] = true;
          }
        }
      }
      
      // Thêm thông tin vào danh sách thời gian không khả dụng
      unavailableTimesMap[scheduleDate].push({
        masterScheduleId: schedule.masterScheduleId || `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        masterId: schedule.masterId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        type: schedule.type || 'Unknown',
        isFirstHalf: schedule.startTime && ['07:00:00', '09:30:00'].includes(schedule.startTime),
        isSecondHalf: schedule.startTime && ['12:30:00', '15:00:00'].includes(schedule.startTime)
      });
    });
    
    // Bước 2: Đếm số Master bận cho mỗi khung giờ
    Object.keys(masterBusyByDay).forEach(date => {
      Object.keys(masterBusyByDay[date]).forEach(timeSlot => {
        const busyMasters = Object.keys(masterBusyByDay[date][timeSlot]);
        
        // Cập nhật bộ đếm và masterIds
        timeSlotCounts[date][timeSlot].count = busyMasters.length;
        busyMasters.forEach(masterId => {
          timeSlotCounts[date][timeSlot].masterIds.add(masterId);
        });
      });
    });
    
    // Bước 3: Xử lý các ngày có lịch Offline cho tất cả Master
    offlineDates.forEach(dateWithOffline => {
      const mastersWithOfflineSchedule = new Set();
      
      // Tìm tất cả Master có lịch Offline vào ngày này
      schedulesData.forEach(schedule => {
        if (schedule.date && schedule.date.split('T')[0] === dateWithOffline &&
            (schedule.type === "Offline" || schedule.type === "BookingOffline") &&
            (!schedule.startTime || !schedule.endTime)) {
          mastersWithOfflineSchedule.add(schedule.masterId);
        }
      });
      
      // Nếu tất cả Master đều có lịch Offline vào ngày này, đánh dấu cả ngày không khả dụng
      if (mastersWithOfflineSchedule.size === masterCount) {
        unavailableDatesMap[dateWithOffline] = true;
      }
    });
    
    // Bước 4: Kiểm tra và đánh dấu các khung giờ mà tất cả Master đều bận
    Object.keys(timeSlotCounts).forEach(date => {
      let unavailableSlotCount = 0;
      
      // Kiểm tra từng khung giờ
      Object.keys(timeSlotCounts[date]).forEach(timeSlot => {
        const slotInfo = timeSlotCounts[date][timeSlot];
        
        // Xác định xem tất cả Master có bận vào khung giờ này không
        const allMastersBusy = slotInfo.masterIds.size === masterCount;
        
        if (allMastersBusy) {
          unavailableSlotCount++;
          
          // Thêm vào danh sách các slot không khả dụng cho ngày này
          if (!unavailableTimesMap[date]) {
            unavailableTimesMap[date] = [];
          }
          
          // Thêm một mục "BlockedForAllMasters" để đánh dấu khung giờ này bị block cho mọi Master
          unavailableTimesMap[date].push({
            masterScheduleId: `blocked_${date}_${timeSlot}`,
            masterId: 'ALL',
            startTime: `${timeSlot}:00`,
            endTime: timeSlot === '07:00' ? '09:15:00' : 
                     timeSlot === '09:30' ? '11:45:00' : 
                     timeSlot === '12:30' ? '14:45:00' : 
                     '17:15:00',
            type: 'BlockedForAllMasters'
          });
        }
      });
      
      // Nếu tất cả 4 khung giờ đều không khả dụng, đánh dấu cả ngày không khả dụng
      if (unavailableSlotCount === 4) {
        unavailableDatesMap[date] = true;
      }
    });
    
    // Cập nhật state với dữ liệu đã xử lý
    setUnavailableDates(unavailableDatesMap);
    setUnavailableTimes(unavailableTimesMap);
  };

  // Thêm hàm determineAffectedTimeSlots để xác định các khung giờ bị ảnh hưởng
  const determineAffectedTimeSlots = (schedule) => {
    const affectedSlots = [];
    
    if (!schedule.startTime) return affectedSlots;
    
    const startTimePart = schedule.startTime.substring(0, 5);
    
    // Xử lý các trường hợp khác nhau dựa vào loại lịch
    if (schedule.type === "Workshop") {
      // Workshop buổi sáng ảnh hưởng đến CẢ 2 slots buổi sáng (07:00-09:15 và 09:30-11:45)
      if (startTimePart === '07:00') {
        affectedSlots.push('07:00', '09:30');
        
        if (debugMode) {
          console.log(`[Debug] Workshop buổi sáng từ 07:00-09:15 sẽ ảnh hưởng đến cả khung giờ 09:30-11:45`);
        }
      } 
      // Workshop bắt đầu lúc 9:30 cũng ảnh hưởng đến cả buổi sáng (bao gồm 07:00-09:15)
      else if (startTimePart === '09:30') {
        affectedSlots.push('07:00', '09:30');
        
        if (debugMode) {
          console.log(`[Debug] Workshop bắt đầu 09:30 sẽ ảnh hưởng đến cả khung giờ 07:00-09:15`);
        }
      }
      // Workshop buổi chiều ảnh hưởng đến CẢ 2 slots buổi chiều (12:30-14:45 và 15:00-17:15)
      else if (startTimePart === '12:30') {
        affectedSlots.push('12:30', '15:00');
        
        if (debugMode) {
          console.log(`[Debug] Workshop buổi chiều từ 12:30-14:45 sẽ ảnh hưởng đến cả khung giờ 15:00-17:15`);
        }
      }
      // Workshop bắt đầu lúc 15:00 cũng ảnh hưởng đến cả buổi chiều (bao gồm 12:30-14:45)
      else if (startTimePart === '15:00') {
        affectedSlots.push('12:30', '15:00');
        
        if (debugMode) {
          console.log(`[Debug] Workshop bắt đầu 15:00 sẽ ảnh hưởng đến cả khung giờ 12:30-14:45`);
        }
      }
    } else {
      // Đối với các lịch khác, chỉ ảnh hưởng đến slot tương ứng
      if (startTimePart === '07:00') {
        affectedSlots.push('07:00');
      } else if (startTimePart === '09:30') {
        affectedSlots.push('09:30');
      } else if (startTimePart === '12:30') {
        affectedSlots.push('12:30');
      } else if (startTimePart === '15:00') {
        affectedSlots.push('15:00');
      }
    }
    
    return affectedSlots;
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/feng shui.png')} 
        style={styles.backgroundContainer}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(26,0,0,0.9)', 'rgba(139,0,0,0.7)']}
          style={styles.gradient}
        />
        
        {/* Enhanced Header */}
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/online_booking')}
            >
              <Ionicons name="arrow-back-circle" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đặt lịch tư vấn</Text>
            
            {/* Nút debug thay vì refresh */}
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                if (customerInfo?.masterId) {
                  logDebugInfo();
                  fetchMasterSchedules(customerInfo.masterId);
                } else {
                  fetchAllMastersInfo();
                }
              }}
            >
              <Ionicons name="refresh-circle" size={36} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {loadingSchedules ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Đang tải thông tin lịch...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Calendar Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Chọn ngày</Text>
                
                <View style={styles.calendarContainer}>
                  {/* Month Navigation */}
                  <View style={styles.monthNavigation}>
                    <TouchableOpacity 
                      style={styles.monthButton}
                      onPress={handlePrevMonth}
                    >
                      <Ionicons name="chevron-back-circle" size={28} color="#8B0000" />
                    </TouchableOpacity>
                    
                    <Text style={styles.monthYearText}>
                      {months[currentMonth]} {currentYear}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.monthButton}
                      onPress={handleNextMonth}
                    >
                      <Ionicons name="chevron-forward-circle" size={28} color="#8B0000" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Weekday headers */}
                  <View style={styles.weekdayHeader}>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                      <Text key={i} style={styles.weekdayText}>{day}</Text>
                    ))}
                  </View>
                  
                  {/* Date Grid */}
                  <View style={styles.dateGrid}>
                    {generateCalendarDates().map((day, index) => {
                      if (day === null) {
                        return <View key={`empty-${index}`} style={styles.dateCell} />;
                      }
                      
                      // Check if it's today
                      const isToday = day === currentDay && 
                           currentMonth === currentMonthActual && 
                           currentYear === currentYearActual;
                      
                      // Check if it's a past date (include today)
                      const isPastDate = (currentYear < currentYearActual) || 
                        (currentYear === currentYearActual && currentMonth < currentMonthActual) || 
                        (currentYear === currentYearActual && currentMonth === currentMonthActual && day <= currentDay);
                      
                      // Check if it's selected
                      const dateString = `${currentMonth + 1}/${day}/${currentYear}`;
                      const isSelected = selectedDate === dateString;
                      
                      // Check if date is unavailable
                      const formattedDate = formatDateString(new Date(currentYear, currentMonth, day));
                      const isUnavailable = unavailableDates[formattedDate];
                      
                      return (
                        <TouchableOpacity
                          key={`day-${day}`}
                          style={[
                            styles.dateCell,
                            isPastDate && styles.pastDateCell,
                            isUnavailable && styles.unavailableCell
                          ]}
                          onPress={() => {
                            if (!isPastDate && !isUnavailable) {
                              selectDate(day);
                            } else if (isToday) {
                              Alert.alert("Thông báo", "Không thể chọn ngày hôm nay. Vui lòng chọn ngày khác.");
                            } else if (isUnavailable) {
                              // Đã bị vô hiệu hóa, không cần hiển thị alert
                              // Alert.alert("Thông báo", "Ngày này không khả dụng. Vui lòng chọn ngày khác.");
                            }
                          }}
                          disabled={isPastDate || isUnavailable}
                        >
                          <View style={[
                            styles.dateCellInner,
                            isToday && styles.todayCell,
                            isSelected && styles.selectedCell,
                            isUnavailable && styles.unavailableCellInner
                          ]}>
                            <Text style={[
                              styles.dateText,
                              isToday && styles.todayText,
                              isSelected && styles.selectedText,
                              isPastDate && styles.pastDateText,
                              isUnavailable && styles.unavailableText
                            ]}>
                              {day}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
              
              {/* Time Selection Card */}
              {selectedDate && (
                <View style={styles.timeSelectionCard}>
                  <Text style={styles.cardTitle}>Chọn thời gian tư vấn</Text>
                  
                  {/* Selected Date Display */}
                  <View style={styles.selectedDateBanner}>
                    <LinearGradient
                      colors={['#8B0000', '#600000']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.dateBannerGradient}
                    >
                      <Ionicons name="calendar" size={22} color="#FFFFFF" />
                      <Text style={styles.selectedDateText}>
                        {formatDisplayDate(selectedDate)}
                      </Text>
                    </LinearGradient>
                  </View>
                  
                  {/* Start Time Selection */}
                  <View style={styles.timeSelectionSection}>
                    <View style={styles.timeLabelContainer}>
                      <Ionicons name="time-outline" size={18} color="#8B0000" />
                      <Text style={styles.timeLabel}>Thời gian bắt đầu</Text>
                    </View>
                    
                    {/* Horizontal Time Slot Picker */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.timeSlotScrollView}
                      contentContainerStyle={styles.timeSlotContainer}
                    >
                      {getAvailableStartTimes().map((timeOption) => {
                        return (
                          <TouchableOpacity
                            key={timeOption.key}
                            style={[
                              styles.timeSlotCard,
                              selectedStartTime === timeOption.key && styles.timeSlotCardSelected,
                              timeOption.isBooked && styles.timeSlotCardDisabled,
                              !timeOption.isAvailable && !timeOption.isBooked && styles.timeSlotCardDisabled
                            ]}
                            onPress={() => handleStartTimeChange(timeOption.key, timeOption.endTime)}
                            onLongPress={() => showTimeSlotDebugInfo(timeOption)}
                            disabled={!timeOption.isAvailable}
                          >
                            <LinearGradient
                              colors={getSlotColor(timeOption).background}
                              style={styles.timeSlotGradient}
                            >
                              <Text style={[
                                styles.timeSlotText,
                                selectedStartTime === timeOption.key && styles.timeSlotTextSelected,
                                timeOption.isBooked && styles.timeSlotTextDisabled,
                                !timeOption.isAvailable && !timeOption.isBooked && styles.timeSlotTextDisabled
                              ]}>
                                {timeOption.label}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                  
                  {/* Booking Summary - Show when all selections are made */}
                  {selectedDate && selectedStartTime && selectedEndTime && (
                    <View style={styles.bookingSummaryContainer}>
                      <LinearGradient
                        colors={['rgba(139,0,0,0.05)', 'rgba(139,0,0,0.15)']}
                        style={styles.summaryGradient}
                      >
                        <View style={styles.summaryHeader}>
                          <Ionicons name="checkmark-circle" size={24} color="#8B0000" />
                          <Text style={styles.summaryTitle}>Thông tin lịch hẹn</Text>
                        </View>
                        
                        <View style={styles.summaryDetails}>
                          <View style={styles.summaryRow}>
                            <Ionicons name="calendar-outline" size={18} color="#8B0000" />
                            <Text style={styles.summaryText}>Ngày: {formatDisplayDate(selectedDate)}</Text>
                          </View>
                          
                          <View style={styles.summaryRow}>
                            <Ionicons name="time-outline" size={18} color="#8B0000" />
                            <Text style={styles.summaryText}>Thời gian: {selectedStartTime} - {selectedEndTime}</Text>
                          </View>
                          
                          <View style={styles.summaryRow}>
                            <Ionicons name="hourglass-outline" size={18} color="#8B0000" />
                            <Text style={styles.summaryText}>
                              Thời lượng: {calculateDuration(selectedStartTime, selectedEndTime)} phút
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  )}
                </View>
              )}
              
              {/* Book Button */}
              <TouchableOpacity
                style={[
                  styles.bookButton,
                  (!selectedDate || !selectedStartTime || !selectedEndTime) && styles.bookButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
              >
                <LinearGradient
                  colors={['#8B0000', '#6B0000']}
                  style={styles.bookButtonGradient}
                >
                  <Text style={styles.bookButtonText}>Xác nhận đặt lịch</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  backgroundContainer: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.25,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  refreshButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A0000',
    marginBottom: 16,
  },
  calendarContainer: {
    marginTop: 5,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  monthButton: {
    padding: 5,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A0000',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 30,
    textAlign: 'center',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCellInner: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#333333',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  todayText: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: '#8B0000',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pastDateCell: {
    opacity: 0.5,
  },
  pastDateText: {
    color: '#999999',
  },
  dateSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dateSelectedText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
    fontWeight: '500',
  },
  timeSelectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedDateBanner: {
    marginVertical: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dateBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  timeSelectionSection: {
    marginBottom: 20,
  },
  timeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginLeft: 8,
  },
  timeSlotScrollView: {
    marginTop: 10,
  },
  timeSlotContainer: {
    paddingBottom: 10,
  },
  timeSlotCard: {
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeSlotGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotCardSelected: {
    transform: [{scale: 1.05}],
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bookingSummaryContainer: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryGradient: {
    borderRadius: 12,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B0000',
    marginLeft: 10,
  },
  summaryDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryText: {
    color: '#333333',
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '500',
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 30,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  fallbackMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  unavailableCell: {
    opacity: 0.5,
  },
  unavailableCellInner: {
    backgroundColor: 'rgba(211, 47, 47, 0.2)',
  },
  unavailableText: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  timeSlotCardDisabled: {
    opacity: 0.5,
  },
  timeSlotTextDisabled: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  timeSlotCardBooked: {
    opacity: 0.5,
  },
  timeSlotTextBooked: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  fixedEndTimeContainer: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fixedEndTimeGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fixedEndTimeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Add this helper function somewhere in your component
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
};

