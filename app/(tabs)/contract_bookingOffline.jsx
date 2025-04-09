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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import { WebView } from 'react-native-webview';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

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
      Alert.alert("Thành công", "Đã cập nhật dữ liệu mới");
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert("Lỗi", "Không thể cập nhật dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        console.log('No token found');
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
        
        // Log trạng thái để debug
        console.log('Fetched booking status:', status);
        
        // Hiển thị thông báo debug trong môi trường phát triển
        if (__DEV__) {
          setTimeout(() => {
            Alert.alert(
              "Thông tin trạng thái",
              `Trạng thái hiện tại: [${status}]`,
              [{ text: "OK" }]
            );
          }, 1000);
        }
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
      console.error('Error fetching data:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tải dữ liệu. Vui lòng thử lại sau."
      );
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
          <Ionicons name="document-outline" size={60} color="#666" />
          <Text style={styles.noContractText}>Không tìm thấy hợp đồng</Text>
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
          <iframe src="${contractUrl}" frameborder="0" allowfullscreen></iframe>
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
      animationType="slide"
      onRequestClose={() => {
        // Luôn cho phép đóng modal bằng nút back
        setOtpModalVisible(false);
        setOtp('');
        setOtpError('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.otpModalContent}>
          <Text style={styles.otpModalTitle}>Xác nhận ký hợp đồng</Text>
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
                // Luôn đóng modal và reset state
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

  useEffect(() => {
    if (bookingStatus) {
      console.log('Booking status changed to:', bookingStatus);
    }
  }, [bookingStatus]);

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
        <Text style={styles.pageTitle}>Hợp đồng</Text>
      </View>

      {/* Contract Display Section */}
      <View style={styles.contractContainer}>
        {renderContract()}
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
    justifyContent: 'space-between',
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
  contractContainer: {
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
  imageContainer: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  contractImage: {
    width: windowWidth - 60,
    height: windowHeight * 0.6,
    borderRadius: 10,
  },
  imageHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
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
  noContractContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noContractText: {
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
  rejectButton: {
    backgroundColor: '#FF5252',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
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
});

export default ContractBookingOffline; 