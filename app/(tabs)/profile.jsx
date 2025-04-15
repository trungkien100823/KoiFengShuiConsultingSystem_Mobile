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
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollY] = useState(new Animated.Value(0));

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp'
  });

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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Floating Header */}
      <Animated.View style={[
        styles.floatingHeader,
        { opacity: headerOpacity }
      ]}>
        <Text style={styles.floatingTitle}>Tài khoản</Text>
      </Animated.View>
      
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Tài khoản</Text>
        </View>
        
        {user ? (
          <View style={styles.userInfoContainer}>
            <Image 
              source={user.avatar ? { uri: user.avatar } : require('../../assets/images/default-avatar.png')} 
              style={styles.avatar} 
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']}
              style={styles.userInfoCard}
            >
              <View style={styles.userInfoTextContainer}>
                <Text style={styles.userName}>{user.userName || user.fullName || 'User'}</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{user.phoneNumber || 'Chưa cập nhật'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{user.email || 'Chưa cập nhật'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{user.address || 'Chưa cập nhật'}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={() => router.push('/(tabs)/edit_profile')}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={18} color="#8B0000" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/(tabs)/Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Tùy chọn</Text>
          
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: 'rgba(52, 152, 219, 0.1)'}]}>
                  <Ionicons name="settings-outline" size={22} color="#3498db" />
                </View>
                <Text style={styles.menuItemText}>Cài đặt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/(tabs)/support')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: 'rgba(26, 188, 156, 0.1)'}]}>
                  <Ionicons name="help-circle-outline" size={22} color="#1abc9c" />
                </View>
                <Text style={styles.menuItemText}>Hỗ trợ</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/(tabs)/edit_profile')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: 'rgba(155, 89, 182, 0.1)'}]}>
                  <Ionicons name="person-outline" size={22} color="#9b59b6" />
                </View>
                <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.menuTitle}>Hoạt động của tôi</Text>
          
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/(tabs)/your_paid_courses')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: 'rgba(230, 126, 34, 0.1)'}]}>
                  <Ionicons name="book-outline" size={22} color="#e67e22" />
                </View>
                <Text style={styles.menuItemText}>Khóa học của tôi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/(tabs)/your_booking')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: 'rgba(41, 128, 185, 0.1)'}]}>
                  <Ionicons name="calendar-outline" size={22} color="#2980b9" />
                </View>
                <Text style={styles.menuItemText}>Lịch hẹn của tôi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/your_registerAttend')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, {backgroundColor: 'rgba(46, 204, 113, 0.1)'}]}>
                  <Ionicons name="ticket-outline" size={22} color="#2ecc71" />
                </View>
                <Text style={styles.menuItemText}>Vé sự kiện của tôi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          
          {user && (
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.bottomSpace} />
        </View>
      </Animated.ScrollView>
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STATUSBAR_HEIGHT + 50,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: STATUSBAR_HEIGHT,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: -30,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  userInfoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userInfoTextContainer: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    marginVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  bottomSpace: {
    height: 50,
  },
});