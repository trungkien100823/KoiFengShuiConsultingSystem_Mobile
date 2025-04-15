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
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { paymentService } from '../../constants/paymentService';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

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
    }, [bookingId])
  );
  
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent barStyle="dark-content" backgroundColor="rgba(255,255,255,0.9)" />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent barStyle="dark-content" backgroundColor="rgba(255,255,255,0.9)" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <LinearGradient
          colors={['#FFFFFF', '#F9F9F9']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/online_booking')}
            activeOpacity={0.7}
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
          >
            <Ionicons name="arrow-back" size={24} color="#8B0000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={styles.headerRight} />
        </LinearGradient>
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar-outline" size={22} color="#8B0000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeader}>Thông tin đặt lịch tư vấn</Text>
          </View>
          
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
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="person-outline" size={22} color="#8B0000" style={styles.sectionIcon} />
            <Text style={styles.sectionHeader}>Thông tin khách hàng</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.customerInfo}>
              <View style={styles.profileRow}>
                <View style={styles.profileIcon}>
                  <Ionicons name="person-circle" size={40} color="#8B0000" />
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
          <View style={styles.summaryCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card-outline" size={22} color="#8B0000" />
              <Text style={styles.paymentHeaderText}>Thông tin thanh toán</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Phí tư vấn</Text>
              <Text style={styles.priceValue}>{scheduleInfo.price} VND</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{scheduleInfo.price} VND</Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Footer with Payment Button */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerPriceContainer}>
              <Text style={styles.footerPriceLabel}>Tổng thanh toán</Text>
              <Text style={styles.footerPrice}>{scheduleInfo.price} VND</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.payButtonText}>Thanh toán ngay</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT + 10 : 10,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bookingInfo: {
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 16,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingDate: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  bookingTime: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  consultant: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  descriptionContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  customerInfo: {
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIcon: {
    marginRight: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#666666',
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  payButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  payButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8B0000',
  }
});