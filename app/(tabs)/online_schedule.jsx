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
      
      for (let i = 0; i < 30; i++) {
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

  // Reset trạng thái khi màn hình được focus lại
  useFocusEffect(
    useCallback(() => {
      // Reset các state về giao diện khi màn hình được focus lại
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
      
      // Tạm thời bỏ phần re-fetch dữ liệu khi focus lại
      // Dữ liệu sẽ được refresh khi masterId thay đổi thông qua useEffect ở trên
      
      return () => {
        // Cleanup function (nếu cần)
      };
    }, [])
  );

  // Cập nhật useEffect cho lần fetch đầu tiên
  useEffect(() => {
    // Kiểm tra xem masterId có thay đổi hay không
    const currentMasterId = customerInfo?.masterId || null;
    const isMasterChanged = prevMasterIdRef.current !== currentMasterId;
    
    if (isMasterChanged) {
      console.log(`[Master Changed] Từ ${prevMasterIdRef.current} sang ${currentMasterId}`);
      // Reset flag để kích hoạt fetch lại dữ liệu
      apiCalledRef.current = false;
    }
    
    // Cập nhật masterId trước đó
    prevMasterIdRef.current = currentMasterId;

    // Ngăn không cho effect gọi lại nhiều lần
    if (apiCalledRef.current && !isMasterChanged) {
      return;
    }

    console.log(`[Fetch] Đang tải lịch cho master: ${customerInfo?.masterId || 'tất cả'}`);

    const fetchMasterSchedules = async () => {
      if (loadingSchedules || isFetchingRef.current) return; // Ngăn gọi API khi đang loading hoặc đang fetch
      
      setLoadingSchedules(true);
      apiCalledRef.current = true;
      isFetchingRef.current = true;
      lastFetchTimeRef.current = Date.now();
      
      try {
        // Reset các state khi fetch dữ liệu mới
        setSelectedDate(null);
        setSelectedDateObj(null);
        setSelectedStartTime(null);
        setSelectedEndTime(null);
        setUnavailableDates({});
        setUnavailableTimes({});

        let scheduleData = [];
        
        if (customerInfo?.masterId && customerInfo.masterId !== 'null') {
          // Nếu đã chọn master cụ thể, lấy lịch của master đó
          try {
            console.log(`Đang lấy lịch của master với ID: ${customerInfo.masterId}`);
            scheduleData = await consultingAPI.getMasterScheduleById(customerInfo.masterId);
            console.log(`Đã lấy lịch của master thành công: ${scheduleData.length} mục`);
          } catch (error) {
            console.error(`Lỗi khi lấy lịch của master ${customerInfo.masterId}:`, error);
            setApiError(error.message || "Lỗi khi lấy lịch master");
            setUseFallbackData(true);
            // Sử dụng dữ liệu mẫu nếu API không hoạt động
            scheduleData = [];
          }
        } else {
          // Nếu không chọn master cụ thể, lấy lịch của tất cả master
          try {
            console.log("Đang lấy lịch của tất cả master");
            scheduleData = await consultingAPI.getAllMasterSchedules();
            console.log(`Đã lấy lịch của tất cả master thành công: ${scheduleData.length} mục`);
          } catch (error) {
            console.error('Lỗi khi lấy lịch của tất cả các master:', error);
            setApiError(error.message || "Lỗi khi lấy lịch master");
            setUseFallbackData(true);
            // Sử dụng dữ liệu mẫu nếu API không hoạt động
            scheduleData = [];
          }
        }
        
        setMasterSchedules(scheduleData);
        
        // Xử lý dữ liệu lịch để xác định ngày và giờ không khả dụng
        const unavailableDatesMap = {};
        const unavailableTimesMap = {};
        const mastersByDatesMap = {}; // Lưu trữ masterIds theo ngày
        const mastersByTimesMap = {}; // Lưu trữ masterIds theo ngày và khung giờ
        const allMasterIds = new Set(); // Lưu trữ tất cả các masterId độc nhất
        
        if (useFallbackData) {
          console.log("Đang sử dụng dữ liệu mẫu cho lịch");
          // Sử dụng dữ liệu mẫu từ constants/consulting.js nếu API không hoạt động
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(today.getDate() + 2);
          
          // Tạo dữ liệu mẫu cho 3 ngày tiếp theo
          const sampleDates = [
            formatDateString(today),
            formatDateString(tomorrow),
            formatDateString(dayAfterTomorrow)
          ];
          
          // Tạo các slot khả dụng cho các ngày mẫu
          sampleDates.forEach(date => {
            if (!unavailableTimesMap[date]) {
              unavailableTimesMap[date] = [];
            }
            
            // Thêm một số slot mẫu (các slot khả dụng)
            unavailableTimesMap[date].push(
              { startTime: '09:00:00', endTime: '10:00:00' },
              { startTime: '10:30:00', endTime: '11:30:00' },
              { startTime: '14:00:00', endTime: '15:00:00' },
              { startTime: '16:00:00', endTime: '17:00:00' }
            );
          });
        } else if (scheduleData.length > 0) {
          console.log(`Đang xử lý ${scheduleData.length} lịch trình từ API`);
          
          // Trước tiên, thu thập tất cả các masterId
          scheduleData.forEach(schedule => {
            if (schedule.masterId) {
              allMasterIds.add(schedule.masterId.trim());
            }
          });
          
          console.log(`Số lượng master tìm thấy: ${allMasterIds.size}`);
          
          // Sau đó tổ chức dữ liệu theo ngày và masterId
          scheduleData.forEach(schedule => {
            const { date, startTime, endTime, type, masterId } = schedule;
            const trimmedMasterId = masterId ? masterId.trim() : null;
            
            if (!date || !trimmedMasterId) return;
            
            // Lưu trữ thông tin master theo ngày
            if (!mastersByDatesMap[date]) {
              mastersByDatesMap[date] = {
                offline: new Set(),
                online: new Set()
              };
            }
            
            if (type === 'Offline') {
              mastersByDatesMap[date].offline.add(trimmedMasterId);
            } else if (type === 'Online' || type === 'Workshop') {
              mastersByDatesMap[date].online.add(trimmedMasterId);
              
              // Nếu có thời gian cụ thể, lưu trữ theo khung giờ
              if (startTime && endTime) {
                if (!mastersByTimesMap[date]) {
                  mastersByTimesMap[date] = {};
                }
                
                const timeKey = `${startTime}-${endTime}`;
                if (!mastersByTimesMap[date][timeKey]) {
                  mastersByTimesMap[date][timeKey] = new Set();
                }
                
                mastersByTimesMap[date][timeKey].add(trimmedMasterId);
              }
            }
          });
          
          // Kiểm tra từng ngày và đánh dấu ngày không khả dụng nếu tất cả master đều có lịch offline
          for (const [date, masters] of Object.entries(mastersByDatesMap)) {
            if (masters.offline.size === allMasterIds.size) {
              // Tất cả master đều có lịch offline vào ngày này
              unavailableDatesMap[date] = true;
              console.log(`Ngày ${date} không khả dụng vì tất cả master đều có lịch offline`);
            } else {
              console.log(`Ngày ${date} vẫn khả dụng: ${masters.offline.size}/${allMasterIds.size} master có lịch offline`);
            }
          }
          
          // Xử lý các khung giờ bận cho từng ngày
          // Lưu ý: Giờ không còn đánh dấu là "không khả dụng" mà chỉ lưu trữ các khung giờ đã bận
          for (const [date, timeslots] of Object.entries(mastersByTimesMap)) {
            // Bỏ qua ngày không khả dụng
            if (unavailableDatesMap[date]) continue;
            
            if (!unavailableTimesMap[date]) {
              unavailableTimesMap[date] = [];
            }
            
            for (const [timeKey, masters] of Object.entries(timeslots)) {
              const [startTime, endTime] = timeKey.split('-');
              
              // Lưu lại tất cả các khung giờ đã đặt, không phân biệt số lượng master
              // Để sử dụng logic mới: cộng 5 phút vào khung giờ kết thúc thay vì loại bỏ khung giờ
              unavailableTimesMap[date].push({ startTime, endTime });
              console.log(`Đã lưu khung giờ ${startTime}-${endTime} ngày ${date} để xử lý với logic mới`);
            }
          }
        }
        
        setUnavailableDates(unavailableDatesMap);
        setUnavailableTimes(unavailableTimesMap);
      } catch (error) {
        console.error('Lỗi khi xử lý lịch master:', error);
        setApiError(error.message || "Lỗi khi xử lý dữ liệu");
        setUseFallbackData(true);
      } finally {
        setLoadingSchedules(false);
        isFetchingRef.current = false;
      }
    };
    
    fetchMasterSchedules();
  }, [customerInfo?.masterId]); // Chỉ phụ thuộc vào masterId, không phải toàn bộ customerInfo

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

  // Sửa lại hàm generateStartTimeOptions để loại bỏ giờ nghỉ trưa và 11:30 khi không có endTime phù hợp
  const generateStartTimeOptions = (formattedDate) => {
    // Khung giờ mặc định (đã loại bỏ 12:00-13:00)
    const defaultStartTimes = [
      {key: '08:00', value: '08:00'},
      {key: '08:30', value: '08:30'},
      {key: '09:00', value: '09:00'},
      {key: '09:30', value: '09:30'},
      {key: '10:00', value: '10:00'},
      {key: '10:30', value: '10:30'},
      {key: '11:00', value: '11:00'},
      {key: '11:30', value: '11:30'}, // Sẽ được kiểm tra để loại bỏ nếu cần
      // Loại bỏ 12:00-12:30
      {key: '13:00', value: '13:00'},
      {key: '13:30', value: '13:30'},
      {key: '14:00', value: '14:00'},
      {key: '14:30', value: '14:30'},
      {key: '15:00', value: '15:00'},
      {key: '15:30', value: '15:30'},
      {key: '16:00', value: '16:00'},
      {key: '16:30', value: '16:30'},
      {key: '17:00', value: '17:00'},
      {key: '17:30', value: '17:30'},
    ];

    // Loại bỏ 11:30 vì không thể có khung giờ kết thúc phù hợp (sẽ chạy vào giờ nghỉ trưa)
    const filteredStartTimes = defaultStartTimes.filter(time => time.key !== '11:30');

    // Nếu không có dữ liệu ngày hoặc không có lịch đã đặt, trả về danh sách đã lọc
    if (!formattedDate || !unavailableTimes[formattedDate] || unavailableTimes[formattedDate].length === 0 || useFallbackData) {
      return filteredStartTimes.map(time => ({
        ...time,
        isAvailable: true,
        isBooked: false
      }));
    }

    // Lấy danh sách các khung thời gian đã đặt từ unavailableTimes
    const bookedSlots = unavailableTimes[formattedDate].map(slot => {
      return {
        startTime: slot.startTime.substring(0, 5), // Lấy "HH:MM" từ "HH:MM:SS"
        endTime: slot.endTime.substring(0, 5),     // Lấy "HH:MM" từ "HH:MM:SS"
      };
    });

    // Sắp xếp các khung giờ đã đặt theo thứ tự thời gian
    bookedSlots.sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    // Tạo một danh sách mới bao gồm các khung giờ đã lọc + khung giờ sau khi cộng 5 phút từ các lịch đã đặt
    let allTimeOptions = [...filteredStartTimes];
    
    // Thêm các khung giờ bắt đầu sau khi cộng thêm 5 phút từ các lịch kết thúc
    bookedSlots.forEach(slot => {
      const endTimeMinutes = timeToMinutes(slot.endTime);
      const newStartTimeMinutes = endTimeMinutes + 5;
      
      // Làm tròn đến bội số của 5 phút nếu cần
      const roundedMinutes = Math.ceil(newStartTimeMinutes % 60 / 5) * 5;
      const adjustedMinutes = (Math.floor(newStartTimeMinutes / 60) * 60) + roundedMinutes;
      
      const newStartTime = minutesToTime(adjustedMinutes);
      
      // Chỉ thêm vào nếu thời gian nằm trong khoảng hợp lệ (8:00-18:00) và KHÔNG phải giờ nghỉ trưa (12:00-13:00)
      const newStartHour = parseInt(newStartTime.split(':')[0], 10);
      const newStartMinute = parseInt(newStartTime.split(':')[1], 10);
      
      // Loại bỏ khung giờ nghỉ trưa và 11:30
      const isLunchHour = (newStartHour === 12);
      const isNearLunch = (newStartHour === 11 && newStartMinute === 30);
      
      if ((newStartHour >= 8 && newStartHour < 11) || 
          (newStartHour === 11 && newStartMinute < 30) || 
          (newStartHour >= 13 && newStartHour < 18)) {
        // Kiểm tra nếu thời gian này đã tồn tại trong danh sách
        const exists = allTimeOptions.some(option => option.key === newStartTime);
        if (!exists) {
          allTimeOptions.push({
            key: newStartTime,
            value: newStartTime
          });
        }
      }
    });
    
    // Sắp xếp tất cả các tùy chọn thời gian theo thứ tự tăng dần
    allTimeOptions.sort((a, b) => {
      return timeToMinutes(a.key) - timeToMinutes(b.key);
    });

    // Bây giờ đánh dấu tất cả các khung giờ là khả dụng, không khả dụng hoặc đã đặt
    return allTimeOptions.map(timeOption => {
      // Kiểm tra xem khung giờ này có trùng với thời gian bắt đầu của lịch đã đặt không
      const isExactBookedTime = bookedSlots.some(slot => slot.startTime === timeOption.key);
      
      // Kiểm tra xem khung giờ này có nằm trong khoảng thời gian của một lịch đã đặt không
      const isInBookedTimeRange = bookedSlots.some(slot => {
        const slotStartMinutes = timeToMinutes(slot.startTime);
        const slotEndMinutes = timeToMinutes(slot.endTime);
        const timeMinutes = timeToMinutes(timeOption.key);
        
        // Kiểm tra nếu thời gian nằm trong khoảng từ bắt đầu đến kết thúc (bao gồm cả thời điểm kết thúc)
        return timeMinutes >= slotStartMinutes && timeMinutes <= slotEndMinutes;
      });
      
      // Kiểm tra xem khung giờ bắt đầu này có làm chồng lấp với lịch đã đặt không
      const wouldOverlapWithExisting = bookedSlots.some(slot => {
        const timeMinutes = timeToMinutes(timeOption.key);
        const slotStartMinutes = timeToMinutes(slot.startTime);
        const slotEndMinutes = timeToMinutes(slot.endTime);
        
        // Một cuộc hẹn 30 phút bắt đầu từ thời điểm này sẽ chồng lấp nếu:
        // 1. Thời điểm bắt đầu nằm trong khoảng (slotStart-30p, slotEnd)
        return timeMinutes > slotStartMinutes - 30 && timeMinutes < slotEndMinutes;
      });
      
      // Khung giờ không khả dụng nếu nó đã bị đặt hoặc sẽ gây chồng lấp
      const isAvailable = !isExactBookedTime && !isInBookedTimeRange && !wouldOverlapWithExisting;
      
      return {
        ...timeOption,
        isAvailable: isAvailable,
        isBooked: isExactBookedTime || isInBookedTimeRange  // Đánh dấu cả khung giờ đã đặt và nằm trong khoảng thời gian đã đặt
      };
    });
  };

  // Sửa lại hàm getEndTimeOptions để lọc ra các endTimes khả dụng
  const getEndTimeOptions = (startTime) => {
    if (!startTime) return [];
    
    // Parse the start time
    const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num, 10));
    const startTimeMinutes = startHour * 60 + startMinute;
    
    const endTimeOptions = [];
    
    // Add options in 30-minute increments, at least 30 mins, at most 2 hours
    for (let minutes = 30; minutes <= 120; minutes += 30) {
      const totalMinutes = startTimeMinutes + minutes;
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;
      
      // Skip lunch break (12:00-13:00) and after 18:00
      if ((endHour === 12) || endHour > 18) continue;
      
      // Kiểm tra thêm cho các trường hợp khung giờ bắt đầu trước 12:00 nhưng kết thúc sau 12:00
      // Ví dụ: bắt đầu 11:40, kết thúc 12:10 -> không hợp lệ
      if (startHour < 12 && endHour >= 12) continue;
      
      const formattedEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Kiểm tra xem thời gian kết thúc này có khả dụng hay không
      const formattedDate = selectedDateObj ? 
        formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day)) :
        null;
        
      // Thêm thông tin về sự khả dụng và đã bận
      const available = isTimeSlotAvailable(formattedEndTime, formattedDate, false);
      
      // Kiểm tra xem có phải là giờ kết thúc đã bận
      const isBooked = formattedDate && unavailableTimes[formattedDate] ? 
        unavailableTimes[formattedDate].some(slot => 
          slot.endTime.substring(0, 5) === formattedEndTime
        ) : false;
        
      // Kiểm tra xem thời gian này có nằm trong khoảng thời gian của một lịch đã đặt không
      const isInBookedSlot = formattedDate && unavailableTimes[formattedDate] ? 
        unavailableTimes[formattedDate].some(slot => {
          const slotStartMinutes = timeToMinutes(slot.startTime);
          const slotEndMinutes = timeToMinutes(slot.endTime);
          const timeMinutes = timeToMinutes(formattedEndTime + ":00");
          return timeMinutes > slotStartMinutes && timeMinutes <= slotEndMinutes;
        }) : false;
      
      const bookedStatus = isBooked || isInBookedSlot;
        
      endTimeOptions.push({
        key: formattedEndTime, 
        value: formattedEndTime,
        isAvailable: available,
        isBooked: bookedStatus
      });
    }
    
    // Nếu không có khung giờ kết thúc khả dụng với các lựa chọn 30 phút tiêu chuẩn
    // tạo thêm các tùy chọn phù hợp dựa trên các khung giờ bận
    if (endTimeOptions.length === 0 && selectedDateObj) {
      const formattedDate = formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day));
      
      if (formattedDate && unavailableTimes[formattedDate] && unavailableTimes[formattedDate].length > 0) {
        // Lấy danh sách các slot đã đặt
        const bookedSlots = unavailableTimes[formattedDate].map(slot => {
          return {
            startTime: slot.startTime.substring(0, 5), // "HH:MM" từ "HH:MM:SS"
            endTime: slot.endTime.substring(0, 5),     // "HH:MM" từ "HH:MM:SS"
            startTimeMinutes: timeToMinutes(slot.startTime.substring(0, 5)),
            endTimeMinutes: timeToMinutes(slot.endTime.substring(0, 5))
          };
        });
        
        // Sắp xếp các slot theo thời gian bắt đầu
        bookedSlots.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
        
        // Tìm slot tiếp theo gần nhất sau thời gian bắt đầu đã chọn
        const selectedStartTimeMinutes = timeToMinutes(startTime);
        let nextBookedSlot = null;
        
        for (const slot of bookedSlots) {
          if (slot.startTimeMinutes > selectedStartTimeMinutes) {
            nextBookedSlot = slot;
            break;
          }
        }
        
        if (nextBookedSlot) {
          // Nếu có slot tiếp theo, tạo khung giờ kết thúc trước khi slot đó bắt đầu
          // Trừ 5 phút giải lao
          const maxEndTimeMinutes = nextBookedSlot.startTimeMinutes - 5;
          const minEndTimeMinutes = selectedStartTimeMinutes + 30; // Ít nhất 30 phút
          
          // Chỉ tạo option nếu còn đủ thời gian (ít nhất 30 phút)
          if (maxEndTimeMinutes > minEndTimeMinutes) {
            // Làm tròn xuống đến bội số của 5 phút
            const roundedMinutes = Math.floor((maxEndTimeMinutes - selectedStartTimeMinutes) / 5) * 5;
            const adjustedMaxEndMinutes = selectedStartTimeMinutes + roundedMinutes;
            
            // Đảm bảo thời gian kết thúc không quá 2 giờ sau khi bắt đầu
            const maxDurationMinutes = Math.min(120, roundedMinutes);
            
            // Tạo các option với các khoảng thời gian 30 phút
            for (let minutes = 30; minutes <= maxDurationMinutes; minutes += 30) {
              const endTimeMinutes = selectedStartTimeMinutes + minutes;
              if (endTimeMinutes <= adjustedMaxEndMinutes) {
                const endTime = minutesToTime(endTimeMinutes);
                
                // Kiểm tra thời gian không nằm trong giờ trưa (12:00-13:00) và không quá 18:00
                const endHour = Math.floor(endTimeMinutes / 60);
                // Kiểm tra thêm cho trường hợp bắt đầu trước 12:00 và kết thúc sau 12:00
                if (endHour !== 12 && endHour <= 18 && !(startHour < 12 && endHour >= 12)) {
                  const isBookedTime = bookedSlots.some(slot => 
                    slot.endTime === endTime
                  );
                  
                  endTimeOptions.push({
                    key: endTime, 
                    value: endTime,
                    isAvailable: true,
                    isBooked: isBookedTime
                  });
                }
              }
            }
          }
        } else {
          // Nếu không có slot tiếp theo, có thể đặt đến tối đa 18:00
          const maxEndTimeHour = 18;
          const maxEndTimeMinutes = maxEndTimeHour * 60;
          const minEndTimeMinutes = selectedStartTimeMinutes + 30; // Ít nhất 30 phút
          
          // Chỉ tạo option nếu còn đủ thời gian (ít nhất 30 phút)
          if (maxEndTimeMinutes > minEndTimeMinutes) {
            // Đảm bảo thời gian kết thúc không quá 2 giờ sau khi bắt đầu
            const maxDurationMinutes = Math.min(120, maxEndTimeMinutes - selectedStartTimeMinutes);
            
            // Tạo các option với các khoảng thời gian 30 phút
            for (let minutes = 30; minutes <= maxDurationMinutes; minutes += 30) {
              const endTimeMinutes = selectedStartTimeMinutes + minutes;
              if (endTimeMinutes <= maxEndTimeMinutes) {
                const endTime = minutesToTime(endTimeMinutes);
                
                // Kiểm tra thời gian không nằm trong giờ trưa và bắt đầu trước 12:00, kết thúc sau 12:00
                const endHour = Math.floor(endTimeMinutes / 60);
                if (endHour !== 12 && !(startHour < 12 && endHour >= 12)) {
                  const isBookedTime = bookedSlots.some(slot => 
                    slot.endTime === endTime
                  );
                  
                  endTimeOptions.push({
                    key: endTime, 
                    value: endTime,
                    isAvailable: true,
                    isBooked: isBookedTime
                  });
                }
              }
            }
          }
        }
      }
    }
    
    return endTimeOptions;
  };

  // Modify the date selection logic to properly handle date selection
  const selectDate = (day) => {
    if (!day) return; // Skip if null (empty cell)
    
    // Create a proper date string in MM/DD/YYYY format
    const dateString = `${currentMonth + 1}/${day}/${currentYear}`;
    
    // Format date to YYYY-MM-DD to check availability
    const formattedDate = formatDateString(new Date(currentYear, currentMonth, day));
    
    // Check if date is unavailable - nhưng không cần hiển thị Alert vì đã disable UI
    if (unavailableDates[formattedDate]) {
      return; // Không làm gì cả, ngày này đã bị vô hiệu hóa trong UI
    }
    
    // Create a date object for the selected date
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    // Set the selected date and date object
    setSelectedDate(dateString);
    setSelectedDateObj({
      dateString: dateString,
      day: day,
      month: currentMonth + 1,
      year: currentYear,
      fullDate: selectedDate
    });
    
    // Reset time selections when a new date is selected
    setSelectedStartTime(null);
    setSelectedEndTime(null);
  };
  
  // Sửa lại handleStartTimeChange để không hiển thị alert mà chỉ kiểm tra tính khả dụng
  const handleStartTimeChange = (time) => {
    // Format date to YYYY-MM-DD to check availability
    const formattedDate = selectedDateObj ? 
      formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day)) :
      null;
    
    // Không cần kiểm tra và hiển thị alert - đã disable các time slots không khả dụng
    setSelectedStartTime(time);
    setSelectedEndTime(null); // Reset end time when start time changes
  };
  
  const validateTimes = (start, end) => {
    if (!start || !end) return false;
    
    // Parse the times
    const [startHour, startMinute] = start.split(':').map(num => parseInt(num, 10));
    const [endHour, endMinute] = end.split(':').map(num => parseInt(num, 10));
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    // Ensure end time is after start time
    if (endTotalMinutes <= startTotalMinutes) {
      Alert.alert("Lỗi", "Thời gian kết thúc phải sau thời gian bắt đầu");
      return false;
    }
    
    // Ensure duration is at least 30 minutes
    if (durationMinutes < 30) {
      Alert.alert("Lỗi", "Thời gian tư vấn tối thiểu là 30 phút");
      return false;
    }
    
    // Ensure duration is at most 2 hours
    if (durationMinutes > 120) {
      Alert.alert("Lỗi", "Thời gian tư vấn tối đa là 2 giờ");
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      // Kiểm tra các trường bắt buộc
      if (!selectedDateObj || !selectedStartTime || !selectedEndTime) {
        Alert.alert(
          "Thông báo",
          "Vui lòng chọn đầy đủ ngày và giờ tư vấn"
        );
        return;
      }

      // Format lại bookingDate để có dạng YYYY-MM-DD
      const bookingDate = formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day));
      
      // Format lại startTime và endTime để có thêm :00 ở cuối
      const formattedStartTime = `${selectedStartTime}:00`;
      const formattedEndTime = `${selectedEndTime}:00`;

      // Chỉ gửi các trường cần thiết theo yêu cầu của API
      const bookingData = {
        masterId: customerInfo.masterId === 'null' ? null : customerInfo.masterId,
        description: customerInfo.description,
        bookingDate: bookingDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };

      console.log('Request data:', bookingData);
      console.log('API URL:', `${API_CONFIG.baseURL}/api/Booking/create`);

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

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.data.isSuccess) {
        const bookingId = response.data.data.bookingOnlineId;
        Alert.alert(
          "Thành công",
          "Đặt lịch tư vấn thành công!",
          [
            {
              text: "OK",
              onPress: () => {
                router.push({
                  pathname: '/(tabs)/online_checkout',
                  params: {
                    bookingId: bookingId
                  }
                });
              }
            }
          ]
        );
      } else {
        // Nếu có message từ response
        Alert.alert(
          "Thông báo",
          response.data.message || "Không thể tạo booking"
        );
      }
    } catch (error) {
      // Hiển thị message lỗi trong Alert
      Alert.alert(
        "Thông báo",
        error.response?.data?.message || error.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau."
      );

      // Nếu là lỗi pending payment, có thể chuyển hướng đến trang thanh toán
      if (error.message?.includes("đang chờ thanh toán")) {
        router.push('/(tabs)/your_booking');
      }
    }
  };

  const getDateStyle = (date) => {
    // Chuyển selectedDate thành ngày để so sánh
    const selectedDay = selectedDate ? parseInt(selectedDate.split('/')[1]) : null;
    
    if (date === selectedDay) {
      return [styles.dateCircle, styles.selected];
    }
    return [styles.dateCircle];
  };

  useEffect(() => {
    // Generate dates for the next 30 days
    const generateDates = () => {
      const datesArray = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        datesArray.push({
          dateString: formatDateString(date),
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          dayName: getDayName(date),
          fullDate: date
        });
      }
      
      return datesArray;
    };
    
    setDates(generateDates());
  }, []);

  // Add this function to render calendar dates with the required styling
  const renderCalendarDates = () => {
    const dates = generateCalendarDates();
    
    return (
      <View style={styles.calendarGrid}>
        {dates.map((day, index) => {
          if (day === null) {
            // Empty cell for padding at start of month
            return <View key={`empty-${index}`} style={styles.dateCell} />;
          }
          
          // Check if it's today
          const isToday = day === currentDay && 
                           currentMonth === currentMonthActual && 
                           currentYear === currentYearActual;
          
          // Check if it's a past date
          const isPastDate = (currentYear < currentYearActual) || 
            (currentYear === currentYearActual && currentMonth < currentMonthActual) || 
            (currentYear === currentYearActual && currentMonth === currentMonthActual && day < currentDay);
          
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
    );
  };

  // Sửa lại hàm isTimeSlotAvailable để kiểm tra xem một khung thời gian có chồng lấp với các lịch hiện có không
  // Và xác định rõ xem đó có phải là khung giờ đã có lịch hay không
  const isTimeSlotAvailable = (time, formattedDate, isStart = true) => {
    if (!formattedDate || !unavailableTimes[formattedDate]) {
      return true; // Nếu không có thông tin về thời gian không khả dụng, coi như khả dụng
    }

    // Kiểm tra khung giờ nghỉ trưa (12:00-13:00)
    const hour = parseInt(time.split(':')[0], 10);
    if (hour === 12) {
      return false; // Giờ nghỉ trưa không khả dụng
    }

    const unavailableSlots = unavailableTimes[formattedDate];
    const timeWithSeconds = `${time}:00`;
    
    // Kiểm tra xem thời gian này có trùng khớp chính xác với một lịch đã đặt hay không
    const isExactBookedTime = unavailableSlots.some(slot => 
      slot.startTime.substring(0, 5) === time
    );
    
    if (useFallbackData) {
      // Khi sử dụng dữ liệu mẫu, logic kiểm tra sẽ ngược lại
      // Kiểm tra nếu time nằm trong bất kỳ khoảng thời gian nào từ dữ liệu mẫu - thì khả dụng
      return unavailableSlots.some(slot => {
        return timeWithSeconds >= slot.startTime && timeWithSeconds < slot.endTime;
      });
    } else {
      const selectedTimeMinutes = timeToMinutes(timeWithSeconds);
      
      if (isStart) {
        // Nếu đây là giờ bắt đầu, kiểm tra xem nó có trùng với một khoảng thời gian không khả dụng không
        for (const slot of unavailableSlots) {
          const slotStartMinutes = timeToMinutes(slot.startTime);
          const slotEndMinutes = timeToMinutes(slot.endTime);
          
          // Nếu thời gian được chọn nằm trong khoảng thời gian của một slot không khả dụng
          if (selectedTimeMinutes >= slotStartMinutes && selectedTimeMinutes < slotEndMinutes) {
            return false;
          }
        }
        
        return true;
      } else {
        // Nếu là giờ kết thúc, cần kiểm tra liệu khoảng thời gian từ giờ bắt đầu đến giờ kết thúc
        // có chồng lấn với bất kỳ khoảng thời gian không khả dụng nào không
        if (!selectedStartTime) return true;
        
        const startTimeWithSeconds = `${selectedStartTime}:00`;
        const startTimeMinutes = timeToMinutes(startTimeWithSeconds);
        
        // Kiểm tra xem giữa thời gian bắt đầu và kết thúc có chứa giờ nghỉ trưa không
        const startHour = Math.floor(startTimeMinutes / 60);
        const endHour = Math.floor(selectedTimeMinutes / 60);
        if (startHour < 12 && endHour >= 12) {
          return false; // Không cho phép lịch hẹn kéo dài qua giờ nghỉ trưa
        }
        
        // Kiểm tra từng khoảng thời gian không khả dụng
        for (const slot of unavailableSlots) {
          const slotStartMinutes = timeToMinutes(slot.startTime);
          const slotEndMinutes = timeToMinutes(slot.endTime);
          
          // Kiểm tra điều kiện chồng lấp
          // Hai khoảng thời gian chồng lấp nếu:
          // (startA < endB) và (endA > startB)
          if (startTimeMinutes < slotEndMinutes && selectedTimeMinutes > slotStartMinutes) {
            return false;
          }
        }
        
        return true;
      }
    }
  };

  // Cập nhật hàm getAvailableStartTimes để trả về tất cả khung giờ (bao gồm cả khung giờ đã bận)
  const getAvailableStartTimes = () => {
    if (!selectedDateObj) return startTimeOptions.map(time => ({ ...time, isAvailable: true }));
    
    const formattedDate = formatDateString(new Date(selectedDateObj.year, selectedDateObj.month - 1, selectedDateObj.day));
    
    // Sử dụng hàm generateStartTimeOptions để lấy danh sách các khung giờ bắt đầu với trạng thái khả dụng
    return generateStartTimeOptions(formattedDate);
  };

  // Generate time slots in 30-minute increments
  const startTimeOptions = [
    {key: '08:00', value: '08:00'},
    {key: '08:30', value: '08:30'},
    {key: '09:00', value: '09:00'},
    {key: '09:30', value: '09:30'},
    {key: '10:00', value: '10:00'},
    {key: '10:30', value: '10:30'},
    {key: '11:00', value: '11:00'},
    // Loại bỏ 11:30 vì không thể có endTime phù hợp (sẽ trùng với giờ nghỉ trưa)
    // Loại bỏ 12:00-12:30 (giờ nghỉ trưa)
    {key: '13:00', value: '13:00'},
    {key: '13:30', value: '13:30'},
    {key: '14:00', value: '14:00'},
    {key: '14:30', value: '14:30'},
    {key: '15:00', value: '15:00'},
    {key: '15:30', value: '15:30'},
    {key: '16:00', value: '16:00'},
    {key: '16:30', value: '16:30'},
    {key: '17:00', value: '17:00'},
    {key: '17:30', value: '17:30'},
  ];

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
              {useFallbackData && (
                <View style={styles.fallbackMessage}>
                  <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.fallbackText}>
                    Đang hiển thị dữ liệu mẫu do không thể kết nối đến máy chủ.
                    {apiError ? `\nLỗi: ${apiError}` : ''}
                  </Text>
                </View>
              )}

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
                      
                      // Check if it's a past date
                      const isPastDate = (currentYear < currentYearActual) || 
                        (currentYear === currentYearActual && currentMonth < currentMonthActual) || 
                        (currentYear === currentYearActual && currentMonth === currentMonthActual && day < currentDay);
                      
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
                              timeOption.isBooked && styles.timeSlotCardBooked,
                              !timeOption.isAvailable && !timeOption.isBooked && styles.timeSlotCardDisabled
                            ]}
                            onPress={() => handleStartTimeChange(timeOption.key)}
                            disabled={!timeOption.isAvailable}
                          >
                            <LinearGradient
                              colors={
                                timeOption.isBooked ? ['#F5F5F5', '#EEEEEE'] :
                                !timeOption.isAvailable ? ['#E0E0E0', '#CCCCCC'] :
                                selectedStartTime === timeOption.key ? 
                                ['#8B0000', '#600000'] : 
                                ['#F8F8F8', '#F0F0F0']
                              }
                              style={styles.timeSlotGradient}
                            >
                              <Text style={[
                                styles.timeSlotText,
                                selectedStartTime === timeOption.key && styles.timeSlotTextSelected,
                                timeOption.isBooked && styles.timeSlotTextBooked,
                                !timeOption.isAvailable && !timeOption.isBooked && styles.timeSlotTextDisabled
                              ]}>
                                {timeOption.value}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                  
                  {/* End Time Selection - Only show when start time is selected */}
                  {selectedStartTime && (
                    <View style={styles.timeSelectionSection}>
                      <View style={styles.timeLabelContainer}>
                        <Ionicons name="time-outline" size={18} color="#8B0000" />
                        <Text style={styles.timeLabel}>Thời gian kết thúc</Text>
                      </View>
                      
                      {/* Horizontal End Time Slot Picker */}
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.timeSlotScrollView}
                        contentContainerStyle={styles.timeSlotContainer}
                      >
                        {getEndTimeOptions(selectedStartTime).map((timeOption) => {
                          return (
                            <TouchableOpacity
                              key={timeOption.key}
                              style={[
                                styles.timeSlotCard,
                                selectedEndTime === timeOption.key && styles.timeSlotCardSelected,
                                timeOption.isBooked && styles.timeSlotCardBooked,
                                !timeOption.isAvailable && !timeOption.isBooked && styles.timeSlotCardDisabled
                              ]}
                              onPress={() => setSelectedEndTime(timeOption.key)}
                              disabled={!timeOption.isAvailable}
                            >
                              <LinearGradient
                                colors={
                                  timeOption.isBooked ? ['#F5F5F5', '#EEEEEE'] :
                                  !timeOption.isAvailable ? ['#E0E0E0', '#CCCCCC'] :
                                  selectedEndTime === timeOption.key ? 
                                  ['#8B0000', '#600000'] : 
                                  ['#F8F8F8', '#F0F0F0']
                                }
                                style={styles.timeSlotGradient}
                              >
                                <Text style={[
                                  styles.timeSlotText,
                                  selectedEndTime === timeOption.key && styles.timeSlotTextSelected,
                                  timeOption.isBooked && styles.timeSlotTextBooked,
                                  !timeOption.isAvailable && !timeOption.isBooked && styles.timeSlotTextDisabled
                                ]}>
                                  {timeOption.value}
                                </Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                  
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 15,
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
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    opacity: 0.7,
  },
  timeSlotTextBooked: {
    color: '#888888',
    fontWeight: '400',
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
