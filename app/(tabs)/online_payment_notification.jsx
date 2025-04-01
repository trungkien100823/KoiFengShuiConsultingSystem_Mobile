import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function OnlinePaymentNotificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingData = params?.bookingData ? JSON.parse(params.bookingData) : null;
  
  // Handle "Continue" button press
  const handleContinue = () => {
    // Navigate to home or another screen
    router.push('/(tabs)');
  };
  
  // Handle "Back" button press
  const handleBack = () => {
    // Go back to previous screen
    router.push('/(tabs)/consulting');
  };
  
  if (!bookingData) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{color: '#333', fontSize: 18}}>Không tìm thấy thông tin đặt lịch</Text>
        <TouchableOpacity 
          style={{marginTop: 20, padding: 10, backgroundColor: '#8B0000', borderRadius: 5}}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={{color: 'white'}}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Payment Success Message */}
      <View style={styles.confirmationHeader}>
        <Text style={styles.confirmationTitle}>Xác nhận thanh toán</Text>
        
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={50} color="#fff" />
        </View>
        
        <Text style={styles.successMessage}>
          Dịch vụ đã được thanh toán thành công
        </Text>
      </View>
      
      {/* Consultation Details */}
      <View style={styles.consultationDetails}>
        <Text style={styles.consultationTitle}>Lịch tư vấn</Text>
        
        {/* Consultant Info */}
        <View style={styles.consultantContainer}>
          <Image 
            source={bookingData.masterImage ? { uri: bookingData.masterImage } : require('../../assets/images/consultant1.jpg')} 
            style={styles.consultantImage}
          />
          <Text style={styles.consultantName}>{bookingData.masterName}</Text>
        </View>
      </View>
      
      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Tiếp tục</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Trở lại</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  confirmationHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 15,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  consultationDetails: {
    flex: 1,
    backgroundColor: '#8B0000',
    padding: 20,
  },
  consultationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  consultantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  consultantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  consultantName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  meetingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  meetingLinkText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  qrCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#8B0000',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
