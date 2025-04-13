import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { authAPI } from '../../constants/auth';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import { getAuthToken } from '../../services/authService';

const elementColors = {
  Hỏa: '#FF4500',
  Kim: '#C0C0C0', 
  Thủy: '#006994',
  Mộc: '#228B22',
  Thổ: '#DEB887',
};

export default function UserInfo() {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      console.log('UserInfo screen focused - loading fresh data');
      loadUserInfo();
      return () => {};
    }, [])
  );

  useEffect(() => {
    const checkForUpdates = async () => {
      const profileUpdated = await AsyncStorage.getItem('profileUpdated');
      if (profileUpdated === 'true') {
        console.log('Profile was updated, refreshing user info');
        loadUserInfo();
      }
    };
    
    checkForUpdates();
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token found, cannot load user info');
        setUserInfo(null);
        setLoading(false);
        return;
      }
      
      const timestamp = new Date().getTime();
      console.log('Fetching user data from correct endpoint');
      
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Account/current-user?_t=${timestamp}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      console.log('User data response:', response.data);
      
      if (response.data) {
        const userData = response.data;
        
        const mappedUserInfo = {
          fullName: userData.fullName || userData.userName,
          dob: userData.dob || '2000-01-01',
          gender: userData.gender === true || userData.gender === 1 || userData.gender === "true" || userData.gender === "1",
          element: determineElementFromDob(userData.dob) || 'Hỏa',
          lifePalace: determineLifePalaceFromDob(userData.dob, userData.gender) || 'Unknown'
        };
        
        setUserInfo(mappedUserInfo);
        console.log('Mapped user info:', mappedUserInfo);
      } else {
        setUserInfo(null);
        console.warn('Unexpected response format:', response.data);
      }
      
      await AsyncStorage.removeItem('profileUpdated');
      
    } catch (error) {
      console.error('Error loading user info:', error);
      console.error('Error details:', error.response?.data);
      setUserInfo(null);
      
      setTimeout(() => {
        Alert.alert(
          'Lỗi',
          'Không thể tải thông tin người dùng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const elementColor = userInfo ? elementColors[userInfo.element] || '#FF4500' : '#FF4500';

  // Helper function to determine element based on year of birth
  // This is a simplified placeholder - replace with actual feng shui logic if available
  const determineElementFromDob = (dob) => {
    if (!dob) return 'Hỏa';
    
    const year = new Date(dob).getFullYear();
    const elements = ['Kim', 'Thủy', 'Hỏa', 'Thổ', 'Mộc'];
    
    // Very simplified element determination - replace with actual logic
    return elements[year % 5];
  };

  // Helper function to determine life palace
  // This is a simplified placeholder - replace with actual feng shui logic if available
  const determineLifePalaceFromDob = (dob, gender) => {
    if (!dob) return 'Unknown';
    
    const year = new Date(dob).getFullYear();
    const palaces = ['Khảm', 'Ly', 'Cấn', 'Đoài', 'Càn', 'Khôn', 'Chấn', 'Tốn'];
    
    // Very simplified life palace determination - replace with actual logic
    const index = (year + (gender ? 1 : 0)) % 8;
    return palaces[index];
  };

  return (
    <ImageBackground
      source={require('../../assets/images/feng shui.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Thông tin của bạn</Text>
          
          <View style={styles.elementSection}>
            <Text style={styles.elementLabel}>Ngũ hành của bạn là</Text>
            <Text style={[styles.elementText, { color: elementColor }]}>
              {userInfo?.element || 'Đang tải...'}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Họ và tên:</Text>
              <Text style={styles.value}>{userInfo?.fullName || 'Đang tải...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày sinh:</Text>
              <Text style={styles.value}>
                {userInfo ? new Date(userInfo.dob).toLocaleDateString('vi-VN') : 'Đang tải...'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Giới tính:</Text>
              <Text style={styles.value}>
                {userInfo ? (userInfo.gender ? 'Nam' : 'Nữ') : 'Đang tải...'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cung mệnh:</Text>
              <Text style={styles.value}>{userInfo?.lifePalace || 'Đang tải...'}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: elementColor }]}
            onPress={() => navigation.navigate('menu')}
          >
            <Text style={styles.buttonText}>Trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  elementSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  elementLabel: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  elementText: {
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
    width: width - 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  label: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    color: 'white',
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30,
    width: width - 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});