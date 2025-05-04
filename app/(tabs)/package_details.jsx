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
  Alert,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');

export default function PackageDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [packageDetails, setPackageDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState(null);

  useEffect(() => {
    fetchPackageDetails();
  }, [params.packageId]);

  const fetchPackageDetails = async () => {
    try {
      if (packageDetails && packageDetails.consultationPackageId === params.packageId) {
        setIsLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/ConsultationPackage/get-by/${params.packageId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );


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
        
        if (params.selectedPrice) {
          setSelectedPrice(parseFloat(params.selectedPrice));
        }
      } else {
        throw new Error(response.data?.message || 'Không thể lấy thông tin gói tư vấn');
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
    // Automatically use the basic price
    const priceToUse = packageDetails.price;
    
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
                packageId: params.packageId,
                selectedPrice: priceToUse,
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
        <ImageBackground 
          source={require('../../assets/images/feng shui.png')} 
          style={styles.fullBackgroundImage}
          imageStyle={{opacity: 0.15}}
        >
          <ActivityIndicator size="large" color="#8B0000" />
        </ImageBackground>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0000" />
      <ImageBackground 
        source={require('../../assets/images/feng shui.png')} 
        style={styles.fullBackgroundImage}
        imageStyle={{opacity: 0.12}}
      >
        <LinearGradient
          colors={['rgba(26, 0, 0, 0.9)', 'rgba(36, 0, 0, 0.95)', 'rgba(12, 0, 0, 0.98)']}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/offline_package')}
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết gói tư vấn</Text>
          </View>

          {packageDetails ? (
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.heroSection}>
                <View style={styles.packageLabelContainer}>
                  <Text style={styles.packageLabel}>Gói tư vấn phong thủy</Text>
                </View>
                <Text style={styles.packageTitle}>{packageDetails.title}</Text>
                <View style={styles.decorativeLine} />
                <Text style={styles.packageDescription}>
                  {packageDetails.description}
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>Thông tin chi tiết</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="people" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Đối tượng</Text>
                    <Text style={styles.infoContent}>{packageDetails.suitableFor}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Thông tin cần cung cấp</Text>
                    <Text style={styles.infoContent}>{packageDetails.requiredInfo}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cash" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Chi tiết giá</Text>
                    <Text style={styles.infoContent}>{packageDetails.pricingDetails}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>Chi phí tư vấn</Text>
                </View>
                
                <View style={styles.singlePriceContainer}>
                  <View style={styles.priceIconContainer}>
                    <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.singlePriceContent}>
                    <Text style={styles.singlePriceValue}>
                      {packageDetails.price?.toLocaleString()} VNĐ
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={50} color="#FFFFFF" />
              <Text style={styles.errorText}>Không có thông tin gói tư vấn</Text>
            </View>
          )}
          
          <LinearGradient
            colors={['rgba(12, 0, 0, 0)', 'rgba(12, 0, 0, 0.9)', '#0C0000']}
            style={styles.buttonContainer}
          >
            <TouchableOpacity 
              style={styles.bookingButton}
              onPress={handleBooking}
            >
              <LinearGradient
                colors={['#8B0000', '#A52A2A']}
                style={styles.bookingButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.bookingButtonText}>Xác nhận đặt tư vấn</Text>
                <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0C0000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0C0000',
  },
  fullBackgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: width * 0.03,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.12,
  },
  heroSection: {
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
  },
  packageLabelContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.005,
    backgroundColor: 'rgba(139, 0, 0, 0.25)',
    borderRadius: 12,
    marginBottom: height * 0.01,
  },
  packageLabel: {
    fontSize: width * 0.035,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  packageTitle: {
    fontSize: width * 0.075,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: height * 0.02,
    letterSpacing: 0.5,
  },
  decorativeLine: {
    width: width * 0.2,
    height: 3,
    backgroundColor: '#8B0000',
    marginBottom: height * 0.02,
    borderRadius: 2,
  },
  packageDescription: {
    fontSize: width * 0.04,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: width * 0.06,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginTop: height * 0.025,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(139, 0, 0, 0.25)',
  },
  cardHeaderText: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.4)',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: height * 0.008,
  },
  infoContent: {
    fontSize: width * 0.038,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: width * 0.058,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: width * 0.05,
  },
  singlePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.05,
    backgroundColor: 'rgba(139, 0, 0, 0.15)',
    borderRadius: 15,
    margin: width * 0.05,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.3)',
  },
  priceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  singlePriceContent: {
    flex: 1,
  },
  singlePriceValue: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  singlePriceLabel: {
    fontSize: width * 0.038,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: width * 0.05,
    paddingBottom: Platform.OS === 'ios' ? height * 0.04 : height * 0.02,
    paddingTop: height * 0.05,
  },
  bookingButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.02,
  },
  bookingButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginRight: width * 0.02,
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    textAlign: 'center',
    marginTop: height * 0.02,
  },
}); 