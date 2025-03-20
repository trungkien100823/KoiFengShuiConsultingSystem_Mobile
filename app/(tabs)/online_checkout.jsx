import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

export default function OnlineCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initializedRef = useRef(false);
  
  console.log('Raw params received in checkout:', params);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Nguyễn Thái Trung Kiên',
    phone: '0943905969',
    email: 'johnsmith@gmail.com',
    masterId: '3BFE51B2-D79C-46D1-9',
    masterName: 'Tư vấn viên ngẫu nhiên',
    description: 'Tôi muốn nuôi cá'
  });
  const [scheduleInfo, setScheduleInfo] = useState({
    date: '15/3/2025',
    startTime: '10:00',
    endTime: '12:00'
  });
  const [selectedPayment, setSelectedPayment] = useState('VIETQR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    try {
      if (params.customerInfo) {
        const parsedInfo = JSON.parse(params.customerInfo);
        console.log('Parsed customer info:', parsedInfo);
        
        setCustomerInfo({
          Name: parsedInfo.Name || parsedInfo.name || 'Nguyễn Thái Trung Kiên',
          Phone: parsedInfo.Phone || parsedInfo.phone || '0943905969',
          Email: parsedInfo.Email || parsedInfo.email || 'tk100823@gmail.com',
          Description: parsedInfo.Description || parsedInfo.description || 'Tư vấn Phong Thủy',
          MasterId: parsedInfo.MasterId || parsedInfo.masterId || '3BFE51B2-D79C-46D1-9',
          MasterName: parsedInfo.MasterName || parsedInfo.masterName || 'Tư vấn viên ngẫu nhiên'
        });
      } else {
        console.warn('No customer info received');
        // Default values already set
      }
      
      if (params.scheduleInfo) {
        const parsedInfo = JSON.parse(params.scheduleInfo);
        console.log('Parsed schedule info:', parsedInfo);
        
        setScheduleInfo({
          Date: parsedInfo.Date || parsedInfo.date || '15/3/2025',
          StartTime: parsedInfo.StartTime || parsedInfo.startTime || '10:00',
          EndTime: parsedInfo.EndTime || parsedInfo.endTime || '12:00'
        });
      } else {
        console.warn('No schedule info received');
        // Default values already set
      }
    } catch (error) {
      console.error('Error parsing params:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý thông tin. Vui lòng thử lại.');
    }
  }, []);
  
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 10);
  };
  
  const handlePayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Thông báo', 'Vui lòng chọn phương thức thanh toán');
      return;
    }
    
    if (!customerInfo || !scheduleInfo) {
      Alert.alert('Thông báo', 'Thiếu thông tin đặt lịch. Vui lòng thử lại.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the authentication token
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để đặt lịch tư vấn');
        setIsSubmitting(false);
        router.push('/(tabs)/login');
        return;
      }
      
      console.log('Customer info before API call:', customerInfo);
      console.log('Schedule info before API call:', scheduleInfo);
      
      // Parse the date string into YYYY-MM-DD format for the API
      let formattedDate;
      
      if (scheduleInfo.Date && scheduleInfo.Date.includes('/')) {
        const dateParts = scheduleInfo.Date.split('/');
        
        // Parse MM/DD/YYYY format to YYYY-MM-DD
        const month = String(parseInt(dateParts[0])).padStart(2, '0');
        const day = String(parseInt(dateParts[1])).padStart(2, '0');
        const year = dateParts[2];
        
        // Format as YYYY-MM-DD for the API
        formattedDate = `${year}-${month}-${day}`;
        console.log('Converted date for API:', formattedDate);
      } else {
        // Fallback to current date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
      
      // Format times with seconds (HH:MM:SS)
      const startTime = scheduleInfo.StartTime && scheduleInfo.StartTime.includes(':') ? 
        (scheduleInfo.StartTime.includes(':00') ? scheduleInfo.StartTime : `${scheduleInfo.StartTime}:00`) : 
        '09:00:00';
        
      const endTime = scheduleInfo.EndTime && scheduleInfo.EndTime.includes(':') ? 
        (scheduleInfo.EndTime.includes(':00') ? scheduleInfo.EndTime : `${scheduleInfo.EndTime}:00`) : 
        '10:00:00';
      
      // Extract masterId and description with fallbacks
      const masterId = customerInfo.MasterId || customerInfo.masterId || "3BFE51B2-D79C-46D1-9";
      const description = customerInfo.Description || customerInfo.description || "Tư vấn Phong Thủy";
      
      // Create the API request with EXACT field names
      const apiRequestData = {
        BookingDate: formattedDate,
        Description: description,
        EndTime: endTime,
        MasterId: masterId,
        StartTime: startTime
      };
      
      console.log('Final API Request:', JSON.stringify(apiRequestData));
      
      // Call the API with the correct structure and authentication
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Booking/create`, 
        apiRequestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Booking created successfully:', response.data);
      
      if (response.data && response.data.isSuccess) {
        // Generate meeting ID for navigation
        const bookingId = response.data.data?.bookingId || generateMeetingId();
        
        Alert.alert(
          'Thành công', 
          'Đặt lịch tư vấn thành công. Bạn sẽ được chuyển đến trang thanh toán.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to payment notification with booking ID
                router.push({
                  pathname: '/(tabs)/online_payment_notification',
                  params: {
                    bookingId: bookingId,
                    customerName: customerInfo.Name || customerInfo.name,
                    masterName: customerInfo.MasterName || customerInfo.masterName,
                    bookingDate: scheduleInfo.Date || scheduleInfo.date,
                    startTime: scheduleInfo.StartTime || scheduleInfo.startTime,
                    endTime: scheduleInfo.EndTime || scheduleInfo.endTime
                  }
                });
              }
            }
          ]
        );
      } else {
        throw new Error(response.data?.message || 'Không thể tạo lịch tư vấn');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Phiên đăng nhập hết hạn', 
          'Vui lòng đăng nhập lại để tiếp tục.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.push('/(tabs)/login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Lỗi', 
          'Không thể đặt lịch tư vấn. Vui lòng thử lại sau.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionHeader}>Thông tin đặt lịch tư vấn trực tuyến</Text>
          
          {/* Booking Info Card */}
          <View style={styles.card}>
            <View style={styles.bookingInfo}>
              <View style={styles.iconTextRow}>
                <Ionicons name="calendar" size={22} color="#8B0000" />
                <Text style={styles.bookingDate}>{scheduleInfo.Date || "15/3/2025"}</Text>
              </View>
              <View style={styles.iconTextRow}>
                <Ionicons name="time" size={22} color="#8B0000" />
                <Text style={styles.bookingTime}>
                  {scheduleInfo.StartTime || "10:00"} - {scheduleInfo.EndTime || "12:00"}
                </Text>
              </View>
              <View style={styles.iconTextRow}>
                <Ionicons name="person" size={22} color="#8B0000" />
                <Text style={styles.consultant}>{customerInfo.MasterName || "Tư vấn viên ngẫu nhiên"}</Text>
              </View>
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Yêu cầu tư vấn</Text>
                <Text style={styles.description}>{customerInfo.Description || "Tôi muốn nuôi cá"}</Text>
              </View>
            </View>
          </View>
          
          {/* Customer Info */}
          <Text style={styles.sectionHeader}>Thông tin khách hàng</Text>
          <View style={styles.card}>
            <View style={styles.customerInfo}>
              <View style={styles.profileRow}>
                <View style={styles.profileIcon}>
                  <Ionicons name="person-circle" size={36} color="#8B0000" />
                </View>
                <Text style={styles.customerName}>{customerInfo.Name || "Nguyễn Thái Trung Kiên"}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={18} color="#666" />
                <Text style={styles.contactText}>{customerInfo.Phone || "0943905969"}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color="#666" />
                <Text style={styles.contactText}>{customerInfo.Email || "johnsmith@gmail.com"}</Text>
              </View>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Coupon code"
                />
                <TouchableOpacity style={styles.couponButton}>
                  <Text style={styles.couponButtonText}>Sử dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Payment Methods */}
          <Text style={styles.sectionHeader}>Phương thức thanh toán</Text>
          <View style={styles.card}>
            <View style={styles.paymentMethods}>
              <TouchableOpacity 
                style={[styles.paymentOption, selectedPayment === 'VIETQR' && styles.selectedPayment]}
                onPress={() => setSelectedPayment('VIETQR')}
              >
                <Image 
                  source={require('../../assets/images/VietQR.png')}
                  style={styles.paymentIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentOption, selectedPayment === 'PAYOS' && styles.selectedPayment]}
                onPress={() => setSelectedPayment('PAYOS')}
              >
                <Image 
                  source={require('../../assets/images/PayOS.svg')}
                  style={styles.paymentIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Price Summary */}
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tổng tiền</Text>
              <Text style={styles.priceValue}>1.000.000 VND</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Chiết khấu</Text>
              <Text style={styles.priceValue}>0 VND</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>1.000.000 VND</Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Payment Button */}
        <View style={styles.bottomBar}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Tổng thanh toán</Text>
            <Text style={styles.totalAmount}>1.000.000 VND</Text>
          </View>
          <TouchableOpacity 
            style={styles.payButton}
            onPress={handlePayment}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>Thanh toán</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  bookingInfo: {
    borderWidth: 1,
    borderColor: '#8B0000',
    borderRadius: 8,
    padding: 15,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingDate: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bookingTime: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  consultant: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  descriptionContainer: {
    marginTop: 5,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#333',
  },
  customerInfo: {
    padding: 5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileIcon: {
    marginRight: 10,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  couponRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  couponButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderRadius: 4,
    marginLeft: 10,
  },
  couponButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paymentOption: {
    width: 100,
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPayment: {
    borderColor: '#8B0000',
    borderWidth: 2,
  },
  paymentIcon: {
    width: '100%',
    height: '100%',
  },
  priceSummary: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 80,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  payButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
  },
});
