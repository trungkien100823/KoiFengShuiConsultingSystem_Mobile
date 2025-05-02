import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? (IS_IPHONE_X ? 44 : 20) : StatusBar.currentHeight || 0;

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
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return 'N/A';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const workshopInfo = ticketsList[0] || null;

  const getStatusColor = (status) => {
    if (!status) return '#999';
    
    switch (status.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'pending': return '#FFA726';
      case 'pendingconfirm': return '#FFA726';
      case 'canceled': return '#F44336';
      default: return '#999';
    }
  };

  const translateStatus = (status) => {
    if (!status) return 'Không xác định';
    
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'pending':
        return 'Chờ thanh toán';
      case 'pendingconfirm':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'paid':
        return 'Đã thanh toán';
      case 'canceled':
        return 'Đã hủy';
      case 'workshopcanceled':
        return 'Hội thảo đã hủy';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" translucent={true} />
      
      {/* Status bar spacer */}
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
      
      {/* Header */}
      <LinearGradient
        colors={['#8B0000', '#600000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/your_registerAttend')}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chi tiết vé</Text>
          <Text style={styles.headerSubtitle}>
            {workshopInfo ? workshopInfo.workshopName : 'Thông tin vé tham dự'}
          </Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải thông tin vé...</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={scale(50)} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchTicketsGroup(groupId)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B0000', '#600000']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.retryButtonGradient}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
                <Ionicons name="refresh" size={scale(16)} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : workshopInfo ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentInner}>
            {/* Event info card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="calendar" size={scale(20)} color="#8B0000" />
                  <Text style={styles.sectionTitle}>Thông tin sự kiện</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="bookmark-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Tên sự kiện:</Text>
                  </View>
                  <Text style={styles.value} numberOfLines={2}>{workshopInfo.workshopName || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="calendar-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Ngày sự kiện:</Text>
                  </View>
                  <Text style={styles.value}>{formatDate(workshopInfo.startDate)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="time-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Thời gian:</Text>
                  </View>
                  <Text style={styles.value}>{formatTime(workshopInfo.startTime)} - {formatTime(workshopInfo.endTime)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="location-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Địa điểm:</Text>
                  </View>
                  <Text style={styles.value}>{workshopInfo.location || 'N/A'}</Text>
                </View>
                
                {workshopInfo.masterName && (
                  <View style={styles.infoRow}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="person-outline" size={scale(16)} color="#666" />
                      <Text style={styles.label}>Người chủ trì:</Text>
                    </View>
                    <Text style={styles.value}>{workshopInfo.masterName}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Customer info card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="person" size={scale(20)} color="#8B0000" />
                  <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="person-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Họ tên:</Text>
                  </View>
                  <Text style={styles.value}>{workshopInfo.customerName || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="call-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Số điện thoại:</Text>
                  </View>
                  <Text style={styles.value}>{workshopInfo.phoneNumber || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="mail-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Email:</Text>
                  </View>
                  <Text style={styles.value}>{workshopInfo.customerEmail || 'N/A'}</Text>
                </View>
              </View>
            </View>
            
            {/* Payment info card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="card" size={scale(20)} color="#8B0000" />
                  <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                </View>
              </View>
              
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="ticket-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Số lượng vé:</Text>
                  </View>
                  <Text style={styles.value}>{ticketsList.length}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="pricetag-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Đơn giá:</Text>
                  </View>
                  <Text style={styles.value}>
                    {workshopInfo.price ? `${workshopInfo.price.toLocaleString('vi-VN')}đ` : 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="wallet-outline" size={scale(16)} color="#666" />
                    <Text style={styles.label}>Tổng tiền:</Text>
                  </View>
                  <Text style={styles.highlightValue}>
                    {totalPrice ? `${parseInt(totalPrice).toLocaleString('vi-VN')}đ` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Tickets List */}
            <View style={styles.ticketsListCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="list" size={scale(20)} color="#8B0000" />
                  <Text style={styles.sectionTitle}>Danh sách vé</Text>
                </View>
              </View>
              
              {ticketsList.map((item, index) => (
                <View key={item.attendId || index} style={styles.ticketItem}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8F8F8']}
                    style={styles.ticketItemContent}
                  >
                    <View style={styles.ticketHeader}>
                      <View style={styles.ticketNumberContainer}>
                        <Ionicons name="ticket-outline" size={scale(16)} color="#8B0000" />
                        <Text style={styles.ticketNumber}>Vé #{index + 1}</Text>
                      </View>
                      
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) }
                      ]}>
                        <Text style={styles.statusText}>{translateStatus(item.status)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.ticketDetails}>
                      <View style={styles.ticketInfoRow}>
                        <Text style={styles.ticketInfoLabel}>Mã vé:</Text>
                        <Text style={styles.ticketInfoValue} numberOfLines={1}>{item.attendId || 'N/A'}</Text>
                      </View>
                      
                      <View style={styles.ticketInfoRow}>
                        <Text style={styles.ticketInfoLabel}>Ngày đăng ký:</Text>
                        <Text style={styles.ticketInfoValue}>{formatDate(item.createdDate) || 'N/A'}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
            
            {/* Bottom spacer */}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="ticket-outline" size={scale(60)} color="#8B0000" style={styles.noDataIcon} />
          <Text style={styles.noDataText}>Không có thông tin vé</Text>
          <TouchableOpacity 
            style={styles.backToListButton} 
            onPress={() => router.push('/(tabs)/your_registerAttend')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B0000', '#600000']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.backToListButtonGradient}
            >
              <Text style={styles.backToListButtonText}>Quay lại danh sách vé</Text>
              <Ionicons name="arrow-forward" size={scale(16)} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTitleContainer: {
    marginLeft: scale(16),
    flex: 1,
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
  },
  headerSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255,255,255,0.8)',
    paddingRight: scale(8),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  contentInner: {
    padding: scale(16),
  },
  
  // Section card styles
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    marginBottom: scale(16),
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
  sectionHeader: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#333',
    marginLeft: scale(8),
  },
  sectionContent: {
    padding: scale(16),
  },
  
  // Info row styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale(12),
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: scale(100),
    maxWidth: '40%',
  },
  label: {
    fontSize: scale(14),
    color: '#666',
    marginLeft: scale(6),
  },
  value: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  highlightValue: {
    fontSize: scale(16),
    color: '#8B0000',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  
  // Tickets list styles
  ticketsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(16),
    overflow: 'hidden',
    marginBottom: scale(16),
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
  ticketItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    padding: scale(12),
  },
  ticketItemContent: {
    borderRadius: scale(12),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(12),
    paddingBottom: scale(8),
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketNumber: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: scale(6),
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  statusText: {
    color: '#FFF',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  ticketDetails: {
    padding: scale(12),
    paddingTop: scale(0),
  },
  ticketInfoRow: {
    flexDirection: 'row',
    marginBottom: scale(8),
    flexWrap: 'wrap',
  },
  ticketInfoLabel: {
    fontSize: scale(14),
    color: '#666',
    width: scale(100),
  },
  ticketInfoValue: {
    fontSize: scale(14),
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingCard: {
    backgroundColor: '#FFF',
    padding: scale(24),
    borderRadius: scale(16),
    alignItems: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(16),
    color: '#666',
  },
  
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorCard: {
    backgroundColor: '#FFF',
    padding: scale(24),
    borderRadius: scale(16),
    alignItems: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorIcon: {
    marginBottom: scale(16),
  },
  errorText: {
    color: '#666',
    fontSize: scale(16),
    textAlign: 'center',
    marginBottom: scale(20),
  },
  retryButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  
  // No data styles
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  noDataIcon: {
    marginBottom: scale(16),
    opacity: 0.7,
  },
  noDataText: {
    fontSize: scale(18),
    color: '#666',
    marginBottom: scale(24),
    textAlign: 'center',
  },
  backToListButton: {
    borderRadius: scale(25),
    overflow: 'hidden',
  },
  backToListButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
  },
  backToListButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: scale(30),
  },
});
