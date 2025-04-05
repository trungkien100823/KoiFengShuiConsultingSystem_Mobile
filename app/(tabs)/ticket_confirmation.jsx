import React, { useState, useEffect } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

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

  const handleTicketCountChange = (value) => {
    setTicketCount(value);
  };

  const handleBooking = async () => {
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

  // New helper function to format price
  const formatPrice = (price) => {
    if (!price) return '0 VND';
    return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} VND`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient

        colors={['#8B0000', '#550000']}

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // Navigate back to workshopDetails with the original workshop ID
            navigation.navigate('workshopDetails', {
              workshop: { id: fullWorkshopId || workshopId },
              // Include any other parameters needed
            });
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt vé Workshop</Text>
        <View style={{width: 32}} />

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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Workshop Info Card */}
              <View style={styles.workshopCard}>
                <View style={styles.workshopHeaderRow}>
                  <View style={styles.workshopImageContainer}>
                    <Image 
                      source={{uri: 'https://res.cloudinary.com/dzedpn3us/image/upload/v1714547103/3_cgq2wb.jpg'}} 
                      style={styles.workshopImage}
                    />
                  </View>
                  <View style={styles.workshopInfo}>
                    <Text style={styles.workshopTitle}>{workshopInfo.title}</Text>
                    
                    <View style={styles.workshopDetailRow}>
                      <Ionicons name="calendar-outline" size={14} color="#8B0000" />
                      <Text style={styles.workshopDetailText}>{workshopInfo.date}</Text>
                    </View>
                    
                    <View style={styles.workshopDetailRow}>
                      <Ionicons name="location-outline" size={14} color="#8B0000" />
                      <Text style={styles.workshopDetailText}>{workshopInfo.location}</Text>
                    </View>
                    
                    <View style={styles.workshopDetailRow}>
                      <FontAwesome name="dollar" size={14} color="#8B0000" />
                      <Text style={styles.workshopDetailText}>{formatPrice(workshopInfo.price)}</Text>
                    </View>
                  </View>
                </View>

              {/* Customer Information Form */}
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Thông tin người đặt</Text>
                
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Họ tên</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={customerName}
                      onChangeText={setCustomerName}
                      placeholder="Nhập họ tên của bạn"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Nhập số điện thoại"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Nhập địa chỉ email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Số lượng vé</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={styles.ticketCounterContainer}>
                    <TouchableOpacity 
                      style={[styles.counterButton, {backgroundColor: ticketCount <= 1 ? '#f0f0f0' : '#8B0000'}]}
                      onPress={() => handleTicketCountChange(ticketCount > 1 ? ticketCount - 1 : 1)}
                      disabled={ticketCount <= 1}
                    >
                      <AntDesign name="minus" size={16} color={ticketCount <= 1 ? '#999' : 'white'} />
                    </TouchableOpacity>
                    
                    <View style={styles.ticketCountWrapper}>
                      <Text style={styles.ticketCountText}>{ticketCount}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.counterButton, {backgroundColor: '#8B0000'}]}
                      onPress={() => handleTicketCountChange(ticketCount + 1)}
                    >
                      <AntDesign name="plus" size={16} color="white" />
                    </TouchableOpacity>
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

              {/* Order Summary Card */}
              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giá vé:</Text>
                  <Text style={styles.summaryValue}>{formatPrice(workshopInfo.price)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Số lượng:</Text>
                  <Text style={styles.summaryValue}>{ticketCount} vé</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Tổng tiền:</Text>
                  <Text style={styles.totalValue}>{formatPrice(workshopInfo.price * ticketCount)}</Text>
                </View>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleBooking}
              >
                <Text style={styles.confirmButtonText}>Xác nhận đặt vé</Text>
              </TouchableOpacity>
              
              <View style={styles.bottomSpacing} />
            </ScrollView>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  workshopCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workshopHeaderRow: {
    flexDirection: 'row',
  },
  workshopImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  workshopImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  workshopInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  workshopDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workshopDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    color: '#8B0000',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  ticketCounterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketCountWrapper: {
    width: 50,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginHorizontal: 12,
  },
  ticketCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  confirmButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },

  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});