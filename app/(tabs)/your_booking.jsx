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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);
  
  const [consultTypes, setConsultTypes] = useState([
    { id: 'all', label: 'Tất cả' }
  ]);
  const [statusTypes, setStatusTypes] = useState([
    { id: 'all', label: 'Tất cả' }
  ]);

  // Thêm state để theo dõi việc tải enum
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);
  const [hasShownAlert, setHasShownAlert] = useState(false);

  // Thêm state để quản lý lỗi
  const [error, setError] = useState(null);

  // Thêm các state mới
  const [bookingDetailVisible, setBookingDetailVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filteredBookings = bookings.filter(booking => {
    const matchConsultType = selectedConsultType === 'all' || booking.type === selectedConsultType;
    const matchStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    return matchConsultType && matchStatus;
  });

  // Cập nhật hàm fetchAllFilterOptions
  const fetchAllFilterOptions = async () => {
    try {
      setError(null);
      setIsLoadingEnums(true);
      const token = await getAuthToken();
      
      if (!token) {
        setError('Vui lòng đăng nhập để tiếp tục');
        return;
      }

      const consultTypeResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/get-all-bookingTypeEnums`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (Array.isArray(consultTypeResponse.data)) {
        const types = consultTypeResponse.data.map(type => ({
          id: type,
          label: type
        }));
        setConsultTypes([{ id: 'all', label: 'Tất cả' }, ...types]);
      }

      const statusResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/get-all-bookingOfflineEnums`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (Array.isArray(statusResponse.data)) {
        const statuses = statusResponse.data.map(status => ({
          id: status,
          label: status
        }));
        setStatusTypes([{ id: 'all', label: 'Tất cả' }, ...statuses]);
      }

    } catch (error) {
      setError('Không thể tải các tùy chọn lọc. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingEnums(false);
    }
  };

  // Thêm hàm delay để đảm bảo UX mượt mà
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Tạo hàm initData để khởi tạo dữ liệu
  const initData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchAllFilterOptions();
      await delay(1000);
      await fetchBookings();
    } catch (error) {
      setError('Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật useFocusEffect để gọi initData mỗi khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      initData();
    }, [])
  );

  // Cập nhật useEffect cho việc fetch status types khi thay đổi loại tư vấn
  useEffect(() => {
    const fetchStatusForType = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        if (selectedConsultType === 'all') {
          setStatusTypes([{ id: 'all', label: 'Tất cả' }]);
          setSelectedStatus('all');
          return;
        }

        const endpoint = selectedConsultType === 'Online' 
          ? '/api/Booking/get-all-bookingOnlineEnums'
          : '/api/Booking/get-all-bookingOfflineEnums';

        const response = await axios.get(`${API_CONFIG.baseURL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (Array.isArray(response.data)) {
          const statuses = response.data.map(status => ({
            id: status,
            label: status
          }));
          setStatusTypes([{ id: 'all', label: 'Tất cả' }, ...statuses]);
          setSelectedStatus('all');
        }
      } catch (error) {
        setStatusTypes([{ id: 'all', label: 'Tất cả' }]);
        setSelectedStatus('all');
      }
    };

    fetchStatusForType();
  }, [selectedConsultType]);

  useEffect(() => {
    fetchBookings();
  }, [selectedConsultType, selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Chỉ gửi params khi không phải là "all"
      const params = {};
      if (selectedConsultType !== 'all') {
        params.type = selectedConsultType;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Booking/get-bookings-by-type-and-status`, 
        {
          params,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.isSuccess) {
        setBookings(response.data.data);
      }
    } catch (error) {
      // Xử lý lỗi kết nối
      if (error.code === 'ECONNABORTED') {
        Alert.alert(
          "Lỗi kết nối",
          "Yêu cầu đã hết thời gian chờ. Vui lòng kiểm tra kết nối mạng và thử lại."
        );
      } else if (!error.response) {
        Alert.alert(
          "Lỗi kết nối",
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau."
        );
        setBookings([]); // Xóa dữ liệu cũ khi không thể kết nối
      } else {
        // Xử lý các lỗi HTTP khác
        switch (error.response.status) {
          case 404:
            setBookings([]);
            break;
          case 400:
            Alert.alert(
              "Thông báo",
              error.response.data.message || "Yêu cầu không hợp lệ"
            );
            break;
          case 401:
            Alert.alert(
              "Thông báo",
              error.response.data.message || "Phiên đăng nhập đã hết hạn"
            );
            router.push('login');
            break;
          case 402:
            Alert.alert(
              "Thông báo",
              error.response.data.message || "Bạn cần thanh toán để tiếp tục"
            );
            break;
          default:
            Alert.alert(
              "Lỗi",
              "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau."
            );
        }
      }
    } finally {
      setLoading(false);
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
        // Thêm masterNote mẫu cho mục đích test giao diện
        const bookingData = {
          ...response.data.data,
          masterNote: `Khách hàng cần tư vấn về vấn đề tâm lý:
- Đang gặp stress trong công việc
- Có dấu hiệu trầm cảm nhẹ
- Cần hỗ trợ về kỹ năng giao tiếp

Kế hoạch tư vấn:
1. Đánh giá mức độ stress và trầm cảm
2. Hướng dẫn các bài tập thư giãn
3. Tư vấn kỹ năng quản lý thời gian
4. Đề xuất các hoạt động giải trí lành mạnh

Lưu ý: Cần theo dõi thêm trong các buổi tư vấn tiếp theo.`
        };
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
      const serviceType = booking.type === 'Online' 
        ? paymentService.SERVICE_TYPES.BOOKING_ONLINE 
        : paymentService.SERVICE_TYPES.BOOKING_OFFLINE;

      const result = await paymentService.processPayment({
        navigation: router,
        serviceId: booking.id,
        serviceType
      });

      if (result.success && result.paymentUrl) {
        router.push({
          pathname: '/(tabs)/payment_webview',
          params: {
            paymentUrl: encodeURIComponent(result.paymentUrl),
            orderId: result.orderId,
            returnScreen: 'menu'
          }
        });
      } else if (result.message) {
        Alert.alert('Thông báo', result.message);
      }
    } catch (error) {
      Alert.alert('Thông báo', error.response?.data?.message || error.message);
    }
  };

  const renderBookingItem = ({ item }) => (
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
          Ngày: {new Date(item.bookingDate).toLocaleDateString('vi-VN')}
        </Text>

        {item.status.toLowerCase() === 'pending' && (
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={() => handlePayment(item)}
          >
            <Ionicons name="wallet-outline" size={20} color="#fff" />
            <Text style={styles.paymentButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FFA726';
      case 'canceled': return '#F44336';
      default: return '#999';
    }
  };

  const SelectList = ({ title, value, options, type }) => (
    <View style={styles.selectListContainer}>
      <TouchableOpacity 
        style={[
          styles.selectList,
          openFilter === type && styles.selectListActive
        ]}
        onPress={() => setOpenFilter(openFilter === type ? null : type)}
      >
        <Text style={styles.selectListLabel}>{title}</Text>
        <View style={styles.selectListValue}>
          <Text style={styles.selectListValueText}>
            {options.find(opt => opt.id === value)?.label || 'Chọn'}
          </Text>
          <Text style={[
            styles.selectListArrow,
            openFilter === type && styles.selectListArrowUp
          ]}>▼</Text>
        </View>
      </TouchableOpacity>
      
      {openFilter === type && (
        <View style={styles.dropdownContainer}>
          {options.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dropdownItem,
                value === item.id && styles.dropdownItemActive
              ]}
              onPress={() => {
                if (type === 'consultType') {
                  setSelectedConsultType(item.id);
                  // Khi chọn "Tất cả" ở bookingType, reset status về "Tất cả"
                  if (item.id === 'all') {
                    setSelectedStatus('all');
                    setStatusTypes([{ id: 'all', label: 'Tất cả' }]);
                  }
                } else {
                  setSelectedStatus(item.id);
                }
                setOpenFilter(null);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                value === item.id && styles.dropdownItemTextActive
              ]}>
                {item.label}
              </Text>
              {value === item.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

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
            data={currentFilter === 'consultType' ? consultTypes : statusTypes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  currentFilter === 'consultType' 
                    ? setSelectedConsultType(item.id)
                    : setSelectedStatus(item.id);
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

  // Cập nhật BookingDetailModal
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
            <Text style={styles.modalTitle}>Chi tiết đặt lịch</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setBookingDetailVisible(false)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedBooking && (
            <ScrollView style={styles.bookingDetailScroll}>
              <View style={styles.bookingDetailSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã đặt lịch:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.bookingOnlineId}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại tư vấn:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.type}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <View style={styles.statusContainer}>
                    <Text style={[
                      styles.statusTag,
                      { backgroundColor: getStatusColor(selectedBooking.status) }
                    ]}>
                      {selectedBooking.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Khách hàng:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customerName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customerEmail}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Master:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.masterName}</Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giá:</Text>
                  <Text style={styles.priceValue}>
                    {selectedBooking.price?.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedBooking.bookingDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời gian:</Text>
                  <Text style={styles.detailValue}>
                    {selectedBooking.startTime.substring(0, 5)} - {selectedBooking.endTime.substring(0, 5)}
                  </Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.descriptionContainer}>
                  <Text style={styles.detailLabel}>Mô tả:</Text>
                  <Text style={styles.descriptionText}>{selectedBooking.description}</Text>
                </View>

                {selectedBooking.masterNote && (
                  <View style={styles.masterNoteContainer}>
                    <Text style={styles.masterNoteLabel}>
                      <Ionicons name="document-text-outline" size={16} color="#666" />
                      {" "}Ghi chú của Master
                    </Text>
                    <Text style={styles.masterNoteText}>{selectedBooking.masterNote}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Cập nhật phần render để hiển thị loading state cho enum
  if (loading || isLoadingEnums) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>
          {isLoadingEnums ? 'Đang tải tùy chọn...' : 'Đang tải đặt lịch...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            fetchAllFilterOptions();
            fetchBookings();
          }}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>My Bookings</Text>
      </View>
      
      <View style={styles.filtersContainer}>
        <SelectList
          title="Loại tư vấn"
          value={selectedConsultType}
          options={consultTypes}
          type="consultType"
        />
        <SelectList
          title="Trạng thái"
          value={selectedStatus}
          options={statusTypes}
          type="status"
        />
      </View>

      <FilterModal />

      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Không có lịch đặt tư vấn nào
            </Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={initData}
      />
      <BookingDetailModal />
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#AE1D1D',
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
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  selectListContainer: {
    flex: 1,
    position: 'relative',
  },
  selectList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectListActive: {
    borderColor: '#8B0000',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectListLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectListValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectListValueText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectListArrow: {
    fontSize: 12,
    color: '#666',
    transform: [{ rotate: '0deg' }],
  },
  selectListArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B0000',
    borderTop: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#8B0000',
    fontWeight: '500',
  },
  checkmark: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#8B0000',
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
    color: '#AE1D1D',
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
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#AE1D1D',
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
});

export default YourBooking; 