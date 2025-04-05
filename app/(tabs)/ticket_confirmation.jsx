import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Alert, ActivityIndicator, Image, ScrollView, Dimensions } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { ticketService } from '../../constants/ticketCreate';
import { paymentService } from '../../constants/paymentService';

const { width } = Dimensions.get('window');

export default function TicketConfirmation() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  let workshopId = params.workshopId;
  const workshopName = params.workshopName;
  const workshopPrice = params.workshopPrice;
  
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workshopInfo, setWorkshopInfo] = useState({
    title: workshopName || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học',
    date: '15/10/2025',
    location: 'Đại học FPT',
    price: workshopPrice || 100
  });
  const [fullWorkshopId, setFullWorkshopId] = useState(workshopId);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchCurrentUser(),
        fetchWorkshopDetails()
      ]);
    };
    
    fetchData();
  }, []);

  const fetchWorkshopDetails = async () => {
    try {
      if (!workshopId) {
        console.log('Không có ID workshop, sử dụng thông tin mặc định');
        return;
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }
      
      console.log(`Đang gọi API workshop với ID: ${workshopId}`);
      
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Workshop/${workshopId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Workshop details response:', JSON.stringify(response.data));
      
      if (response.data) {
        const workshopData = response.data.data || response.data;
        
        console.log('Workshop data extracted:', JSON.stringify(workshopData));
        
        if (workshopData.id) {
          setFullWorkshopId(workshopData.id);
          console.log('Đã cập nhật fullWorkshopId đầy đủ:', workshopData.id);
        }
        
        if (workshopData.startDate) console.log('Found startDate:', workshopData.startDate);
        
        setWorkshopInfo({
          title: workshopData.title || workshopData.name || workshopName,
          date: formatDate(workshopData.startDate),
          location: workshopData.location || workshopData.address || 'Đang cập nhật',
          price: parseFloat(workshopData.price) || workshopPrice
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin workshop:', error);
      console.log('Error details:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      console.log('Formatting date string:', dateString);
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.log('Date không hợp lệ, trả về nguyên mẫu:', dateString);
        return dateString;
      }
      
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      console.log('Formatted date result:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return dateString;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        navigation.navigate('login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Account/current-user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Current user response:', response.data);

      if (response.data) {
        setCustomerName(response.data.fullName || response.data.userName || '');
        setPhoneNumber(response.data.phoneNumber || '');
        setEmail(response.data.email || '');
      } else {
        Alert.alert('Thông báo', 'Không thể lấy thông tin người dùng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const decreaseTickets = () => {
    if (ticketCount > 1) {
      setTicketCount(ticketCount - 1);
    }
  };

  const increaseTickets = () => {
    setTicketCount(ticketCount + 1);
  };

  const checkPaymentEndpoint = async () => {
    try {
      console.log('Kiểm tra cấu hình API thanh toán:', API_CONFIG.endpoints.payment);
      if (!API_CONFIG.endpoints.payment) {
        console.error('Không tìm thấy cấu hình endpoint thanh toán');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra endpoint thanh toán:', error);
    }
  };

  const checkPendingPayments = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return false;

      // Gọi API kiểm tra thanh toán đang chờ (nếu có)
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Order/check-pending?serviceType=RegisterAttend`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Trả về true nếu không có thanh toán đang chờ
      return response.data.isSuccess;
    } catch (error) {
      // Nếu có lỗi 400 với thông báo về thanh toán đang chờ
      if (error.response && error.response.status === 400 && 
          error.response.data && error.response.data.message &&
          error.response.data.message.includes('chưa thanh toán')) {
        
        // Hiển thị thông báo và chuyển đến trang thanh toán
        Alert.alert(
          'Thông báo',
          error.response.data.message,
          [
            {
              text: 'Đi đến thanh toán',
              onPress: () => {
                // Điều hướng đến màn hình quản lý vé
                navigation.navigate('tickets');
              }
            },
            {
              text: 'Hủy',
              style: 'cancel'
            }
          ]
        );
        return false;
      }
      // Mặc định cho phép tiếp tục
      return true;
    }
  };

  // Thêm hàm delay để đợi một khoảng thời gian
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const checkTicketStatus = async (groupId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return false;
      
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/RegisterAttend/check-status/${groupId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.isSuccess;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái vé:', error);
      return false;
    }
  };

  const handleContinue = async () => {
    if (!customerName || !phoneNumber || !email) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setIsLoading(true);
      
      // Kiểm tra thanh toán đang chờ trước
      const canProceed = await checkPendingPayments();
      if (!canProceed) {
        setIsLoading(false);
        return;
      }
      
      // Kiểm tra cấu hình API
      await checkPaymentEndpoint();
      
      // Đảm bảo ticketCount là số dương
      const numberOfTicket = parseInt(ticketCount, 10);
      if (isNaN(numberOfTicket) || numberOfTicket <= 0) {
        Alert.alert('Thông báo', 'Số lượng vé phải lớn hơn 0');
        return;
      }
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        navigation.navigate('login');
        return;
      }
      
      // Đảm bảo workshopId hợp lệ
      if (!fullWorkshopId && !workshopId) {
        Alert.alert('Thông báo', 'Không tìm thấy thông tin workshop');
        return;
      }
      
      // Chuẩn bị dữ liệu vé
      const ticketData = {
        workshopId: fullWorkshopId || workshopId,
        quantity: numberOfTicket,
        customerName: customerName,
        phoneNumber: phoneNumber,
        email: email
      };
      
      console.log('Dữ liệu vé được chuẩn bị:', JSON.stringify(ticketData));
      
      // Sử dụng service tạo vé
      const createResult = await ticketService.createTicket(ticketData);
      
      console.log('Kết quả tạo vé:', JSON.stringify(createResult));
      
      if (createResult.success) {
        // Lấy GroupId từ response
        const groupId = createResult.data.groupId;
        
        // Hiển thị thông báo tạo vé thành công và chuyển thẳng đến phần thanh toán
        Alert.alert(
          'Tạo vé thành công',
          'Vé đã được tạo thành công. Bạn sẽ được chuyển đến trang thanh toán.',
          [
            {
              text: 'Tiếp tục thanh toán',
              onPress: () => {
                // Gọi hàm thanh toán với groupId
                processPayment(groupId, numberOfTicket);
              }
            }
          ],
          { cancelable: false } // Không cho phép đóng alert bằng cách nhấn bên ngoài
        );
        
        return; // Kết thúc hàm ở đây để không thực hiện phần code phía dưới
      } else {
        Alert.alert('Thông báo', 'Không thể tạo vé');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      
      // Kiểm tra lỗi cụ thể về thanh toán đang chờ
      if (error.message && (
        error.message.includes('hoàn tất thanh toán') || 
        error.message.includes('chưa thanh toán')
      )) {
        Alert.alert(
          'Thông báo',
          error.message,
          [
            {
              text: 'Đi đến thanh toán',
              onPress: () => {
                // Điều hướng đến màn hình tickets để xem các vé chưa thanh toán
                navigation.navigate('tickets');
              }
            },
            {
              text: 'Hủy',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu');
      }
      
      setIsLoading(false);
      return;
    }
  };

  // Cập nhật hàm processPayment để sử dụng service
  const processPayment = async (groupId, numberOfTicket) => {
    try {
      setIsLoading(true);
      
      console.log(`Đang xử lý thanh toán cho GroupId: ${groupId}`);
      
      // Sử dụng service thanh toán với GroupId
      const result = await paymentService.processPayment({
        navigation,
        serviceId: groupId,
        serviceType: paymentService.SERVICE_TYPES.REGISTER_ATTEND,
        serviceInfo: {
          title: workshopInfo.title,
          date: workshopInfo.date,
          location: workshopInfo.location,
          customerName: customerName,
          phoneNumber: phoneNumber,
          email: email,
          ticketCount: numberOfTicket,
          totalFee: `${workshopInfo.price * numberOfTicket}$`
        },
        onError: (error) => {
          console.error('Lỗi thanh toán:', error);
          Alert.alert(
            'Lỗi thanh toán',
            error.message || 'Không thể kết nối đến cổng thanh toán. Vui lòng thử lại.',
            [
              {
                text: 'Thử lại',
                onPress: () => processPayment(groupId, numberOfTicket)
              }
            ],
            { cancelable: false }
          );
        }
      });
      
      if (result.success) {
        // Lấy paymentUrl và orderId trực tiếp từ result
        const { paymentUrl, orderId } = result;
        console.log('Payment URL:', paymentUrl); // Thêm log để debug
        console.log('Order ID:', orderId); // Thêm log để debug
        
        // Sử dụng navigation.navigate
        navigation.navigate('payment_webview', {
          paymentUrl: encodeURIComponent(paymentUrl),
          orderId: orderId,
          returnScreen: 'workshop'
        });
      } else {
        Alert.alert(
          'Thông báo',
          result.message || 'Không thể tạo liên kết thanh toán.',
          [
            {
              text: 'Thử lại',
              onPress: () => processPayment(groupId, numberOfTicket)
            }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Lỗi xử lý thanh toán:', error);
      
      Alert.alert(
        'Lỗi hệ thống',
        'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
        [
          {
            text: 'Thử lại',
            onPress: () => processPayment(groupId, numberOfTicket)
          }
        ],
        { cancelable: false }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#8B0000', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xác Nhận Đặt Vé</Text>
          <View style={styles.rightHeaderPlaceholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : (
          <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.workshopCard}>
                  <Image 
                    source={require('../../assets/images/buddha.png')} 
                    style={styles.workshopImage}
                  />
                  <View style={styles.workshopInfo}>
                    <View style={styles.workshopOverlay}>
                      <Text style={styles.workshopTitle} numberOfLines={2}>
                        {workshopInfo.title}
                      </Text>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#FFD700" />
                        <Text style={styles.infoText}>{workshopInfo.date}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#FFD700" />
                        <Text style={styles.infoText}>{workshopInfo.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="person" size={20} color="#8B0000" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Họ và tên"
                      value={customerName}
                      onChangeText={setCustomerName}
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="call" size={20} color="#8B0000" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Số điện thoại"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail" size={20} color="#8B0000" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Số Lượng Vé</Text>
                  
                  <View style={styles.ticketSelectionContainer}>
                    <View style={styles.ticketPriceContainer}>
                      <Text style={styles.ticketPriceLabel}>Giá vé:</Text>
                      <Text style={styles.ticketPrice}>{workshopInfo.price || "$0"}</Text>
                    </View>

                    <View style={styles.ticketCounterRow}>
                      <Text style={styles.ticketCounterLabel}>Số lượng:</Text>
                      <View style={styles.ticketCounter}>
                        <TouchableOpacity 
                          style={styles.counterButton}
                          onPress={() => ticketCount > 1 && setTicketCount(ticketCount - 1)}
                        >
                          <AntDesign name="minus" size={16} color="#FFF" />
                        </TouchableOpacity>
                        
                        <View style={styles.counterValueContainer}>
                          <Text style={styles.counterValue}>{ticketCount}</Text>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.counterButton}
                          onPress={() => setTicketCount(ticketCount + 1)}
                        >
                          <AntDesign name="plus" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Payment Method Section */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                  
                  <View style={styles.paymentOptions}>
                    <TouchableOpacity 
                      style={[
                        styles.paymentMethod,
                        selectedPayment === 'VietQR' && styles.selectedPaymentMethod
                      ]}
                      onPress={() => setSelectedPayment('VietQR')}
                    >
                      <Image 
                        source={require('../../assets/images/VietQR.png')} 
                        style={styles.paymentMethodImage} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.paymentMethod,
                        selectedPayment === 'PayOS' && styles.selectedPaymentMethod
                      ]}
                      onPress={() => setSelectedPayment('PayOS')}
                    >
                      <Image 
                        source={require('../../assets/images/PayOS.png')} 
                        style={styles.paymentMethodImage} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Order Summary */}
                <View style={styles.sectionCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tổng tiền</Text>
                    <Text style={styles.summaryValue}>
                      {workshopInfo && workshopInfo.price ? 
                        typeof workshopInfo.price === 'string' ?
                          `${parseFloat(workshopInfo.price.replace(/[^0-9.]/g, '')) * ticketCount} VND` :
                          `${parseFloat(workshopInfo.price) * ticketCount} VND`
                        : "0 VND"}
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Chiết khấu</Text>
                    <Text style={styles.summaryValue}>0 VND</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                    <Text style={styles.totalValue}>
                      {workshopInfo && workshopInfo.price ? 
                        typeof workshopInfo.price === 'string' ?
                          `${parseFloat(workshopInfo.price.replace(/[^0-9.]/g, '')) * ticketCount} VND` :
                          `${parseFloat(workshopInfo.price) * ticketCount} VND`
                        : "0 VND"}
                    </Text>
                  </View>
                </View>

                <View style={styles.bottomSpacing} />
              </ScrollView>
            </TouchableWithoutFeedback>

            {/* Fixed Bottom Payment Bar - moved outside TouchableWithoutFeedback */}
            <View style={styles.fixedBottomBar}>
              <View style={styles.bottomTotalContainer}>
                <Text style={styles.bottomTotalLabel}>Tổng thanh toán</Text>
                <Text style={styles.bottomTotalValue}>
                  {workshopInfo && workshopInfo.price ? 
                    typeof workshopInfo.price === 'string' ?
                      `${parseFloat(workshopInfo.price.replace(/[^0-9.]/g, '')) * ticketCount} VND` :
                      `${parseFloat(workshopInfo.price) * ticketCount} VND`
                    : "0 VND"}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={handleContinue}
                disabled={!selectedPayment || isLoading}
              >
                <Text style={styles.paymentButtonText}>Thanh toán</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  rightHeaderPlaceholder: {
    width: 40,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  workshopCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workshopImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  workshopInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  workshopOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  workshopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  inputIconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  ticketSelectionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  ticketPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketPriceLabel: {
    fontSize: 16,
    color: '#555',
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  ticketCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketCounterLabel: {
    fontSize: 16,
    color: '#555',
  },
  ticketCounter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValueContainer: {
    minWidth: 50,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  bottomSpacing: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B0000',
  },
  paymentOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  paymentMethod: {
    width: 100,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  selectedPaymentMethod: {
    borderColor: '#8B0000',
    backgroundColor: '#FFF5F5',
  },
  paymentMethodImage: {
    width: 80,
    height: 50,
    resizeMode: 'contain',
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bottomTotalContainer: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 14,
    color: '#fff',
  },
  bottomTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  paymentButtonText: {
    color: '#8B0000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});