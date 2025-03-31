import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function TicketDetails() {
  const { groupId, totalPrice } = useLocalSearchParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [ticketsList, setTicketsList] = useState([]);
  const [error, setError] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (groupId) {
        fetchTicketsGroup(groupId);
      }
    }, [groupId])
  );

  const fetchTicketsGroup = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(tabs)/Login');
        return;
      }

      console.log('Đang gọi API với groupId:', id);
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/RegisterAttend/register-by-group/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Kết quả API:', response.data);

      if (response.data && response.data.isSuccess) {
        setTicketsList(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Không thể tải thông tin vé');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin vé:', error);
      setError(error.message || 'Đã có lỗi xảy ra khi tải thông tin vé');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return 'N/A';
    }
  };

  const translateStatus = (status) => {
    if (!status) return 'N/A';
    
    // Chuyển đổi status thành chữ thường để so sánh
    const statusLower = status.toLowerCase();
    
    // Trả về trạng thái tiếng Việt tương ứng
    switch (statusLower) {
      case 'pending':
        return 'Đang chờ xử lý thanh toán';
      case 'confirmed':
        return 'Đã check-in';
      case 'paid':
        return 'Đã thanh toán';
      case 'canceled':
        return 'Đã hủy';
      default:
        return status; // Trả về status gốc nếu không match
    }
  };

  const formatCurrency = (amount) => {
    return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ" || 'N/A';
  };

  const workshopInfo = ticketsList[0] || null;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/your_registerAttend')}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chi tiết vé</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#AE1D1D" />
            <Text style={styles.loadingText}>Đang tải thông tin vé...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchTicketsGroup(groupId)}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : workshopInfo ? (
          <>
            <Text style={styles.eventTitle}>
              <Ionicons name="ticket-outline" size={24} color="#AE1D1D" />
              {' '}{workshopInfo.workshopName}
            </Text>
            
            <View style={styles.ticketInfo}>
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.label}>Ngày sự kiện:</Text>
                </View>
                <Text style={styles.value}>{formatDate(workshopInfo.startDate)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.label}>Địa điểm:</Text>
                </View>
                <Text style={styles.value}>{workshopInfo.location || 'N/A'}</Text>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <Text style={styles.label}>Khách hàng:</Text>
                </View>
                <Text style={styles.value}>{workshopInfo.customerName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <Text style={styles.label}>Số điện thoại:</Text>
                </View>
                <Text style={styles.value}>{workshopInfo.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <Text style={styles.label}>Email:</Text>
                </View>
                <Text style={styles.value}>{workshopInfo.customerEmail}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="documents-outline" size={20} color="#666" />
                  <Text style={styles.label}>Số lượng vé:</Text>
                </View>
                <Text style={styles.value}>{ticketsList.length}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Ionicons name="wallet-outline" size={20} color="#666" />
                  <Text style={styles.label}>Tổng tiền:</Text>
                </View>
                <Text style={[styles.value, { color: '#AE1D1D', fontWeight: 'bold' }]}>
                  {formatCurrency(totalPrice)}
                </Text>
              </View>
            </View>

            <View style={styles.ticketsListContainer}>
              <Text style={styles.ticketsListTitle}>
                <Ionicons name="list-circle-outline" size={24} color="#333" />
                {' '}Danh sách vé
              </Text>
              {ticketsList.map((item, index) => (
                <View key={item.attendId || index} style={styles.ticketItem}>
                  <Text style={styles.ticketItemTitle}>Vé #{index + 1}</Text>
                  <View style={styles.ticketItemDetails}>
                    <View style={styles.ticketInfoRow}>
                      <Text style={styles.ticketInfoLabel}>Mã vé:</Text>
                      <Text style={styles.ticketInfoValue}>{item.attendId || 'N/A'}</Text>
                    </View>
                    <View style={styles.ticketInfoRow}>
                      <Text style={styles.ticketInfoLabel}>Trạng thái:</Text>
                      <Text style={[
                        styles.ticketInfoValue, 
                        { 
                          color: item.status?.toLowerCase() === 'confirmed' ? '#4CAF50' : 
                                item.status?.toLowerCase() === 'pending' ? '#FF9800' : 
                                item.status?.toLowerCase() === 'cancelled' || 
                                item.status?.toLowerCase() === 'canceled' ? '#d32f2f' : '#333' 
                        }
                      ]}>
                        {translateStatus(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.noTicketsText}>Không có thông tin vé</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 90,
    justifyContent: 'flex-end',
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  ticketInfo: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  label: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
  value: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  ticketsListContainer: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
  },
  ticketsListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  ticketItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#AE1D1D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  ticketItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#AE1D1D',
  },
  ticketItemDetails: {
    paddingLeft: 6,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  ticketInfoLabel: {
    fontSize: 14,
    color: '#555',
    width: 80,
  },
  ticketInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  noTicketsText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 45,
    width: 200,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#AE1D1D',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    padding: 5,
  },
});
