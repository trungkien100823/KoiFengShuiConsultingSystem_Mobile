import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  SafeAreaView,
  Image,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentMethods } from '../../constants/consulting';

export default function OnlineCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#8B0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Bạn đã chọn dịch vụ tư vấn</Text>
        
        {/* Package Card */}
        <View style={styles.packageCard}>
          <Image
            source={params.packageImage}
            style={styles.packageImage}
          />
          <View style={styles.packageOverlay}>
            <Text style={styles.packageLabel}>{params.packageLabel}</Text>
            <Text style={styles.packageTitle}>{params.packageTitle}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
        <View style={styles.customerInfoCard}>
          <View style={styles.customerIconContainer}>
            <Ionicons name="person-outline" size={30} color="#8B0000" style={styles.customerIcon} />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>Nguyễn Thái Trung Kiên</Text>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="#666666" />
              <Text style={styles.contactText}>0943905969</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color="#666666" />
              <Text style={styles.contactText}>johnsmith@gmail.com</Text>
            </View>
          </View>
        </View>

        {/* Coupon Code */}
        <View style={styles.couponContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="Mã giảm giá"
            placeholderTextColor="#999999"
          />
          <TouchableOpacity style={styles.couponButton}>
            <Text style={styles.couponButtonText}>Sử dụng</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.paymentMethods}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPayment === method.id && styles.selectedPayment
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <Image source={method.image} style={styles.paymentIcon} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tổng tiền</Text>
            <Text style={styles.priceValue}>1.000.000 VND</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Chiết khấu</Text>
            <Text style={styles.priceValue}>1.000.000 VND</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tổng thanh toán</Text>
            <Text style={styles.priceValue}>1.000.000 VND</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.fixedFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalAmount}>1.000.000 VND</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/online_payment_notification',
              params: {
                packageId: params.packageId,
                packageTitle: params.packageTitle,
                packageLabel: params.packageLabel,
                packageImage: params.packageImage
              }
            });
          }}
        >
          <Text style={styles.checkoutButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    textAlign: 'center',
    marginRight: 30,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  packageCard: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  packageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  packageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  packageTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  customerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B0000',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  customerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  customerIcon: {
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  couponContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  couponButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethods: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paymentMethod: {
    width: 120,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginRight: 15,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPayment: {
    borderColor: '#8B0000',
    borderWidth: 2,
  },
  paymentIcon: {
    width: '90%',
    height: '90%',
  },
  priceSummary: {
    marginBottom: 100,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 5,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333333',
  },
  priceValue: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginTop: 10,
    marginVertical: 10,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8B0000',
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkoutButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 20,
  },
  checkoutButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
