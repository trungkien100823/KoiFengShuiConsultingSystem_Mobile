import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  TextInput, 
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomTabBar from '../../components/ui/CustomTabBar';

// Component for workshop card with new design
const WorkshopCard = ({ workshop }) => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      style={styles.workshopCard}
      onPress={() => {
        console.log('Workshop pressed:', workshop.title);
        
        const workshopToSend = {
          id: workshop.id,
          title: workshop.title,
          date: workshop.date,
          location: workshop.location,
        };
        
        navigation.navigate('workshopDetails', { 
          workshop: workshopToSend,
          imageId: workshop.id 
        });
      }}
    >
      <Image
        source={workshop.image}
        style={styles.workshopImage}
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.workshopTitle} numberOfLines={2}>{workshop.title}</Text>
        <View style={styles.workshopDetails}>
          <Text style={styles.workshopDate}>
            <Ionicons name="calendar-outline" size={14} color="#fff" /> {workshop.date}
          </Text>
          <Text style={styles.workshopLocation}>
            <Ionicons name="location-outline" size={14} color="#fff" /> {workshop.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Component for workshop section with new styling
const WorkshopSection = ({ title, workshops, loading }) => {
  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={workshops}
        renderItem={({ item }) => <WorkshopCard workshop={item} />}
        keyExtractor={item => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workshopList}
      />
    </View>
  );
};

export default function Workshop() {
  const [trendingWorkshops, setTrendingWorkshops] = useState([]);
  const [newestWorkshops, setNewestWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('John Smith');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('Token không tồn tại, chuyển hướng đến trang đăng nhập');
        navigation.navigate('login');
        return;
      }
  
      // Log token để debug
      console.log('Token hiện tại:', token.substring(0, 10) + '...');
      
      // Định nghĩa cấu hình yêu cầu chung
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // URLs
      const trendingUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.trendingWorkshop}`;
      const newestUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.newestWorkshop}`;
      
      console.log('Đang gọi API trending:', trendingUrl);
      console.log('Đang gọi API newest:', newestUrl);
  
      // Gọi APIs riêng biệt không dùng Promise.all để xác định lỗi chính xác hơn
      let trendingData = [];
      let newestData = [];
      
      try {
        const trendingResponse = await axios.get(trendingUrl, config);
        console.log('Trạng thái response trending:', trendingResponse.status);
        trendingData = trendingResponse.data?.data || [];
      } catch (trendingError) {
        console.error('Lỗi chi tiết khi lấy trending workshops:', trendingError);
        // Không đặt error state ở đây, tiếp tục thử API thứ hai
      }
      
      try {
        const newestResponse = await axios.get(newestUrl, config);
        console.log('Trạng thái response newest:', newestResponse.status);
        newestData = newestResponse.data?.data || [];
      } catch (newestError) {
        console.error('Lỗi chi tiết khi lấy newest workshops:', newestError);
        // Không đặt error state ở đây
      }
  
      console.log('Dữ liệu trending thô:', trendingData);
      console.log('Dữ liệu newest thô:', newestData);
  
      // Xử lý dữ liệu workshop
      const processWorkshopData = (workshop) => {
        if (!workshop) return null;
        
        try {
          return {
            id: workshop.workshopId,
            title: workshop.workshopName || 'Chưa có tiêu đề',
            date: workshop.startDate 
              ? new Date(workshop.startDate).toLocaleDateString('vi-VN')
              : 'Chưa cập nhật',
            location: workshop.location || 'Chưa cập nhật địa điểm',
            description: workshop.description,
            price: workshop.price,
            capacity: workshop.capacity,
            status: workshop.status,
            masterName: workshop.masterName,
            image: require('../../assets/images/buddha.png') // Tạm thời dùng ảnh mặc định
          };
        } catch (error) {
          console.error('Lỗi xử lý workshop:', error);
          return null;
        }
      };
  
      // Xử lý và lọc dữ liệu
      const processedTrending = Array.isArray(trendingData) 
        ? trendingData.map(processWorkshopData).filter(Boolean)
        : [];
      
      const processedNewest = Array.isArray(newestData)
        ? newestData.map(processWorkshopData).filter(Boolean)
        : [];
  
      console.log('Số lượng trending workshops đã xử lý:', processedTrending.length);
      console.log('Số lượng newest workshops đã xử lý:', processedNewest.length);
  
      // Cập nhật state ngay cả khi một trong các API thất bại
      setTrendingWorkshops(processedTrending);
      setNewestWorkshops(processedNewest);
  
      // Chỉ hiển thị lỗi khi cả hai API đều không trả về dữ liệu
      if (!processedTrending.length && !processedNewest.length) {
        setError('Không có workshop nào được tìm thấy');
      }
  
    } catch (error) {
      console.error('Lỗi tổng quát khi tải workshops:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Có lỗi xảy ra khi tải danh sách workshop'
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh data khi focus vào màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Màn hình được focus - Tải lại dữ liệu');
      fetchWorkshops();
    });

    return unsubscribe;
  }, [navigation]);

  // Thêm retry button khi có lỗi
  const RetryButton = () => (
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={() => {
        setError(null);
        fetchWorkshops();
      }}
    >
      <Text style={styles.retryButtonText}>Thử lại</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hi, {userName}</Text>
            <Text style={styles.subGreeting}>Find workshops near you</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="calendar-outline" size={35} color="#8B0000" style={{ marginTop: 20, marginRight: 5 }} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search workshops"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search" size={20} color="#666" />
          </View>
        </View>
      </View>

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <RetryButton />
        </View>
      )}

      {loading && !error ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      ) : (
        <ScrollView style={styles.scrollContent}>
          {/* Trending Workshops */}
          <WorkshopSection 
            title="Trending Workshops" 
            workshops={trendingWorkshops}
            loading={false}
          />
          
          {/* Newest Workshops */}
          <WorkshopSection 
            title="Newest Workshops" 
            workshops={newestWorkshops}
            loading={false}
          />
          
          {/* Add some space at the bottom for the tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
      
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#8B0000',
    marginTop: 10,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  workshopList: {
    paddingLeft: 16,
  },
  workshopCard: {
    width: 220,
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workshopImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  workshopTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workshopDetails: {
    marginTop: 4,
  },
  workshopDate: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  workshopLocation: {
    color: '#fff',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#8B0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
