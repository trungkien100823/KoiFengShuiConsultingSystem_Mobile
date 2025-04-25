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
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '../../components/ui/CustomTabBar';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import { useFocusEffect } from '@react-navigation/native';
import { paymentService } from '../../constants/paymentService';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? (IS_IPHONE_X ? 44 : 20) : StatusBar.currentHeight || 0;

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
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={styles.filterLabelContainer}>
        <Ionicons name="funnel-outline" size={scale(16)} color="#8B0000" />
        <Text style={styles.filterLabel}>Trạng thái:</Text>
      </View>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectButtonText}>
          {statusTypes.find(status => status.id === selectedStatus)?.label || 'Tất cả'}
        </Text>
        <View style={styles.selectIconContainer}>
          <Ionicons name="chevron-down" size={scale(18)} color="#8B0000" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setModalVisible(false);
  };

  const renderTicketItem = ({ item }) => {
    const paymentStatus = item.status || 'Pending';
    const showPaymentButton = paymentStatus.toLowerCase() === 'pending';
    const showCancelButton = 
      paymentStatus.toLowerCase() === 'pending' || 
      paymentStatus.toLowerCase() === 'pendingconfirm';
    
    return (
      <View style={styles.ticketItemContainer}>
        <TouchableOpacity 
          style={styles.ticketItem}
          onPress={() => router.push({
            pathname: '/(tabs)/ticketDetails',
            params: { 
              groupId: item.groupId,
              totalPrice: item.totalPrice
            }
          })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8']}
            style={styles.ticketItemGradient}
          >
            {/* Header with status badge */}
            <View style={styles.ticketHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="calendar-outline" size={scale(18)} color="#8B0000" style={styles.ticketIcon} />
                <Text style={styles.workshopName} numberOfLines={2}>
                  {item.workshopName || 'Workshop'}
                </Text>
              </View>
              <View style={[
                styles.statusTag,
                { backgroundColor: getStatusColor(item.status) }
              ]}>
                <Text style={styles.statusTagText}>
                  {getStatusDisplay(item.status)}
                </Text>
              </View>
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* Ticket details */}
            <View style={styles.ticketDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="ticket-outline" size={scale(16)} color="#666" />
                <Text style={styles.detailText}>Số lượng vé: {item.numberOfTickets}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={scale(16)} color="#666" />
                <Text style={styles.detailText}>
                  Tổng tiền: {item.totalPrice ? 
                    `${item.totalPrice.toLocaleString('vi-VN')}đ` : 
                    'Miễn phí'}
                </Text>
              </View>
            </View>
            
            {/* Action buttons */}
            {(showPaymentButton || showCancelButton) && (
              <View style={styles.actionContainer}>
                {showPaymentButton && (
                  <TouchableOpacity 
                    style={styles.paymentButton}
                    onPress={() => handlePayment(item)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#8B0000', '#600000']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.actionButtonGradient}
                    >
                      <Ionicons name="wallet-outline" size={scale(16)} color="#FFF" />
                      <Text style={styles.actionButtonText}>Thanh toán</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                
                {showCancelButton && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => cancelTicket(item)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F44336', '#D32F2F']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.actionButtonGradient}
                    >
                      <Ionicons name="close-circle-outline" size={scale(16)} color="#FFF" />
                      <Text style={styles.actionButtonText}>Hủy vé</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    if (!status) return '#999';
    
    switch (status.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FFA726';
      case 'pendingconfirm': return '#FFA726';
      case 'canceled': return '#F44336';
      default: return '#999';
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Chờ thanh toán';
    
    switch (status.toLowerCase()) {
      case 'paid': return 'Đã thanh toán';
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ thanh toán';
      case 'pendingconfirm': return 'Chờ xác nhận';
      case 'canceled': return 'Đã hủy';
      default: return status;
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setTickets([]);
      console.log('Refreshing ticket data...');
      await fetchTickets(selectedStatus);
    } catch (error) {
      console.error('Error during refresh:', error);
      Alert.alert('Thông báo', 'Đã có lỗi xảy ra khi làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  }, [selectedStatus]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" translucent={true} />
      
      {/* Status bar spacer */}
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
      
      {/* Header */}
      <LinearGradient 
        colors={['#8B0000', '#600000']} 
        start={[0, 0]} 
        end={[1, 0]}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.backButton}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vé tham dự hội thảo</Text>
          <Text style={styles.headerSubtitle}>
            {tickets.length > 0 
              ? `${tickets.length} vé đã đăng ký` 
              : 'Khám phá và đăng ký tham gia'
            }
          </Text>
        </View>
      </LinearGradient>

      {renderStatusSelect()}

      {/* Status selection modal */}
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
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Ionicons name="close" size={scale(22)} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              {statusTypes.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    styles.modalOption,
                    selectedStatus === status.id && styles.modalOptionSelected
                  ]}
                  onPress={() => handleStatusSelect(status.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedStatus === status.id && styles.modalOptionTextSelected
                  ]}>
                    {status.label}
                  </Text>
                  {selectedStatus === status.id && (
                    <Ionicons name="checkmark-circle" size={scale(20)} color="#8B0000" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Content area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải danh sách vé...</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={scale(50)} color="#F44336" style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={initData}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B0000', '#600000']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
              <Ionicons name="refresh" size={scale(16)} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.groupId || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={scale(60)} color="#8B0000" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
              <Text style={styles.emptyText}>
                Bạn chưa đăng ký tham dự workshop nào. Hãy khám phá các workshop của chúng tôi ngay.
              </Text>
              <TouchableOpacity 
                style={styles.browseButton} 
                onPress={() => router.push('/(tabs)/workshop')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B0000', '#600000']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.browseButtonGradient}
                >
                  <Text style={styles.browseButtonText}>Xem workshop</Text>
                  <Ionicons name="arrow-forward" size={scale(16)} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#8B0000']}
              tintColor="#8B0000"
              title="Đang làm mới..."
              titleColor="#8B0000"
              progressBackgroundColor="rgba(255, 255, 255, 0.8)"
            />
          }
        />
      )}

      {/* Keep the custom tab bar */}
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTitleContainer: {
    marginLeft: scale(16),
    flex: 1,
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
  },
  headerSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255,255,255,0.8)',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#333',
    marginLeft: scale(6),
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: scale(130),
  },
  selectButtonText: {
    fontSize: scale(14),
    color: '#333',
    flex: 1,
  },
  selectIconContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: scale(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  modalOptions: {
    paddingVertical: scale(8),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
  },
  modalOptionText: {
    fontSize: scale(16),
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#8B0000',
    fontWeight: '600',
  },
  
  // Ticket item styles
  ticketItemContainer: {
    marginBottom: scale(16),
    marginHorizontal: scale(16),
  },
  ticketItem: {
    borderRadius: scale(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ticketItemGradient: {
    borderRadius: scale(16),
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    paddingBottom: scale(12),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketIcon: {
    marginRight: scale(8),
  },
  workshopName: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(16),
    marginLeft: scale(8),
  },
  statusTagText: {
    color: '#FFF',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: scale(16),
  },
  ticketDetails: {
    padding: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  detailText: {
    fontSize: scale(14),
    color: '#666',
    marginLeft: scale(8),
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: scale(16),
    paddingTop: scale(0),
    gap: scale(8),
  },
  paymentButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  cancelButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: scale(14),
    fontWeight: '600',
    marginLeft: scale(6),
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: scale(24),
    borderRadius: scale(16),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(16),
    color: '#666',
  },
  
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorIcon: {
    marginBottom: scale(16),
  },
  errorText: {
    color: '#666',
    fontSize: scale(16),
    textAlign: 'center',
    marginBottom: scale(20),
  },
  retryButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
    marginTop: scale(40),
  },
  emptyIcon: {
    marginBottom: scale(16),
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(12),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: scale(16),
    color: '#666',
    marginBottom: scale(24),
    textAlign: 'center',
    lineHeight: scale(24),
  },
  browseButton: {
    borderRadius: scale(30),
    overflow: 'hidden',
    width: '100%',
    maxWidth: scale(200),
  },
  browseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
    paddingVertical: scale(14),
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginRight: scale(8),
  },
  
  // List container
  listContainer: {
    paddingTop: scale(16),
    paddingBottom: IS_IPHONE_X ? scale(100) : scale(80), // Account for custom tab bar
    minHeight: '100%',
  },
});

export default YourRegisterAttend; 