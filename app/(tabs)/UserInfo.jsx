import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../../constants/auth';

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserInfo();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const result = await authAPI.currentCustomerElement();
      if (result.success) {
        setUserInfo(result.data);
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      setUserInfo(null);
      Alert.alert('Lỗi', error.toString());
    } finally {
      setLoading(false);
    }
  };

  const elementColor = userInfo ? elementColors[userInfo.element] || '#FF4500' : '#FF4500';

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