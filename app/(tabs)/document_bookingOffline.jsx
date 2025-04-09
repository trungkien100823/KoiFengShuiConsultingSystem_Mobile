import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
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

const DocumentBookingOffline = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetailVisible, setBookingDetailVisible] = useState(false);
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
    console.log('Current document status:', bookingStatus);
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
        setBookingStatus(bookingResponse.data.data.status);
      }

      // Fetch document data
      try {
        const documentResponse = await axios.get(
          `${API_CONFIG.baseURL}/api/FengShuiDocument/document/${params.id}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (documentResponse.data && documentResponse.data.isSuccess) {
          setDocumentUrl(documentResponse.data.data.documentUrl);
          setDocumentId(documentResponse.data.data.documentId);
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        console.error('Error response:', error.response?.data);
        // Không hiển thị alert lỗi nếu document chưa được tạo
        if (error.response?.status !== 404) {
          Alert.alert(
            "Lỗi",
            "Không thể tải tài liệu. Vui lòng thử lại sau."
          );
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert(
        "Lỗi",
        "Không thể tải dữ liệu. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn từ chối hồ sơ này?",
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
              let response;

              // Log để debug
              console.log('Rejecting document with ID:', params.id);
              console.log('Current booking status:', bookingStatus);
              
              if (bookingStatus.trim().toLowerCase() === 'documentconfirmedbymanager') {
                // Gọi API lấy document ID và status
                const documentResponse = await axios.get(
                  `${API_CONFIG.baseURL}/api/FengShuiDocument/document/${params.id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                console.log('Document Response:', JSON.stringify(documentResponse.data, null, 2));

                if (!documentResponse.data?.isSuccess) {
                  throw new Error(documentResponse.data?.message || 'Không thể lấy thông tin document');
                }

                const documentId = documentResponse.data.data.documentId;
                const currentDocStatus = documentResponse.data.data.status;

                if (!documentId) {
                  throw new Error('Document ID không tồn tại trong response');
                }

                console.log('Document ID:', documentId);
                console.log('Current document status:', currentDocStatus);

                // Kiểm tra trạng thái document
                if (currentDocStatus.trim().toLowerCase() !== 'pending') {
                  throw new Error('Không thể hủy tài liệu ở trạng thái hiện tại');
                }

                const url = `${API_CONFIG.baseURL}/api/FengShuiDocument/${documentId}/cancel-by-customer`;
                console.log('Calling API:', url);
                
                try {
                  response = await axios.put(
                    url,
                    {
                      bookingOfflineId: params.id
                    },
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );
                } catch (error) {
                  // Kiểm tra xem document đã được cập nhật thành công chưa
                  const checkResponse = await axios.get(
                    `${API_CONFIG.baseURL}/api/FengShuiDocument/document/${params.id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  console.log('Check document status after error:', checkResponse.data);

                  if (checkResponse.data?.data?.status?.toLowerCase() === 'cancelledbycustomer') {
                    // Nếu document đã được cập nhật thành công, coi như thành công
                    response = {
                      data: {
                        isSuccess: true,
                        message: "Đã từ chối hồ sơ thành công"
                      }
                    };
                  } else {
                    // Nếu document chưa được cập nhật, throw lỗi
                    throw error;
                  }
                }
              } else {
                const url = `${API_CONFIG.baseURL}/api/FengShuiDocument/reject-document/${params.id}`;
                console.log('Calling API:', url);
                
                response = await axios.put(
                  url,
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
              }
              
              console.log('API Response:', response.data);
              
              if (response.data && response.data.isSuccess) {
                Alert.alert("Thành công", response.data.message || "Đã từ chối hồ sơ", [
                  {
                    text: "OK",
                    onPress: () => router.push('/(tabs)/your_booking')
                  }
                ]);
              } else {
                throw new Error(response.data?.message || 'Có lỗi xảy ra');
              }
            } catch (error) {
              console.error('Lỗi từ chối hồ sơ:', error);
              console.error('Error response:', error.response?.data);
              Alert.alert("Lỗi", error.response?.data?.message || error.message || "Không thể từ chối hồ sơ. Vui lòng thử lại sau.");
            }
          }
        }
      ]
    );
  };

  const handleApprove = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn đồng ý hồ sơ này?",
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
              let response;

              // Log để debug
              console.log('Approving document with ID:', params.id);
              console.log('Current booking status:', bookingStatus);

              if (bookingStatus.trim().toLowerCase() === 'documentconfirmedbymanager') {
                // Gọi API lấy document ID
                const documentResponse = await axios.get(
                  `${API_CONFIG.baseURL}/api/FengShuiDocument/document/${params.id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                console.log('Document Response:', JSON.stringify(documentResponse.data, null, 2));

                if (!documentResponse.data?.isSuccess) {
                  throw new Error(documentResponse.data?.message || 'Không thể lấy thông tin document');
                }

                const documentId = documentResponse.data.data.documentId;
                if (!documentId) {
                  throw new Error('Document ID không tồn tại trong response');
                }

                console.log('Document ID:', documentId);

                const url = `${API_CONFIG.baseURL}/api/FengShuiDocument/${documentId}/confirm-by-customer`;
                console.log('Calling API:', url);
                
                response = await axios.put(
                  url,
                  {
                    bookingOfflineId: params.id
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
              } else {
                const url = `${API_CONFIG.baseURL}/api/FengShuiDocument/approve-document/${params.id}`;
                console.log('Calling API:', url);
                
                response = await axios.put(
                  url,
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
              }
              
              console.log('API Response:', response.data);
              
              if (response.data && response.data.isSuccess) {
                Alert.alert("Thành công", response.data.message || "Đã đồng ý hồ sơ", [
                  {
                    text: "OK",
                    onPress: () => router.push('/(tabs)/your_booking')
                  }
                ]);
              } else {
                throw new Error(response.data?.message || 'Có lỗi xảy ra');
              }
            } catch (error) {
              console.error('Lỗi xác nhận hồ sơ:', error);
              console.error('Error response:', error.response?.data);
              Alert.alert("Lỗi", error.response?.data?.message || error.message || "Không thể đồng ý hồ sơ. Vui lòng thử lại sau.");
            }
          }
        }
      ]
    );
  };

  const renderActionButtons = () => {
    if (!bookingStatus) return null;

    const status = bookingStatus.trim().toLowerCase();
    console.log('Current document status:', status);

    // Log chi tiết hơn để debug
    console.log('Comparing document status:', {
      status: status,
      isDocumentConfirmedByManager: status === 'documentconfirmedbymanager' || status.includes('documentconfirmedbymanager'),
      isDocumentConfirmedByCustomer: status === 'documentconfirmedbycustomer' || status.includes('documentconfirmedbycustomer'),
      isAttachmentPendingRejected: status === 'attachmentpendingrejected' || status.includes('attachmentpendingrejected'),
      isCompleted: status === 'completed' || status.includes('completed')
    });

    // Hiển thị nút Đồng ý và Từ chối khi trạng thái là DocumentConfirmedByManager
    if (status === 'documentconfirmedbymanager' || status.includes('documentconfirmedbymanager')) {
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
    if (!status.includes('documentconfirmedbymanager') && 
        !status.includes('documentconfirmedbycustomer') && 
        !status.includes('attachmentpendingrejected') && 
        !status.includes('completed')) {
      console.log('Unhandled document status:', status);
    }

    return null;
  };

  const renderDocument = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      );
    }

    if (!documentUrl) {
      return (
        <View style={styles.noDocumentContainer}>
          <Ionicons name="document-outline" size={60} color="#666" />
          <Text style={styles.noDocumentText}>Không tìm thấy hồ sơ</Text>
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
          <iframe src="${documentUrl}" frameborder="0" allowfullscreen></iframe>
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
        <Text style={styles.pageTitle}>Hồ sơ phong thủy</Text>
      </View>

      {/* Document Display Section */}
      <View style={styles.documentContainer}>
        {renderDocument()}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {renderActionButtons()}
      </View>
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
  documentContainer: {
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
  noDocumentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDocumentText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DocumentBookingOffline; 