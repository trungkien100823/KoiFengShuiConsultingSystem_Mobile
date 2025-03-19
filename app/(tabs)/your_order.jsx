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
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { orderService } from '../../constants/order';
import { useFocusEffect } from '@react-navigation/native';

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
      console.log('Order object received:', order);
      console.log('Order ID:', order.id);

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
          console.log('Full order info:', fullOrderInfo);
          console.log('Order ID to be passed:', fullOrderInfo.orderId);
          
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
      
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/menu')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your order</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AE1D1D" />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : orders.length > 0 ? (
        <ScrollView style={styles.orderList}>
          {orders.map((order, index) => (
            <View key={index} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <Image source={order.image || require('../../assets/images/buddha.png')} style={styles.orderImage} />
                <View style={styles.orderDetails}>
                  <Text style={styles.serviceType}>Loại dịch vụ: {order.type}</Text>
                  <Text style={styles.orderPrice}>Tổng tiền: {order.price.toLocaleString('vi-VN')} VNĐ</Text>
                  <Text style={styles.orderStatus}>Trạng thái: {order.status}</Text>
                  <Text style={styles.orderId}>Mã đơn: {order.id}</Text>
                </View>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.buttonWrapper}
                  onPress={() => handlePayment(order)}
                >
                  <LinearGradient
                    colors={['#AE1D1D', '#212121']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Thanh toán</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.buttonWrapper}
                  onPress={() => handleCancelOrder(order.id)}
                >
                  <LinearGradient
                    colors={['#AE1D1D', '#212121']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Hủy đơn</Text>
                  </LinearGradient>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16
  },
  menuButton: {
    padding: 8,
  },
  orderList: {
    padding: 16
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 12
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'space-between'
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '500'
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
    justifyContent: 'space-between',
    marginTop: 8,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    height: 35,
    marginHorizontal: 4,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
