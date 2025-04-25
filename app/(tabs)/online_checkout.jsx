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
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { paymentService } from '../../constants/paymentService';
import { useFocusEffect } from '@react-navigation/native';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isSmallDevice = width < 375;

// Helper function to scale sizes based on screen width
const scale = size => Math.round((width / 375) * size);

export default function OnlineCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log('Params received in checkout:', params);
  const bookingId = params.bookingId || params.serviceId; // Accept either parameter
  console.log('BookingId in checkout:', bookingId);
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
  const [navigationSource, setNavigationSource] = useState(null);
  
  console.log('BookingId received:', bookingId);
  
  useFocusEffect(
    React.useCallback(() => {
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

          // Kiểm tra xem có thông tin được truyền từ màn hình trước không
          if (params.customerInfo && params.scheduleInfo) {
            try {
              const customerInfoData = JSON.parse(params.customerInfo);
              const scheduleInfoData = JSON.parse(params.scheduleInfo);
              
              setCustomerInfo({
                name: customerInfoData.name,
                phone: customerInfoData.phone,
                email: customerInfoData.email,
                masterName: customerInfoData.masterName,
                description: customerInfoData.description
              });

              setScheduleInfo({
                date: scheduleInfoData.date,
                startTime: scheduleInfoData.startTime,
                endTime: scheduleInfoData.endTime,
                price: scheduleInfoData.price
              });
            } catch (error) {
              console.error('Error parsing customer/schedule info:', error);
              // Nếu parse lỗi thì tiếp tục lấy từ API
            }
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
            
            // Chỉ cập nhật nếu chưa có thông tin từ params
            if (!params.customerInfo || !params.scheduleInfo) {
              // Cập nhật schedule info
              setScheduleInfo({
                date: bookingData.bookingDate,
                startTime: bookingData.startTime?.slice(0, 5),
                endTime: bookingData.endTime?.slice(0, 5),
                price: bookingData.price || params.selectedPrice || 0
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
              });
            }
          }

          // Determine navigation source from params
          if (params.source) {
            setNavigationSource(params.source);
          } else if (params.returnTo) {
            setNavigationSource(params.returnTo);
          } else {
            // Try to infer source from other parameters
            if (params.bookingId) {
              setNavigationSource('your_booking');
            } else {
              setNavigationSource('online_schedule');
            }
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
    }, [])
  );
  
  const handleBackNavigation = () => {
    // Get the referrer information from params
    const fromBookingsList = params.source === 'your_booking' || 
                            params.bookingOnlineId || 
                            params.serviceId;
                            
    if (fromBookingsList) {
      console.log('Navigating back to your_booking');
      router.push('/(tabs)/your_booking');
    } else {
      console.log('Navigating back to online_schedule');
      router.push('/(tabs)/online_schedule');
    }
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
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={isIOS ? "padding" : "height"}
      >
        {/* Status Bar - for Android */}
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackNavigation}
            hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Booking Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Thông tin đặt lịch tư vấn trực tuyến</Text>
            
            <View style={styles.card}>
              <View style={styles.bookingInfo}>
                <View style={styles.iconTextRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar" size={scale(20)} color="#8B0000" />
                  </View>
                  <Text style={styles.infoLabel}>Ngày tư vấn:</Text>
                  <Text style={styles.infoValue}>{scheduleInfo.date}</Text>
                </View>
                
                <View style={styles.iconTextRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="time" size={scale(20)} color="#8B0000" />
                  </View>
                  <Text style={styles.infoLabel}>Thời gian:</Text>
                  <Text style={styles.infoValue}>
                    {scheduleInfo.startTime} - {scheduleInfo.endTime}
                  </Text>
                </View>
                
                <View style={styles.iconTextRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="person" size={scale(20)} color="#8B0000" />
                  </View>
                  <Text style={styles.infoLabel}>Chuyên gia:</Text>
                  <Text style={styles.infoValue}>{customerInfo.masterName}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Yêu cầu tư vấn:</Text>
                  <Text style={styles.description}>{customerInfo.description || "Không có yêu cầu cụ thể"}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Customer Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Thông tin khách hàng</Text>
            
            <View style={styles.card}>
              <View style={styles.customerInfo}>
                <View style={styles.profileRow}>
                  <View style={styles.profileIconContainer}>
                    <Ionicons name="person-circle" size={scale(40)} color="#8B0000" />
                  </View>
                  <View style={styles.profileDetails}>
                    <Text style={styles.customerName}>{customerInfo.name}</Text>
                    <View style={styles.contactInfoContainer}>
                      <View style={styles.contactRow}>
                        <Ionicons name="call" size={scale(16)} color="#666" />
                        <Text style={styles.contactText}>{customerInfo.phone}</Text>
                      </View>
                      <View style={styles.contactRow}>
                        <Ionicons name="mail" size={scale(16)} color="#666" />
                        <Text style={styles.contactText}>{customerInfo.email}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Price Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Chi tiết thanh toán</Text>
            
            <View style={styles.card}>
              <View style={styles.priceSummary}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tư vấn trực tuyến</Text>
                  <Text style={styles.priceValue}>{scheduleInfo.price} VND</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                  <Text style={styles.totalValue}>{scheduleInfo.price} VND</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Payment Button - Fixed at bottom */}
        <View style={styles.paymentButtonContainer}>
          <TouchableOpacity 
            style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={scale(20)} color="#FFFFFF" style={styles.payButtonIcon} />
                <Text style={styles.payButtonText}>Thanh toán ngay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingVertical: scale(15),
    paddingHorizontal: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: scale(10)
  },
  backButton: {
    padding: scale(5),
    borderRadius: scale(20),
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#8B0000',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: scale(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: scale(100), // Extra padding for the payment button
  },
  section: {
    marginHorizontal: scale(15),
    marginTop: scale(15),
  },
  sectionHeader: {
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: scale(10),
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    marginBottom: scale(15),
    overflow: 'hidden',
    // Cross-platform shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bookingInfo: {
    padding: scale(15),
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  iconContainer: {
    width: scale(30),
    alignItems: 'center',
    marginRight: scale(10),
  },
  infoLabel: {
    fontSize: scale(14),
    color: '#666',
    width: scale(90),
    marginRight: scale(5),
  },
  infoValue: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: scale(12),
  },
  descriptionContainer: {
    marginTop: scale(5),
  },
  descriptionLabel: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#666',
    marginBottom: scale(8),
  },
  description: {
    fontSize: scale(14),
    color: '#333',
    lineHeight: scale(20),
  },
  customerInfo: {
    padding: scale(15),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    marginRight: scale(15),
  },
  profileDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(5),
  },
  contactInfoContainer: {
    marginTop: scale(5),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  contactText: {
    fontSize: scale(14),
    color: '#666',
    marginLeft: scale(8),
  },
  priceSummary: {
    padding: scale(15),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  priceLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  priceValue: {
    fontSize: scale(14),
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#8B0000',
  },
  paymentButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    // Add shadow for iOS
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  payButton: {
    backgroundColor: '#8B0000',
    paddingVertical: scale(14),
    borderRadius: scale(10),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#C78383',
  },
  payButtonIcon: {
    marginRight: scale(8),
  },
  payButtonText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scale(10),
    fontSize: scale(14),
    color: '#666',
  }
});