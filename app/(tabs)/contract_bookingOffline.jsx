import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const ContractBookingOffline = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [contractUrl, setContractUrl] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchContractData(params.id);
    }
  }, [params.id]);

  const fetchContractData = async (bookingId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Contract/by-bookingOffline/${bookingId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.isSuccess) {
        setContractUrl(response.data.data.contractUrl);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = () => {
    setIsModalVisible(true);
  };

  const handleConfirmOTP = () => {
    // Xử lý logic xác nhận OTP ở đây
    console.log('Confirming OTP:', otp);
    setIsModalVisible(false);
    setOtp('');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setOtp('');
  };

  const handleResendOTP = () => {
    // Xử lý logic gửi lại OTP
    console.log('Resending OTP...');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/your_booking')}
        >
          <Ionicons name="arrow-back" size={24} color="#8B0000" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Hợp đồng</Text>
        <Text style={styles.subtitle}>Xem chi tiết hợp đồng của bạn</Text>
      </View>

      {/* Contract Display Section */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.contractContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
            </View>
          ) : contractUrl ? (
            <>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: contractUrl }}
                  style={styles.contractImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.imageHint}>Vuốt để xem toàn bộ hợp đồng</Text>
            </>
          ) : (
            <View style={styles.noContractContainer}>
              <Ionicons name="document-outline" size={60} color="#666" />
              <Text style={styles.noContractText}>Không tìm thấy hợp đồng</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.signButton}
          onPress={handleSignContract}
        >
          <Ionicons name="pencil" size={20} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.signButtonText}>Ký hợp đồng</Text>
        </TouchableOpacity>
      </View>

      {/* OTP Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận ký hợp đồng</Text>
            <Text style={styles.modalSubtitle}>Nhập mã OTP</Text>
            
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Nhập mã OTP"
            />

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
            >
              <Text style={styles.resendText}>Gửi lại mã OTP</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmOTP}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B0000',
    marginLeft: 5,
  },
  titleSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  contractContainer: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    minHeight: windowHeight * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  contractImage: {
    width: windowWidth - 60,
    height: windowHeight * 0.6,
    borderRadius: 10,
  },
  imageHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  noContractContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noContractText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  signButton: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  signButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  resendButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  resendText: {
    color: '#8B0000',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#8B0000',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ContractBookingOffline; 