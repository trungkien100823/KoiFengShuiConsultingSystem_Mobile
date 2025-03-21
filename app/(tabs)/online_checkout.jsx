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
import { paymentService } from '../../constants/paymentService';

export default function OnlineCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId;
  const initializedRef = useRef(false);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    masterId: '',
    masterName: '',
    description: ''
  });
  const [scheduleInfo, setScheduleInfo] = useState({
    date: '',
    startTime: '',
    endTime: '',
    price: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('VIETQR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  console.log('BookingId received:', bookingId);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
          router.push('/(tabs)/login');
          return;
        }

        if (!bookingId) {
          console.log('No bookingId found in params');
          Alert.alert('Thông báo', 'Không tìm thấy thông tin đặt lịch');
          return;
        }

        // Lấy thông tin user hiện tại
        const userResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Account/current-user`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Lấy thông tin booking theo ID
        const bookingResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Booking/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('User Response:', userResponse.data);
        console.log('Booking Response:', bookingResponse.data);

        if (bookingResponse.data.isSuccess && bookingResponse.data.data) {
          const bookingData = bookingResponse.data.data;
          
          // Cập nhật schedule info
          setScheduleInfo({
            date: bookingData.bookingDate,
            startTime: bookingData.startTime?.slice(0, 5),
            endTime: bookingData.endTime?.slice(0, 5),
            price: bookingData.price || 0
          });

          // Cập nhật customer info với thông tin từ booking
          setCustomerInfo({
            name: bookingData.customerName,
            phone: userResponse.data.phoneNumber,
            email: bookingData.customerEmail,
            masterName: bookingData.masterName,
            description: bookingData.description,
            bookingId: bookingData.bookingOnlineId,
            status: bookingData.status,
            type: bookingData.type,
            linkMeet: bookingData.linkMeet
          });
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        console.log('Error details:', error.response?.data);
        Alert.alert(
          'Lỗi',
          'Không thể tải thông tin. Vui lòng thử lại sau.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);
  
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 10);
  };
  
  const handlePayment = async () => {
    if (!customerInfo || !scheduleInfo) {
      Alert.alert('Thông báo', 'Thiếu thông tin đặt lịch. Vui lòng thử lại.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Sử dụng paymentService để xử lý thanh toán
      const result = await paymentService.processPayment({
        navigation: router,
        serviceId: bookingId,
        serviceType: paymentService.SERVICE_TYPES.BOOKING_ONLINE, // 0 cho BookingOnline
        serviceInfo: {
          customerName: customerInfo.name,
          masterName: customerInfo.masterName,
          bookingDate: scheduleInfo.date,
          startTime: scheduleInfo.startTime,
          endTime: scheduleInfo.endTime
        },
        onError: (error) => {
          console.error('Lỗi thanh toán:', error);
          Alert.alert(
            'Lỗi thanh toán',
            error.message || 'Không thể kết nối đến cổng thanh toán. Vui lòng thử lại.'
          );
        }
      });

      if (result.success) {
        // Lấy paymentUrl và orderId từ result
        const { paymentUrl, orderId } = result;
        console.log('Payment URL:', paymentUrl);
        console.log('Order ID:', orderId);

        // Chuyển đến màn hình payment webview
        router.push({
          pathname: '/payment_webview',
          params: {
            paymentUrl: encodeURIComponent(paymentUrl),
            orderId: orderId,
            returnScreen: 'online_checkout'
          }
        });
      }

    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Lỗi', 
        'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/online_booking')}
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
                <Text style={styles.bookingDate}>{scheduleInfo.date}</Text>
              </View>
              <View style={styles.iconTextRow}>
                <Ionicons name="time" size={22} color="#8B0000" />
                <Text style={styles.bookingTime}>
                  {scheduleInfo.startTime} - {scheduleInfo.endTime}
                </Text>
              </View>
              <View style={styles.iconTextRow}>
                <Ionicons name="person" size={22} color="#8B0000" />
                <Text style={styles.consultant}>{customerInfo.masterName}</Text>
              </View>
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Yêu cầu tư vấn</Text>
                <Text style={styles.description}>{customerInfo.description}</Text>
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
                <Text style={styles.customerName}>{customerInfo.name}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={18} color="#666" />
                <Text style={styles.contactText}>{customerInfo.phone}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color="#666" />
                <Text style={styles.contactText}>{customerInfo.email}</Text>
              </View>
            </View>
          </View>
          
          {/* Price Summary */}
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>{scheduleInfo.price} VND</Text>
            </View>
            
            {/* Payment Button */}
            <TouchableOpacity 
              style={styles.payButton}
              onPress={handlePayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#8B0000" />
              ) : (
                <Text style={styles.payButtonText}>Thanh toán</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  priceSummary: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  payButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});