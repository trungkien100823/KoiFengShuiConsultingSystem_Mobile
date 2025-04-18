import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import { WebView } from 'react-native-webview';

const AttachmentBookingOffline = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [attachmentId, setAttachmentId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailVisible, setBookingDetailVisible] = useState(false);

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
    if (bookingStatus) {
      console.log('Current booking status:', bookingStatus);
      console.log('Status after trim and lowercase:', bookingStatus.trim().toLowerCase());
      
      if (bookingStatus.trim().toLowerCase() === 'verifyingotpattachment') {
        setOtpModalVisible(true);
      }
      
      if (bookingStatus.trim().toLowerCase() === 'secondpaymentpendingconfirm') {
        console.log('Showing alert for SecondPaymentPendingConfirm');
        setTimeout(() => {
          Alert.alert(
            "Thông báo",
            "Bạn đã thanh toán thành công, Master đang xác nhận thanh toán của bạn"
          );
        }, 500);
      }
    }
  }, [bookingStatus]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch booking status first
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

      // Fetch attachment data
      try {
        const attachmentResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Attachment/booking/${params.id}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (attachmentResponse.data && attachmentResponse.data.isSuccess && attachmentResponse.data.data) {
          setAttachmentUrl(attachmentResponse.data.data.attachmentUrl);
          setAttachmentId(attachmentResponse.data.data.attachmentId);
        }
      } catch (error) {
        // Chỉ log lỗi, không hiển thị alert
      }
    } catch (error) {
      // Chỉ log lỗi, không hiển thị alert
    } finally {
      setLoading(false);
    }
  };

  const handleSignAttachment = async () => {
    if (!attachmentId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin biên bản");
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Attachment/send-otp/${attachmentId}`,
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
        Alert.alert("Lỗi", response.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      let errorMessage = "Không thể gửi mã OTP. Vui lòng thử lại sau.";
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Trạng thái biên bản không hợp lệ để gửi OTP.";
            break;
          case 404:
            errorMessage = "Không tìm thấy thông tin biên bản hoặc booking.";
            break;
          case 500:
            errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
            break;
        }
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert("Lỗi", errorMessage);
    }
  };

  const handleResendOTP = async () => {
    if (!attachmentId) {
      console.log('Error: attachmentId is missing');
      Alert.alert("Lỗi", "Không tìm thấy thông tin biên bản");
      return;
    }

    try {
      console.log('Sending OTP request for attachmentId:', attachmentId);
      const token = await getAuthToken();
      const url = `${API_CONFIG.baseURL}/api/Attachment/send-otp/${attachmentId}`;
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
        attachmentId: attachmentId
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

    if (!attachmentId) {
      console.log('Error: attachmentId is missing');
      Alert.alert("Lỗi", "Không tìm thấy thông tin biên bản");
      return;
    }

    try {
      console.log('Verifying OTP for attachmentId:', attachmentId);
      const token = await getAuthToken();

      console.log('OTP Request Data:', {
        attachmentId: attachmentId,
        otpCode: otp.trim()
      });

      const url = `${API_CONFIG.baseURL}/api/Attachment/verify-otp/${attachmentId}`;
      console.log('Request URL:', url);

      const response = await axios.post(
        url,
        {
          otpCode: otp.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Verify OTP Response:', response.data);
      
      if (response.data && response.data.isSuccess) {
        setOtpModalVisible(false);
        setOtp('');
        setOtpError('');

        // Lấy thông tin booking từ API
        const bookingResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/Booking/${params.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Booking Response:', JSON.stringify(bookingResponse.data, null, 2));

        if (bookingResponse.data && bookingResponse.data.isSuccess) {
          const bookingData = bookingResponse.data.data;
          console.log('Booking Data:', JSON.stringify(bookingData, null, 2));

          const paymentParams = {
            serviceId: params.id,
            packageName: bookingData.packageName || 'Gói tư vấn phong thủy',
            selectedPrice: bookingData.finalPrice || bookingData.price || bookingData.selectedPrice,
            status: 'VerifiedOTPAttachment',
            serviceType: 'BookingOffline'
          };

          console.log('Payment Params:', JSON.stringify(paymentParams, null, 2));

          Alert.alert("Thành công", "Xác thực OTP thành công", [
            {
              text: "OK",
              onPress: () => {
                router.push({
                  pathname: '/(tabs)/offline_payment',
                  params: paymentParams
                });
              }
            }
          ]);
        } else {
          throw new Error('Không thể lấy thông tin booking');
        }
      } else {
        console.log('Verify OTP failed:', response.data);
        setOtpError(response.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
      }
    } catch (error) {
      console.error('Error verifying OTP:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        attachmentId: attachmentId,
        otpLength: otp?.length
      });
      
      let errorMessage = "Mã OTP không đúng hoặc đã hết hạn";
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Mã OTP không đúng hoặc đã hết hạn";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy thông tin biên bản";
      } else if (error.response?.status === 500) {
        errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
      }
      
      setOtpError(errorMessage);
    }
  };

  const handleApprove = async () => {
    try {
      if (!attachmentId) {
        console.error('Error approving attachment: [Error: Không tìm thấy ID biên bản]');
        Alert.alert(
          "Thông báo",
          "Biên bản chưa được tạo. Vui lòng chờ Master tạo biên bản."
        );
        return;
      }

      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập lại để tiếp tục");
        return;
      }

      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn đồng ý biên bản này?",
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
                const response = await axios.patch(
                  `${API_CONFIG.baseURL}/api/Attachment/confirm/${attachmentId}`,
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (response.data && response.data.isSuccess) {
                  Alert.alert("Thành công", "Đã đồng ý biên bản");
                  router.push('/(tabs)/your_booking');
                }
              } catch (error) {
                console.error('Error confirming attachment:', error);
                Alert.alert("Lỗi", "Không thể đồng ý biên bản. Vui lòng thử lại sau.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleApprove:', error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại sau.");
    }
  };

  const handleReject = async () => {
    try {
      if (!attachmentId) {
        console.error('Error rejecting attachment: [Error: Không tìm thấy ID biên bản]');
        Alert.alert(
          "Thông báo",
          "Biên bản chưa được tạo. Vui lòng chờ Master tạo biên bản."
        );
        return;
      }

      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập lại để tiếp tục");
        return;
      }

      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn từ chối biên bản này?",
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
                const response = await axios.patch(
                  `${API_CONFIG.baseURL}/api/Attachment/cancel/${attachmentId}`,
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (response.data && response.data.isSuccess) {
                  Alert.alert("Thành công", "Đã từ chối biên bản");
                  router.push('/(tabs)/your_booking');
                }
              } catch (error) {
                console.error('Error rejecting attachment:', error);
                Alert.alert("Lỗi", "Không thể từ chối biên bản. Vui lòng thử lại sau.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleReject:', error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại sau.");
    }
  };

  const renderAttachment = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải biên bản...</Text>
        </View>
      );
    }

    if (!attachmentUrl) {
      return (
        <View style={styles.noAttachmentContainer}>
          <Ionicons name="document-outline" size={60} color="#666" />
          <Text style={styles.noAttachmentText}>
            Không tìm thấy biên bản nghiệm thu
          </Text>
        </View>
      );
    }

    // Thử sử dụng nhiều phương pháp hiển thị PDF khác nhau
    // Option 1: Google PDF Viewer
    let pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(attachmentUrl)}&embedded=true`;
    
    // Chuẩn bị fallback URLs để thử khi cần
    const pdfJsViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(attachmentUrl)}`;
    
    console.log('PDF Viewer URL:', pdfViewerUrl);

    // Thêm mã JavaScript để tối ưu hiển thị PDF khi tải xong
    const injectedJavaScript = `
      document.addEventListener('DOMContentLoaded', function() {
        // Tối ưu khung hiển thị PDF để vừa với màn hình
        var viewerContainer = document.querySelector('.viewer-container');
        if (viewerContainer) {
          viewerContainer.style.width = '100%';
          viewerContainer.style.height = '100%';
        }
        
        // Tối ưu các điều khiển cuộn trang
        var controls = document.querySelector('.controls');
        if (controls) {
          controls.style.position = 'sticky';
          controls.style.top = '0';
          controls.style.zIndex = '1000';
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
        renderLoading={() => (
          <View style={styles.webViewLoadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải biên bản PDF...</Text>
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
          setAttachmentUrl(pdfJsViewerUrl);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
          
          // Thử fallback sang PDF.js của Mozilla
          if (pdfViewerUrl.includes('docs.google.com')) {
            console.log('Trying PDF.js fallback');
            setAttachmentUrl(pdfJsViewerUrl);
          } else {
            setAttachmentUrl(null);
          }
        }}
      />
    );
  };

  const renderActionButtons = () => {
    if (!bookingStatus) return null;

    const status = bookingStatus.trim().toLowerCase();
    console.log('Rendering buttons for status:', status);
    
    // Log chi tiết để debug
    console.log('Status checks:', {
      isDocumentConfirmedByCustomer: status.includes('documentconfirmedbycustomer'),
      isAttachmentConfirmed: status.includes('attachmentconfirmed'),
      isVerifyingOTPAttachment: status.includes('verifyingotpattachment'),
      rawStatus: bookingStatus
    });

    // Kiểm tra chính xác trạng thái DocumentConfirmedByCustomer
    if (status.includes('documentconfirmedbycustomer')) {
      try {
        if (!attachmentId) {
          console.log('Error: Attachment ID not found');
          return null;
        }

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
      } catch (error) {
        console.error('Error rendering buttons for DocumentConfirmedByCustomer:', error);
        return null;
      }
    }
    //documentconfirmedbycustomer
    // Kiểm tra trạng thái AttachmentConfirmed và VerifyingOTPAttachment
    if (status.includes('attachmentconfirmed') || status.includes('verifyingotpattachment')) {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.signButton]}
            onPress={handleSignAttachment}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Ký biên bản</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Log nếu không phù hợp với bất kỳ điều kiện nào
    console.log('No matching condition for status:', status);
    return null;
  };

  const renderOTPModal = () => (
    <Modal
      visible={otpModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setOtpModalVisible(false);
        setOtp('');
        setOtpError('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.otpModalContent}>
          <Text style={styles.otpModalTitle}>Xác nhận ký biên bản</Text>
          <Text style={styles.otpModalSubtitle}>Nhập mã OTP</Text>
          
          <TextInput
            style={[
              styles.otpInput,
              otpError ? styles.otpInputError : null
            ]}
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setOtpError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Nhập mã OTP"
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
              style={[styles.otpButton, styles.cancelButton]}
              onPress={() => {
                setOtpModalVisible(false);
                setOtp('');
                setOtpError('');
              }}
            >
              <Text style={styles.otpButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.otpButton, styles.confirmButton]}
              onPress={handleConfirmOTP}
            >
              <Text style={styles.otpButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/feng shui.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/your_booking')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Biên bản nghiệm thu</Text>
        </View>

        {/* Attachment Display Section */}
        <View style={styles.attachmentContainer}>
          {renderAttachment()}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {renderActionButtons()}
        </View>

        {renderOTPModal()}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 5,
  },
  titleSection: {
    padding: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  attachmentContainer: {
    flex: 1,
    margin: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '600',
  },
  noAttachmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  noAttachmentText: {
    fontSize: 16,
    color: '#8B0000',
    marginTop: 10,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  approveButton: {
    backgroundColor: '#006400',
  },
  rejectButton: {
    backgroundColor: '#8B0000',
  },
  signButton: {
    backgroundColor: '#191970',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  webView: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  webViewLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpModalContent: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  otpModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  otpModalSubtitle: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 25,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    letterSpacing: 5,
    color: '#FFF',
  },
  otpInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'center',
    padding: 10,
    marginBottom: 20,
  },
  resendButtonText: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: '600',
  },
  otpButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  otpButton: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    backgroundColor: '#8B0000',
  },
  confirmButton: {
    backgroundColor: '#006400',
  },
  otpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default AttachmentBookingOffline; 