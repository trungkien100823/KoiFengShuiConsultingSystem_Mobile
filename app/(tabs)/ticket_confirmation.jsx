import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Alert, ActivityIndicator } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { ticketService } from '../../constants/ticketCreate';
import { paymentService } from '../../constants/paymentService';

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
        serviceId: groupId,  // GroupId từ ticket creation
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
      
      if (!result.success) {
        // Xử lý khi có lỗi nhưng không được bắt bởi onError
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ticket confirmation</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#AE1D1D" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <Text style={styles.eventTitle}>{workshopInfo.title}</Text>
              
              <View style={styles.eventInfoContainer}>
                <View style={styles.eventInfoItem}>
                  <MaterialIcons name="date-range" size={14} color="#AE1D1D" />
                  <Text style={styles.eventInfoText}>Date: {workshopInfo.date}</Text>
                </View>
                
                <View style={styles.eventInfoItem}>
                  <Ionicons name="location" size={14} color="#AE1D1D" />
                  <Text style={styles.eventInfoText}>{workshopInfo.location}</Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Customer<Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="John Smith"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone number<Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="0123456789"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                      {phoneNumber.length === 10 && (
                        <Ionicons name="checkmark" size={20} color="#4CAF50" />
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email<Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="johnsmith@gmail.com"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>No. Of Tickets</Text>
                  <View style={styles.ticketCounterContainer}>
                    <View style={styles.ticketInputContainer}>
                      <TextInput
                        style={styles.ticketInput}
                        value={ticketCount.toString()}
                        editable={false}
                      />
                    </View>
                    <View style={styles.ticketButtons}>
                      <TouchableOpacity onPress={decreaseTickets} style={styles.ticketButton}>
                        <AntDesign name="minus" size={16} color="black" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={increaseTickets} style={styles.ticketButton}>
                        <AntDesign name="plus" size={16} color="black" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonWrapper} onPress={handleContinue} disabled={isLoading}>
          <LinearGradient
            colors={['#AE1D1D', '#212121']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonWrapper} 
          onPress={() => navigation.navigate('workshopDetails')}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#AE1D1D', '#212121']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  eventInfoContainer: {
    marginBottom: 16,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventInfoText: {
    marginLeft: 8,
    fontSize: 13,
  },
  formContainer: {
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    width: '30%',
  },
  required: {
    color: '#AE1D1D',
  },
  inputContainer: {
    width: '65%',
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#AE1D1D',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  
  ticketCounterContainer: {
    width: '65%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketInputContainer: {
    marginRight: 10,
    width: 50,
    height: 40,
  },
  ticketButtons: {
    flexDirection: 'row',
  },
  ticketButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    height: 45,
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
    fontSize: 16,
  },
  ticketInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#AE1D1D',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#AE1D1D',
  },
});