import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function CoursePaymentScreen() {
  const router = useRouter();
  const { courseId, courseTitle, coursePrice, courseImage } = useLocalSearchParams();
  
  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('VietQR');
  
  // User information
  const [userName, setUserName] = useState('Nguyễn Thái Trung Kiên');
  const [userPhone, setUserPhone] = useState('0943905969');
  const [userEmail, setUserEmail] = useState('johnsmith@gmail.com');
  const [couponCode, setCouponCode] = useState('');
  
  // Handle back navigation
  const handleBackNavigation = () => {
    router.push("/(tabs)/course_details");
  };
  
  // Format price as VND
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString('vi-VN');
  };
  
  // Inside CoursePaymentScreen component, add the navigation handler:
  const handlePayment = () => {
    router.push({
      pathname: '/(tabs)/course_payment_success',
      params: {
        courseId: courseId,
        courseTitle: courseTitle,
        courseImage: courseImage
      }
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
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
                  source={courseImage ? { uri: courseImage } : require('../../assets/images/koi_image.jpg')} 
                  style={styles.courseImage} 
                />
                <View style={styles.cardOverlay}>
                  <Text style={styles.courseTitle}>
                    {courseTitle || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học'}
                  </Text>
                  <Text style={styles.price}>
                    {formatPrice(coursePrice || 2400000)} đ
                  </Text>
                </View>
              </View>
              <Image 
                source={require('../../assets/images/f2.png')} 
                style={styles.fengShuiLogo}
              />
            </View>
          </View>
          
          {/* Customer Information - Updated */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.customerCard}>
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
            </View>
            
            {/* Coupon Code Input */}
            <View style={styles.couponContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
              />
              <TouchableOpacity style={styles.couponButton}>
                <Text style={styles.couponButtonText}>Sử dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Payment Methods - Updated */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.paymentMethodsContainer}>
              <TouchableOpacity 
                style={[
                  styles.paymentOption, 
                  selectedPaymentMethod === 'VietQR' && styles.selectedPayment
                ]}
                onPress={() => setSelectedPaymentMethod('VietQR')}
              >
                <Image 
                  source={require('../../assets/images/VietQR.png')} 
                  style={styles.paymentLogo} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.paymentOption, 
                  selectedPaymentMethod === 'PayOS' && styles.selectedPayment
                ]}
                onPress={() => setSelectedPaymentMethod('PayOS')}
              >
                <Image 
                  source={require('../../assets/images/PayOS.png')} 
                  style={styles.paymentLogo} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Order Summary - Updated */}
          <View style={styles.infoSection}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Tổng tiền</Text>
              <Text style={styles.orderValue}>{formatPrice(coursePrice || 2400000)} VND</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Chiết khấu</Text>
              <Text style={styles.orderValue}>0 VND</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.orderRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>{formatPrice(coursePrice || 2400000)} VND</Text>
            </View>
          </View>
          
          {/* Add padding at bottom to ensure content doesn't get hidden behind checkout container */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Payment Button - Updated to fill width */}
        <View style={styles.checkoutContainer}>
          <View style={styles.checkoutTotal}>
            <Text style={styles.checkoutTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.checkoutTotalValue}>{formatPrice(coursePrice || 2400000)} VND</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={handlePayment}
          >
            <Text style={styles.checkoutButtonText}>Thanh toán</Text>
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
    flex: 1, // This ensures the main container takes up all available space
    position: 'relative', // This is needed for the absolute positioning of the checkout container
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
    marginBottom: 40, // Space for the feng shui logo
  },
  courseCardContainer: {
    position: 'relative',
    marginBottom: 60,
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
    bottom: -45,
    width: 100,
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
  
  // New styles for updated sections
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  couponContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  couponButton: {
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  couponButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  paymentOption: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
  },
  selectedPayment: {
    borderColor: '#8B0000',
    borderWidth: 2,
  },
  paymentLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 16,
    color: '#333',
  },
  orderValue: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
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
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
  }
});
