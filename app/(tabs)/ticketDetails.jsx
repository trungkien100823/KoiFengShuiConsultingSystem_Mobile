import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';

export default function TicketDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Lấy dữ liệu từ params
  const { ticket, ticketId } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [ticketsList, setTicketsList] = useState([]);
  
  // Đảm bảo có dữ liệu mặc định
  const ticketData = ticket || {
    title: 'Không có thông tin',
    date: 'N/A',
    location: 'N/A',
    customerName: 'N/A',
    phoneNumber: 'N/A',
    email: 'N/A',
    ticketCount: 1,
    totalFee: '0$',
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketsGroup(ticketId);
    }
  }, [ticketId]);

  const fetchTicketsGroup = async (id) => {
    try {
      setIsLoading(true);
      
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem thông tin vé');
        navigation.navigate('login');
        return;
      }
      
      console.log(`Đang gọi API lấy danh sách vé theo nhóm với ID: ${id}`);
      
      // Sửa URL API để dùng trực tiếp thay vì dùng API_CONFIG.endpoints.getRegistersByGroup
      const url = `${API_CONFIG.baseURL}/api/RegisterAttend/register-by-group/${id}`;
      console.log('URL gọi API:', url);
      
      const response = await axios.get(
        url,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Kết quả lấy danh sách vé theo nhóm:', response.data);
      
      if (response.data && response.data.isSuccess) {
        const tickets = response.data.data || [];
        setTicketsList(tickets);
      } else {
        console.log('Không thể lấy danh sách vé:', response.data?.message);
        // Có thể hiển thị thông báo lỗi nếu cần
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vé theo nhóm:', error);
      console.log('Chi tiết lỗi:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo mảng số vé dựa vào ticketCount
  const ticketArray = Array.from({ length: ticketData.ticketCount || 1 }, (_, i) => i + 1);

  // Thêm các hàm helper sau vào trước return
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return dateString;
    }
  };

  const translateStatus = (status) => {
    const statusMap = {
      'Pending': 'Đang chờ để check-in',
      'Confirmed': 'Đã check-in thành công',
    };
    
    return statusMap[status] || status;
  };

  // Lấy thông tin workshop từ ticket đầu tiên trong danh sách nếu có
  const workshopInfo = ticketsList.length > 0 ? {
    workshopName: ticketsList[0].workshopName,
    startDate: ticketsList[0].startDate,
    location: ticketsList[0].location,
    customerName: ticketsList[0].customerName,
    phoneNumber: ticketsList[0].phoneNumber,
    customerEmail: ticketsList[0].customerEmail
  } : null;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ticket detail</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Nếu có thông tin từ API, hiển thị thông tin từ API */}
        {workshopInfo ? (
          <>
            <Text style={styles.eventTitle}>{workshopInfo.workshopName}</Text>
            
            <View style={styles.ticketInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ngày sự kiện:</Text>
                <Text style={styles.value}>{formatDate(workshopInfo.startDate)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Địa điểm:</Text>
                <Text style={styles.value}>{workshopInfo.location}</Text>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Khách hàng:</Text>
                <Text style={styles.value}>{workshopInfo.customerName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Số điện thoại:</Text>
                <Text style={styles.value}>{workshopInfo.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{workshopInfo.customerEmail}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Số lượng vé:</Text>
                <Text style={styles.value}>{ticketsList.length}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Nếu không có thông tin từ API, hiển thị thông tin từ params */}
            <Text style={styles.eventTitle}>{ticketData.title}</Text>
            
            <View style={styles.ticketInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{ticketData.date}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{ticketData.location}</Text>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Customer:</Text>
                <Text style={styles.value}>{ticketData.customerName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{ticketData.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{ticketData.email}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Number of Tickets:</Text>
                <Text style={styles.value}>{ticketData.ticketCount}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Total Fee:</Text>
                <Text style={styles.value}>{ticketData.totalFee}</Text>
              </View>
            </View>
          </>
        )}
        
        {/* Hiển thị danh sách các vé riêng lẻ */}
        <View style={styles.ticketsListContainer}>
          <Text style={styles.ticketsListTitle}>Danh sách vé</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#AE1D1D" />
              <Text style={styles.loadingText}>Đang tải danh sách vé...</Text>
            </View>
          ) : ticketsList.length > 0 ? (
            ticketsList.map((item, index) => (
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
                        color: item.status === 'Confirmed' ? '#4CAF50' : 
                              item.status === 'Pending' ? '#FF9800' : '#333' 
                      }
                    ]}>
                      {translateStatus(item.status) || 'Chưa xác nhận'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noTicketsText}>Không có thông tin vé</Text>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.buttonWrapper} 
            onPress={() => navigation.navigate('ticket_confirmation')}
          >
            <LinearGradient
              colors={['#AE1D1D', '#212121']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  ticketInfo: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  ticketsListContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  ticketsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
});
