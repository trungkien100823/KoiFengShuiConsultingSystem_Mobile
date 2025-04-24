import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ImageBackground,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

const ContractBookingOffline = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [contractUrl, setContractUrl] = useState(null);
  const [contractId, setContractId] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (params.id && isFirstLoad) {
      fetchBookingData();
      setIsFirstLoad(false);
    }
  }, [params.id, isFirstLoad]);

  useFocusEffect(
    React.useCallback(() => {
      if (params.id && !isFirstLoad) {
        fetchBookingData();
      }
    }, [params.id, isFirstLoad])
  );

  useEffect(() => {
    if (bookingStatus?.trim().toLowerCase() === 'firstpaymentpendingconfirm') {
      Alert.alert(
        "Thông báo",
        "Bạn đã thanh toán thành công, Master đang xác nhận thanh toán của bạn"
      );
    }
  }, [bookingStatus]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchBookingData();
      if (bookingStatus && contractUrl) {
        Alert.alert("Thành công", "Đã cập nhật dữ liệu mới");
      }
    } catch (error) {
      if (!bookingStatus || !contractUrl) {
        console.error('Error refreshing data:', error);
        Alert.alert("Lỗi", "Không thể cập nhật dữ liệu. Vui lòng thử lại sau.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch booking status
      const bookingResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (bookingResponse.data && bookingResponse.data.isSuccess) {
        const status = bookingResponse.data.data.status;
        setBookingStatus(status);
      }

      // Fetch contract data
      const contractResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/Contract/by-bookingOffline/${params.id}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (contractResponse.data && contractResponse.data.isSuccess) {
        setContractUrl(contractResponse.data.data.contractUrl);
        setContractId(contractResponse.data.data.contractId);
      }
    } catch (error) {
      // Chỉ log lỗi, không hiển thị alert
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (!contractId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin hợp đồng");
      return;
    }

    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn từ chối hợp đồng này?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await axios.patch(
                `${API_CONFIG.baseURL}/api/Contract/customer/cancel/${contractId}`,
                {},
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (response.data && response.data.isSuccess) {
                Alert.alert("Thành công", "Đã từ chối hợp đồng");
                router.push('/(tabs)/your_booking');
              }
            } catch (error) {
              console.error('Error rejecting contract:', error);
              Alert.alert("Lỗi", "Không thể từ chối hợp đồng. Vui lòng thử lại sau.");
            }
          }
        }
      ]
    );
  };

  const handleApprove = async () => {
    if (!contractId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin hợp đồng");
      return;
    }

    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn đồng ý hợp đồng này?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Đồng ý",
          style: "default",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await axios.patch(
                `${API_CONFIG.baseURL}/api/Contract/customer/confirm/${contractId}`,
                {},
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (response.data && response.data.isSuccess) {
                Alert.alert("Thành công", "Đã đồng ý hợp đồng");
                router.push('/(tabs)/your_booking');
              }
            } catch (error) {
              console.error('Error confirming contract:', error);
              Alert.alert("Lỗi", "Không thể đồng ý hợp đồng. Vui lòng thử lại sau.");
            }
          }
        }
      ]
    );
  };

  const handleSignContract = async () => {
    if (!contractId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Contract/send-otp/${contractId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.isSuccess) {
        setOtpModalVisible(true);
      } else {
        // Hiển thị thông báo lỗi cụ thể từ backend
        Alert.alert("Lỗi", response.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      let errorMessage = "Không thể gửi mã OTP. Vui lòng thử lại sau.";
      
      // Xử lý các trường hợp lỗi cụ thể
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Trạng thái hợp đồng không hợp lệ để gửi OTP.";
            break;
          case 404:
            errorMessage = "Không tìm thấy thông tin hợp đồng hoặc booking.";
            break;
          case 500:
            errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
            break;
        }
        
        // Nếu có message từ backend thì hiển thị
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert("Lỗi", errorMessage);
    }
  };

  const handleResendOTP = async () => {
    if (!contractId) {
      console.log('Error: contractId is missing');
      Alert.alert("Lỗi", "Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      console.log('Sending OTP request for contractId:', contractId);
      const token = await getAuthToken();
      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.sendOTPContract.replace('{contractId}', contractId)}`;
      console.log('Request URL:', url);
      
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Send OTP Response:', response.data);
      
      if (response.data && response.data.isSuccess) {
        Alert.alert("Thành công", "Đã gửi lại mã OTP mới");
        setOtp('');
        setOtpError('');
      } else {
        console.log('Send OTP failed:', response.data);
        Alert.alert("Lỗi", response.data?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error('Error sending OTP:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        contractId: contractId
      });
      
      let errorMessage = "Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert("Lỗi", errorMessage);
    }
  };

  const handleConfirmOTP = async () => {
    if (!otp.trim()) {
      console.log('Error: OTP is empty');
      setOtpError('Vui lòng nhập mã OTP');
      return;
    }

    if (!contractId) {
      console.log('Error: contractId is missing');
      Alert.alert("Lỗi", "Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      console.log('Verifying OTP for contractId:', contractId);
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('OtpCode', otp.trim());

      console.log('OTP Request Data:', {
        contractId: contractId,
        otpCode: otp.trim()
      });

      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.verifyOTPContract.replace('{contractId}', contractId)}`;
      console.log('Request URL:', url);

      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Verify OTP Response:', response.data);
      
      if (response.data && response.data.isSuccess) {
        setOtpModalVisible(false);
        setOtp('');
        setOtpError('');
        Alert.alert("Thành công", "Xác thực OTP thành công");
        router.push('/(tabs)/your_booking');
      } else {
        console.log('Verify OTP failed:', response.data);
        setOtpError(response.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
      }
    } catch (error) {
      console.error('Error verifying OTP:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        contractId: contractId,
        otpLength: otp?.length
      });
      
      let errorMessage = "Mã OTP không đúng hoặc đã hết hạn";
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Mã OTP không đúng hoặc đã hết hạn";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy thông tin hợp đồng";
      } else if (error.response?.status === 500) {
        errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
      }
      
      setOtpError(errorMessage);
    }
  };

  const renderContract = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
        </View>
      );
    }

    if (!contractUrl) {
      return (
        <View style={styles.noContractContainer}>
          <View style={styles.noContractIconContainer}>
            <Ionicons name="document-outline" size={64} color="#8B0000" />
          </View>
          <Text style={styles.noContractTitle}>Không tìm thấy hợp đồng</Text>
          <Text style={styles.noContractSubtitle}>
            Vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ
          </Text>
        </View>
      );
    }

    // Thử sử dụng nhiều phương pháp hiển thị PDF khác nhau
    // Option 1: Google PDF Viewer
    let pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(contractUrl)}&embedded=true`;
    
    // Chuẩn bị fallback URLs để thử khi cần
    const pdfJsViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(contractUrl)}`;
    
    console.log('PDF Viewer URL:', pdfViewerUrl);

    // Thêm mã JavaScript để tối ưu hiển thị PDF khi tải xong
    const injectedJavaScript = `
      document.addEventListener('DOMContentLoaded', function() {
        // Tối ưu khung hiển thị PDF để vừa với màn hình
        var viewerContainer = document.querySelector('.viewer-container');
        if (viewerContainer) {
          viewerContainer.style.width = '100%';
          viewerContainer.style.height = '100%';
          viewerContainer.style.padding = '0';
          viewerContainer.style.margin = '0';
          viewerContainer.style.overflow = 'hidden';
        }
        
        // Tối ưu các điều khiển cuộn trang
        var controls = document.querySelector('.controls');
        if (controls) {
          controls.style.position = 'sticky';
          controls.style.top = '0';
          controls.style.zIndex = '1000';
        }
        
        // Loại bỏ padding và margin cho các phần tử con
        var allDivs = document.querySelectorAll('div');
        allDivs.forEach(function(div) {
          if (div.style.padding) {
            div.style.padding = '0';
          }
          if (div.style.margin) {
            div.style.margin = '0';
          }
        });
        
        // Điều chỉnh style cho trang PDF
        var pdfContainer = document.querySelector('.goog-container');
        if (pdfContainer) {
          pdfContainer.style.backgroundColor = 'white';
          pdfContainer.style.margin = '0';
          pdfContainer.style.padding = '0';
          pdfContainer.style.borderRadius = '0';
          pdfContainer.style.overflow = 'hidden';
        }
        
        // Điều chỉnh các trang PDF
        var pdfPages = document.querySelectorAll('.page');
        if (pdfPages.length > 0) {
          pdfPages.forEach(function(page) {
            page.style.margin = '0 auto';
            page.style.padding = '0';
            page.style.borderRadius = '0';
            page.style.border = 'none';
            page.style.boxShadow = 'none';
            page.style.width = '100%';
          });
        }
        
        // Điều chỉnh thêm cho viewer của PDF.js
        var viewerContainer = document.getElementById('viewer');
        if (viewerContainer) {
          viewerContainer.style.width = '100%';
          viewerContainer.style.height = '100%';
          viewerContainer.style.padding = '0';
          viewerContainer.style.margin = '0';
          viewerContainer.style.overflow = 'hidden';
          viewerContainer.style.backgroundColor = 'white';
        }
        
        // Kiểm tra nếu Google Viewer không hiển thị đúng thì tự động chuyển sang PDF.js
        setTimeout(function() {
          var googlePdfElement = document.querySelector('#viewer');
          if (!googlePdfElement || googlePdfElement.style.display === 'none') {
            window.location.href = "${pdfJsViewerUrl}";
          }
        }, 5000);
      });
      true;
    `;

    return (
      <WebView
        source={{ uri: pdfViewerUrl }}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải tài liệu...</Text>
          </View>
        )}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        scalesPageToFit={true}
        bounces={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        injectedJavaScript={injectedJavaScript}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          
          // Nếu Google PDF Viewer không hoạt động, thử dùng PDF.js trực tiếp
          setContractUrl(pdfJsViewerUrl);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
          
          // Thử fallback sang PDF.js của Mozilla
          if (pdfViewerUrl.includes('docs.google.com')) {
            console.log('Trying PDF.js fallback');
            setContractUrl(pdfJsViewerUrl);
          } else {
            setContractUrl(null);
          }
        }}
      />
    );
  };

  const renderActionButtons = () => {
    if (!bookingStatus) return null;

    const status = bookingStatus.trim().toLowerCase();
    console.log('Current status:', bookingStatus);
    console.log('Trimmed and lowercased status:', status);

    // Log chi tiết hơn để debug
    console.log('Comparing status:', {
      status: status,
      isContractConfirmedByCustomer: status === 'contractconfirmedbycustomer' || status.includes('contractconfirmedbycustomer'),
      isVerifyingOTP: status === 'verifyingotp' || status.includes('verifyingotp'),
      isContractConfirmedByManager: status === 'contractconfirmedbymanager' || status.includes('contractconfirmedbymanager')
    });

    // Hiển thị nút Ký hợp đồng khi booking ở trạng thái ContractConfirmedByCustomer
    if (status === 'contractconfirmedbycustomer' || status.includes('contractconfirmedbycustomer')) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.signButton]}
            onPress={handleSignContract}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Ký hợp đồng</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Hiển thị nút Ký hợp đồng khi booking ở trạng thái VerifyingOTP
    if (status === 'verifyingotp' || status.includes('verifyingotp')) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.signButton]}
            onPress={handleSignContract}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Ký hợp đồng</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Hiển thị nút Đồng ý và Từ chối khi booking ở trạng thái ContractConfirmedByManager
    if (status === 'contractconfirmedbymanager' || status.includes('contractconfirmedbymanager')) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={handleApprove}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Đồng ý</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Hiển thị thông tin trạng thái nếu không khớp với bất kỳ trường hợp nào
    if (!status.includes('contractconfirmedbycustomer') && 
        !status.includes('verifyingotp') && 
        !status.includes('contractconfirmedbymanager')) {
      console.log('Unhandled contract status:', status);
    }

    return null;
  };

  const renderOTPModal = () => (
    <Modal
      visible={otpModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setOtpModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.otpModalContent}>
          <View style={styles.otpModalHeader}>
            <Text style={styles.otpModalTitle}>Xác thực OTP</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setOtpModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.otpModalSubtitle}>
            Vui lòng nhập mã OTP đã được gửi đến email của bạn
          </Text>
          
          <TextInput
            style={[styles.otpInput, otpError && styles.otpInputError]}
            value={otp}
            onChangeText={text => {
              setOtp(text);
              setOtpError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Nhập mã OTP"
            placeholderTextColor="#999"
          />
          
          {otpError ? (
            <Text style={styles.errorText}>{otpError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOTP}
          >
            <Text style={styles.resendButtonText}>Gửi lại mã OTP</Text>
          </TouchableOpacity>

          <View style={styles.otpButtonRow}>
            <TouchableOpacity
              style={[styles.otpButton, styles.otpCancelButton]}
              onPress={() => setOtpModalVisible(false)}
            >
              <Text style={styles.otpButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.otpButton, styles.otpConfirmButton]}
              onPress={handleConfirmOTP}
            >
              <Text style={styles.otpButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  useEffect(() => {
    if (bookingStatus) {
      console.log('Booking status changed to:', bookingStatus);
    }
  }, [bookingStatus]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#590000" />
      
      {/* Enhanced Gradient Header */}
      <LinearGradient
        colors={['#590000', '#8B0000', '#AA1E23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.safeAreaHeader}>
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButtonContainer}
                onPress={() => router.push('/(tabs)/your_booking')}
              >
                <View style={styles.backButtonInner}>
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Hợp đồng tư vấn</Text>
                <Text style={styles.headerSubtitle}>Xem và ký hợp đồng</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Contract Display */}
        <View style={styles.contractWrapper}>
          {renderContract()}
        </View>

        {/* Action Buttons */}
        {renderActionButtons() && (
          <View style={styles.actionContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', '#fff']}
              style={styles.actionGradient}
            >
              {renderActionButtons()}
            </LinearGradient>
          </View>
        )}
      </View>

      {/* OTP Modal with enhanced design */}
      <Modal
        visible={otpModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContent}>
            <View style={styles.otpModalHeader}>
              <Text style={styles.otpModalTitle}>Xác thực OTP</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setOtpModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.otpModalSubtitle}>
              Vui lòng nhập mã OTP đã được gửi đến email của bạn
            </Text>
            
            <TextInput
              style={[styles.otpInput, otpError && styles.otpInputError]}
              value={otp}
              onChangeText={text => {
                setOtp(text);
                setOtpError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Nhập mã OTP"
              placeholderTextColor="#999"
            />
            
            {otpError ? (
              <Text style={styles.errorText}>{otpError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
            >
              <Text style={styles.resendButtonText}>Gửi lại mã OTP</Text>
            </TouchableOpacity>

            <View style={styles.otpButtonRow}>
              <TouchableOpacity
                style={[styles.otpButton, styles.otpCancelButton]}
                onPress={() => setOtpModalVisible(false)}
              >
                <Text style={styles.otpButtonText}>Hủy bỏ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.otpButton, styles.otpConfirmButton]}
                onPress={handleConfirmOTP}
              >
                <Text style={styles.otpButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  safeAreaHeader: {
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerContent: {
    height: Platform.OS === 'ios' ? 88 : 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButtonContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contractWrapper: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    overflow: 'hidden',
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
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noContractContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noContractIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noContractTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  noContractSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionGradient: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  signButton: {
    backgroundColor: '#1D4ED8',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpModalContent: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  otpModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    marginBottom: 16,
  },
  otpInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
  },
  otpButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  otpButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  otpCancelButton: {
    backgroundColor: '#EF4444',
  },
  otpConfirmButton: {
    backgroundColor: '#059669',
  },
  otpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContractBookingOffline; 