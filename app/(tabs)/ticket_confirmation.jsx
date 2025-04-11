import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { ticketService } from '../../constants/ticketCreate';
import { paymentService } from '../../constants/paymentService';
import { workshopDetailsService } from '../../constants/workshopDetails';

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

  // Thêm hàm retry cho API
  const retryApiCall = async (apiCall, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.log(`Lần thử ${i + 1} thất bại, đang thử lại...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi 1 giây trước khi thử lại
      }
    }
    throw lastError;
  };

  // Hàm fetch dữ liệu chính
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch workshop details trước vì API này ổn định hơn
      await fetchWorkshopDetails();
      
      // Thử fetch user info với retry
      try {
        await retryApiCall(async () => {
          await verifyTokenAndUser();
          await fetchCurrentUser();
        });
      } catch (error) {
        console.error('Không thể lấy thông tin người dùng sau nhiều lần thử:', error);
        // Vẫn tiếp tục nếu không lấy được user info
      }
      
    } catch (error) {
      console.error('Lỗi khi fetch dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm useFocusEffect để re-fetch dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      console.log('Màn hình được focus, đang fetch dữ liệu...');
      
      // Lấy params mới nhất từ route
      const currentParams = route.params || {};
      const currentWorkshopId = currentParams.workshopId;
      
      // Nếu workshopId thay đổi, cập nhật và fetch lại dữ liệu
      if (currentWorkshopId && currentWorkshopId !== workshopId) {
        console.log('WorkshopId thay đổi từ', workshopId, 'sang', currentWorkshopId);
        workshopId = currentWorkshopId;
        setFullWorkshopId(currentWorkshopId);
        setTicketCount(1); // Reset số lượng vé về 1
      }
      
      fetchData();
      
      return () => {
        console.log('Màn hình bị blur');
      };
    }, [route.params]) // Thêm route.params vào dependency array
  );

  useEffect(() => {
    // Add a listener for when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      // Get the latest params from the route
      const currentParams = route.params || {};
      const currentWorkshopId = currentParams.workshopId;
      
      // If the ID changed since we last set it, refresh everything
      if (currentWorkshopId && currentWorkshopId !== workshopId) {
        // Update our internal workshopId state
        workshopId = currentWorkshopId;
        
        // Reset loading state and fetch new data
        setIsLoading(true);
        setTicketCount(1);
        
        Promise.all([
          verifyTokenAndUser(),
          fetchWorkshopDetails()
        ]);
      }
    });

    // Cleanup the listener when component unmounts
    return unsubscribe;
  }, [navigation, route]);

  // Thêm hàm refresh để gọi lại các API
  const refreshScreen = async () => {
    setIsLoading(true);
    try {
      await fetchCurrentUser();
      await fetchWorkshopDetails();
    } catch (error) {
      console.error('Lỗi khi refresh màn hình:', error);
      Alert.alert(
        "Thông báo",
        "Không thể tải lại thông tin. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkshopDetails = async () => {
    if (!workshopId) {
      setIsLoading(false);
      return;
    }

    try {
      // Use the workshopDetailsService from constants
      const response = await workshopDetailsService.getWorkshopDetails(workshopId);
      
      console.log('Workshop details response in ticket confirmation:', JSON.stringify(response));
      
      if (response && response.isSuccess) {
        const workshopData = response.data;
        console.log('Workshop data extracted:', JSON.stringify(workshopData));
        
        // Set workshop information using the correct API response property names
        setWorkshopInfo({
          title: workshopData.workshopName || workshopName,
          date: formatDate(workshopData.startDate) || 'Đang cập nhật',
          location: workshopData.location || 'Đang cập nhật',
          price: workshopData.price || workshopPrice,
          imageUrl: workshopData.imageUrl || null,
          capacity: workshopData.capacity || 0,
          status: workshopData.status || 'Pending'
        });
        
        // Set the full workshop ID for later use
        setFullWorkshopId(workshopData.workshopId);
      } else {
        console.error('API response error:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching workshop details:', error);
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

  const verifyTokenAndUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // If no token exists, redirect to login
      if (!token) {
        console.log('No token found, redirecting to login');
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
        return false;
      }
      
      console.log('Đang xác thực token với endpoint current-user');
      
      // Sử dụng endpoint current-user trực tiếp giống như trong online_booking.jsx
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Account/current-user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Nếu có phản hồi, token hợp lệ
      if (response.data) {
        console.log('Token verification successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      
      // If error is 401/403, token is invalid
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Token invalid (401/403), clearing and redirecting to login');
        await AsyncStorage.removeItem('accessToken');
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
        return false;
      }
      
      // For other errors, we can just try to continue
      console.log('Other error during verification, continuing anyway');
      return true;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      // Clear previous user info first
      setCustomerName('');
      setPhoneNumber(''); 
      setEmail('');
      
      // Get current access token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found, redirecting to login');
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
        return;
      }
      
      console.log('Đang gọi API để lấy thông tin người dùng hiện tại');
      
      // Sử dụng endpoint current-user trực tiếp giống như trong online_booking.jsx
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Account/current-user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Current user API response:', JSON.stringify(response.data));
      
      // Xử lý dữ liệu trả về từ API
      if (response.data) {
        // Update the UI with user data - Trích xuất đúng dữ liệu như trong online_booking.jsx
        setCustomerName(response.data.fullName || response.data.userName || '');
        setPhoneNumber(response.data.phoneNumber || '');
        setEmail(response.data.email || '');
        
        console.log('User profile loaded successfully:', response.data.fullName);
      } else {
        console.error('Failed to get user data: No data returned');
        Alert.alert('Thông báo', 'Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Check for authentication errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Authentication error, redirecting to login');
        await AsyncStorage.removeItem('accessToken');
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
      } else {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#8B0000', '#550000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // Navigate back to workshopDetails with the correct workshop ID structure
            navigation.navigate('workshopDetails', {
              workshop: { 
                id: fullWorkshopId || workshopId 
              }
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
        style={{flex: 1}}
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
                      source={{ uri: workshopInfo.imageUrl }}
                      style={styles.workshopImage}
                    />
                  </View>
                  <View style={styles.workshopInfo}>
                    <Text style={styles.workshopTitle}>{workshopInfo.title}</Text>
                    
                    <View style={styles.workshopDetailRow}>
                      <Ionicons name="calendar" size={16} color="#8B0000" />
                      <Text style={styles.workshopDetailText}>{workshopInfo.date}</Text>
                    </View>
                    
                    <View style={styles.workshopDetailRow}>
                      <Ionicons name="location" size={16} color="#8B0000" />
                      <Text style={styles.workshopDetailText}>{workshopInfo.location}</Text>
                    </View>

                    <View style={styles.workshopDetailRow}>
                      <FontAwesome name="ticket" size={16} color="#8B0000" />
                      <Text style={styles.workshopDetailText}>{formatPrice(workshopInfo.price)}/vé</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Customer Information Form - Read Only */}
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Thông tin người đặt</Text>
                
                {/* Customer Name - Read Only */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Họ tên</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                    <Ionicons name="person-outline" size={20} color="#777" />
                    <TextInput
                      style={styles.input}
                      value={customerName}
                      editable={false}
                      placeholder="Họ tên của bạn"
                    />
                  </View>
                </View>

                {/* Phone Number - Read Only */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                    <Ionicons name="call-outline" size={20} color="#777" />
                    <TextInput
                      style={styles.input}
                      value={phoneNumber}
                      editable={false}
                      placeholder="Số điện thoại của bạn"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Email - Read Only */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.required}>*</Text>
                  </View>
                  <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                    <Ionicons name="mail-outline" size={20} color="#777" />
                    <TextInput
                      style={styles.input}
                      value={email}
                      editable={false}
                      placeholder="Địa chỉ email của bạn"
                      keyboardType="email-address"
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
    marginBottom: 6,
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
    marginLeft: 10,
    color: '#333',
  },
  ticketCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  idContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  idLabel: {
    fontSize: 13,
    color: '#777',
  },
  idValue: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    marginLeft: 8,
  },
  readOnlyInput: {
    backgroundColor: '#eaeaea',
    borderColor: '#cccccc',
  },
});