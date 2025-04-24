import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfflineBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldCompleteBooking, setShouldCompleteBooking] = useState(false);
  
  // Thêm state cho calendar
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(params.startDate || null);

  // Thêm state để lưu lịch master và ngày không khả dụng
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [masterSchedules, setMasterSchedules] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState({});
  const apiCalledRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Get today's date for reference
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthActual = today.getMonth();
  const currentYearActual = today.getFullYear();

  // Thêm useFocusEffect để reset state khi màn hình được focus lại
  useFocusEffect(
    useCallback(() => {
      // Reset các state khi màn hình được focus lại
      setSelectedDate(null);
      setDescription('');
      setLocation('');
      setCurrentMonth(new Date().getMonth());
      setCurrentYear(new Date().getFullYear());
      
      // Reset flag để gọi lại API
      apiCalledRef.current = false;
      
      // Xóa dữ liệu đã lưu trong AsyncStorage nếu có
      AsyncStorage.removeItem('offlineBookingDescription');
      AsyncStorage.removeItem('offlineBookingLocation');
      AsyncStorage.removeItem('offlineBookingDate');
      
      // Gọi lại API để lấy lịch master mới nhất
      const fetchMasterSchedules = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setLoadingSchedules(true);

        try {
          const token = await AsyncStorage.getItem('accessToken');
          if (!token) {
            console.error('Không tìm thấy token đăng nhập');
            return;
          }

          // Bước 1: Lấy danh sách tất cả master
          const mastersResponse = await axios.get(
            `${API_CONFIG.baseURL}/api/Master/get-all`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!mastersResponse.data?.isSuccess) {
            throw new Error('Không thể lấy danh sách master');
          }

          const allMasters = mastersResponse.data.data;
          console.log('Tổng số master:', allMasters.length);
          console.log('Danh sách master:', allMasters.map(m => m.masterId));

          // Bước 2: Lấy lịch trình của các master
          const schedulesResponse = await axios.get(
            `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getSchedulesForMobile}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (schedulesResponse.data && schedulesResponse.data.isSuccess) {
            const scheduleData = schedulesResponse.data.data;
            setMasterSchedules(scheduleData);

            // Xử lý dữ liệu lịch để xác định ngày không khả dụng
            const unavailableDatesMap = {};
            const mastersByDatesMap = {}; // Lưu trữ masterIds theo ngày

            // Tổ chức dữ liệu theo ngày và masterId
            scheduleData.forEach(schedule => {
              const { date, type, masterId } = schedule;
              const trimmedMasterId = masterId ? masterId.trim() : null;

              if (!date || !trimmedMasterId) return;

              // Lưu trữ thông tin master theo ngày
              if (!mastersByDatesMap[date]) {
                mastersByDatesMap[date] = {
                  offline: new Set(),
                  online: new Set(),
                  both: new Set() // Lưu tất cả các master có lịch bất kể loại nào
                };
              }

              if (type === 'Offline') {
                mastersByDatesMap[date].offline.add(trimmedMasterId);
              } else if (type === 'Online') {
                mastersByDatesMap[date].online.add(trimmedMasterId);
              }

              // Thêm master vào tập hợp 'both' bất kể loại lịch
              mastersByDatesMap[date].both.add(trimmedMasterId);
            });

            // Log thông tin lịch theo ngày
            for (const [date, masters] of Object.entries(mastersByDatesMap)) {
              console.log(`Ngày ${date}:`);
              console.log(`- Số master có lịch Offline: ${masters.offline.size}`);
              console.log(`- Số master có lịch Online: ${masters.online.size}`);
              console.log(`- Tổng số master có lịch: ${masters.both.size}`);
              console.log(`- Master có lịch: `, [...masters.both]);
            }

            // Kiểm tra từng ngày và đánh dấu ngày không khả dụng nếu tất cả master đều có lịch
            for (const [date, masters] of Object.entries(mastersByDatesMap)) {
              // Chỉ khi tất cả master đều có lịch vào ngày này
              if (masters.both.size === allMasters.length) {
                unavailableDatesMap[date] = true;
                console.log(`Ngày ${date} bị bôi đen vì tất cả ${masters.both.size}/${allMasters.length} master đều có lịch`);
              } else {
                console.log(`Ngày ${date} không bị bôi đen vì chỉ có ${masters.both.size}/${allMasters.length} master có lịch`);
              }
            }

            setUnavailableDates(unavailableDatesMap);
          }
        } catch (error) {
          console.error('Lỗi khi lấy lịch master:', error);
        } finally {
          setLoadingSchedules(false);
          isFetchingRef.current = false;
        }
      };
      
      // Gọi hàm fetchMasterSchedules ngay khi màn hình được focus
      fetchMasterSchedules();
      
      return () => {
        // Cleanup function
      };
    }, [])
  );

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

  const generateCalendarDates = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const dates = [];
    
    for (let i = 0; i < firstDay; i++) {
      dates.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(i);
    }
    
    return dates;
  };

  // Thêm hàm kiểm tra ngày quá khứ
  const isDateInPast = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateString);
    return selectedDate <= today;
  };

  // Thêm hàm kiểm tra ngày không khả dụng
  const isDateUnavailable = (dateString) => {
    // Format dateString thành yyyy-MM-dd
    const formattedDate = dateString.split('T')[0];
    return unavailableDates[formattedDate] === true;
  };

  const selectDate = (date) => {
    if (!date) return;
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    // Kiểm tra ngày quá khứ và ngày hiện tại
    if (isDateInPast(dateString)) {
      Alert.alert('Thông báo', 'Không thể chọn ngày hôm nay hoặc ngày trong quá khứ');
      return;
    }
    
    // Kiểm tra ngày không khả dụng
    if (isDateUnavailable(dateString)) {
      Alert.alert('Thông báo', 'Tất cả master đều bận vào ngày này. Vui lòng chọn ngày khác.');
      return;
    }
    
    setSelectedDate(dateString);
  };

  const getDateStyle = (date) => {
    if (!date) return [styles.dateCell];
    
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const isSelected = selectedDate === dateString;
    
    return [
      styles.dateCircle,
      isSelected && styles.selected
    ];
  };

  // Format a date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    return dateString;
  };

  const handleContinue = () => {
    // Kiểm tra cả 3 điều kiện
    if (!selectedDate && !description.trim() && !location.trim()) {
      Alert.alert('Thông báo', 'Vui lòng chọn ngày, nhập địa điểm và mô tả nhu cầu tư vấn');
      return;
    }

    // Kiểm tra riêng từng điều kiện để hiển thị thông báo cụ thể
    if (!selectedDate) {
      Alert.alert('Thông báo', 'Vui lòng chọn ngày tư vấn');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa điểm tư vấn');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mô tả nhu cầu tư vấn');
      return;
    }

    // Format ngày tháng đúng chuẩn ISO
    const formattedDate = new Date(selectedDate);
    formattedDate.setHours(0, 0, 0, 0);
    const isoDate = formattedDate.toISOString();

    // Lưu thông tin vào AsyncStorage
    AsyncStorage.setItem('offlineBookingDescription', description);
    AsyncStorage.setItem('offlineBookingLocation', location);
    AsyncStorage.setItem('offlineBookingDate', isoDate);
    
    // Chuyển sang màn hình chọn gói tư vấn
    router.push('/(tabs)/offline_package');
  };

  const retryRequest = async (fn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Tăng thời gian chờ mỗi lần retry
      }
    }
  };

  const makeRequest = async (token) => {
    return await axios.post(
      `${API_CONFIG.baseURL}/api/Booking/offline-transaction-complete`,
      {
        description: description,
        startDate: selectedDate,
        location: location
      },
      {
        params: {
          packageId: params.packageId,
          selectedPrice: parseFloat(params.selectedPrice)
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
  };

  useEffect(() => {
    const completeBooking = async () => {
      if (params.packageId && params.selectedPrice && params.shouldCompleteBooking) {
        try {
          setIsSubmitting(true);
          
          // Tăng delay lên 1000ms để tránh race condition với DbContext
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const token = await AsyncStorage.getItem('accessToken');
          
          if (!token) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
            router.push('/(tabs)/login');
            return;
          }

          const response = await retryRequest(() => makeRequest(token));

          if (response.data && response.data.isSuccess && response.data.data) {
            const bookingOfflineId = response.data.data.bookingOfflineId;
            await AsyncStorage.removeItem('offlineBookingDescription');
            await AsyncStorage.removeItem('offlineBookingLocation');
            await AsyncStorage.removeItem('offlineBookingDate');
            Alert.alert(
              'Thành công',
              'Bạn đã đăng ký lịch tư vấn thành công',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.push({
                      pathname: '/(tabs)/menu',
                      params: {
                        serviceId: bookingOfflineId,
                        serviceType: 1,
                        selectedPrice: params.selectedPrice
                      }
                    });
                  }
                }
              ]
            );
          } else {
            throw new Error(response.data?.message || 'Không nhận được bookingOfflineId từ API');
          }
        } catch (error) {
          let errorMessage = 'Không thể hoàn tất đặt lịch. Vui lòng thử lại sau.';
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          
          Alert.alert('Thông báo', errorMessage);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    // Tăng delay trước khi gọi completeBooking lên 500ms
    const timer = setTimeout(() => {
      if (params.packageId && params.selectedPrice && params.shouldCompleteBooking) {
        completeBooking();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [params.packageId, params.selectedPrice, params.shouldCompleteBooking]);

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
        
        <SafeAreaView style={styles.safeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.push('/(tabs)/OfflineOnline')}
                >
                  <Ionicons name="arrow-back-circle" size={36} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đặt lịch tư vấn trực tiếp</Text>
              </View>

              {/* Calendar Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Chọn ngày tư vấn</Text>
                
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
                      
                      const isToday = day === currentDay && 
                        currentMonth === currentMonthActual && 
                        currentYear === currentYearActual;
                      
                      const isPastDate = (currentYear < currentYearActual) || 
                        (currentYear === currentYearActual && currentMonth < currentMonthActual) || 
                        (currentYear === currentYearActual && currentMonth === currentMonthActual && day < currentDay);
                      
                      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = selectedDate === dateString;
                      
                      // Kiểm tra xem ngày có không khả dụng không
                      const isUnavailable = isDateUnavailable(dateString);
                      
                      // Kiểm tra xem có phải ngày hiện tại không
                      const isCurrentDate = day === currentDay && 
                        currentMonth === currentMonthActual && 
                        currentYear === currentYearActual;
                      
                      return (
                        <TouchableOpacity
                          key={`day-${day}`}
                          style={[
                            styles.dateCell,
                            isPastDate && styles.pastDateCell,
                            isUnavailable && styles.unavailableCell,
                            isCurrentDate && styles.pastDateCell
                          ]}
                          onPress={() => selectDate(day)}
                          disabled={isPastDate || isUnavailable || isCurrentDate}
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
                              isUnavailable && styles.unavailableDateText,
                            ]}>
                              {day}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                {/* Selected Date Display */}
                {selectedDate && (
                  <View style={styles.dateSelectedContainer}>
                    <Ionicons name="calendar" size={20} color="#8B0000" />
                    <Text style={styles.dateSelectedText}>
                      Ngày đã chọn: {formatDisplayDate(selectedDate)}
                    </Text>
                  </View>
                )}

                {/* Loading indicator while fetching schedules */}
                {loadingSchedules && (
                  <View style={styles.loadingCalendarContainer}>
                    <ActivityIndicator size="small" color="#8B0000" />
                    <Text style={styles.loadingCalendarText}>Đang tải lịch...</Text>
                  </View>
                )}
              </View>
              
              {/* Form Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Địa điểm tư vấn*</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Vui lòng nhập địa điểm tư vấn"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Mô tả nhu cầu tư vấn*</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Vui lòng nhập chi tiết nhu cầu tư vấn của bạn"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Submit Button */}
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleContinue}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={['#8B0000', '#6B0000']}
                    style={styles.submitButtonGradient}
                  >
                    <Text style={styles.submitButtonText}>
                      {params.packageId ? 'Hoàn tất đặt lịch' : 'Chọn gói tư vấn'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
          </TouchableWithoutFeedback>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
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
  unavailableCell: {
    opacity: 0.5,
  },
  unavailableCellInner: {
    backgroundColor: 'rgba(211, 47, 47, 0.2)',
  },
  unavailableDateText: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  dateSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateSelectedText: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingCalendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  loadingCalendarText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#8B0000',
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    backgroundColor: '#F9F9F9',
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 30,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
