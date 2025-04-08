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
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workshopService } from '../../constants/workshop';
import CustomTabBar from '../../components/ui/CustomTabBar';

// Component hiển thị một workshop
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
      {/* Rest of your component remains the same */}
      <View style={styles.imageContainer}>
        <Image
          source={workshop.image}
          style={styles.workshopImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.workshopInfo}>
        <Text style={styles.workshopTitle} numberOfLines={2}>{workshop.title}</Text>
        <View style={styles.workshopDetails}>
          <Text style={styles.workshopDate}>
            <Ionicons name="calendar-outline" size={14} color="#666" /> {workshop.date}
          </Text>
          <Text style={styles.workshopLocation}>
            <Ionicons name="location-outline" size={14} color="#666" /> {workshop.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Component hiển thị một phần (section) với tiêu đề và danh sách workshops
const WorkshopSection = ({ title, workshops, loading }) => {
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <ActivityIndicator size="large" color="#AE1D1D" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FlatList
        horizontal
        inverted={title === "Newest Workshops"}
        data={workshops}
        renderItem={({ item }) => <WorkshopCard workshop={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={[
          styles.workshopList,
          title === "Newest Workshops" && styles.workshopListReversed
        ]}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default function Workshop() {
  const [trendingWorkshops, setTrendingWorkshops] = useState([]);
  const [newestWorkshops, setNewestWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>What Suit You?</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <RetryButton />
          </View>
        )}
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search workshops..."
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        <WorkshopSection 
          title="Trending Workshops" 
          workshops={trendingWorkshops}
          loading={loading}
        />

        <WorkshopSection 
          title="Newest Workshops" 
          workshops={newestWorkshops}
          loading={loading}
        />
      </ScrollView>
      
      {/* Thêm CustomTabBar vào đây */}
      <CustomTabBar />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  moreButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  workshopList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  workshopListReversed: {
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 16,
  },
  workshopCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageContainer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  workshopImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  workshopInfo: {
    padding: 12,
  },
  workshopTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  workshopDetails: {
    marginTop: 4,
  },
  workshopDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  workshopLocation: {
    fontSize: 12,
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF0000',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#AE1D1D',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
