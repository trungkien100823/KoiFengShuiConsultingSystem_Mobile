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
  ImageBackground,
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
        setLoading(false);
        return;
      }

      // Fetch booking status
      try {
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
      } catch (error) {
        // Chỉ log lỗi, không hiển thị alert
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
        // Chỉ log lỗi, không hiển thị alert
      }
    } catch (error) {
      // Chỉ log lỗi, không hiển thị alert
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

                const url = `${API_CONFIG.baseURL}/api/FengShuiDocument/${documentId}/cancel-by-customer`;
                console.log('Calling API:', url);
                
                try {
                  response = await axios.patch(
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
                
                response = await axios.patch(
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
                
                response = await axios.patch(
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
                
                response = await axios.patch(
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

    // Thử sử dụng nhiều phương pháp hiển thị PDF khác nhau
    // Option 1: Google PDF Viewer
    let pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;
    
    // Chuẩn bị fallback URLs để thử khi cần
    const pdfJsViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(documentUrl)}`;
    
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
          <View style={styles.webViewLoadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải hồ sơ PDF...</Text>
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
          setDocumentUrl(pdfJsViewerUrl);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
          
          // Thử fallback sang PDF.js của Mozilla
          if (pdfViewerUrl.includes('docs.google.com')) {
            console.log('Trying PDF.js fallback');
            setDocumentUrl(pdfJsViewerUrl);
          } else {
            setDocumentUrl(null);
          }
        }}
      />
    );
  };

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
  documentContainer: {
    flex: 1,
    margin: 0,
    padding: 0,
    backgroundColor: 'white',
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
  noDocumentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  noDocumentText: {
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
  rejectButton: {
    backgroundColor: '#8B0000',
  },
  approveButton: {
    backgroundColor: '#006400',
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
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  webViewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  webViewLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default DocumentBookingOffline; 