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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { paymentService } from '../../constants/paymentService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
const scale = size => Math.round(BASE_SIZE * (size / 375));

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

  useFocusEffect(
    React.useCallback(() => {
      fetchCurrentUser();
    }, [])
  );

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
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#590000', '#8B0000', '#AA0000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.push('/(tabs)/your_booking')}
              >
                <View style={styles.backButtonInner}>
                  <Ionicons name="chevron-back-outline" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.titleWrapper}>
                <Text style={styles.headerSubtitle}>Thanh toán</Text>
                <Text style={styles.headerTitle}>{getPaymentTitle(params.status)}</Text>
              </View>
              
              <View style={styles.headerRight} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Package Card */}
        <View style={styles.packageCard}>
          <Image 
            source={require('../../assets/images/koi_image.jpg')} 
            style={styles.packageImage} 
          />
          <View style={styles.packageOverlay}>
            <Text style={styles.packageName}>
              {params.packageName || 'Gói tư vấn phong thủy'}
            </Text>
            <Text style={styles.packagePrice}>
              {formatPrice(calculatePaymentAmount(params.selectedPrice, params.status))} đ
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoCard}>
            {isLoadingUser ? (
              <ActivityIndicator color="#8B0000" size="large" />
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color="#8B0000" />
                  <Text style={styles.infoText}>{userName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={20} color="#8B0000" />
                  <Text style={styles.infoText}>{userPhone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={20} color="#8B0000" />
                  <Text style={styles.infoText}>{userEmail}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tổng tiền</Text>
              <Text style={styles.priceValue}>{formatPrice(params.selectedPrice)} đ</Text>
            </View>
            {params.status === 'VerifiedOTPAttachment' && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Đã thanh toán (30%)</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(parseFloat(params.selectedPrice) * 0.3)} đ
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{getPaymentTitle(params.status)}</Text>
              <Text style={styles.totalValue}>
                {formatPrice(calculatePaymentAmount(params.selectedPrice, params.status))} đ
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutLabel}>Tổng thanh toán</Text>
          <Text style={styles.checkoutPrice}>
            {formatPrice(calculatePaymentAmount(params.selectedPrice, params.status))} đ
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <Text style={styles.checkoutButtonText}>
            {isLoading ? 'Đang xử lý...' : 'Thanh toán ngay'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#8B0000',
    zIndex: 10,
  },
  header: {
    width: '100%',
    height: '12%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    height: Platform.OS === 'ios' ? 88 : 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    marginTop: scale(5)
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  backButtonInner: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: scale(14),
    fontWeight: '500',
    marginBottom: scale(4),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: scale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: scale(40),
    marginLeft: scale(8),
  },
  content: {
    flex: 1,
  },
  packageCard: {
    margin: scale(16),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: '#FFF',
    aspectRatio: 1,
    width: SCREEN_WIDTH - scale(32),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  packageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  packageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
    paddingBottom: scale(24),
    backgroundColor: 'rgba(139, 0, 0, 0.85)',
    borderBottomLeftRadius: scale(12),
    borderBottomRightRadius: scale(12),
  },
  packageName: {
    color: '#FFF',
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: scale(8),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  packagePrice: {
    color: '#FFF',
    fontSize: scale(28),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  section: {
    marginHorizontal: scale(16),
    marginBottom: scale(24),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: scale(12),
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    padding: scale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  infoText: {
    marginLeft: scale(12),
    fontSize: scale(16),
    color: '#333',
  },
  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    padding: scale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  priceLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  priceValue: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: scale(8),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalLabel: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#8B0000',
  },
  totalValue: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#8B0000',
  },
  checkoutBar: {
    backgroundColor: '#FFF',
    padding: scale(16),
    paddingBottom: Platform.OS === 'ios' ? scale(34) : scale(16),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  checkoutPrice: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#8B0000',
  },
  checkoutButton: {
    backgroundColor: '#8B0000',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
}); 