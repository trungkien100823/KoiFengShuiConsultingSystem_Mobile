import React, { useState, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '../../components/ui/CustomTabBar';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import { useFocusEffect } from '@react-navigation/native';
import { paymentService } from '../../constants/paymentService';

const YourRegisterAttend = () => {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const [statusTypes, setStatusTypes] = useState([
    { id: 'all', label: 'Tất cả' }
  ]);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const initData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gọi API lấy status types trước
      await fetchStatusTypes();
      
      // Đợi 1 giây
      await delay(1000);
      
      // Sau đó mới gọi API lấy tickets
      await fetchTickets('all');
    } catch (error) {
      console.error('Init error:', error);
      setError('Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      initData();
    }, [])
  );

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchTickets(selectedStatus);
      } catch (error) {
        setError(error.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
      } finally {
        setLoading(false);
      }
    };

    if (selectedStatus) {
      loadTickets();
    }
  }, [selectedStatus]);

  const fetchStatusTypes = async () => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('/(tabs)/login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/RegisterAttend/get-all-registerAttendEnums`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (Array.isArray(response.data)) {
        const types = response.data.map(status => ({
          id: status.toLowerCase(),
          label: status
        }));
        setStatusTypes([{ id: 'all', label: 'Tất cả' }, ...types]);
      } else {
        Alert.alert('Thông báo', 'Không thể tải danh sách trạng thái');
        setStatusTypes([{ id: 'all', label: 'Tất cả' }]);
      }
    } catch (error) {
      console.error('Error fetching status types:', error);
      Alert.alert('Thông báo', 'Không thể tải danh sách trạng thái');
      setStatusTypes([{ id: 'all', label: 'Tất cả' }]);
    }
  };

  const fetchTickets = async (status = selectedStatus) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('/(tabs)/login');
        return;
      }

      let url = `${API_CONFIG.baseURL}/api/RegisterAttend/get-by-status-for-current-user`;
      if (status && status !== 'all') {
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        url += `?status=${formattedStatus}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.isSuccess) {
        if (!response.data.data || response.data.data.length === 0) {
          Alert.alert('Thông báo', 'Không có vé nào trong danh sách');
        }
        setTickets(response.data.data || []);
      } else {
        Alert.alert('Thông báo', response.data?.message || 'Không có vé nào trong danh sách');
      }
    } catch (error) {
      // Chỉ log lỗi khi không phải là lỗi 404
      if (error.response?.status !== 404) {
        console.error('Error fetching tickets:', error);
      }
      
      if (error.response?.status === 404) {
        Alert.alert('Thông báo', 'Không có vé nào trong danh sách');
      } else {
        Alert.alert('Thông báo', 'Đã có lỗi xảy ra khi tải danh sách vé');
      }
      setTickets([]);
    }
  };

  // Thêm hàm hủy vé
  const cancelTicket = async (ticket) => {
    try {
      // Kiểm tra điều kiện hủy vé
      const canCancel = ticket.status.toLowerCase() === 'pending' || ticket.status.toLowerCase() === 'pendingconfirm';
      
      if (!canCancel) {
        Alert.alert('Thông báo', 'Không thể hủy vé trong trạng thái hiện tại');
        return;
      }

      Alert.alert(
        'Xác nhận hủy vé',
        'Bạn có chắc chắn muốn hủy vé tham gia workshop này không?',
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
                
                // Sử dụng API để hủy vé
                const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.cancelOrder.replace('{id}', ticket.groupId)}`;
                const response = await axios.put(
                  url,
                  null,
                  {
                    params: {
                      type: 'RegisterAttend'
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
                      'Đã hủy vé thành công',
                      [
                        {
                          text: 'OK',
                          onPress: async () => {
                            try {
                              setLoading(true); // Hiển thị loading khi làm mới danh sách
                              // Xóa dữ liệu hiện tại
                              setTickets([]);
                              
                              // Chờ một chút để backend cập nhật trạng thái
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              
                              // Lấy dữ liệu mới
                              await fetchTickets(selectedStatus);
                              
                              setLoading(false);
                            } catch (error) {
                              console.error('Lỗi khi refresh sau khi hủy vé:', error);
                              setLoading(false);
                            }
                          }
                        }
                      ]
                    );
                  }, 100);
                } else {
                  setLoading(false);
                  Alert.alert('Thông báo', response.data?.message || 'Không thể hủy vé. Vui lòng thử lại sau.');
                }
              } catch (error) {
                console.error('Lỗi khi hủy vé:', error);
                setLoading(false);
                Alert.alert('Thông báo', 'Đã xảy ra lỗi khi hủy vé. Vui lòng thử lại sau.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi hủy vé:', error);
      Alert.alert('Thông báo', 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    }
  };

  const renderStatusSelect = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Trạng thái:</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectButtonText}>
          {statusTypes.find(status => status.id === selectedStatus)?.label}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setModalVisible(false);
  };

  const renderTicketItem = ({ item }) => {
    // Kiểm tra điều kiện hiển thị nút thanh toán
    const showPaymentButton = item.status.toLowerCase() === 'pending';
    
    // Kiểm tra điều kiện hiển thị nút hủy vé
    const showCancelButton = 
      item.status.toLowerCase() === 'pending' || 
      item.status.toLowerCase() === 'pendingconfirm';
    
    return (
      <TouchableOpacity 
        style={styles.ticketItem}
        onPress={() => router.push({
          pathname: '/(tabs)/ticketDetails',
          params: { 
            groupId: item.groupId,
            totalPrice: item.totalPrice
          }
        })}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.workshopName}>{item.workshopName}</Text>
          <Text style={[
            styles.statusTag,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            {item.status}
          </Text>
        </View>
        
        <View style={styles.ticketContent}>
          <Text style={styles.ticketCount}>Số lượng vé: {item.numberOfTickets}</Text>
          
          <View style={styles.buttonContainer}>
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
                onPress={() => cancelTicket(item)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Hủy vé</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handlePayment = async (ticket) => {
    try {
      const result = await paymentService.processPayment({
        navigation: router,
        serviceId: ticket.groupId,
        serviceType: paymentService.SERVICE_TYPES.REGISTER_ATTEND,
        serviceInfo: {
          title: ticket.workshopName,
          ticketCount: ticket.numberOfTickets,
          totalPrice: ticket.totalPrice
        },
        onError: (error) => {
          Alert.alert(
            'Lỗi thanh toán',
            error.message || 'Không thể kết nối đến cổng thanh toán. Vui lòng thử lại.'
          );
        }
      });

      if (result.success && result.paymentUrl) {
        router.push({
          pathname: '/(tabs)/payment_webview',
          params: {
            paymentUrl: encodeURIComponent(result.paymentUrl),
            orderId: result.orderId,
            returnScreen: 'workshop'
          }
        });
      }
    } catch (error) {
      console.error('Lỗi xử lý thanh toán:', error);
      Alert.alert(
        'Thông báo',
        'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau.'
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FFA726';
      case 'pendingconfirm': return '#FFA726';
      case 'canceled': return '#F44336';
      default: return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vé tham dự hội thảo</Text>
      </View>

      {renderStatusSelect()}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn trạng thái</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {statusTypes.map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.modalOption,
                  selectedStatus === status.id && styles.modalOptionSelected
                ]}
                onPress={() => handleStatusSelect(status.id)}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedStatus === status.id && styles.modalOptionTextSelected
                ]}>
                  {status.label}
                </Text>
                {selectedStatus === status.id && (
                  <Ionicons name="checkmark" size={20} color="#8B0000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải danh sách vé...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={initData}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.groupId}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có vé nào</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={() => fetchTickets(selectedStatus)}
        />
      )}
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  modalOptionSelected: {
    backgroundColor: '#f8f8f8',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#8B0000',
    fontWeight: '500',
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
    gap: 8,
  },
  ticketCount: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d9534f',
    textAlign: 'center',
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
  listContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#8B0000',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
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
    gap: 5,
  },
  paymentButtonText: {
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
    gap: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default YourRegisterAttend; 