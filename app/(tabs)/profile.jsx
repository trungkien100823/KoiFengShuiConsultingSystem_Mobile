import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import UserInfo from './UserInfo';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        
        if (!token) {
          console.log('No token found, user not logged in');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_CONFIG.baseURL}/api/Account/current-user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.isSuccess) {
          console.log('User data:', response.data.data);
          setUser(response.data.data);
        } else {
          console.warn('Failed to fetch user data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
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
              if (!token) {
                console.log('No token found');
                return;
              }

              const response = await axios.get(
                `${API_CONFIG.baseURL}/api/Account/logout`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );

              if (response.data && response.data.isSuccess) {
                await AsyncStorage.removeItem('accessToken');
                setUser(null);
                
                Alert.alert(
                  'Thành công',
                  'Đăng xuất thành công',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(tabs)/Login');
                      }
                    }
                  ]
                );
              } else {
                throw new Error('Logout failed');
              }
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert(
                'Lỗi',
                'Không thể đăng xuất. Vui lòng thử lại sau.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Tài khoản</Text>
        </View>
        
        {user ? (
          <UserInfo 
            user={user} 
            // Make sure all required props are passed with fallbacks
            avatar={user.avatar || require('../../assets/images/default-avatar.png')}
            name={user.userName || user.fullName || 'User'}
            phone={user.phoneNumber || 'No phone'}
            email={user.email || 'No email'}
            address={user.address || 'No address'}
            // Pass an empty object if element is undefined to avoid error
            element={user.element || {}} 
          />
        ) : (
          <View style={styles.loginPrompt}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/(tabs)/Login')}
            >
              <Text style={styles.loginButtonText}>Log out</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Cài đặt</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/support')}>
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Hỗ trợ</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/(tabs)/your_paid_courses')}
          >
            <Ionicons name="book-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>My Courses</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/(tabs)/your_booking')}
          >
            <Ionicons name="calendar-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>My Bookings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/your_registerAttend')}
          >
            <Ionicons name="ticket-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>My Tickets</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          {user && (
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#d9534f" />
              <Text style={[styles.menuItemText, {color: '#d9534f'}]}>Đăng xuất</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  loginPrompt: {
    marginTop: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});