import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { consultingAPI, consultants as fallbackConsultants } from '../../constants/consulting';

export default function OnlinePaymentNotificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Meeting link (would be dynamically generated in production)
  const meetingLink = "https://meet.google.com/nui-wqp-srj";
  
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConsultant = async () => {
    try {
      // In a real app, this would be the ID of the assigned consultant
      const consultantId = '1'; 
      const data = await consultingAPI.getConsultantById(consultantId);
      setConsultant(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching consultant:', err);
      // Fallback to sample data
      setConsultant(fallbackConsultants[0]);
      setLoading(false);
    }
  };

  // Sample appointment date/time - in production, this would be scheduled
  const appointmentDate = "15/3/2025";
  const appointmentTime = "10:00 - 12:00";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xác nhận thanh toán</Text>
      </View>

      {/* Success Message */}
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={50} color="#FFFFFF" />
        </View>
        <Text style={styles.successText}>Dịch vụ đã được thanh toán</Text>
        <Text style={styles.successText}>thành công</Text>
      </View>

      {/* Service Details Section */}
      <View style={styles.serviceSection}>
        <Text style={styles.sectionTitle}>Dịch vụ của bạn</Text>
        
        {/* Package Card */}
        <View style={styles.packageCard}>
          <Image
            source={params.packageImage || require('../../assets/images/koi_image.jpg')}
            style={styles.packageImage}
          />
          <View style={styles.packageOverlay}>
            <Text style={styles.packageLabel}>Gói tư vấn</Text>
            <Text style={styles.packageTitle}>{params.packageTitle || "CƠ BẢN"}</Text>
          </View>
        </View>
        
        {/* Appointment Info */}
        <Text style={styles.infoLabel}>Lịch tư vấn</Text>
        <View style={styles.appointmentRow}>
          <View style={styles.consultantInfo}>
            <Image source={consultant?.image} style={styles.consultantImage} />
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                <Ionicons name="time-outline" size={22} color="#8B0000" />
                <Text style={styles.dateTimeText}>{appointmentDate}</Text>
                <Text style={styles.dateTimeText}>{appointmentTime}</Text>
              </View>
              <View style={styles.consultantRow}>
                <Ionicons name="person-outline" size={22} color="#8B0000" />
                <Text style={styles.consultantName}>{consultant?.name}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Google Meet Link */}
        <View style={styles.meetSection}>
          <Image 
            source={require('../../assets/images/google_meet.png')} 
            style={styles.meetIcon} 
            resizeMode="contain"
          />
          <Text 
            style={styles.meetLink}
            onPress={() => Linking.openURL(meetingLink)}
          >
            {meetingLink}
          </Text>
        </View>
        
        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode
            value={meetingLink}
            size={150}
            backgroundColor="white"
            color="black"
          />
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.continueButtonText}>Tiếp tục</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/consulting')}
        >
          <Text style={styles.backButtonText}>Trở lại</Text>
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 26,
  },
  serviceSection: {
    backgroundColor: '#8B0000',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  packageCard: {
    height: 180,
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
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  appointmentRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  consultantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateTimeText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 5,
    marginRight: 10,
  },
  consultantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  meetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  meetIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  meetLink: {
    color: '#FFFFFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: '#8B0000',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
