import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { paymentService } from '../../constants/paymentService';

export default function PaymentWebView() {
  const route = useRoute();
  const navigation = useNavigation();
  const { 
    paymentUrl, 
    serviceId, 
    serviceInfo, 
    serviceType,
    returnScreen = 'home'
  } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleNavigationStateChange = (navState) => {
    // Kiểm tra URL để xác định kết quả thanh toán
    const currentUrl = navState.url.toLowerCase();
    
    // Nếu URL chứa các từ khóa như "success", "return", "callback=success"
    if (currentUrl.includes('success') || currentUrl.includes('return_url') || currentUrl.includes('callback=success')) {
      handlePaymentSuccess();
    }
    
    // Nếu URL chứa các từ khóa như "fail", "error", "callback=fail"
    if (currentUrl.includes('fail') || currentUrl.includes('error') || currentUrl.includes('callback=fail')) {
      handlePaymentFail();
    }
    
    // Nếu URL chứa các từ khóa như "cancel", "callback=cancel"
    if (currentUrl.includes('cancel') || currentUrl.includes('callback=cancel')) {
      handlePaymentCancel();
    }
  };

  const handlePaymentSuccess = () => {
    // Hiển thị thông báo dựa trên loại dịch vụ
    let title = 'Thanh toán thành công';
    let message = 'Cảm ơn bạn đã thanh toán.';
    
    switch (serviceType) {
      case paymentService.SERVICE_TYPES.BOOKING_ONLINE:
        message = 'Buổi tư vấn trực tuyến của bạn đã được xác nhận.';
        break;
      case paymentService.SERVICE_TYPES.BOOKING_OFFLINE:
        message = 'Buổi tư vấn trực tiếp của bạn đã được xác nhận.';
        break;
      case paymentService.SERVICE_TYPES.COURSE:
        message = 'Bạn đã đăng ký khóa học thành công.';
        break;
      case paymentService.SERVICE_TYPES.REGISTER_ATTEND:
        message = 'Bạn có thể xem thông tin vé ngay bây giờ.';
        break;
    }
    
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Xem chi tiết',
          onPress: () => {
            // Điều hướng dựa trên loại dịch vụ
            navigation.navigate(returnScreen, {
              serviceId: serviceId,
              serviceInfo: serviceInfo
            });
          }
        }
      ]
    );
  };

  const handlePaymentFail = () => {
    Alert.alert(
      'Thanh toán thất bại',
      'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau.',
      [
        {
          text: 'Đóng',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handlePaymentCancel = () => {
    Alert.alert(
      'Thanh toán đã hủy',
      'Bạn đã hủy quá trình thanh toán.',
      [
        {
          text: 'Đóng',
          onPress: () => navigation.goBack()
        }
      ]
    );
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
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{width: 24}} />
      </LinearGradient>
      
      {hasError ? (
        renderErrorView()
      ) : (
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: paymentUrl }}
            onLoad={() => console.log('WebView đang tải...')}
            onLoadEnd={handleOnLoadEnd}
            onError={handleOnError}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            style={styles.webView}
          />
          {isLoading && renderLoadingView()}
        </View>
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
