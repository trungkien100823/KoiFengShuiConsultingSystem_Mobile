import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

const { width } = Dimensions.get('window');

export default function PackageDetailsScreen() {
  const router = useRouter();
  const { packageId } = useLocalSearchParams();
  const [packageDetails, setPackageDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState(null);

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/ConsultationPackage/get-by/${packageId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        }
      );

      console.log('Package details response:', response.data);

      if (response.data && response.data.isSuccess) {
        setPackageDetails({
          consultationPackageId: response.data.data.consultationPackageId,
          title: response.data.data.packageName,
          price: response.data.data.minPrice,
          maxPrice: response.data.data.maxPrice,
          description: response.data.data.description,
          suitableFor: response.data.data.suitableFor,
          requiredInfo: response.data.data.requiredInfo,
          pricingDetails: response.data.data.pricingDetails
        });
      } else {
        throw new Error(response.data.message || 'Không thể lấy thông tin gói tư vấn');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin gói tư vấn:', error);
      
      if (error.response?.status === 404) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin gói tư vấn');
      } else {
        Alert.alert('Lỗi', 'Không thể lấy thông tin gói tư vấn. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = () => {
    if (!selectedPrice) {
      Alert.alert('Thông báo', 'Vui lòng chọn mức giá');
      return;
    }

    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn đặt gói tư vấn này?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đồng ý',
          onPress: () => {
            router.push({
              pathname: '/(tabs)/offline_booking',
              params: { 
                packageId: packageId,
                selectedPrice: selectedPrice,
                shouldCompleteBooking: true
              }
            });
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/offline_package')}
          >
            <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offline Booking{'\n'}Confirmation</Text>
        </View>

        {packageDetails ? (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.packageHeader}>
              <Text style={styles.packageLabel}>Gói tư vấn</Text>
              <Text style={styles.packageTitle}>{packageDetails.title}</Text>
              <Text style={styles.packageDescription}>
                {packageDetails.description}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={24} color="#FFFFFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Đối tượng</Text>
                  <Text style={styles.infoContent}>{packageDetails.suitableFor}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Thông tin cần cung cấp</Text>
                  <Text style={styles.infoContent}>{packageDetails.requiredInfo}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Chi tiết giá</Text>
                  <Text style={styles.infoContent}>{packageDetails.pricingDetails}</Text>
                </View>
              </View>
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>CHI PHÍ</Text>
              
              <TouchableOpacity 
                style={[
                  styles.priceOption,
                  selectedPrice === packageDetails.price && styles.priceOptionSelected
                ]}
                onPress={() => setSelectedPrice(packageDetails.price)}
              >
                <View style={styles.radioButton}>
                  {selectedPrice === packageDetails.price && <View style={styles.radioButtonSelected} />}
                </View>
                <View style={styles.priceOptionContent}>
                  <Text style={styles.priceOptionValue}>{packageDetails.price?.toLocaleString()} VNĐ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.priceOption,
                  selectedPrice === packageDetails.maxPrice && styles.priceOptionSelected
                ]}
                onPress={() => setSelectedPrice(packageDetails.maxPrice)}
              >
                <View style={styles.radioButton}>
                  {selectedPrice === packageDetails.maxPrice && <View style={styles.radioButtonSelected} />}
                </View>
                <View style={styles.priceOptionContent}>
                  <Text style={styles.priceOptionValue}>{packageDetails.maxPrice?.toLocaleString()} VNĐ</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.bookingButton}
              onPress={handleBooking}
            >
              <Text style={styles.bookingButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Không có thông tin gói tư vấn</Text>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0000',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  backgroundImage: {
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  packageHeader: {
    padding: 20,
  },
  packageLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  packageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4B2B',
    marginVertical: 10,
  },
  packageDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  infoSection: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  infoContent: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 24,
  },
  priceSection: {
    padding: 20,
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priceOptionSelected: {
    borderColor: '#FF4B2B',
    backgroundColor: 'rgba(255, 75, 43, 0.1)',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF4B2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4B2B',
  },
  priceOptionContent: {
    flex: 1,
  },
  priceOptionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  bookingButton: {
    backgroundColor: '#FF4B2B',
    margin: 20,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
}); 