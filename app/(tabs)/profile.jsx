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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

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
          <View style={styles.userInfoContainer}>
            <Image source={user.avatar || require('../../assets/images/default-avatar.png')} style={styles.avatar} />
            <View style={styles.userInfoTextContainer}>
              <Text style={styles.userName}>{user.userName || user.fullName || 'User'}</Text>
              <Text style={styles.phone}>{user.phoneNumber || 'No phone'}</Text>
              <Text style={styles.email}>{user.email || 'No email'}</Text>
            </View>
          </View>
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
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/edit_profile')}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>My Profile</Text>
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  address: {
    fontSize: 16,
    color: '#666',
  },
  userFullNameContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  userFullNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});