import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthToken } from '../../services/authService';
import CustomTabBar from '../../components/ui/CustomTabBar';

const YourBooking = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_CONFIG.baseURL}/api/Booking/current-login-bookingOffline`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.isSuccess) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (bookingId) => {
    router.push({
      pathname: '/(tabs)/contract_bookingOffline',
      params: { id: bookingId }
    });
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingId}>Booking ID: {item.bookingOfflineId}</Text>
        <Text style={styles.bookingStatus}>Status: {item.status}</Text>
        <Text style={styles.bookingPrice}>Price: {item.selectedPrice.toLocaleString()} VND</Text>
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewBooking(item.bookingOfflineId)}
      >
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Your Bookings</Text>
      </View>
      
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.bookingOfflineId?.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingStatus: {
    fontSize: 14,
    color: '#8B0000',
    marginTop: 4,
  },
  bookingPrice: {
    fontSize: 14,
    color: '#008000',
    marginTop: 4,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default YourBooking; 