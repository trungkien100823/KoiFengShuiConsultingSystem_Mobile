import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Alert,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import CustomTabBar from '../../components/ui/CustomTabBar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paymentService } from '../../constants/paymentService';

const YourBooking = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultType, setSelectedConsultType] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);
  const [modalType, setModalType] = useState('status');
  
  const consultTypeOptions = [
    { id: 'all', label: 'Tất cả loại tư vấn' },
    { id: 'Online', label: 'Tư vấn Online' },
    { id: 'Offline', label: 'Tư vấn Offline' }
  ];

  // Thêm state để theo dõi việc tải enum
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);
  const [hasShownAlert, setHasShownAlert] = useState(false);

  // Thêm state để quản lý lỗi
  const [error, setError] = useState(null);

  // Thêm các state mới
  const [bookingDetailVisible, setBookingDetailVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setBookings([]); // Clear current data first
      await fetchBookings();
    } catch (error) {
      console.error('Error refetching:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedConsultType]);

  const filteredBookings = bookings.filter(booking => {
    return selectedConsultType === 'all' || booking.type === selectedConsultType;
  });

  // Cập nhật hàm initData để chỉ gọi fetchBookings
  const initData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchBookings();
    } catch (error) {
      setError('Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        try {
          setLoading(true);
          setBookings([]); // Clear current data first
          if (isActive) {
            await fetchBookings();
          }
        } catch (error) {
          console.error('Error in useFocusEffect:', error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        isActive = false;
        setBookings([]);
      };
    }, [selectedConsultType])
  );

  const fetchBookings = async () => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        return;
      }

      // Thêm delay 1 giây để đợi backend cập nhật
      await new Promise(resolve => setTimeout(resolve, 1000));

      const params = {
        _t: new Date().getTime(),
        _nc: Math.random() // thêm số random để tránh cache
      };
      
      if (selectedConsultType !== 'all') {
        params.type = selectedConsultType;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/get-bookings-by-type-and-status`, 
        {
          params,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Mobile-App': 'true'
          },
          timeout: 30000,
          cache: false,
          withCredentials: false
        }
      );

      if (response.data && response.data.isSuccess) {
        // Log chi tiết dữ liệu từ API
        console.log('API Response data:', {
          firstItem: response.data.data[0],
          totalItems: response.data.data.length,
          dataStructure: Object.keys(response.data.data[0])
        });
        
        // Đảm bảo dữ liệu mới được set
        setBookings([]);
        setTimeout(() => {
          setBookings(response.data.data || []);
        }, 100);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      
      if (error.response?.status !== 401) {
        Alert.alert(
          "Thông báo",
          "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau."
        );
      }
    }
  };

  // Thêm hàm để lấy thông tin chi tiết booking
  const fetchBookingDetail = async (bookingId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) return;

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.isSuccess) {
        const bookingData = response.data.data;
        
        // Chỉ thiết lập masterNote cho BookingOnline
        if (bookingData.type === 'Online') {
          bookingData.masterNote = bookingData.masterNote || 'Chưa có ghi chú';
        }
        
        setSelectedBooking(bookingData);
        setBookingDetailVisible(true);
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể tải thông tin chi tiết. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm handleViewBooking
  const handleViewBooking = async (bookingId) => {
    await fetchBookingDetail(bookingId);
  };

  // Thêm hàm handlePayment
  const handlePayment = async (booking) => {
    try {
      // Kiểm tra điều kiện thanh toán cho từng loại booking
      const isOnlinePaymentAllowed = booking.type === 'Online' && booking.status.trim() === 'Pending';
      const isOfflineFirstPaymentAllowed = booking.type === 'Offline' && 
        (booking.status.trim() === 'VerifiedOTP' || booking.status.trim() === 'VerifiedOTPAttachment');
      const isOfflineSecondPaymentAllowed = booking.type === 'Offline' && 
        booking.status.trim() === 'SecondPaymentPending';

      if (!isOnlinePaymentAllowed && !isOfflineFirstPaymentAllowed && !isOfflineSecondPaymentAllowed) {
        Alert.alert('Thông báo', 'Booking không ở trạng thái cho phép thanh toán');
        return;
      }

      // Lấy token
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập lại để tiếp tục');
        return;
      }

      // Gọi API để lấy thông tin chi tiết của booking
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/${booking.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Booking detail response:', response.data);

      if (response.data && response.data.isSuccess) {
        const bookingDetail = response.data.data;
        const selectedPrice = bookingDetail.finalPrice || bookingDetail.price || bookingDetail.selectedPrice || bookingDetail.totalPrice;

        if (!selectedPrice || selectedPrice === 0) {
          console.error('Không tìm thấy giá trị cho selectedPrice trong booking detail:', bookingDetail);
          Alert.alert('Thông báo', 'Không tìm thấy thông tin giá. Vui lòng thử lại sau.');
          return;
        }

        console.log('Booking Detail:', JSON.stringify(bookingDetail, null, 2));
        console.log('Package Name:', bookingDetail.packageName);

        console.log('Chuyển sang màn hình thanh toán với thông tin:', {
          serviceId: booking.id,
          packageName: bookingDetail.packageName || 'Gói tư vấn phong thủy',
          selectedPrice: selectedPrice,
          status: booking.status.trim(),
          serviceType: booking.type === 'Offline' ? 'BookingOffline' : 'BookingOnline'
        });

        router.push({
          pathname: '/(tabs)/offline_payment',
          params: {
            serviceId: booking.id,
            packageName: bookingDetail.packageName || 'Gói tư vấn phong thủy',
            selectedPrice: selectedPrice,
            status: booking.status.trim(),
            serviceType: booking.type === 'Offline' ? 'BookingOffline' : 'BookingOnline'
          }
        });
      } else {
        throw new Error('Không thể lấy thông tin chi tiết booking');
      }
    } catch (error) {
      console.error('Lỗi xử lý thanh toán:', error);
      console.error('Error details:', error.response?.data || error);
      Alert.alert('Thông báo', 'Có lỗi xảy ra, vui lòng thử lại sau');
    }
  };

  // Thêm hàm cancelBooking
  const cancelBooking = async (booking) => {
    try {
      // Kiểm tra điều kiện hủy lịch theo loại booking
      let canCancel = false;
      if (booking.type === 'Online') {
        canCancel = booking.status.trim() === 'Pending' || booking.status.trim() === 'PendingConfirm';
      } else if (booking.type === 'Offline') {
        canCancel = booking.status.trim() === 'Pending';
      }

      if (!canCancel) {
        Alert.alert('Thông báo', 'Không thể hủy lịch đặt tư vấn trong trạng thái hiện tại');
        return;
      }

      Alert.alert(
        'Xác nhận hủy lịch',
        'Bạn có chắc chắn muốn hủy lịch đặt tư vấn này không?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Xác nhận',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert('Thông báo', 'Vui lòng đăng nhập lại để tiếp tục');
                  setLoading(false);
                  return;
                }
                
                // Sử dụng API mới để hủy booking
                const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.cancelOrder.replace('{id}', booking.id)}`;
                const response = await axios.put(
                  url,
                  null,
                  {
                    params: {
                      type: booking.type === 'Online' ? 'BookingOnline' : 'BookingOffline'
                    },
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                if (response.data && response.data.isSuccess) {
                  // Giữ màn hình loading hiển thị trong khi xử lý
                  setTimeout(() => {
                    setLoading(false);
                    Alert.alert(
                      'Thành công',
                      'Đã hủy lịch đặt tư vấn thành công',
                      [
                        {
                          text: 'OK',
                          onPress: async () => {
                            try {
                              setLoading(true); // Hiển thị loading khi làm mới danh sách
                              // Xóa dữ liệu hiện tại
                              setBookings([]);
                              
                              // Chờ một chút để backend cập nhật trạng thái
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              
                              // Lấy dữ liệu mới
                              await fetchBookings();
                              
                              // Tắt loading sau khi đã lấy dữ liệu
                              setLoading(false);
                              
                              // Thực hiện thêm một lần refresh nữa sau khoảng thời gian ngắn
                              setTimeout(async () => {
                                try {
                                  await fetchBookings();
                                } catch (error) {
                                  console.error('Lỗi khi refresh lần 2:', error);
                                }
                              }, 1000);
                            } catch (error) {
                              console.error('Lỗi khi refresh sau khi hủy booking:', error);
                              setLoading(false);
                            }
                          }
                        }
                      ]
                    );
                  }, 100); // Hiển thị loading thêm 0.1 giây trước khi hiện thông báo thành công
                } else {
                  setLoading(false);
                  Alert.alert('Thông báo', response.data?.message || 'Không thể hủy lịch đặt tư vấn. Vui lòng thử lại sau.');
                }
              } catch (error) {
                console.error('Lỗi khi hủy booking:', error);
                setLoading(false);
                Alert.alert('Thông báo', 'Đã xảy ra lỗi khi hủy lịch. Vui lòng thử lại sau.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi hủy booking:', error);
      Alert.alert('Thông báo', 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có ngày';
    
    try {
      // Log để kiểm tra giá trị đầu vào
      console.log('Date string received:', dateString);
      
      // Parse ngày từ định dạng YYYY-MM-DD
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      
      // Kiểm tra tính hợp lệ của date
      if (isNaN(date.getTime())) {
        console.log('Invalid date after parsing');
        return 'Ngày không hợp lệ';
      }
      
      // Format theo định dạng Việt Nam
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Ngày không hợp lệ';
    }
  };

  const renderBookingItem = ({ item }) => {
    // Log để kiểm tra dữ liệu
    console.log('Booking item:', {
      id: item.id,
      type: item.type,
      bookingDate: item.bookingDate
    });
    
    // Điều kiện hiển thị nút thanh toán cho Online và Offline
    const showPaymentButton = 
      (item.type === 'Online' && item.status.trim() === 'Pending') ||
      (item.type === 'Offline' && (item.status.trim() === 'VerifiedOTP' || 
                                   item.status.trim() === 'VerifiedOTPAttachment'));
    
    // Điều kiện hiển thị nút hủy lịch - cập nhật theo yêu cầu mới
    const showCancelButton = 
      (item.type === 'Online' && (item.status.trim() === 'Pending' || item.status.trim() === 'PendingConfirm')) ||
      (item.type === 'Offline' && item.status.trim() === 'Pending');

    // Điều kiện hiển thị nút xem hợp đồng cho Offline
    const isOffline = item.type === 'Offline';
    const isConfirmedByManager = item.status.trim() === 'ContractConfirmedByManager';
    const isConfirmedByCustomer = item.status.trim() === 'ContractConfirmedByCustomer';
    const isVerifyingOTP = item.status.trim() === 'VerifyingOTP';
    const isVerifiedOTP = item.status.trim() === 'VerifiedOTP';
    const isFirstPaymentPending = item.status.trim() === 'FirstPaymentPending';
    const isFirstPaymentPendingConfirm = item.status.trim() === 'FirstPaymentPendingConfirm';
    const isFirstPaymentSuccess = item.status.trim() === 'FirstPaymentSuccess';
    const isDocumentRejectedByManager = item.status.trim() === 'DocumentRejectedByManager';
    const isDocumentRejectedByCustomer = item.status.trim() === 'DocumentRejectedByCustomer';
    const isDocumentConfirmedByManager = item.status.trim() === 'DocumentConfirmedByManager';
    const isDocumentConfirmedByCustomer = item.status.trim() === 'DocumentConfirmedByCustomer';
    const isAttachmentRejected = item.status.trim() === 'AttachmentRejected';
    const isAttachmentConfirmed = item.status.trim() === 'AttachmentConfirmed';
    const isVerifyingOTPAttachment = item.status.trim() === 'VerifyingOTPAttachment';
    const isVerifiedOTPAttachment = item.status.trim() === 'VerifiedOTPAttachment';
    const isSecondPaymentPending = item.status.trim() === 'SecondPaymentPending';
    const isSecondPaymentPendingConfirm = item.status.trim() === 'SecondPaymentPendingConfirm';
    const isCompleted = item.status.trim() === 'Completed';
    
    const showContractButton = 
      isOffline && (isConfirmedByManager || isConfirmedByCustomer || isVerifyingOTP || 
      isVerifiedOTP || isFirstPaymentPending || isFirstPaymentPendingConfirm || 
      isFirstPaymentSuccess || isDocumentRejectedByManager || isDocumentRejectedByCustomer ||
      isDocumentConfirmedByManager || isDocumentConfirmedByCustomer || isAttachmentRejected ||
      isAttachmentConfirmed || isVerifyingOTPAttachment || isVerifiedOTPAttachment ||
      isSecondPaymentPending || isSecondPaymentPendingConfirm || isCompleted);

    // Điều kiện hiển thị nút xem hồ sơ
    const showDocumentButton = isOffline && (isDocumentConfirmedByManager || 
      isDocumentConfirmedByCustomer || isAttachmentRejected ||
      isAttachmentConfirmed || isVerifyingOTPAttachment || isVerifiedOTPAttachment ||
      isSecondPaymentPending || isSecondPaymentPendingConfirm || isCompleted);

    // Điều kiện hiển thị nút xem biên bản cho Offline
    const showAttachmentButton = isOffline && (isAttachmentConfirmed || 
      isVerifyingOTPAttachment || isVerifiedOTPAttachment ||
      isSecondPaymentPending || isSecondPaymentPendingConfirm || isCompleted ||
      item.status.trim() === 'DocumentConfirmedByCustomer');

    // Chỉ cho phép xem chi tiết cho các trạng thái đã từ chối
    const isRejectedStatus = 
      item.type === 'Offline' && 
      (item.status.trim() === 'ContractRejectedByMaster' ||
       item.status.trim() === 'ContractRejectedByCustomer');

    return (
      <TouchableOpacity 
        style={styles.ticketItem}
        onPress={() => handleViewBooking(item.id)}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.workshopName}>
            {item.type === 'Online' ? 'Tư vấn Online' : 'Tư vấn Offline'}
          </Text>
          <Text style={[
            styles.statusTag,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
        
        <View style={styles.ticketContent}>
          <Text style={styles.ticketCount}>
            Mã đặt lịch: {item.id}
          </Text>
          
          <Text style={styles.bookingTime}>
            Ngày: {formatDate(item.bookingDate)}
          </Text>

          <View style={styles.buttonContainer}>
            {showContractButton && (
              <TouchableOpacity 
                style={styles.contractButton}
                onPress={() => router.push({
                  pathname: '/(tabs)/contract_bookingOffline',
                  params: { id: item.id }
                })}
              >
                <Ionicons name="document-text-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Xem hợp đồng</Text>
              </TouchableOpacity>
            )}

            {showDocumentButton && (
              <TouchableOpacity 
                style={styles.documentButton}
                onPress={() => router.push({
                  pathname: '/(tabs)/document_bookingOffline',
                  params: { id: item.id }
                })}
              >
                <Ionicons name="folder-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Xem hồ sơ</Text>
              </TouchableOpacity>
            )}

            {showAttachmentButton && (
              <TouchableOpacity 
                style={styles.attachmentButton}
                onPress={() => router.push({
                  pathname: '/(tabs)/attachment_bookingOffline',
                  params: { id: item.id }
                })}
              >
                <Ionicons name="clipboard-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Xem biên bản</Text>
              </TouchableOpacity>
            )}

            {showPaymentButton && (
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={() => handlePayment(item)}
              >
                <Ionicons name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.paymentButtonText}>Tạo đơn thanh toán</Text>
              </TouchableOpacity>
            )}
            
            {showCancelButton && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => cancelBooking(item)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Hủy lịch</Text>
              </TouchableOpacity>
            )}
          </View>

          {isRejectedStatus && (
            <View style={styles.rejectedNote}>
              <Text style={styles.rejectedText}>
                <Ionicons name="information-circle-outline" size={16} color="#FF5252" />
                {" "}Nhấn để xem chi tiết
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FFA726';
      case 'canceled': return '#F44336';
      case 'contractrejectedbymaster': return '#FF5252';
      case 'contractrejectedbycustomer': return '#FF5252';
      case 'contractconfirmedbymaster': return '#009688';
      case 'contractconfirmedbycustomer': return '#009688';
      case 'verifyingotp': return '#FFA726';
      case 'verifiedotp': return '#FFA726';
      case 'firstpaymentpending': return '#FFA726';
      case 'firstpaymentpendingconfirm': return '#FFA726';
      case 'firstpaymentsuccess': return '#FFA726';
      case 'documentrejectedbymanager': return '#FF5252';
      case 'documentrejectedbycustomer': return '#FF5252';
      case 'documentconfirmedbymanager': return '#009688';
      case 'documentconfirmedbycustomer': return '#009688';
      case 'attachmentrejected': return '#FFA726';
      case 'attachmentconfirmed': return '#009688';
      case 'verifyingotpattachment': return '#FFA726';
      case 'verifiedotpattachment': return '#009688';
      case 'secondpaymentpending': return '#FFA726';
      case 'secondpaymentpendingconfirm': return '#FFA726';
      case 'completed': return '#4CAF50';
      default: return '#999';
    }
  };

  const SelectList = () => {
    const displayText = selectedConsultType === 'all' ? 'Tất cả loại tư vấn' :
                       selectedConsultType === 'Online' ? 'Tư vấn Online' : 'Tư vấn Offline';

    return (
      <View style={styles.selectListContainer}>
        <TouchableOpacity 
          style={[
            styles.selectList,
            openFilter && styles.selectListActive
          ]}
          onPress={() => setOpenFilter(!openFilter)}
        >
          <Text style={styles.selectListValueText}>{displayText}</Text>
          <Ionicons
            name={openFilter ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={openFilter ? "#FF6B6B" : "#666"}
          />
        </TouchableOpacity>
        
        {openFilter && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                selectedConsultType === 'all' && styles.dropdownItemActive
              ]}
              onPress={() => {
                setSelectedConsultType('all');
                setOpenFilter(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedConsultType === 'all' && styles.dropdownItemTextActive
              ]}>
                Tất cả loại tư vấn
              </Text>
              {selectedConsultType === 'all' && (
                <Ionicons name="checkmark" size={18} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                selectedConsultType === 'Online' && styles.dropdownItemActive
              ]}
              onPress={() => {
                setSelectedConsultType('Online');
                setOpenFilter(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedConsultType === 'Online' && styles.dropdownItemTextActive
              ]}>
                Tư vấn Online
              </Text>
              {selectedConsultType === 'Online' && (
                <Ionicons name="checkmark" size={18} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                selectedConsultType === 'Offline' && styles.dropdownItemActive
              ]}
              onPress={() => {
                setSelectedConsultType('Offline');
                setOpenFilter(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedConsultType === 'Offline' && styles.dropdownItemTextActive
              ]}>
                Tư vấn Offline
              </Text>
              {selectedConsultType === 'Offline' && (
                <Ionicons name="checkmark" size={18} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {currentFilter === 'consultType' ? 'Chọn loại tư vấn' : 'Chọn trạng thái'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={currentFilter === 'consultType' ? consultTypeOptions : consultTypeOptions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  currentFilter === 'consultType' 
                    ? setSelectedConsultType(item.id)
                    : setSelectedConsultType('all');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const OnlineBookingDetailModal = ({ booking, onClose }) => (
    <View style={styles.bookingDetailSection}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Mã đặt lịch:</Text>
        <Text style={styles.detailValue}>{booking?.bookingOnlineId || 'Không có'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Loại tư vấn:</Text>
        <Text style={styles.detailValue}>{booking?.type}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Trạng thái:</Text>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusTag,
            { backgroundColor: getStatusColor(booking?.status) }
          ]}>
            {booking?.status}
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Khách hàng:</Text>
        <Text style={styles.detailValue}>{booking?.customerName}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Email:</Text>
        <Text style={styles.detailValue}>{booking?.customerEmail}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Master:</Text>
        <Text style={styles.detailValue}>{booking?.masterName || 'Chưa có Master'}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá:</Text>
        <Text style={styles.priceValue}>
          {booking?.price ? `${booking.price.toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Ngày:</Text>
        <Text style={styles.detailValue}>
          {formatDate(booking?.bookingDate)}
        </Text>
      </View>

      {booking?.startTime && booking?.endTime && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Thời gian:</Text>
          <Text style={styles.detailValue}>
            {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
          </Text>
        </View>
      )}

      {booking?.linkMeet && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Link Meet:</Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL(booking.linkMeet)}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>Nhấn để mở link</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.separator} />

      <View style={styles.descriptionContainer}>
        <Text style={styles.detailLabel}>Mô tả:</Text>
        <Text style={styles.descriptionText}>{booking?.description || 'Chưa có mô tả'}</Text>
      </View>

      {booking?.masterNote && (
        <View style={styles.masterNoteContainer}>
          <Text style={styles.masterNoteLabel}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            {" "}Ghi chú của Master
          </Text>
          <Text style={styles.masterNoteText}>{booking.masterNote}</Text>
        </View>
      )}
    </View>
  );

  const OfflineBookingDetailModal = ({ booking, onClose }) => (
    <View style={styles.bookingDetailSection}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Mã đặt lịch:</Text>
        <Text style={styles.detailValue}>{booking?.bookingOfflineId || 'Không có'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Loại tư vấn:</Text>
        <Text style={styles.detailValue}>{booking?.type}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Trạng thái:</Text>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusTag,
            { backgroundColor: getStatusColor(booking?.status) }
          ]}>
            {booking?.status}
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Khách hàng:</Text>
        <Text style={styles.detailValue}>{booking?.customerName}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Email:</Text>
        <Text style={styles.detailValue}>{booking?.customerEmail}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Master:</Text>
        <Text style={styles.detailValue}>{booking?.masterName || 'Chưa có Master'}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Giá:</Text>
        <Text style={styles.priceValue}>
          {booking?.selectedPrice ? `${parseFloat(booking.selectedPrice).toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Ngày:</Text>
        <Text style={styles.detailValue}>
          {formatDate(booking?.bookingDate)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Địa điểm:</Text>
        <Text style={styles.detailValue}>{booking?.location || 'Chưa có địa điểm'}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.descriptionContainer}>
        <Text style={styles.detailLabel}>Mô tả:</Text>
        <Text style={styles.descriptionText}>{booking?.description || 'Chưa có mô tả'}</Text>
      </View>
    </View>
  );

  const BookingDetailModal = () => (
    <Modal
      visible={bookingDetailVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setBookingDetailVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.bookingDetailContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết đặt lịch {selectedBooking?.type}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setBookingDetailVisible(false)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedBooking && (
            <ScrollView style={styles.bookingDetailScroll}>
              {selectedBooking.type === 'Online' ? (
                <OnlineBookingDetailModal 
                  booking={selectedBooking}
                  onClose={() => setBookingDetailVisible(false)}
                />
              ) : (
                <OfflineBookingDetailModal
                  booking={selectedBooking}
                  onClose={() => setBookingDetailVisible(false)}
                />
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Thêm lại hàm forceRefresh
  const forceRefresh = async () => {
    try {
      setLoading(true);
      console.log('Đang xóa cache và tải lại dữ liệu...');
      
      // Xóa dữ liệu hiện tại
      setBookings([]);
      
      // Tải lại toàn bộ dữ liệu
      await initData();
      
      Alert.alert(
        'Làm mới hoàn tất',
        'Đã xóa bộ nhớ cache và tải lại dữ liệu mới nhất từ máy chủ.'
      );
    } catch (error) {
      console.error('Lỗi khi làm mới dữ liệu:', error);
      Alert.alert(
        'Lỗi làm mới',
        'Không thể làm mới dữ liệu. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật phần render để chỉ hiển thị loading cho fetchBookings
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={initData}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/profile')}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Lịch tư vấn</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {header}
      
      <View style={styles.filtersContainer}>
        <SelectList />
      </View>

      <FilterModal />

      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={isRefreshing}
        onRefresh={refetch}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Không có lịch đặt tư vấn nào
            </Text>
          </View>
        )}
      />
      <BookingDetailModal />
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#8B0000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  backButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  ticketItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workshopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    color: '#fff',
    fontSize: 12,
  },
  ticketContent: {
    marginTop: 5,
    gap: 4,
  },
  ticketCount: {
    fontSize: 14,
    color: '#666',
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
    gap: 5,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1,
  },
  selectListContainer: {
    position: 'relative',
    zIndex: 1,
  },
  selectList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectListActive: {
    borderColor: '#FF6B6B',
  },
  selectListValueText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  bookingDetailContent: {
    padding: 0,
  },
  bookingDetailScroll: {
    padding: 15,
  },
  bookingDetailSection: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  descriptionContainer: {
    marginTop: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    lineHeight: 20,
  },
  masterNoteContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  masterNoteLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterNoteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  closeButton: {
    padding: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rejectedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
  rejectedText: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '500',
  },
  linkContainer: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
    gap: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default YourBooking; 