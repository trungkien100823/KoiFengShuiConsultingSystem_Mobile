import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SelectList } from 'react-native-dropdown-select-list';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // Check if dateString is in YYYY-MM-DD format
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  
  // Already in DD/MM/YYYY format or something else
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
              {item.month}/{item.year}
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

  // Get today's actual date
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthActual = today.getMonth();
  const currentYearActual = today.getFullYear();

  // Example data for booked dates (you would get this from your backend)
  const fullyBookedDates = [2, 6, 13];

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
  
  // Fix the selectDate function to ensure we get complete date information
  const selectDate = (item) => {
    const dateString = `${currentMonth + 1}/${item.dateString}/${currentYear}`;
    console.log('Selected date:', dateString);
    
    setSelectedDate(dateString);
    setSelectedDateObj({
      dateString: dateString,
      day: parseInt(item.dateString),
      month: currentMonth + 1,
      year: currentYear
    });
    
    // Reset time selections
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

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fixedHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/online_booking')}
          >
            <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt lịch tư vấn{'\n'}trực tuyến</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.sectionTitle}>Đặt lịch tư vấn</Text>

          <View style={styles.calendar}>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {months[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              <View style={styles.weekDays}>
                <Text style={styles.weekDay}>CN</Text>
                <Text style={styles.weekDay}>T2</Text>
                <Text style={styles.weekDay}>T3</Text>
                <Text style={styles.weekDay}>T4</Text>
                <Text style={styles.weekDay}>T5</Text>
                <Text style={styles.weekDay}>T6</Text>
                <Text style={styles.weekDay}>T7</Text>
              </View>

              <View style={styles.dates}>
                {generateCalendarDates().map((date, index) => (
                  <View key={index} style={styles.dateCell}>
                    {date && (
                      <TouchableOpacity
                        style={getDateStyle(date)}
                        onPress={() => selectDate({dateString: date.toString()})}
                      >
                        <Text style={styles.dateText}>{date}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {selectedDate && (
            <View style={styles.timeSection}>
              <Text style={styles.dateSelected}>
                Ngày đã chọn: {formatDisplayDate(selectedDate)}
              </Text>
              
              <View style={styles.timeSelectionContainer}>
                <Text style={styles.timeLabel}>Giờ bắt đầu</Text>
                <SelectList
                  setSelected={handleStartTimeChange}
                  data={startTimeOptions}
                  save="key"
                  placeholder="Chọn giờ bắt đầu"
                  boxStyles={styles.selectBox}
                  dropdownStyles={styles.dropdown}
                  inputStyles={styles.selectText}
                  dropdownTextStyles={styles.dropdownText}
                  search={false}
                />
              </View>
              
              {selectedStartTime && (
                <View style={[styles.timeSelectionContainer, {marginTop: 16}]}>
                  <Text style={styles.timeLabel}>Giờ kết thúc</Text>
                  <SelectList
                    setSelected={setSelectedEndTime}
                    data={getEndTimeOptions(selectedStartTime)}
                    save="key"
                    placeholder="Chọn giờ kết thúc"
                    boxStyles={styles.selectBox}
                    dropdownStyles={styles.dropdown}
                    inputStyles={styles.selectText}
                    dropdownTextStyles={styles.dropdownText}
                    search={false}
                  />
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleSubmit}
          >
            <Text style={styles.continueButtonText}>Đặt lịch</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  backgroundImage: {
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
    backgroundColor: 'rgba(26, 0, 0, 0)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
    lineHeight: 32,
  },
  scrollView: {
    flex: 1,
    marginTop: 120,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  calendar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarGrid: {
    width: '100%',
    marginTop: 10,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginLeft: -10,
    marginBottom: 15,
  },
  weekDay: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    width: 43,
    textAlign: 'center',
    marginLeft: -1,
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dateCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    marginBottom: 5,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircle: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    width: 40,
  },
  selected: {
    backgroundColor: '#FF0008',
  },
  timeSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateSelected: {
    fontSize: 16,
    color: '#8B0000',
    marginBottom: 16,
  },
  timeSelectionContainer: {
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  selectBox: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  dropdown: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  selectText: {
    color: '#333',
  },
  dropdownText: {
    color: '#333',
  },
  continueButton: {
    backgroundColor: '#FF0008',  // Red color matching your theme
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
