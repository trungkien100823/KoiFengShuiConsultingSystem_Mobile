import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 
  (Platform.isPad ? 20 : 44) : 
  StatusBar.currentHeight || 0;

export default function RefundScreen() {
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);

  // Fetch refunds when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRefunds();
    }, [])
  );

  const fetchRefunds = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/(tabs)/Login');
        return;
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Payment/get-manager-refunded-for-mobile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Refunds API response:', response.data);
      
      // Add detailed logging for the first item to see field names
      if (response.data?.isSuccess && response.data.data && response.data.data.length > 0) {
        console.log('First refund item structure:', JSON.stringify(response.data.data[0], null, 2));
        
        // Map data to ensure consistent field names
        const processedData = response.data.data.map(item => {
          // Check all possible field names for these properties
          const transactionId = item.transactionId || item.id || item.paymentId || item.refundId || item.orderId || '';
          const requestDate = item.requestDate || item.createdDate || item.createDate || item.date || item.orderDate || null;
          const refundDate = item.refundDate || item.completedDate || item.processedDate || null;
          
          return {
            ...item,
            transactionId,
            requestDate,
            refundDate
          };
        });
        
        setRefunds(processedData);
      } else {
        setRefunds(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
      setError(error.message || 'Đã có lỗi xảy ra khi tải danh sách hoàn tiền');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRefunds();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Convert string to date object
      let date;
      
      if (typeof dateString === 'string') {
        // Try parsing different formats
        if (dateString.includes('T')) {
          // ISO format (e.g. "2023-08-15T14:30:00")
          date = new Date(dateString);
        } else if (dateString.includes('/')) {
          // DD/MM/YYYY format
          const parts = dateString.split('/');
          if (parts.length === 3) {
            // Month is 0-indexed in JavaScript Date
            date = new Date(parts[2], parts[1] - 1, parts[0]);
          } else {
            date = new Date(dateString);
          }
        } else {
          // Try Unix timestamp
          const timestamp = parseInt(dateString);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else {
            date = new Date(dateString);
          }
        }
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        console.log('Unknown date format:', typeof dateString);
        return 'N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'N/A';
      }
      
      // Format date as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Also add time if available
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Không xác định';
    
    const statusLower = typeof status === 'string' ? status.toLowerCase() : '';
    
    switch (statusLower) {
      case 'pending': return 'Đang xử lý';
      case 'processing': return 'Đang xử lý';
      case 'approved': return 'Đã phê duyệt';
      case 'accepted': return 'Đã chấp nhận';
      case 'rejected': return 'Đã từ chối';
      case 'denied': return 'Đã từ chối';
      case 'cancelled': return 'Đã hủy';
      case 'canceled': return 'Đã hủy';
      case 'completed': return 'Đã hoàn tiền';
      case 'refunded': return 'Đã hoàn tiền';
      case 'expired': return 'Đã hết hạn';
      case 'failed': return 'Thất bại';
      default: return status ? `${status}` : 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#999';
    
    const statusLower = typeof status === 'string' ? status.toLowerCase() : '';
    
    switch (statusLower) {
      case 'pending': return '#FF9800'; // Orange
      case 'processing': return '#2196F3'; // Blue
      case 'approved': return '#4CAF50'; // Green
      case 'accepted': return '#4CAF50'; // Green
      case 'rejected': return '#F44336'; // Red
      case 'denied': return '#F44336'; // Red
      case 'cancelled': return '#9E9E9E'; // Gray
      case 'canceled': return '#9E9E9E'; // Gray
      case 'completed': return '#8BC34A'; // Light Green
      case 'refunded': return '#8BC34A'; // Light Green
      case 'expired': return '#795548'; // Brown
      case 'failed': return '#E91E63'; // Pink
      default: return '#9C27B0'; // Purple for unknown
    }
  };

  const renderRefundItem = ({ item }) => {
    // Try multiple possible field names for each property
    const transactionId = item.transactionId || item.id || item.paymentId || item.refundId || item.orderId || 'N/A';
    const customerName = item.customerName || item.userName || item.fullName || item.name || 'N/A';
    const serviceType = item.serviceType || item.type || item.orderType || item.paymentType || 'N/A';
    const amount = item.amount || item.money || item.price || item.refundAmount || item.totalAmount || 0;
    const requestDate = item.requestDate || item.createdDate || item.createDate || item.date || item.orderDate;
    const refundDate = item.refundDate || item.completedDate || item.processedDate;
    const status = item.status || item.state || 'pending';
    const reason = item.reason || item.message || item.description || item.note || '';
    
    console.log('Rendering item with dates:', { 
      requestDate, 
      refundDate,
      originalRequestDate: item.requestDate,
      originalRefundDate: item.refundDate
    });

    return (
      <TouchableOpacity
        style={styles.refundCard}
        onPress={() => {
          Alert.alert('Thông tin chi tiết', 
            `Mã giao dịch: ${transactionId}\n` +
            `Loại giao dịch: ${serviceType}\n` +
            `Khách hàng: ${customerName}\n` +
            `Số tiền: ${formatCurrency(amount)}\n` +
            `Ngày yêu cầu: ${formatDate(requestDate)}\n` +
            `Ngày hoàn tiền: ${formatDate(refundDate)}\n` +
            `Trạng thái: ${getStatusLabel(status)}\n` +
            `Lý do: ${reason || 'Không có'}`
          );
        }}
      >
        <View style={styles.refundHeader}>
          <View style={styles.refundIdContainer}>
            <Ionicons name="refresh-circle" size={20} color="#8B0000" />
            <Text style={styles.refundId} numberOfLines={1}>
              {transactionId !== 'N/A' ? transactionId : 'Không có mã'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>
        </View>

        <View style={styles.refundContent}>
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Khách hàng:</Text>
            <Text style={styles.refundValue} numberOfLines={1}>{customerName}</Text>
          </View>

          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Loại dịch vụ:</Text>
            <Text style={styles.refundValue} numberOfLines={1}>{serviceType}</Text>
          </View>

          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Số tiền:</Text>
            <Text style={styles.refundAmount}>{formatCurrency(amount)}</Text>
          </View>

          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Ngày yêu cầu:</Text>
            <Text style={styles.refundValue}>{formatDate(requestDate)}</Text>
          </View>

          {refundDate && (
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Ngày hoàn tiền:</Text>
              <Text style={styles.refundValue}>{formatDate(refundDate)}</Text>
            </View>
          )}

          {reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Lý do:</Text>
              <Text style={styles.reasonText} numberOfLines={2}>{reason}</Text>
            </View>
          )}
        </View>
        
        {/* Status timeline indicator */}
        <View style={[styles.statusTimeline, { backgroundColor: getStatusColor(status) + '20' }]}>
          <View style={styles.statusTimelineItem}>
            <Ionicons 
              name={status.toLowerCase() === 'rejected' || status.toLowerCase() === 'denied' ? 
                "close-circle" : status.toLowerCase() === 'completed' || status.toLowerCase() === 'refunded' ? 
                "checkmark-circle" : "time"} 
              size={18} 
              color={getStatusColor(status)} 
            />
            <Text style={[styles.statusTimelineText, { color: getStatusColor(status) }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cash-outline" size={60} color="#8B0000" style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Không có yêu cầu hoàn tiền nào</Text>
    </View>
  );

  const handleBack = () => {
    AsyncStorage.setItem('shouldRefreshProfile', 'true')
      .then(() => router.replace('/(tabs)/profile'))
      .catch(error => {
        console.error("Error setting refresh flag:", error);
        router.replace('/(tabs)/profile');
      });
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
          onPress={handleBack}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Danh sách hoàn tiền</Text>
          <Text style={styles.headerSubtitle}>
            Quản lý các yêu cầu hoàn tiền
          </Text>
        </View>
      </LinearGradient>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải danh sách hoàn tiền...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#8B0000" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchRefunds}
          >
            <LinearGradient
              colors={['#8B0000', '#600000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={refunds}
          renderItem={renderRefundItem}
          keyExtractor={(item, index) => item.transactionId?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#8B0000']}
              tintColor="#8B0000"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {refunds.length > 0 
                  ? `Tổng số ${refunds.length} yêu cầu hoàn tiền` 
                  : 'Danh sách yêu cầu hoàn tiền'}
              </Text>
            </View>
          }
        />
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
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    width: 120,
  },
  retryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  listHeader: {
    marginBottom: 15,
    padding: 5,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  refundCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 15,
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
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'rgba(245, 245, 245, 0.5)',
  },
  refundIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  refundId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    maxWidth: '80%',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refundContent: {
    padding: 15,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refundLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  refundValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  refundAmount: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  reasonContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    marginBottom: 15,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusTimeline: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  statusTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusTimelineText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '600',
  },
});
