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
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import CustomTabBar from '../../components/ui/CustomTabBar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paymentService } from '../../constants/paymentService';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

// Helper function to convert status to Vietnamese
const getStatusDisplayText = (status) => {
  if (!status) return 'Không xác định';
  
  switch (status.toLowerCase()) {
    // Online booking statuses
    case 'paid': return 'Đã thanh toán';
    case 'confirmed': return 'Đã xác nhận';
    case 'pending': return 'Chờ xác nhận';
    case 'pendingconfirm': return 'Chờ xác nhận';
    case 'canceled': return 'Đã hủy';
    
    // Offline booking - Contract statuses
    case 'contractrejectedbymaster': return 'Hợp đồng bị từ chối';
    case 'contractrejectedbycustomer': return 'Khách từ chối hợp đồng';
    case 'contractconfirmedbymaster': return 'Đã xác nhận hợp đồng';
    case 'contractconfirmedbycustomer': return 'Đã xác nhận hợp đồng';
    
    // OTP verification statuses
    case 'verifyingotp': return 'Đang xác minh OTP';
    case 'verifiedotp': return 'Đã xác minh OTP';
    
    // First payment statuses
    case 'firstpaymentpending': return 'Chờ thanh toán lần 1';
    case 'firstpaymentpendingconfirm': return 'Chờ xác nhận thanh toán lần 1';
    case 'firstpaymentsuccess': return 'Thanh toán lần 1 thành công';
    
    // Document statuses
    case 'documentrejectedbymanager': return 'Hồ sơ bị từ chối';
    case 'documentrejectedbycustomer': return 'Khách từ chối hồ sơ';
    case 'documentconfirmedbymanager': return 'Hồ sơ đã được xác nhận';
    case 'documentconfirmedbycustomer': return 'Hồ sơ đã được xác nhận';
    
    // Attachment statuses
    case 'attachmentrejected': return 'Biên bản bị từ chối';
    case 'attachmentconfirmed': return 'Biên bản đã xác nhận';
    case 'verifyingotpattachment': return 'Đang xác minh OTP biên bản';
    case 'verifiedotpattachment': return 'Đã xác minh OTP biên bản';
    
    // Second payment statuses
    case 'secondpaymentpending': return 'Chờ thanh toán lần 2';
    case 'secondpaymentpendingconfirm': return 'Chờ xác nhận thanh toán lần 2';
    
    // Final statuses
    case 'completed': return 'Hoàn thành';
    case 'rejected': return 'Đã từ chối';
    
    default: return status; // Return original if no mapping found
  }
};

// Create a separate BookingItem component before the main YourBooking component
const BookingItem = React.memo(({ 
  item, 
  onViewBooking, 
  onPayment, 
  onCancel, 
  navigation,
  formatDate,
  getStatusColor,
  getStatusColorWithOpacity
}) => {
  const showPaymentButton = 
    (item.type === 'Online' && item.status.trim() === 'Pending') ||
    (item.type === 'Offline' && (item.status.trim() === 'VerifiedOTP' || 
                                item.status.trim() === 'VerifiedOTPAttachment'));
  
  const showCancelButton = 
    (item.type === 'Online' && (item.status.trim() === 'Pending' || item.status.trim() === 'PendingConfirm')) ||
    (item.type === 'Offline' && item.status.trim() === 'Pending');

  const showContractButton = 
    item.type === 'Offline' && (item.status.trim() === 'ContractConfirmedByManager' ||
    item.status.trim() === 'ContractConfirmedByCustomer' || item.status.trim() === 'VerifyingOTP' || 
    item.status.trim() === 'VerifiedOTP' || item.status.trim() === 'FirstPaymentPending' || 
    item.status.trim() === 'FirstPaymentPendingConfirm' || item.status.trim() === 'FirstPaymentSuccess' ||
    item.status.trim() === 'DocumentRejectedByManager' || item.status.trim() === 'DocumentRejectedByCustomer' ||
    item.status.trim() === 'DocumentConfirmedByManager' || item.status.trim() === 'DocumentConfirmedByCustomer' ||
    item.status.trim() === 'AttachmentRejected' || item.status.trim() === 'AttachmentConfirmed' ||
    item.status.trim() === 'VerifyingOTPAttachment' || item.status.trim() === 'VerifiedOTPAttachment' ||
    item.status.trim() === 'SecondPaymentPending' || item.status.trim() === 'SecondPaymentPendingConfirm' ||
    item.status.trim() === 'Completed');

  const showDocumentButton = item.type === 'Offline' && (item.status.trim() === 'DocumentConfirmedByManager' || 
    item.status.trim() === 'DocumentConfirmedByCustomer' || item.status.trim() === 'AttachmentRejected' ||
    item.status.trim() === 'AttachmentConfirmed' || item.status.trim() === 'VerifyingOTPAttachment' || 
    item.status.trim() === 'VerifiedOTPAttachment' || item.status.trim() === 'SecondPaymentPending' ||
    item.status.trim() === 'SecondPaymentPendingConfirm' || item.status.trim() === 'Completed');

  const showAttachmentButton = item.type === 'Offline' && (item.status.trim() === 'AttachmentConfirmed' || 
    item.status.trim() === 'VerifyingOTPAttachment' || item.status.trim() === 'VerifiedOTPAttachment' ||
    item.status.trim() === 'SecondPaymentPending' || item.status.trim() === 'SecondPaymentPendingConfirm' ||
    item.status.trim() === 'Completed' || item.status.trim() === 'DocumentConfirmedByCustomer');

  const isRejectedStatus = 
    item.type === 'Offline' && 
    (item.status.trim() === 'ContractRejectedByMaster' ||
      item.status.trim() === 'ContractRejectedByCustomer');

  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.typeInfoContainer}>
          <View style={[
            styles.typeIcon, 
            {backgroundColor: item.type === 'Online' ? '#4a6fa5' : '#4d9078'}
          ]}>
            <Ionicons 
              name={item.type === 'Online' ? 'videocam' : 'business'} 
              size={isSmallDevice ? 18 : 22} 
              color="#FFF" 
            />
          </View>
          <View>
            <Text style={styles.typeText}>
              {item.type === 'Online' ? 'Tư vấn Online' : 'Tư vấn Offline'}
            </Text>
            <Text style={styles.idText}>ID: {item.id}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColorWithOpacity(item.status) }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) }
          ]} />
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {getStatusDisplayText(item.status)}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.cardBody}
        onPress={() => onViewBooking(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={isSmallDevice ? 16 : 18} color="#666" />
            <Text style={styles.infoLabel}>Ngày:</Text>
            <Text style={styles.infoValue}>{formatDate(item.bookingDate)}</Text>
          </View>

          {item.masterName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={isSmallDevice ? 16 : 18} color="#666" />
              <Text style={styles.infoLabel}>Master:</Text>
              <Text style={styles.infoValue}>{item.masterName}</Text>
            </View>
          )}
        </View>

        {isRejectedStatus && (
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={isSmallDevice ? 18 : 20} color="#f44336" />
            <Text style={styles.warningText}>Nhấn để xem chi tiết lý do từ chối</Text>
          </View>
        )}
      </TouchableOpacity>

      {(showContractButton || showDocumentButton || showAttachmentButton || 
        showPaymentButton || showCancelButton) && (
        <View style={styles.cardActions}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsScrollContent}
          >
            {showContractButton && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.contractButton]}
                onPress={() => navigation.push({
                  pathname: '/(tabs)/contract_bookingOffline',
                  params: { id: item.id }
                })}
              >
                <Ionicons name="document-text" size={isSmallDevice ? 16 : 18} color="#FFF" />
                <Text style={styles.actionButtonText}>Hợp đồng</Text>
              </TouchableOpacity>
            )}

            {showDocumentButton && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.documentButton]}
                onPress={() => navigation.push({
                  pathname: '/(tabs)/document_bookingOffline',
                  params: { id: item.id }
                })}
              >
                <Ionicons name="folder" size={isSmallDevice ? 16 : 18} color="#FFF" />
                <Text style={styles.actionButtonText}>Hồ sơ</Text>
              </TouchableOpacity>
            )}

            {showAttachmentButton && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.attachmentButton]}
                onPress={() => navigation.push({
                  pathname: '/(tabs)/attachment_bookingOffline',
                  params: { id: item.id }
                })}
              >
                <Ionicons name="clipboard" size={isSmallDevice ? 16 : 18} color="#FFF" />
                <Text style={styles.actionButtonText}>Biên bản</Text>
              </TouchableOpacity>
            )}

            {showPaymentButton && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.paymentButton]}
                onPress={() => onPayment(item)}
              >
                <Ionicons name="wallet" size={isSmallDevice ? 16 : 18} color="#FFF" />
                <Text style={styles.actionButtonText}>Thanh toán</Text>
              </TouchableOpacity>
            )}

            {showCancelButton && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => onCancel(item)}
              >
                <Ionicons name="close-circle" size={isSmallDevice ? 16 : 18} color="#FFF" />
                <Text style={styles.actionButtonText}>Hủy lịch</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const OnlineBookingDetailModal = ({ booking, getStatusColor, formatDate }) => (
  <View style={styles.modalDetailContainer}>
    <View style={styles.modalDetailSection}>
      <View style={styles.modalDetailRow}>
        <Ionicons name="bookmark-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Mã đặt lịch:</Text>
        <Text style={styles.modalDetailValue}>{booking?.bookingOnlineId || booking?.id || 'Không có'}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="videocam-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Loại tư vấn:</Text>
        <Text style={styles.modalDetailValue}>{booking?.type}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="information-circle-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Trạng thái:</Text>
        <View style={[
          styles.statusBadgeSmall,
          { backgroundColor: getStatusColor(booking?.status) + '20' }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(booking?.status) }
          ]} />
          <Text style={[
            styles.statusTextSmall,
            { color: getStatusColor(booking?.status) }
          ]}>
            {getStatusDisplayText(booking?.status)}
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.modalDivider} />

    <View style={styles.modalDetailSection}>
      <View style={styles.modalDetailRow}>
        <Ionicons name="person-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Khách hàng:</Text>
        <Text style={styles.modalDetailValue}>{booking?.customerName}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="mail-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Email:</Text>
        <Text style={styles.modalDetailValue}>{booking?.customerEmail}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="person-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Master:</Text>
        <Text style={styles.modalDetailValue}>{booking?.masterName || 'Chưa có Master'}</Text>
      </View>
    </View>

    <View style={styles.modalDivider} />

    <View style={styles.modalDetailSection}>
      <View style={styles.modalDetailRow}>
        <Ionicons name="cash-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Giá:</Text>
        <Text style={styles.modalDetailPrice}>
          {booking?.price ? `${booking.price.toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
        </Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="calendar-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Ngày:</Text>
        <Text style={styles.modalDetailValue}>{formatDate(booking?.bookingDate)}</Text>
      </View>

      {booking?.startTime && booking?.endTime && (
        <View style={styles.modalDetailRow}>
          <Ionicons name="time-outline" size={18} color="#8B0000" />
          <Text style={styles.modalDetailLabel}>Thời gian:</Text>
          <Text style={styles.modalDetailValue}>
            {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
          </Text>
        </View>
      )}

      {booking?.linkMeet && (
        <View style={styles.modalDetailRow}>
          <Ionicons name="link-outline" size={18} color="#8B0000" />
          <Text style={styles.modalDetailLabel}>Link Meet:</Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL(booking.linkMeet)}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>Nhấn để mở link</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    <View style={styles.modalDivider} />

    <View style={styles.modalDetailSection}>
      <View style={styles.modalDescriptionContainer}>
        <View style={styles.modalDescriptionHeader}>
          <Ionicons name="document-text-outline" size={18} color="#8B0000" />
          <Text style={styles.modalDescriptionLabel}>Mô tả:</Text>
        </View>
        <Text style={styles.modalDescriptionText}>{booking?.description || 'Chưa có mô tả'}</Text>
      </View>

      {booking?.masterNote && (
        <View style={styles.modalMasterNoteContainer}>
          <View style={styles.modalDescriptionHeader}>
            <Ionicons name="chatbubbles-outline" size={18} color="#8B0000" />
            <Text style={styles.modalDescriptionLabel}>Ghi chú của Master:</Text>
          </View>
          <Text style={styles.modalDescriptionText}>{booking.masterNote}</Text>
        </View>
      )}
    </View>
  </View>
);

const OfflineBookingDetailModal = ({ booking, getStatusColor, formatDate }) => (
  <View style={styles.modalDetailContainer}>
    <View style={styles.modalDetailSection}>
      <View style={styles.modalDetailRow}>
        <Ionicons name="bookmark-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Mã đặt lịch:</Text>
        <Text style={styles.modalDetailValue}>{booking?.bookingOfflineId || booking?.id || 'Không có'}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="business-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Loại tư vấn:</Text>
        <Text style={styles.modalDetailValue}>{booking?.type}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="information-circle-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Trạng thái:</Text>
        <View style={[
          styles.statusBadgeSmall,
          { backgroundColor: getStatusColor(booking?.status) + '20' }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(booking?.status) }
          ]} />
          <Text style={[
            styles.statusTextSmall,
            { color: getStatusColor(booking?.status) }
          ]}>
            {getStatusDisplayText(booking?.status)}
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.modalDivider} />

    <View style={styles.modalDetailSection}>
      <View style={styles.modalDetailRow}>
        <Ionicons name="person-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Khách hàng:</Text>
        <Text style={styles.modalDetailValue}>{booking?.customerName}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="mail-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Email:</Text>
        <Text style={styles.modalDetailValue}>{booking?.customerEmail}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="person-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Master:</Text>
        <Text style={styles.modalDetailValue}>{booking?.masterName || 'Chưa có Master'}</Text>
      </View>
    </View>

    <View style={styles.modalDivider} />

    <View style={styles.modalDetailSection}>
      <View style={styles.modalDetailRow}>
        <Ionicons name="cash-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Giá:</Text>
        <Text style={styles.modalDetailPrice}>
          {booking?.selectedPrice ? `${parseFloat(booking.selectedPrice).toLocaleString('vi-VN')} VNĐ` : 'Chưa có giá'}
        </Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="calendar-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Ngày:</Text>
        <Text style={styles.modalDetailValue}>{formatDate(booking?.bookingDate)}</Text>
      </View>

      <View style={styles.modalDetailRow}>
        <Ionicons name="location-outline" size={18} color="#8B0000" />
        <Text style={styles.modalDetailLabel}>Địa điểm:</Text>
        <Text style={styles.modalDetailValue}>{booking?.location || 'Chưa có địa điểm'}</Text>
      </View>
    </View>

    <View style={styles.modalDivider} />

    <View style={styles.modalDetailSection}>
      <View style={styles.modalDescriptionContainer}>
        <View style={styles.modalDescriptionHeader}>
          <Ionicons name="document-text-outline" size={18} color="#8B0000" />
          <Text style={styles.modalDescriptionLabel}>Mô tả:</Text>
        </View>
        <Text style={styles.modalDescriptionText}>{booking?.description || 'Chưa có mô tả'}</Text>
      </View>
    </View>
  </View>
);

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

      if (response.data && response.data.isSuccess) {
        const bookingDetail = response.data.data;
        const selectedPrice = bookingDetail.finalPrice || bookingDetail.price || bookingDetail.selectedPrice || bookingDetail.totalPrice;

        if (!selectedPrice || selectedPrice === 0) {
          console.error('Không tìm thấy giá trị cho selectedPrice trong booking detail:', bookingDetail);
          Alert.alert('Thông báo', 'Không tìm thấy thông tin giá. Vui lòng thử lại sau.');
          return;
        }

        // Navigate to different payment pages based on booking type
        if (booking.type === 'Online') {
          router.replace({
            pathname: '/(tabs)/online_checkout',
            params: {
              bookingId: booking.id,
              packageName: bookingDetail.packageName || 'Gói tư vấn phong thủy online',
              selectedPrice: selectedPrice,
              status: booking.status.trim(),
              serviceType: 'BookingOnline',
              returnTo: 'your_booking'
            }
          });
        } else {
          router.replace({
            pathname: '/(tabs)/offline_payment',
            params: {
              serviceId: booking.id,
              packageName: bookingDetail.packageName || 'Gói tư vấn phong thủy',
              selectedPrice: selectedPrice,
              status: booking.status.trim(),
              serviceType: 'BookingOffline',
              returnTo: 'your_booking'
            }
          });
        }
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

  // Helper function to get status color with opacity
  const getStatusColorWithOpacity = (status) => {
    return getStatusColor(status) + '20'; // 20 is hex for 12% opacity
  };

  const getStatusColor = (status) => {
    if (!status) return '#999';
    
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

  // Render booking item using the separate component
  const renderBookingItem = ({ item }) => {
    return (
      <BookingItem
        item={item}
        onViewBooking={handleViewBooking}
        onPayment={handlePayment}
        onCancel={cancelBooking}
        navigation={router}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getStatusColorWithOpacity={getStatusColorWithOpacity}
      />
    );
  };

  // Update the filter component with better responsiveness
  const SelectList = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterTabsContainer}>
        {consultTypeOptions.map((option) => (
            <TouchableOpacity
            key={option.id}
              style={[
              styles.filterTab,
              selectedConsultType === option.id && styles.filterTabActive
              ]}
            onPress={() => setSelectedConsultType(option.id)}
            >
              <Text style={[
              styles.filterTabText,
              selectedConsultType === option.id && styles.filterTabTextActive
              ]}>
              {option.label}
              </Text>
            {selectedConsultType === option.id && (
              <View style={styles.activeTabIndicator} />
              )}
            </TouchableOpacity>
        ))}
          </View>
      </View>
    );

  // Update the modal design
  const BookingDetailModal = () => (
    <Modal
      visible={bookingDetailVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setBookingDetailVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Chi tiết đặt lịch {selectedBooking?.type}
            </Text>
              <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setBookingDetailVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
        </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedBooking?.type === 'Online' ? (
              <OnlineBookingDetailModal 
                booking={selectedBooking} 
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            ) : (
              <OfflineBookingDetailModal 
                booking={selectedBooking}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.modalCloseButton}
              onPress={() => setBookingDetailVisible(false)}
            >
            <Text style={styles.modalCloseButtonText}>Đóng</Text>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Keep the main return but with updated styling
    return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#8B0000' }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#8B0000"
        translucent={true}
      />
      
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/profile')}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Lịch tư vấn</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refetch}
        >
          <Ionicons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
    </View>
      
        <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
          <SelectList />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
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
                  <Ionicons 
                    name="calendar-outline" 
                    size={isSmallDevice ? 60 : 80} 
                    color="#DDD" 
                  />
                <Text style={styles.emptyText}>
                  Không có lịch đặt tư vấn nào
                </Text>
              </View>
            )}
          />
          )}
        </View>
      
      <BookingDetailModal />
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8B0000',
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight + 16,
    paddingBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallDevice ? 8 : 16,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  filterTabActive: {
    backgroundColor: 'transparent',
  },
  filterTabText: {
    color: '#666',
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#8B0000',
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#8B0000',
    borderRadius: 1.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#666',
  },
  listContainer: {
    padding: isSmallDevice ? 12 : 16,
    paddingBottom: 80, // Space for tab bar
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isSmallDevice ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '700',
    color: '#333',
  },
  idText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: isSmallDevice ? 12 : 16,
  },
  infoSection: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#666',
    width: 60,
  },
  infoValue: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    color: '#f44336',
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '500',
    flex: 1,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: isSmallDevice ? 8 : 12,
  },
  actionsScrollContent: {
    paddingHorizontal: isSmallDevice ? 12 : 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '600',
  },
  contractButton: {
    backgroundColor: '#4CAF50',
  },
  documentButton: {
    backgroundColor: '#2196F3',
  },
  attachmentButton: {
    backgroundColor: '#9C27B0',
  },
  paymentButton: {
    backgroundColor: '#FF9800',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    height: SCREEN_HEIGHT * 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCloseButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDetailContainer: {
    flex: 1,
  },
  modalDetailSection: {
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modalDetailLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#666',
    width: 80,
  },
  modalDetailValue: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  modalDetailPrice: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#8B0000',
    fontWeight: '700',
    flex: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusTextSmall: {
    fontSize: isSmallDevice ? 10 : 11,
    fontWeight: '600',
  },
  linkButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalDescriptionContainer: {
    marginBottom: 12,
  },
  modalDescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  modalDescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalMasterNoteContainer: {
    backgroundColor: '#FFF9F9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
});

export default YourBooking; 