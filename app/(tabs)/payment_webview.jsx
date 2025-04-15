import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  StatusBar, 
  Platform,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function PaymentWebView() {
  const navigation = useNavigation();
  const route = useRoute();
  const { 
    paymentUrl, 
    serviceId, 
    serviceInfo, 
    serviceType,
    returnScreen = 'home',
    orderId
  } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef(null);

  const decodedPaymentUrl = decodeURIComponent(paymentUrl || '');
  console.log('Loading payment URL:', decodedPaymentUrl);

  const handleNavigationStateChange = async (navState) => {
    const currentUrl = navState.url.toLowerCase();
    console.log('Current URL:', currentUrl);
    console.log('OrderId received:', orderId);
    
    // Xử lý khi thanh toán thành công
    if (currentUrl.includes('success')) {
      try {
        // Kiểm tra orderId
        if (!orderId) {
          console.error('Không tìm thấy orderId');
          Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn hàng');
          return;
        }

        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.error('Không tìm thấy token');
          Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
          return;
        }

        console.log('Đang gọi API cập nhật trạng thái đơn hàng:', `${API_CONFIG.baseURL}/api/Order/update-to-PENDINGCONFIRM/${orderId}`);

        // Gọi API để cập nhật trạng thái đơn hàng
        const response = await axios.put(
          `${API_CONFIG.baseURL}/api/Order/update-to-PENDINGCONFIRM/${orderId}`,
          null,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Kết quả cập nhật trạng thái:', response.data);

        if (response.data && response.data.isSuccess) {
          console.log('Đã cập nhật trạng thái đơn hàng thành công');
          
          // Đợi 5 giây rồi chuyển màn hình
          setTimeout(() => {
            navigation.navigate('menu');
          }, 5000);
          
        } else {
          throw new Error(response.data?.message || 'Cập nhật trạng thái thất bại');
        }

      } catch (error) {
        console.error('Chi tiết lỗi khi cập nhật trạng thái đơn hàng:', error.response?.data || error);
        Alert.alert(
          'Thông báo',
          'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng. Vui lòng liên hệ hỗ trợ.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('menu')
            }
          ]
        );
      }
      return;
    }

    // Xử lý khi hủy thanh toán
    if (currentUrl.includes('cancel')) {
      navigation.navigate('menu');
      return;
    }
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    
    // Danh sách domain được phép
    const allowedDomains = [
      'pay.payos.vn',
      'api.payos.vn',
      'koifengshui.com',
      '192.168.1.8:5261',
      'sandbox.payos.vn'
    ];

    // Cho phép tất cả URL có chứa "cancel" hoặc "success"
    if (url.toLowerCase().includes('cancel') || url.toLowerCase().includes('success')) {
      // Cho phép load URL success/cancel để hiển thị trang thành công/hủy
      return true;
    }

    // Kiểm tra domain cho các URL khác
    const isAllowedDomain = allowedDomains.some(domain => url.includes(domain));
    if (!isAllowedDomain) {
      console.log('Blocked URL:', url);
      return false;
    }

    return true;
  };

  const handleOnLoadEnd = () => {
    setIsLoading(false);
  };

  const handleOnError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#AE1D1D" />
      <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={60} color="#AE1D1D" />
      <Text style={styles.errorText}>Không thể tải trang thanh toán</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          setHasError(false);
          setIsLoading(true);
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#AE1D1D', '#8B0000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.retryButtonGradient}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar translucent barStyle="light-content" backgroundColor="rgba(174,29,29,0.9)" />
      
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#AE1D1D', '#212121']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, {paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 10}]}
        >
          <TouchableOpacity 
            onPress={() => navigation.navigate('menu')} 
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{width: 24}} />
        </LinearGradient>
      </View>
      
      <View style={styles.webViewContainer}>
        {hasError ? (
          renderErrorView()
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: decodedPaymentUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadEnd={handleOnLoadEnd}
            onError={handleOnError}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={renderLoadingView}
            cacheEnabled={false}
            incognito={true}
            pullToRefreshEnabled={true}
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
          />
        )}
        
        {isLoading && !hasError && renderLoadingView()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  headerContainer: {
    width: '100%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#AE1D1D',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
    color: '#444',
    maxWidth: '80%',
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
