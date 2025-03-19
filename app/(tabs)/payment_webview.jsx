import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { paymentService } from '../../constants/paymentService';
import { useRouter } from 'expo-router';

export default function PaymentWebView() {
  const router = useRouter();
  const route = useRoute();
  const navigation = useNavigation();
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

  const handleNavigationStateChange = (navState) => {
    const currentUrl = navState.url.toLowerCase();
    console.log('Current URL:', currentUrl);
    
    // Xử lý khi thanh toán thành công
    if (currentUrl.includes('success')) {
      // Đợi 5 giây ở màn hình thành công rồi mới chuyển về workshop
      setTimeout(() => {
        router.replace('/(tabs)/workshop');
      }, 5000);
      return;
    }

    // Xử lý khi hủy thanh toán
    if (currentUrl.includes('cancel')) {
      // Chuyển thẳng về workshop ngay lập tức khi hủy
      router.replace('/(tabs)/workshop');
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
          onPress={() => router.back()} 
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
