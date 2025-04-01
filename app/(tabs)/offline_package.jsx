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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { useNavigation } from '@react-navigation/native';

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
      console.log('Calling API URL:', url);
      console.log('Token:', token);

      const response = await axios.get(
        url,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000, // Tăng timeout lên 30 giây
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Chấp nhận status code từ 200-499
          }
        }
      );

      // Log response để debug
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      console.log('API Response Data:', response.data);

      if (response.data && response.data.isSuccess) {
        setConsultingPackages(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Không thể lấy danh sách gói tư vấn');
      }
    } catch (error) {
      console.error('Chi tiết lỗi:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request,
        config: error.config
      });

      if (error.code === 'ECONNABORTED') {
        Alert.alert('Lỗi', 'Kết nối tới server quá lâu, vui lòng thử lại sau');
      } else if (error.code === 'ERR_NETWORK') {
        Alert.alert(
          'Lỗi Kết Nối',
          'Không thể kết nối đến server. Vui lòng kiểm tra:\n' +
          '- Kết nối mạng\n' +
          '- Server có đang chạy không\n' +
          '- IP của server có đúng không',
          [
            {
              text: 'Thử lại',
              onPress: () => fetchConsultingPackages()
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else if (error.response) {
        // Có response từ server nhưng status code không hợp lệ
        Alert.alert('Lỗi', `Lỗi từ server: ${error.response.status}`);
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách gói tư vấn. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
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
        <View style={styles.fixedHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/offline_booking')}
          >
            <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt lịch tư vấn{'\n'}trực tiếp</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Các gói tư vấn phong thủy</Text>

          {consultingPackages.map((pkg) => (
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
            >
              <ImageBackground
                source={require('../../assets/images/koi_image.jpg')}
                style={styles.packageImage}
                imageStyle={styles.packageImageStyle}
              >
                <View style={styles.packageContent}>
                  <Text style={styles.packageLabel}>Gói tư vấn</Text>
                  <Text style={styles.packageTitle}>{pkg.packageName}</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
  scrollView: {
    flex: 1,
    marginTop: 120,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
    backgroundColor: 'rgba(26, 0, 0, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
    lineHeight: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  packageCard: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  packageImageStyle: {
    borderRadius: 10,
  },
  packageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  packageLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 4,
  },
  packageTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0000',
  },
});
