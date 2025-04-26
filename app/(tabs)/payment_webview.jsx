import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';

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
  

  const handleNavigationStateChange = async (navState) => {
    const currentUrl = navState.url.toLowerCase();
    
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

        

        if (response.data && response.data.isSuccess) {
          
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
        }}
      >
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('menu')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{width: 24}} />
      </LinearGradient>
      
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  backButton: {
    padding: 8
  },
  webViewContainer: {
    flex: 1
  },
  webView: {
    flex: 1
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#AE1D1D'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#AE1D1D',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});
