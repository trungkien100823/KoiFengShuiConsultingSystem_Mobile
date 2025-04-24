import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  ImageBackground
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Define color palette
const COLORS = {
  primary: '#8B0000', // Wine red
  primaryDark: '#600000',
  primaryLight: '#A52A2A',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#666666',
  black: '#333333',
  danger: '#D32F2F',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const token = await getAuthToken();
          
          if (!token) {
            console.log('No token found, user not logged in');
            setLoading(false);
            return;
          }
          
          const timestamp = new Date().getTime();
          const response = await axios.get(
            `${API_CONFIG.baseURL}/api/Account/current-user?_t=${timestamp}`, 
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            }
          );
          
          console.log('User data response:', response.data);
          
          if (response.data && response.data.fullName) {
            setUser(response.data);
          } else if (response.data && response.data.data && response.data.data.fullName) {
            setUser(response.data.data);
          } else {
            console.warn('Unexpected user data format:', response.data);
          }
          
          await AsyncStorage.removeItem('profileUpdated');
        } catch (error) {
          console.error('Error fetching user profile:', error);
          
          if (error.response && error.response.data && error.response.data.fullName) {
            console.log('Found user data in error response, using it anyway');
            setUser(error.response.data);
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
      return () => {};
    }, [])
  );

  const showAlert = (title, message, buttons) => {
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        buttons,
        { cancelable: true }
      );
    }, 150);
  };

  const handleLogout = async () => {
    showAlert(
      'Xác nhận',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { 
          text: 'Hủy', 
          style: 'cancel'
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (token) {
                const response = await axios.post(
                  `${API_CONFIG.baseURL}/api/Account/logout`,
                  {},
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                console.log('Logout response:', response.data);
              }
              
              await AsyncStorage.removeItem('accessToken');
              setUser(null);
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
              
              await AsyncStorage.removeItem('accessToken');
              setUser(null);
              router.replace('/');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải thông tin tài khoản...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <Text style={styles.pageTitle}>Tài khoản</Text>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(139, 0, 0, 0.8)', 'rgba(96, 0, 0, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            {user ? (
              <View style={styles.userInfoContainer}>
                <Image 
                  source={user.avatar || require('../../assets/images/default-avatar.png')} 
                  style={styles.avatar} 
                />
                <View style={styles.userInfoTextContainer}>
                  <Text style={styles.userName}>{user.userName || user.fullName || 'User'}</Text>
                  <View style={styles.contactInfoRow}>
                    <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.contactText}>{user.phoneNumber || 'Chưa cập nhật'}</Text>
                  </View>
                  <View style={styles.contactInfoRow}>
                    <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.contactText}>{user.email || 'Chưa cập nhật'}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Vui lòng đăng nhập để truy cập tài khoản của bạn</Text>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => router.push('/(tabs)/Login')}
                >
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
        
        {/* Menu Section */}
        {user && (
          <View style={styles.menuSectionContainer}>
            <Text style={styles.menuSectionTitle}>Quản lý tài khoản</Text>
            
            <View style={styles.menuSection}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/(tabs)/edit_profile')}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="person" size={20} color={COLORS.white} />
                </View>
                <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/(tabs)/your_paid_courses')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="book" size={20} color={COLORS.white} />
                </View>
                <Text style={styles.menuItemText}>Khóa học</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push('/(tabs)/your_booking')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="calendar" size={20} color={COLORS.white} />
                </View>
                <Text style={styles.menuItemText}>Lịch tư vấn</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/your_registerAttend')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#FF9800' }]}>
                  <Ionicons name="ticket" size={20} color={COLORS.white} />
                </View>
                <Text style={styles.menuItemText}>Vé tham dự hội thảo</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuSectionTitle}>Dịch vụ</Text>
            
            <View style={styles.menuSection}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/your_order')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#9C27B0' }]}>
                  <Ionicons name="cart" size={20} color={COLORS.white} />
                </View>
                <Text style={styles.menuItemText}>Dịch vụ chưa thanh toán</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/your_certificate')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#009688' }]}>
                  <Ionicons name="document-text" size={20} color={COLORS.white} />
                </View>
                <Text style={styles.menuItemText}>Chứng chỉ</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.logoutContainer}>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={20} color={COLORS.white} />
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 15,
    paddingHorizontal: width * 0.05,
  },
  pageTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: width * 0.06,
    width: '80%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  profileCard: {
    marginHorizontal: width * 0.05,
    marginTop: height * 0.02,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileGradient: {
    padding: width * 0.05,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  userInfoTextContainer: {
    marginLeft: width * 0.04,
    flex: 1,
  },
  userName: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: height * 0.01,
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.005,
  },
  contactText: {
    fontSize: width * 0.035,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: width * 0.02,
  },
  loginPrompt: {
    alignItems: 'center',
    padding: width * 0.04,
  },
  loginPromptText: {
    color: COLORS.white,
    fontSize: width * 0.04,
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.08,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  menuSectionContainer: {
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  menuSectionTitle: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: height * 0.01,
    marginTop: height * 0.02,
    paddingLeft: width * 0.02,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: height * 0.02,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuIconContainer: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  menuItemText: {
    fontSize: width * 0.04,
    color: COLORS.black,
    flex: 1,
  },
  logoutContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.04,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.08,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: width * 0.04,
    fontWeight: '600',
    marginLeft: width * 0.02,
  },
});