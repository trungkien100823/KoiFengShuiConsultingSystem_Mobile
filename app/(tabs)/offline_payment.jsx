import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { paymentService } from '../../constants/paymentService';

const { width } = Dimensions.get('window');

export default function OfflinePaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VietQR');
  
  // User information
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Account/current-user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setUserName(response.data.fullName || response.data.userName || '');
        setUserPhone(response.data.phoneNumber || '');
        setUserEmail(response.data.email || '');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin user:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('vi-VN');
  };

  const calculatePaymentAmount = (price, status) => {
    const totalPrice = parseFloat(price);
    if (status === 'VerifiedOTP') {
      return totalPrice * 0.3; // Thanh toán đợt 1: 30%
    } else if (status === 'VerifiedOTPAttachment') {
      return totalPrice * 0.7; // Thanh toán đợt 2: 70%
    }
    return totalPrice;
  };

  const getPaymentTitle = (status) => {
    if (status === 'VerifiedOTP') {
      return 'Thanh toán đợt 1 (30%)';
    } else if (status === 'VerifiedOTPAttachment') {
      return 'Thanh toán đợt 2 (70%)';
    }
    return 'Thanh toán';
  };

  const handlePayment = async () => {
    if (!userName || !userPhone || !userEmail) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsLoading(true);

    try {
      const paymentPhase = params.status === 'VerifiedOTP' ? 1 : 2;
      
      console.log('Payment params:', params);
      console.log('ServiceId:', params.serviceId);
      console.log('ServiceType:', params.serviceType);
      console.log('PaymentPhase:', paymentPhase);

      // Xác định loại dịch vụ từ enum
      const serviceTypeEnum = 
        params.serviceType === 'BookingOffline' 
          ? paymentService.SERVICE_TYPES.BOOKING_OFFLINE 
          : paymentService.SERVICE_TYPES.BOOKING_ONLINE;
      
      console.log('ServiceTypeEnum:', serviceTypeEnum);
      
      // Quay lại cách dùng createPaymentUrl nhưng KHÔNG truyền tham số options
      console.log('Sử dụng createPaymentUrl với options trống');
      const result = await paymentService.createPaymentUrl(
        params.serviceId,
        serviceTypeEnum
      );
      
      console.log('Payment result:', result);
      
      if (result.success) {
        // Kiểm tra và sử dụng kết quả
        if (!result.paymentUrl) {
          throw new Error('Không nhận được URL thanh toán từ API');
        }
        
        console.log('Payment URL:', result.paymentUrl);
        console.log('Order ID:', result.orderId);
        
        // Chuyển hướng đến trang thanh toán
        router.push({
          pathname: '/payment_webview',
          params: {
            paymentUrl: encodeURIComponent(result.paymentUrl),
            orderId: result.orderId,
            serviceId: params.serviceId,
            serviceType: params.serviceType,
            returnScreen: 'home'
          }
        });
      } else {
        throw new Error(result.message || 'Không thể tạo URL thanh toán');
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể xử lý thanh toán. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/your_booking')}
        >
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getPaymentTitle(params.status)}</Text>
      </View>
      
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Package Registration Title */}
          <Text style={styles.registrationTitle}>
            {params.status === 'VerifiedOTPAttachment' ? 'Thanh toán đợt 2 (70%)' : 'Gói tư vấn bạn đã chọn'}
          </Text>
          
          {/* Package Card */}
          <View style={styles.courseCardWrapper}>
            <View style={styles.courseCardContainer}>
              <View style={styles.courseCard}>
                <Image 
                  source={require('../../assets/images/koi_image.jpg')} 
                  style={styles.courseImage} 
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.courseTitle}>
                    {params.packageName || 'Gói tư vấn phong thủy'}
                  </Text>
                  <Text style={styles.price}>
                    {formatPrice(calculatePaymentAmount(params.selectedPrice, params.status))} đ
                  </Text>
                </View>
              </View>
              <Image 
                source={require('../../assets/images/f2.png')} 
                style={styles.fengShuiLogo}
              />
            </View>
          </View>
          
          {/* Customer Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.customerCard}>
              {isLoadingUser ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#8B0000" />
                  <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.customerAvatarContainer}>
                    <Ionicons name="person-circle" size={40} color="#8B0000" />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{userName}</Text>
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={14} color="#666" />
                      <Text style={styles.contactText}>{userPhone}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={14} color="#666" />
                      <Text style={styles.contactText}>{userEmail}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
          <View style={{ height: 80 }} />
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Chi tiết thanh toán</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceTitle}>Tổng tiền:</Text>
              <Text style={styles.priceValue}>
                {formatPrice(params.selectedPrice)} VNĐ
              </Text>
            </View>
            {params.status === 'VerifiedOTPAttachment' && (
              <View style={styles.priceRow}>
                <Text style={styles.priceTitle}>Đã thanh toán đợt 1 (30%):</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(parseFloat(params.selectedPrice) * 0.3)} VNĐ
                </Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceTitle}>{getPaymentTitle(params.status)}:</Text>
              <Text style={styles.priceValue}>
                {formatPrice(calculatePaymentAmount(params.selectedPrice, params.status))} VNĐ
              </Text>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.checkoutContainer}>
          <View style={styles.checkoutTotal}>
            <Text style={styles.checkoutTotalLabel}>{getPaymentTitle(params.status)}</Text>
            <Text style={styles.checkoutTotalValue}>
              {formatPrice(calculatePaymentAmount(params.selectedPrice, params.status))} VND
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.checkoutButton,
              isLoading && { opacity: 0.7 }
            ]}
            onPress={handlePayment}
            disabled={isLoading}
          >
            <Text style={styles.checkoutButtonText}>
              {isLoading ? 'Đang xử lý...' : 'Thanh toán'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  mainContainer: {
    flex: 1, 
    position: 'relative', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    flex: 1,
    textAlign: 'center',
    marginRight: 48, // Để cân bằng với backButton
  },
  content: {
    flex: 1,
  },
  registrationTitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '500',
  },
  courseCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  courseCardContainer: {
    position: 'relative',
    marginBottom: 40,
    paddingLeft: 8,
  },
  courseCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(139,0,0,0.6)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'flex-end',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    marginLeft: 8,
  },
  price: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  fengShuiLogo: {
    position: 'absolute',
    left: -5,
    bottom: -35,
    width: 100,
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8B0000',
    marginBottom: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B0000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  customerAvatarContainer: {
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  checkoutTotal: {
    flex: 1,
  },
  checkoutTotalLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  checkoutTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30
  },
  checkoutButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 30
  },
  checkoutButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  priceSection: {
    padding: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceTitle: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
  },
}); 