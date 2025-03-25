import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { paymentService } from '../../constants/paymentService';

const { width } = Dimensions.get('window');

export default function CoursePaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Log để debug
  console.log('Payment Screen Params:', params);

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VietQR');
  
  // User information
  const [userName, setUserName] = useState('Nguyễn Thái Trung Kiên');
  const [userPhone, setUserPhone] = useState('0943905969');
  const [userEmail, setUserEmail] = useState('johnsmith@gmail.com');
  const [couponCode, setCouponCode] = useState('');
  
  // Thêm state để xử lý loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Thêm state cho loading user info
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Thêm useEffect để gọi API lấy thông tin user khi component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Cập nhật hàm fetchCurrentUser
  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
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
        setUserName(response.data.fullName || response.data.userName || '');
        setUserPhone(response.data.phoneNumber || '');
        setUserEmail(response.data.email || '');
      } else {
        Alert.alert('Thông báo', 'Không thể lấy thông tin người dùng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
    } finally {
      setIsLoadingUser(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    // Log trước khi điều hướng
    console.log('CourseId when navigating back:', params.courseId);
    
    if (!params.courseId) {
      console.log('Warning: courseId is undefined');
      router.push('/(tabs)/courses'); // Fallback về courses nếu không có courseId
      return;
    }

    router.replace({
      pathname: '/(tabs)/course_details',
      params: { 
        courseId: params.courseId,
        source: 'payment'
      }
    });
  };
  
  // Format price as VND
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('vi-VN');
  };
  
  // Cập nhật hàm handlePayment
  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('/login');
        return;
      }

      console.log('Bắt đầu xử lý thanh toán khóa học:', {
        courseId: params.courseId,
        courseTitle: params.courseTitle,
        coursePrice: params.coursePrice
      });

      // Sử dụng paymentService để xử lý thanh toán
      const result = await paymentService.processPayment({
        navigation: router,
        serviceId: params.courseId,
        serviceType: paymentService.SERVICE_TYPES.COURSE,
        serviceInfo: {
          title: params.courseTitle,
          price: params.coursePrice,
          customerName: userName,
          phoneNumber: userPhone,
          email: userEmail
        },
        onError: (error) => {
          console.error('Lỗi thanh toán:', error);
          Alert.alert(
            'Lỗi thanh toán',
            error.message || 'Không thể kết nối đến cổng thanh toán. Vui lòng thử lại.',
            [
              {
                text: 'Thử lại',
                onPress: () => handlePayment()
              }
            ],
            { cancelable: false }
          );
        }
      });

      if (result.success) {
        const { paymentUrl, orderId } = result;
        console.log('Payment URL:', paymentUrl);
        console.log('Order ID:', orderId);

        router.push({
          pathname: '/(tabs)/payment_webview',
          params: {
            paymentUrl: encodeURIComponent(paymentUrl),
            orderId: orderId,
            returnScreen: 'courses'
          }
        });
      } else {
        Alert.alert(
          'Thông báo',
          result.message || 'Không thể tạo liên kết thanh toán.',
          [
            {
              text: 'Thử lại',
              onPress: () => handlePayment()
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
            onPress: () => handlePayment()
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
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>
      
      <View style={styles.mainContainer}>
        <ScrollView style={styles.content}>
          {/* Course Registration Title */}
          <Text style={styles.registrationTitle}>Khóa học bạn đã đăng ký</Text>
          
          {/* Course Card - Using exact styles from courses_list.jsx */}
          <View style={styles.courseCardWrapper}>
            <View style={styles.courseCardContainer}>
              <View style={styles.courseCard}>
                <Image 
                  source={params.courseImage ? { uri: params.courseImage } : require('../../assets/images/koi_image.jpg')} 
                  style={styles.courseImage} 
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.courseTitle}>
                    {params.courseTitle || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học'}
                  </Text>
                  <Text style={styles.price}>
                    {formatPrice(params.coursePrice)} đ
                  </Text>
                </View>
              </View>
              <Image 
                source={require('../../assets/images/f2.png')} 
                style={styles.fengShuiLogo}
              />
            </View>
          </View>
          
          {/* Customer Information Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.customerCard}>
              {isLoadingUser ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#8B0000" />
                  <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.customerAvatarContainer}>
                    <Ionicons name="person-circle" size={40} color="#8B0000" />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{userName}</Text>
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={14} color="#666" />
                      <Text style={styles.contactText}>{userPhone}</Text>
                    </View>
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={14} color="#666" />
                      <Text style={styles.contactText}>{userEmail}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
        
        <View style={styles.checkoutContainer}>
          <View style={styles.checkoutTotal}>
            <Text style={styles.checkoutTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.checkoutTotalValue}>{formatPrice(params.coursePrice)} VND</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.checkoutButton,
              isLoading && { opacity: 0.7 }  // Thêm effect khi loading
            ]}
            onPress={handlePayment}
            disabled={isLoading}
          >
            <Text style={styles.checkoutButtonText}>
              {isLoading ? 'Đang xử lý...' : 'Thanh toán'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  mainContainer: {
    flex: 1, 
    position: 'relative', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
  },
  registrationTitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '500',
  },
  courseCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  courseCardContainer: {
    position: 'relative',
    marginBottom: 40,
    paddingLeft: 8,
  },
  courseCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(139,0,0,0.6)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'flex-end',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    marginLeft: 8,
  },
  price: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  fengShuiLogo: {
    position: 'absolute',
    left: -5,
    bottom: -35,
    width: 100,
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
  
  // New styles for updated sections
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8B0000',
    marginBottom: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B0000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  customerAvatarContainer: {
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  checkoutTotal: {
    flex: 1,
  },
  checkoutTotalLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  checkoutTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30
  },
  checkoutButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 30
  },
  checkoutButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
});
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   TextInput,
//   Dimensions,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { API_CONFIG } from '../../constants/config';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { paymentService } from '../../constants/paymentService';

// const { width } = Dimensions.get('window');

// export default function CoursePaymentScreen() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
  
//   // Log để debug
//   console.log('Payment Screen Params:', params);

//   // Payment method state
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VietQR');
  
//   // User information
//   const [userName, setUserName] = useState('');
//   const [userPhone, setUserPhone] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const [couponCode, setCouponCode] = useState('');
  
//   // Thêm state để xử lý loading
//   const [isLoading, setIsLoading] = useState(false);
  
//   // Thêm state cho loading user info
//   const [isLoadingUser, setIsLoadingUser] = useState(true);

//   useEffect(() => {
//     fetchCurrentUser();
//   }, []);

//   const fetchCurrentUser = async () => {
//     try {
//       const token = await AsyncStorage.getItem('accessToken');
      
//       if (!token) {
//         Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
//         router.push('login');
//         return;
//       }

//       const response = await axios.get(
//         `${API_CONFIG.baseURL}/api/Account/current-user`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );

//       if (response.data) {
//         setUserName(response.data.fullName || response.data.userName || '');
//         setUserPhone(response.data.phoneNumber || '');
//         setUserEmail(response.data.email || '');
//       }
//     } catch (error) {
//       console.error('Lỗi khi lấy thông tin người dùng:', error);
//       Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
//     } finally {
//       setIsLoadingUser(false);
//     }
//   };
  
//   const handleBack = () => {
//     router.replace({
//       pathname: '/(tabs)/course_details',
//       params: { 
//         courseId: params.courseId,
//         source: 'payment'
//       }
//     });
//   };
  
//   const formatPrice = (price) => {
//     return parseFloat(price).toLocaleString('vi-VN');
//   };
  
//   // Modified handlePayment for testing
//   const handlePayment = async () => {
//     try {
//       setIsLoading(true);
      
//       // Simulate payment processing
//       await new Promise(resolve => setTimeout(resolve, 1500));

//       // Simulate successful payment
//       Alert.alert(
//         'Thanh toán thành công',
//         'Bạn đã mua khóa học thành công!',
//         [
//           {
//             text: 'Xem khóa học',
//             onPress: () => {
//               // Navigate to my courses or learning screen
//               router.push('/(tabs)/course_chapter');
//             }
//           }
//         ],
//         { cancelable: false }
//       );

//     } catch (error) {
//       console.error('Lỗi xử lý thanh toán:', error);
//       Alert.alert(
//         'Lỗi',
//         'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.',
//         [{ text: 'OK' }]
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           onPress={handleBack}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Thanh toán</Text>
//       </View>
      
//       <View style={styles.mainContainer}>
//         <ScrollView style={styles.content}>
//           {/* Course Registration Title */}
//           <Text style={styles.registrationTitle}>Khóa học bạn đã đăng ký</Text>
          
//           {/* Course Card - Using exact styles from courses_list.jsx */}
//           <View style={styles.courseCardWrapper}>
//             <View style={styles.courseCardContainer}>
//               <View style={styles.courseCard}>
//                 <Image 
//                   source={params.courseImage ? { uri: params.courseImage } : require('../../assets/images/koi_image.jpg')} 
//                   style={styles.courseImage} 
//                 />
//                 <View style={styles.cardOverlay}>
//                   <Text style={styles.courseTitle}>
//                     {params.courseTitle || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học'}
//                   </Text>
//                   <Text style={styles.price}>
//                     {formatPrice(params.coursePrice)} đ
//                   </Text>
//                 </View>
//               </View>
//               <Image 
//                 source={require('../../assets/images/f2.png')} 
//                 style={styles.fengShuiLogo}
//               />
//             </View>
//           </View>
          
//           {/* Customer Information Section */}
//           <View style={styles.infoSection}>
//             <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
//             <View style={styles.customerCard}>
//               {isLoadingUser ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator color="#8B0000" />
//                   <Text style={styles.loadingText}>Đang tải thông tin...</Text>
//                 </View>
//               ) : (
//                 <>
//                   <View style={styles.customerAvatarContainer}>
//                     <Ionicons name="person-circle" size={40} color="#8B0000" />
//                   </View>
//                   <View style={styles.customerDetails}>
//                     <Text style={styles.customerName}>{userName}</Text>
//                     <View style={styles.contactRow}>
//                       <Ionicons name="call-outline" size={14} color="#666" />
//                       <Text style={styles.contactText}>{userPhone}</Text>
//                     </View>
//                     <View style={styles.contactRow}>
//                       <Ionicons name="mail-outline" size={14} color="#666" />
//                       <Text style={styles.contactText}>{userEmail}</Text>
//                     </View>
//                   </View>
//                 </>
//               )}
//             </View>
//           </View>
//           <View style={{ height: 80 }} />
//         </ScrollView>
        
//         <View style={styles.checkoutContainer}>
//           <View style={styles.checkoutTotal}>
//             <Text style={styles.checkoutTotalLabel}>Tổng thanh toán</Text>
//             <Text style={styles.checkoutTotalValue}>{formatPrice(params.coursePrice)} VND</Text>
//           </View>
//           <TouchableOpacity 
//             style={[
//               styles.checkoutButton,
//               isLoading && { opacity: 0.7 }  // Thêm effect khi loading
//             ]}
//             onPress={handlePayment}
//             disabled={isLoading}
//           >
//             <Text style={styles.checkoutButtonText}>
//               {isLoading ? 'Đang xử lý...' : 'Thanh toán'}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFF',
//   },
//   mainContainer: {
//     flex: 1, 
//     position: 'relative', 
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     backgroundColor: '#FFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#8B0000',
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#8B0000',
//     textAlign: 'center',
//     marginRight: 40,
//   },
//   content: {
//     flex: 1,
//   },
//   registrationTitle: {
//     fontSize: 16,
//     color: '#333',
//     textAlign: 'center',
//     marginVertical: 16,
//     fontWeight: '500',
//   },
//   courseCardWrapper: {
//     paddingHorizontal: 16,
//     marginBottom: 20,
//   },
//   courseCardContainer: {
//     position: 'relative',
//     marginBottom: 40,
//     paddingLeft: 8,
//   },
//   courseCard: {
//     backgroundColor: '#000',
//     borderRadius: 12,
//     overflow: 'hidden',
//     position: 'relative',
//     aspectRatio: 1,
//   },
//   courseImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   cardOverlay: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     padding: 20,
//     backgroundColor: 'rgba(139,0,0,0.6)',
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//     alignItems: 'flex-end',
//   },
//   courseTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 8,
//     textAlign: 'right',
//     marginLeft: 8,
//   },
//   price: {
//     fontSize: 30,
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'right',
//   },
//   fengShuiLogo: {
//     position: 'absolute',
//     left: -5,
//     bottom: -35,
//     width: 100,
//     height: 100,
//     resizeMode: 'contain',
//     zIndex: 1,
//   },
  
//   // New styles for updated sections
//   infoSection: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     color: '#8B0000',
//     marginBottom: 16,
//   },
//   customerCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#8B0000',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//   },
//   customerAvatarContainer: {
//     marginRight: 12,
//   },
//   customerDetails: {
//     flex: 1,
//   },
//   customerName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   contactRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   contactText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 6,
//   },
//   checkoutContainer: {
//     position: 'absolute',
//     bottom: -40,
//     left: 0,
//     right: 0,
//     height: 120,
//     backgroundColor: '#8B0000',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center'
//   },
//   checkoutTotal: {
//     flex: 1,
//   },
//   checkoutTotalLabel: {
//     fontSize: 14,
//     color: '#FFF',
//   },
//   checkoutTotalValue: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#FFF',
//     marginBottom: 30
//   },
//   checkoutButton: {
//     backgroundColor: '#FFF',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 24,
//     marginBottom: 30
//   },
//   checkoutButtonText: {
//     color: '#8B0000',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 8,
//     color: '#666',
//     fontSize: 14,
//   },
// });
