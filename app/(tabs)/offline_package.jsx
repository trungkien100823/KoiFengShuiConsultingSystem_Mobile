import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Refined color palette for elegance
const COLORS = {
  primary: '#8B0000', // Deep wine red
  primaryLight: '#C1272D', // Lighter wine red for accents
  primaryDark: '#4D0003', // Very dark red for depth
  accent: '#D4AF37', // Gold accent color
  white: '#FFFFFF',
  cream: '#FFF8E1', // Warm cream for text on dark backgrounds
  black: '#1A1A1A',
  darkGray: '#333333',
  mediumGray: '#888888',
  lightGray: '#CCCCCC',
  background: '#0E0000', // Very dark background
  transparentDark: 'rgba(14, 0, 0, 0.92)',
  overlay: 'rgba(14, 0, 0, 0.75)',
  cardOverlay: 'rgba(14, 0, 0, 0.4)',
};

export default function OfflinePackageScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [consultingPackages, setConsultingPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConsultingPackages();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Màn hình Offline Package được focus - Tải lại dữ liệu');
      fetchConsultingPackages();
    });

    return unsubscribe;
  }, [navigation]);

  const retryRequest = async (fn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const fetchConsultingPackages = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      if (!API_CONFIG.endpoints.getAllConsultationPackages) {
        throw new Error('API endpoint không được định nghĩa');
      }

      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getAllConsultationPackages}`;
      await new Promise(resolve => setTimeout(resolve, 500));

      const makeRequest = async () => {
        return await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      };

      const response = await retryRequest(makeRequest);

      if (response.data && response.data.isSuccess) {
        setConsultingPackages(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Không thể lấy danh sách gói tư vấn');
      }
    } catch (error) {
      let errorMessage = 'Không thể tải danh sách gói tư vấn. Vui lòng thử lại sau.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Thông báo', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="calendar" size={width * 0.12} color={COLORS.accent} />
            <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: height * 0.03}} />
          </View>
          <Text style={styles.loadingText}>Đang tải gói tư vấn...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['rgba(14, 0, 0, 0.85)', 'rgba(14, 0, 0, 0.7)', 'rgba(14, 0, 0, 0.6)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/offline_booking')}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={width * 0.055} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Đặt lịch tư vấn trực tiếp</Text>
              <View style={styles.headerDivider} />
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionTitleContainer}>
              <View style={styles.titleDecoration} />
              <Text style={styles.sectionTitle}>Các gói tư vấn phong thủy</Text>
            </View>

            <View style={styles.packageGrid}>
              {consultingPackages.map((pkg, index) => (
                <TouchableOpacity 
                  key={pkg.consultationPackageId}
                  style={styles.packageCard}
                  onPress={() => router.push({
                    pathname: '/(tabs)/package_details',
                    params: { 
                      packageId: pkg.consultationPackageId,
                      packageTitle: pkg.packageName
                    }
                  })}
                  activeOpacity={0.92}
                >
                  <ImageBackground
                    source={require('../../assets/images/koi_image.jpg')}
                    style={styles.packageImage}
                    imageStyle={styles.packageImageStyle}
                  >
                    <LinearGradient
                      colors={['rgba(14, 0, 0, 0)', 'rgba(14, 0, 0, 0.7)', 'rgba(14, 0, 0, 0.9)']}
                      style={styles.packageOverlay}
                    >
                      <View style={styles.packageHeader}>
                        <View style={styles.packageTagContainer}>
                          <Text style={styles.packageTag}>Phong thủy</Text>
                        </View>
                        
                        <View style={styles.detailsButtonContainer}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.detailsButton}
                          >
                            <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                          </LinearGradient>
                        </View>
                      </View>
                      
                      <View style={styles.packageContent}>
                        <View style={styles.packageTitleContainer}>
                          <Text style={styles.packageTitle}>{pkg.packageName}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    opacity: 0.4,
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? height * 0.05 : height * 0.03,
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: width * 0.03,
  },
  backButtonGradient: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: width * 0.055,
    color: COLORS.cream,
    fontWeight: '600',
  },
  headerDivider: {
    width: width * 0.3,
    height: 2,
    backgroundColor: COLORS.accent,
    marginTop: height * 0.01,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.08,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  titleDecoration: {
    width: 4,
    height: height * 0.03,
    backgroundColor: COLORS.accent,
    marginRight: width * 0.02,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  packageGrid: {
    width: '100%',
  },
  packageCard: {
    width: '100%',
    height: height * 0.4,
    marginBottom: height * 0.03,
    borderRadius: width * 0.04,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  packageImageStyle: {
    borderRadius: width * 0.04,
  },
  packageOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: width * 0.04,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  packageTagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
    paddingVertical: height * 0.006,
    paddingHorizontal: width * 0.025,
    borderRadius: width * 0.03,
  },
  packageTag: {
    color: COLORS.black,
    fontSize: width * 0.032,
    fontWeight: '600',
  },
  packageContent: {
    width: '100%',
  },
  packageTitleContainer: {
    marginBottom: height * 0.01,
  },
  packageTitle: {
    color: COLORS.white,
    fontSize: width * 0.1,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  detailsButtonContainer: {
    alignSelf: 'flex-start',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.035,
    borderRadius: width * 0.06,
  },
  detailsButtonText: {
    color: COLORS.white,
    fontSize: width * 0.032,
    fontWeight: '600',
    marginRight: width * 0.01,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.cream,
    fontSize: width * 0.045,
    marginTop: height * 0.03,
    fontWeight: '500',
    textAlign: 'center',
  },
});
