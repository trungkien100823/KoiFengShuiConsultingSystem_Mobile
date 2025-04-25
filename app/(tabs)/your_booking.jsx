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
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import CustomTabBar from '../../components/ui/CustomTabBar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paymentService } from '../../constants/paymentService';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#8B0000', // Wine red
  primaryDark: '#590000',
  primaryLight: '#AA1E23',
  primaryGlow: '#D40000',
  accent: '#D4AF37', // Gold accent
  white: '#FFFFFF',
  offWhite: '#F9F9F9',
  background: '#F8F8F8',
  card: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    tertiary: '#999999',
    light: '#FFFFFF',
  },
  status: {
    pending: '#FFA726',
    confirmed: '#2196F3',
    paid: '#4CAF50',
    canceled: '#F44336',
    rejected: '#FF5252',
    success: '#009688',
  },
  border: 'rgba(139, 0, 0, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.12)',
};

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
        (booking.status.trim() === 'Xác thực OTP' || booking.status.trim() === 'Đã xác thực OTP');
      const isOfflineSecondPaymentAllowed = booking.type === 'Offline' && 
        booking.status.trim() === 'Chờ thanh toán lần 2';

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
          bookingOnlineId: booking.type === 'Online' ? booking.id : null,
          packageName: bookingDetail.packageName || 'Gói tư vấn phong thủy',
          selectedPrice: selectedPrice,
          status: booking.status.trim(),
          serviceType: booking.type === 'Offline' ? 'BookingOffline' : 'BookingOnline',
          source: 'your_booking'
        });

        router.push({
          pathname: booking.type === 'Online' ? '/(tabs)/online_checkout' : '/(tabs)/offline_payment',
          params: {
            serviceId: booking.id,
            bookingOnlineId: booking.type === 'Online' ? booking.id : null,
            packageName: bookingDetail.packageName || 'Gói tư vấn phong thủy',
            selectedPrice: selectedPrice,
            status: booking.status.trim(),
            serviceType: booking.type === 'Offline' ? 'BookingOffline' : 'BookingOnline',
            source: 'your_booking'
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
        canCancel = booking.status.trim() === 'Chờ xử lý' || booking.status.trim() === 'Đang xử lý';
      } else if (booking.type === 'Offline') {
        canCancel = booking.status.trim() === 'Chờ xử lý';
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

  const getShortStatusText = (status) => {
    switch(status.trim()) {
      case 'ContractConfirmedByManager': return 'Quản lý xác nhận HĐ';
      case 'ContractConfirmedByCustomer': return 'KH xác nhận HĐ';
      case 'VerifyingOTP': return 'Đang xác thực OTP';
      case 'VerifiedOTP': return 'Đã xác thực OTP';
      case 'FirstPaymentPending': return 'Chờ thanh toán lần 1';
      case 'FirstPaymentPendingConfirm': return 'Chờ xác nhận TT lần 1';
      case 'FirstPaymentSuccess': return 'Đã thanh toán lần 1';
      case 'DocumentRejectedByManager': return 'Quản lý từ chối HS';
      case 'DocumentRejectedByCustomer': return 'KH từ chối HS';
      case 'DocumentConfirmedByManager': return 'Quản lý duyệt HS';
      case 'DocumentConfirmedByCustomer': return 'KH duyệt HS';
      case 'AttachmentRejected': return 'Từ chối biên bản';
      case 'AttachmentConfirmed': return 'Đã duyệt biên bản';
      case 'VerifyingOTPAttachment': return 'Xác thực OTP BB';
      case 'VerifiedOTPAttachment': return 'Đã xác thực BB';
      case 'SecondPaymentPending': return 'Chờ thanh toán lần 2';
      case 'SecondPaymentPendingConfirm': return 'Chờ xác nhận TT lần 2';
      case 'Completed': return 'Hoàn thành';
      case 'Pending': return 'Chờ xử lý';
      case 'Canceled': return 'Đã hủy';
      default: return status;
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
      (item.type === 'Online' && item.status.trim() === 'Chờ xử lý') ||
      (item.type === 'Offline' && (item.status.trim() === 'Đã xác thực OTP' || 
                                   item.status.trim() === 'Đã xác thực BB'));
    
    // Điều kiện hiển thị nút hủy lịch - cập nhật theo yêu cầu mới
    const showCancelButton = 
      (item.type === 'Online' && (item.status.trim() === 'Chờ xử lý' || item.status.trim() === 'Đang xử lý')) ||
      (item.type === 'Offline' && item.status.trim() === 'Chờ xử lý');

    // Điều kiện hiển thị nút xem hợp đồng cho Offline
    const isOffline = item.type === 'Offline';
    const isConfirmedByManager = item.status.trim() === 'Quản lý xác nhận HĐ';
    const isConfirmedByCustomer = item.status.trim() === 'KH xác nhận HĐ';
    const isVerifyingOTP = item.status.trim() === 'Đang xác thực OTP';
    const isVerifiedOTP = item.status.trim() === 'Đã xác thực OTP';
    const isFirstPaymentPending = item.status.trim() === 'Chờ thanh toán lần 1';
    const isFirstPaymentPendingConfirm = item.status.trim() === 'Chờ xác nhận TT lần 1';
    const isFirstPaymentSuccess = item.status.trim() === 'Đã thanh toán lần 1';
    const isDocumentRejectedByManager = item.status.trim() === 'Quản lý từ chối HS';
    const isDocumentRejectedByCustomer = item.status.trim() === 'KH từ chối HS';
    const isDocumentConfirmedByManager = item.status.trim() === 'Quản lý duyệt HS';
    const isDocumentConfirmedByCustomer = item.status.trim() === 'KH duyệt HS';
    const isAttachmentRejected = item.status.trim() === 'Từ chối biên bản';
    const isAttachmentConfirmed = item.status.trim() === 'Đã duyệt biên bản';
    const isVerifyingOTPAttachment = item.status.trim() === 'Xác thực OTP BB';
    const isVerifiedOTPAttachment = item.status.trim() === 'Đã xác thực BB';
    const isSecondPaymentPending = item.status.trim() === 'Chờ thanh toán lần 2';
    const isSecondPaymentPendingConfirm = item.status.trim() === 'Chờ xác nhận TT lần 2';
    const isCompleted = item.status.trim() === 'Hoàn thành';
    
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
      item.status.trim() === 'Khách hàng đãđã duyệt biên bản');

    // Chỉ cho phép xem chi tiết cho các trạng thái đã từ chối
    const isRejectedStatus = 
      item.type === 'Offline' && 
      (item.status.trim() === 'Quản lý từ chối HĐ' ||
       item.status.trim() === 'Khách hàng từ chối HĐ');

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

    return (
      <View style={styles.bookingCard}>
        {/* Enhanced Card Header with Type and Status */}
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <View style={styles.cardTypeContainer}>
            <View style={styles.iconCircle}>
              <Ionicons 
                name={item.type === 'Online' ? "videocam" : "business"} 
                size={16} 
                color={COLORS.white}
              />
            </View>
            <Text style={styles.cardType}>
              {item.type === 'Online' ? 'Tư vấn Online' : 'Tư vấn Offline'}
            </Text>
          </View>
          <View style={[
            styles.statusTag,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{getShortStatusText(item.status)}</Text>
          </View>
        </LinearGradient>
        
        {/* Card Body with Details */}
        <TouchableOpacity 
          style={styles.cardBody}
          onPress={() => handleViewBooking(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.infoRow}>
            <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Mã đặt lịch:</Text>
            <Text style={styles.infoValue}>{item.id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Ngày đặt:</Text>
            <Text style={styles.infoValue}>{formatDate(item.bookingDate)}</Text>
          </View>
          
          {isRejectedStatus && (
            <View style={styles.rejectedMessage}>
              <Ionicons name="alert-circle" size={18} color={COLORS.status.rejected} />
              <Text style={styles.rejectedText}>Nhấn để xem chi tiết từ chối</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Card Actions */}
        {(showContractButton || showDocumentButton || showAttachmentButton || 
          showPaymentButton || showCancelButton) && (
          <View style={styles.cardActions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
              {showContractButton && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.contractButton]}
                  onPress={() => router.push({
                    pathname: '/(tabs)/contract_bookingOffline',
                    params: { id: item.id }
                  })}
                >
                  <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Hợp đồng</Text>
                </TouchableOpacity>
              )}

              {showDocumentButton && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.documentButton]}
                  onPress={() => router.push({
                    pathname: '/(tabs)/document_bookingOffline',
                    params: { id: item.id }
                  })}
                >
                  <Ionicons name="folder-outline" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Hồ sơ</Text>
                </TouchableOpacity>
              )}

              {showAttachmentButton && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.attachmentButton]}
                  onPress={() => router.push({
                    pathname: '/(tabs)/attachment_bookingOffline',
                    params: { id: item.id }
                  })}
                >
                  <Ionicons name="clipboard-outline" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Biên bản</Text>
                </TouchableOpacity>
              )}

              {showPaymentButton && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.paymentButton]}
                  onPress={() => handlePayment(item)}
                >
                  <Ionicons name="wallet-outline" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Thanh toán</Text>
                </TouchableOpacity>
              )}
              
              {showCancelButton && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => cancelBooking(item)}
                >
                  <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Hủy lịch</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>
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
          activeOpacity={0.7}
        >
          <View style={styles.selectListContent}>
            <Ionicons 
              name={selectedConsultType === 'Online' ? "videocam" : 
                    selectedConsultType === 'Offline' ? "business" : "apps"} 
              size={20} 
              color={COLORS.primary}
              style={styles.selectListIcon}
            />
            <Text style={styles.selectListText}>{displayText}</Text>
          </View>
          <View style={styles.selectListArrow}>
            <Ionicons
              name={openFilter ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.primary}
            />
          </View>
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
              <Ionicons name="apps" size={20} color={selectedConsultType === 'all' ? COLORS.primary : COLORS.text.secondary} />
              <Text style={[
                styles.dropdownItemText,
                selectedConsultType === 'all' && styles.dropdownItemTextActive
              ]}>
                Tất cả loại tư vấn
              </Text>
              {selectedConsultType === 'all' && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
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
              <Ionicons name="videocam" size={20} color={selectedConsultType === 'Online' ? COLORS.primary : COLORS.text.secondary} />
              <Text style={[
                styles.dropdownItemText,
                selectedConsultType === 'Online' && styles.dropdownItemTextActive
              ]}>
                Tư vấn Online
              </Text>
              {selectedConsultType === 'Online' && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
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
              <Ionicons name="business" size={20} color={selectedConsultType === 'Offline' ? COLORS.primary : COLORS.text.secondary} />
              <Text style={[
                styles.dropdownItemText,
                selectedConsultType === 'Offline' && styles.dropdownItemTextActive
              ]}>
                Tư vấn Offline
              </Text>
              {selectedConsultType === 'Offline' && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
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
      {/* Header with booking type badge */}
      <View style={styles.detailHeader}>
        <View style={styles.typeBadge}>
          <Ionicons name="videocam" size={16} color="#FFFFFF" />
          <Text style={styles.typeBadgeText}>Tư vấn Online</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(booking?.status) }
        ]}>
          <Text style={styles.statusBadgeText}>{booking?.status}</Text>
        </View>
      </View>

      {/* Main Info Section */}
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Mã đặt lịch:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.bookingOnlineId || 'Không có'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Khách hàng:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.customerName}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Email:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.customerEmail}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Master:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.masterName || 'Chưa có Master'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Giá:</Text>
          </View>
          <Text style={styles.priceValue}>
            {booking?.price ? `${booking.price.toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Ngày:</Text>
          </View>
          <Text style={styles.detailValue}>
            {formatDate(booking?.bookingDate)}
          </Text>
        </View>

        {booking?.startTime && booking?.endTime && (
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailLabel}>Thời gian:</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
            </Text>
          </View>
        )}
      </View>

      {/* Meeting Link Section */}
      {booking?.linkMeet && (
        <View style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <Ionicons name="videocam" size={20} color={COLORS.primary} />
            <Text style={styles.linkHeaderText}>Link Cuộc Họp</Text>
          </View>
          <TouchableOpacity 
            onPress={() => Linking.openURL(booking.linkMeet)}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>Tham gia buổi tư vấn</Text>
            <Ionicons name="open-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Description Section */}
      <View style={styles.descriptionCard}>
        <View style={styles.descriptionHeader}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.descriptionHeaderText}>Chi tiết yêu cầu</Text>
        </View>
        <Text style={styles.descriptionText}>{booking?.description || 'Chưa có mô tả'}</Text>
      </View>

      {/* Master Note Section */}
      {booking?.masterNote && (
        <View style={styles.masterNoteCard}>
          <View style={styles.masterNoteHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
            <Text style={styles.masterNoteHeaderText}>Ghi chú của Master</Text>
          </View>
          <Text style={styles.masterNoteText}>{booking.masterNote}</Text>
        </View>
      )}
    </View>
  );

  const OfflineBookingDetailModal = ({ booking, onClose }) => (
    <View style={styles.bookingDetailSection}>
      {/* Header with booking type badge */}
      <View style={styles.detailHeader}>
        <View style={[styles.typeBadge, styles.offlineTypeBadge]}>
          <Ionicons name="business" size={16} color="#FFFFFF" />
          <Text style={styles.typeBadgeText}>Tư vấn Offline</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(booking?.status) }
        ]}>
          <Text style={styles.statusBadgeText}>{booking?.status}</Text>
        </View>
      </View>

      {/* Main Info Section */}
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Mã đặt lịch:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.bookingOfflineId || 'Không có'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Khách hàng:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.customerName}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Email:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.customerEmail}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Master:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.masterName || 'Chưa có Master'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Giá:</Text>
          </View>
          <Text style={styles.priceValue}>
            {booking?.selectedPrice ? `${parseFloat(booking.selectedPrice).toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Ngày:</Text>
          </View>
          <Text style={styles.detailValue}>
            {formatDate(booking?.bookingDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Địa điểm:</Text>
          </View>
          <Text style={styles.detailValue}>{booking?.location || 'Chưa có địa điểm'}</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.descriptionCard}>
        <View style={styles.descriptionHeader}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.descriptionHeaderText}>Chi tiết yêu cầu</Text>
        </View>
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
        <View style={styles.modalContent}>
          {/* Enhanced Modal Header */}
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeaderGradient}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons 
                  name={selectedBooking?.type === 'Online' ? "videocam" : "business"} 
                  size={24} 
                  color={COLORS.white} 
                />
                <Text style={styles.modalTitle}>
                  Chi tiết {selectedBooking?.type === 'Online' ? 'Tư vấn Online' : 'Tư vấn Offline'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setBookingDetailVisible(false)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {selectedBooking && (
            <ScrollView 
              style={styles.bookingDetailScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bookingDetailContent}
            >
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
          
          {/* Action Button at Bottom */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setBookingDetailVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch tư vấn...</Text>
        </View>
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
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Lịch tư vấn của bạn</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      {/* Elegant Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch tư vấn của bạn</Text>
        </View>
      </LinearGradient>
      
      {/* Refined Filter Section */}
      <View style={styles.filterSection}>
        <SelectList />
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải lịch tư vấn...</Text>
          </View>
        </View>
      ) : (
        /* Booking List with Elegant Cards */
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={refetch}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={64} color={COLORS.white} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có lịch tư vấn</Text>
              <Text style={styles.emptyText}>Bạn chưa có lịch đặt tư vấn nào. Vui lòng đặt lịch tư vấn mới để xem tại đây.</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              colors={['#8B0000']}
              tintColor="#FFFFFF"
              title="Đang làm mới..."
              titleColor="#FFFFFF"
              progressBackgroundColor="rgba(255, 255, 255, 0.2)"
            />
          }
        />
      )}

      <FilterModal />
      <BookingDetailModal />
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  filterSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    zIndex: 9,
  },
  selectListContainer: {
    zIndex: 10,
    position: 'relative',
    elevation: 5,
  },
  selectList: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectListActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
  },
  selectListContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectListIcon: {
    marginRight: 12,
  },
  selectListText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  selectListArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(139, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 11,
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(139, 0, 0, 0.08)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Extra padding for TabBar
    zIndex: 1,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cardTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardType: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardBody: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 8,
    width: 22,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  rejectedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectedText: {
    fontSize: 14,
    color: COLORS.status.rejected,
    marginLeft: 8,
    fontWeight: '500',
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
  },
  actionsScroll: {
    paddingRight: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginRight: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  contractButton: {
    backgroundColor: COLORS.primary,
  },
  documentButton: {
    backgroundColor: COLORS.primaryLight,
  },
  attachmentButton: {
    backgroundColor: COLORS.primaryDark,
  },
  paymentButton: {
    backgroundColor: '#38A169', // Green
  },
  cancelButton: {
    backgroundColor: '#E53E3E', // Red
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    width: '85%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeaderGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingDetailScroll: {
    maxHeight: Platform.OS === 'ios' ? '74%' : '72%',
  },
  bookingDetailContent: {
    paddingBottom: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingDetailSection: {
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '60%',
  },
  offlineTypeBadge: {
    backgroundColor: '#8B0000',
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '40%',
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    textAlign: 'right',
    width: '60%',
  },
  priceValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '60%',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 8,
  },
  linkCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.text.primary,
  },
  linkButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  linkButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  descriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.text.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  masterNoteCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  masterNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  masterNoteHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.text.primary,
  },
  masterNoteText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
});

export default YourBooking; 