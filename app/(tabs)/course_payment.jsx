import React, { useState, useEffect, useCallback } from 'react';
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
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { paymentService } from '../../constants/paymentService';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
const scale = size => Math.round(BASE_SIZE * (size / 375));

export default function CoursePaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Log để debug
  console.log('Payment Screen Params:', params);

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VietQR');
  
  // User information
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  
  // Thêm state để xử lý loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Thêm state cho loading user info
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useFocusEffect(
    useCallback(() => {
      console.log('Payment screen is focused - re-fetching data');
      setIsLoadingUser(true);
      fetchCurrentUser();
      return () => {
        // Cleanup khi màn hình mất focus
        console.log('Payment screen lost focus');
      };
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
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
    } finally {
      setIsLoadingUser(false);
    }
  };
  
  const handleBack = () => {
    router.replace({
      pathname: '/(tabs)/course_details',
      params: { 
        courseId: params.courseId,
        source: 'payment'
      }
    });
  };
  
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('vi-VN');
  };
  
  // Modified handlePayment for testing
  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      // Gọi API tạo URL thanh toán
      const result = await paymentService.createPaymentUrl(
        params.courseId, 
        paymentService.SERVICE_TYPES.COURSE
      );

      setIsLoading(false);

      if (result.success && result.paymentUrl) {
        // Chuyển sang màn hình thanh toán
        router.push({
          pathname: '/(tabs)/payment_webview',
          params: {
            paymentUrl: result.paymentUrl,
            serviceId: params.courseId,
            serviceType: paymentService.SERVICE_TYPES.COURSE,
            serviceInfo: {
              courseId: params.courseId,
              courseTitle: params.courseTitle,
              coursePrice: params.coursePrice
            },
            orderId: result.orderId,
            returnScreen: 'course_chapter'
          }
        });
      } else {
        throw new Error(result.message || 'Không thể tạo liên kết thanh toán');
      }
    } catch (error) {
      console.error('Lỗi xử lý thanh toán:', error);
      setIsLoading(false);
      
      // Hiển thị thông báo lỗi từ backend thay vì thông báo cố định
      Alert.alert(
        'Thông báo',
        error.message || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful, navigating to course with ID:', params.courseId);
    
    // Make sure courseId exists before navigating
    if (!params.courseId) {
      console.error('No courseId available for navigation');
      Alert.alert('Lỗi', 'Không thể tìm khóa học. Vui lòng thử lại.');
      return;
    }
    
    // Store the courseId in AsyncStorage for backup
    try {
      AsyncStorage.setItem('lastViewedCourseId', params.courseId);
    } catch (err) {
      console.error('Error saving courseId to storage:', err);
    }
    
    // Navigate to course chapter screen with the courseId
    router.push({
      pathname: '/(tabs)/course_chapter',
      params: {
        courseId: params.courseId,
        source: 'payment'
      }
    });
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
                onPress={handleBack}
              >
                <View style={styles.backButtonInner}>
                  <Ionicons name="chevron-back-outline" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.titleWrapper}>
                <Text style={styles.headerSubtitle}>Khóa học</Text>
                <Text style={styles.headerTitle}>Thanh toán</Text>
              </View>
              
              <View style={styles.headerRight} />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
      
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enhanced Course Card - Styled like package card in offline_payment */}
          <View style={styles.packageCard}>
            <Image 
              source={params.courseImage ? { uri: params.courseImage } : require('../../assets/images/koi_image.jpg')} 
              style={styles.packageImage} 
            />
            <View style={styles.packageOverlay}>
              <Text style={styles.packageName}>
                {params.courseTitle || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học'}
              </Text>
              <Text style={styles.packagePrice}>
                {formatPrice(params.coursePrice)} đ
              </Text>
            </View>
          </View>
          
          {/* Customer Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.customerCard}>
              {isLoadingUser ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#8B0000" size="large" />
                  <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.customerAvatarContainer}>
                    <Ionicons name="person" size={30} color="#8B0000" />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{userName}</Text>
                    <View style={styles.contactRow}>
                      <Ionicons name="call" size={16} color="#8B0000" />
                      <Text style={styles.contactText}>{userPhone}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Ionicons name="mail" size={16} color="#8B0000" />
                      <Text style={styles.contactText}>{userEmail}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Enhanced Checkout Bar */}
        <View style={styles.checkoutContainer}>
          <View style={styles.checkoutTotal}>
            <Text style={styles.checkoutTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.checkoutTotalValue}>{formatPrice(params.coursePrice)} đ</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutButton, isLoading && { opacity: 0.7 }]}
            onPress={handlePayment}
            disabled={isLoading}
          >
            <Text style={styles.checkoutButtonText}>
              {isLoading ? 'Đang xử lý...' : 'Thanh toán ngay'}
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
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#8B0000',
    zIndex: 10,
  },
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? '12%' : '13%',
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
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingBottom: scale(120),
  },
  registrationTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: scale(16),
    letterSpacing: 0.5,
  },
  packageCard: {
    margin: scale(16),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: '#FFF',
    aspectRatio: 1.2,
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
  infoSection: {
    marginHorizontal: scale(16),
    marginBottom: scale(24),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: scale(12),
    textAlign: 'left',
    paddingLeft: scale(4),
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  customerCard: {
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    padding: scale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatarContainer: {
    marginRight: scale(14),
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.2)',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(6),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(4),
  },
  contactText: {
    fontSize: scale(14),
    color: '#666',
    marginLeft: scale(8),
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: scale(16),
    paddingBottom: Platform.OS === 'ios' ? scale(34) : scale(16),
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutTotal: {
    flex: 1,
  },
  checkoutTotalLabel: {
    fontSize: scale(14),
    color: '#666',
  },
  checkoutTotalValue: {
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
  checkoutButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(20),
  },
  loadingText: {
    marginTop: scale(8),
    color: '#666',
    fontSize: scale(14),
  },
});
