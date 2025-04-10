import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SelectList } from 'react-native-dropdown-select-list';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dates, setDates] = useState([]);
  const [allDates, setAllDates] = useState([]); // Store all generated dates

  // Thêm useFocusEffect để reset state khi màn hình được focus lại
  useFocusEffect(
    useCallback(() => {
      // Reset các state khi màn hình được focus lại
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
      
      return () => {
        // Cleanup function (nếu cần)
      };
    }, [])
  );

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

  // Generate time slots in 30-minute increments
  const startTimeOptions = [
    {key: '08:00', value: '08:00'},
    {key: '08:30', value: '08:30'},
    {key: '09:00', value: '09:00'},
    {key: '09:30', value: '09:30'},
    {key: '10:00', value: '10:00'},
    {key: '10:30', value: '10:30'},
    {key: '11:00', value: '11:00'},
    {key: '11:30', value: '11:30'},
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
  
  // Generate available end times based on selected start time
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
      
      const formattedEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      endTimeOptions.push({key: formattedEndTime, value: formattedEndTime});
    }
    
    return endTimeOptions;
  };
  
  // Modify the date selection logic to properly handle date selection
  const selectDate = (day) => {
    if (!day) return; // Skip if null (empty cell)
    
    // Create a proper date string in MM/DD/YYYY format
    const dateString = `${currentMonth + 1}/${day}/${currentYear}`;
    
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
  
  const handleStartTimeChange = (time) => {
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
          
          return (
            <TouchableOpacity
              key={`day-${day}`}
              style={[
                styles.dateCell,
                isPastDate && styles.pastDateCell
              ]}
              onPress={() => {
                if (!isPastDate) {
                  selectDate(day);
                }
              }}
              disabled={isPastDate}
            >
              <View style={[
                styles.dateCellInner,
                isToday && styles.todayCell,
                isSelected && styles.selectedCell
              ]}>
                <Text style={[
                  styles.dateText,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText,
                  isPastDate && styles.pastDateText
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
                    
                    // Check if it's a past date
                    const isPastDate = (currentYear < currentYearActual) || 
                      (currentYear === currentYearActual && currentMonth < currentMonthActual) || 
                      (currentYear === currentYearActual && currentMonth === currentMonthActual && day < currentDay);
                    
                    // Check if it's selected
                    const dateString = `${currentMonth + 1}/${day}/${currentYear}`;
                    const isSelected = selectedDate === dateString;
                    
                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        style={[
                          styles.dateCell,
                          isPastDate && styles.pastDateCell
                        ]}
                        onPress={() => {
                          if (!isPastDate) {
                            selectDate(day);
                          }
                        }}
                        disabled={isPastDate}
                      >
                        <View style={[
                          styles.dateCellInner,
                          isToday && styles.todayCell,
                          isSelected && styles.selectedCell
                        ]}>
                          <Text style={[
                            styles.dateText,
                            isToday && styles.todayText,
                            isSelected && styles.selectedText,
                            isPastDate && styles.pastDateText
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
                    {startTimeOptions.map((timeOption) => (
                      <TouchableOpacity
                        key={timeOption.key}
                        style={[
                          styles.timeSlotCard,
                          selectedStartTime === timeOption.key && styles.timeSlotCardSelected
                        ]}
                        onPress={() => handleStartTimeChange(timeOption.key)}
                      >
                        <LinearGradient
                          colors={selectedStartTime === timeOption.key ? 
                            ['#8B0000', '#600000'] : 
                            ['#F8F8F8', '#F0F0F0']}
                          style={styles.timeSlotGradient}
                        >
                          <Text style={[
                            styles.timeSlotText,
                            selectedStartTime === timeOption.key && styles.timeSlotTextSelected
                          ]}>
                            {timeOption.value}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
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
                      {getEndTimeOptions(selectedStartTime).map((timeOption) => (
                        <TouchableOpacity
                          key={timeOption.key}
                          style={[
                            styles.timeSlotCard,
                            selectedEndTime === timeOption.key && styles.timeSlotCardSelected
                          ]}
                          onPress={() => setSelectedEndTime(timeOption.key)}
                        >
                          <LinearGradient
                            colors={selectedEndTime === timeOption.key ? 
                              ['#8B0000', '#600000'] : 
                              ['#F8F8F8', '#F0F0F0']}
                            style={styles.timeSlotGradient}
                          >
                            <Text style={[
                              styles.timeSlotText,
                              selectedEndTime === timeOption.key && styles.timeSlotTextSelected
                            ]}>
                              {timeOption.value}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
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
