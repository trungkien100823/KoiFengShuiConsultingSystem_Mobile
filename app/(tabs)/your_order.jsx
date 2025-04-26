import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { orderService } from '../../constants/order';
import { useFocusEffect } from '@react-navigation/native';
import CustomTabBar from '../../components/ui/CustomTabBar';

export default function YourOrderScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchPendingOrders();
    }, [])
  );

  const fetchPendingOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem đơn hàng');
        router.push('/login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Order/get-pending-order`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.isSuccess) {
        const simplifiedOrders = response.data.data.map(order => ({
          type: order.serviceType,
          price: order.amount,
          status: order.status,
          id: order.orderId.trim()
        }));
        setOrders(simplifiedOrders);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Không có đơn hàng nào, set orders là mảng rỗng
        setOrders([]);
      } else {
        console.error('API Error Details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      Alert.alert(
        'Xác nhận',
        'Bạn có chắc chắn muốn hủy đơn hàng này?',
        [
          {
            text: 'Không',
            style: 'cancel'
          },
          {
            text: 'Có',
            onPress: async () => {
              try {
                setIsLoading(true);
                
                const token = await AsyncStorage.getItem('accessToken');
                const response = await axios.put(
                  `${API_CONFIG.baseURL}/api/Order/cancel/${orderId}`,
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                if (response.data && response.data.isSuccess) {
                  Alert.alert('Thành công', 'Đã hủy đơn hàng');
                  // Gọi lại API để cập nhật danh sách
                  await fetchPendingOrders();
                } else {
                  Alert.alert('Lỗi', response.data?.message || 'Không thể hủy đơn hàng');
                }
              } catch (error) {
                console.error('Lỗi khi hủy đơn:', error);
                Alert.alert('Lỗi', 'Không thể hủy đơn hàng');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể hủy đơn hàng');
    }
  };

  const handlePayment = async (order) => {
    try {
      // Log để debug

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để thanh toán');
        router.push('/login');
        return;
      }

      // Gọi API để lấy thông tin chi tiết đơn hàng bao gồm PaymentReference
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Order/get-pending-order`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.isSuccess) {
        // Tìm order tương ứng trong response
        const fullOrderInfo = response.data.data.find(o => o.orderId.trim() === order.id);
        
        if (fullOrderInfo && fullOrderInfo.paymentReference) {
          // Log toàn bộ thông tin order để debug
          
          router.push({
            pathname: '/payment_webview',
            params: {
              paymentUrl: encodeURIComponent(fullOrderInfo.paymentReference),
              orderId: fullOrderInfo.orderId, // Đảm bảo dùng orderId từ response API
              returnScreen: 'your_order'
            }
          });
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin thanh toán');
        }
      }
    } catch (error) {
      console.error('Chi tiết lỗi:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert('Lỗi', 'Không thể xử lý thanh toán');
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
        <Text style={styles.headerTitle}>Dịch vụ chưa thanh toán</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : orders.length > 0 ? (
        <ScrollView style={styles.orderList}>
          {orders.map((order, index) => (
            <View key={index} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <View style={styles.orderDetails}>
                  <Text style={styles.serviceType}>Loại dịch vụ: {order.type}</Text>
                  <Text style={styles.orderPrice}>Tổng tiền: {order.price.toLocaleString('vi-VN')} VNĐ</Text>
                  <Text style={styles.orderStatus}>Trạng thái: {order.status}</Text>
                  <Text style={styles.orderId}>Mã đơn: {order.id}</Text>
                </View>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.paymentButton}
                  onPress={() => handlePayment(order)}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Thanh toán</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => handleCancelOrder(order.id)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Hủy đơn</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có đơn hàng nào đang xử lý</Text>
        </View>
      )}
      <CustomTabBar />
    </SafeAreaView>
  );
}

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
  orderList: {
    padding: 16
  },
  orderCard: {
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
  orderInfo: {
    marginBottom: 12
  },
  orderDetails: {
    gap: 8
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  orderId: {
    fontSize: 14,
    color: '#666'
  },
  orderPrice: {
    fontSize: 14,
    color: '#666'
  },
  orderStatus: {
    fontSize: 14,
    color: '#666'
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
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
});
