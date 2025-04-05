import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

export default function OfflineBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldCompleteBooking, setShouldCompleteBooking] = useState(false);
  
  // Thêm state cho calendar
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(params.startDate || null);

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
    return selectedDate < today;
  };

  const selectDate = (date) => {
    if (!date) return;
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    // Kiểm tra ngày quá khứ
    if (isDateInPast(dateString)) {
      Alert.alert('Thông báo', 'Không thể chọn ngày trong quá khứ');
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

  const handleContinue = () => {
    // Kiểm tra cả 2 điều kiện
    if (!selectedDate && !description.trim()) {
      Alert.alert('Thông báo', 'Vui lòng chọn ngày và nhập mô tả nhu cầu tư vấn');
      return;
    }

    // Kiểm tra riêng từng điều kiện để hiển thị thông báo cụ thể
    if (!selectedDate) {
      Alert.alert('Thông báo', 'Vui lòng chọn ngày tư vấn');
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
        startDate: selectedDate
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
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.push('/(tabs)/OfflineOnline')}
              >
                <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Đặt lịch tư vấn{'\n'}trực tiếp</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>

            {/* Thêm calendar vào đây */}
            <View style={styles.calendar}>
              <Text style={styles.requiredLabel}>Chọn ngày tư vấn *</Text>
              {selectedDate && (
                <Text style={styles.selectedDateText}>
                  Ngày đã chọn: {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </Text>
              )}
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
                          onPress={() => selectDate(date)}
                        >
                          <Text style={styles.dateText}>{date}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Mô tả nhu cầu tư vấn*"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#FFFFFF80"
                />
              </View>

              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#8B0000" />
                  <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleContinue}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {params.packageId ? 'Hoàn tất đặt lịch' : 'Chọn gói tư vấn'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  backButton: {
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 0.8,
    lineHeight: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    backgroundColor: '#8B0000',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16
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
    width: '14.28%',
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
  requiredLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  }
});
