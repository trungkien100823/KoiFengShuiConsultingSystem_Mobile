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
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Add scale function for responsive sizing
const scale = size => Math.round(width * size / 375);

// Add platform-specific constants
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? (IS_IPHONE_X ? 44 : 20) : StatusBar.currentHeight || 0;

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
        console.log('API Response:', response.data.data);
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
        <StatusBar style="light" translucent />
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="calendar" size={scale(45)} color={COLORS.accent} />
            <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: scale(20)}} />
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
      <ExpoStatusBar style="light" translucent />
      <LinearGradient
        colors={['rgba(14, 0, 0, 0.85)', 'rgba(14, 0, 0, 0.7)', 'rgba(14, 0, 0, 0.6)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Status Bar Spacer for Android */}
          {Platform.OS === 'android' && <View style={{ height: STATUS_BAR_HEIGHT }} />}
          
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
                <Ionicons name="arrow-back" size={scale(22)} color={COLORS.white} />
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

            {consultingPackages.map((pkg) => (
              <TouchableOpacity 
                key={pkg.consultationPackageId}
                style={styles.packageCard}
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: '/(tabs)/package_details',
                  params: { 
                    packageId: pkg.consultationPackageId,
                    packageTitle: pkg.packageName
                  }
                })}
              >
                <ImageBackground
                  source={pkg.imageUrl ? { uri: pkg.imageUrl } : require('../../assets/images/koi_image.jpg')}
                  style={styles.packageImage}
                  imageStyle={styles.packageImageStyle}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)']}
                    style={styles.packageOverlay}
                  >
                    <View style={styles.packageTagContainer}>
                      <Text style={styles.packageTag}>Gói tư vấn</Text>
                    </View>
                    
                    <View style={styles.packageContent}>
                      <Text style={styles.packageTitle}>{pkg.packageName}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
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
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? scale(10) : 20,
    paddingBottom: scale(15),
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: scale(15),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButtonGradient: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scale(22),
    color: COLORS.cream,
    fontWeight: '600',
  },
  headerDivider: {
    width: scale(100),
    height: 2,
    backgroundColor: COLORS.accent,
    marginTop: scale(6),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    paddingBottom: scale(30),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  titleDecoration: {
    width: 4,
    height: scale(20),
    backgroundColor: COLORS.accent,
    marginRight: scale(10),
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  packageCard: {
    width: '100%',
    height: scale(180),
    marginBottom: scale(20),
    borderRadius: scale(16),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  packageImageStyle: {
    borderRadius: scale(16),
  },
  packageOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: scale(16),
  },
  packageTagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderRadius: scale(12),
  },
  packageTag: {
    color: COLORS.black,
    fontSize: scale(12),
    fontWeight: '600',
  },
  packageContent: {
    width: '100%',
    marginBottom: scale(10),
  },
  packageTitle: {
    color: COLORS.white,
    fontSize: scale(24),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  logoContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.cream,
    fontSize: scale(16),
    marginTop: scale(20),
    fontWeight: '500',
    textAlign: 'center',
  },
});
