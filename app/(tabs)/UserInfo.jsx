import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../../constants/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const elementColors = {
  Hỏa: '#FF4500',
  Kim: '#C0C0C0', 
  Thủy: '#006994',
  Mộc: '#228B22',
  Thổ: '#DEB887',
};

export default function UserInfo({ user, avatar, name, phone, email, address, element }) {
  const navigation = useNavigation();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const result = await authAPI.currentCustomerElement();
      if (result.success) {
        setUserInfo(result.data);
      }
    } catch (error) {
      Alert.alert('Lỗi', error.toString());
    } finally {
      setLoading(false);
    }
  };

  const userElement = element || {};

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

          <View style={styles.userInfoContainer}>
            <View style={styles.avatarSection}>
              <ImageBackground
                source={typeof avatar === 'string' ? { uri: avatar } : avatar}
                style={styles.avatar}
                defaultSource={require('../../assets/images/default-avatar.png')}
              >
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{name}</Text>
                  <View style={styles.elementContainer}>
                    <Text style={styles.userElement}>
                      {userElement.name || 'Unknown Element'}
                    </Text>
                    <View style={[
                      styles.elementIcon, 
                      { backgroundColor: userElement.color || '#ccc' }
                    ]}>
                      <Text style={styles.elementText}>
                        {(userElement.name || '?')[0]}
                      </Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>
            
            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <Text style={styles.detailText}>{phone}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <Text style={styles.detailText}>{email}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.detailText}>{address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/edit_profile')}
            >
              <Text style={styles.actionButtonText}>Sửa Thông tin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewHistoryButton]}
              onPress={() => router.push('/(tabs)/booking_history')}
            >
              <Text style={[styles.actionButtonText, styles.viewHistoryText]}>
                Lịch sử tư vấn
              </Text>
            </TouchableOpacity>
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
  userInfoContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e1e1e1',
  },
  nameContainer: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  elementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userElement: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  elementIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f0ad4e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elementText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#444',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#8B0000',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  viewHistoryButton: {
    backgroundColor: '#e7e7e7',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  viewHistoryText: {
    color: '#333',
  },
});