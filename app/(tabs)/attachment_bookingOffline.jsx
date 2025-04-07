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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  const [attachmentId, setAttachmentId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailVisible, setBookingDetailVisible] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchBookingData();
    }
  }, [params.id]);

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
        console.log('No token found');
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

      console.log('Booking Response:', JSON.stringify(bookingResponse.data, null, 2));

      if (bookingResponse.data && bookingResponse.data.isSuccess) {
        const status = bookingResponse.data.data.status;
        setBookingStatus(status);
        console.log('Set booking status to:', status);
        
        // Hiển thị thông báo debug trong môi trường phát triển
        if (__DEV__) {
          setTimeout(() => {
            Alert.alert(
              "Debug - Trạng thái",
              `Trạng thái hiện tại: [${status}]`,
              [{ text: "OK" }]
            );
          }, 1000);
        }
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
        console.error('Error fetching data:', error);
        console.error('Error response:', error.response?.data);
        console.log('Attachment not found');
        // Không hiển thị alert lỗi nếu biên bản chưa được tạo, chỉ ghi log
        if (error.response?.status !== 404) {
          Alert.alert(
            "Lỗi",
            "Không thể tải biên bản. Vui lòng thử lại sau."
          );
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tải dữ liệu. Vui lòng thử lại sau."
      );
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
                const response = await axios.put(
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
                const response = await axios.put(
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

    const status = bookingStatus?.trim().toLowerCase();
    
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

    const htmlContent = `
      <!DOCTYPE html>
      <html style="height: 100%;">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              overflow: hidden;
            }
            iframe {
              border: none;
              width: 100%;
              height: 100%;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
            }
          </style>
        </head>
        <body>
          <iframe src="${attachmentUrl}" frameborder="0" allowfullscreen></iframe>
        </body>
      </html>
    `;

    return (
      <WebView
        source={{ html: htmlContent }}
        style={styles.webView}
        renderLoading={() => (
          <ActivityIndicator size="large" color="#8B0000" />
        )}
        startInLoadingState={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/your_booking')}
        >
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    marginLeft: 5,
  },
  titleSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  attachmentContainer: {
    flex: 1,
    margin: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  noAttachmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAttachmentText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    borderRadius: 10,
  },
  signButton: {
    backgroundColor: '#4A90E2',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  otpModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  otpModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  otpInputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginBottom: 10,
  },
  resendButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  resendButtonText: {
    color: '#4A90E2',
    fontSize: 14,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#8B0000',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  otpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginBottom: 10,
  },
  messageText: {
    color: '#FF9800',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF5252',
  },
});

export default AttachmentBookingOffline; 