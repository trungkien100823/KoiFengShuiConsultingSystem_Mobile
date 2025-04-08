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
  Dimensions
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

const { width } = Dimensions.get('window');

// Enhanced workshop card component
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
      <View style={styles.cardInner}>
        <View style={styles.imageContainer}>
          <Image
            source={workshop.image}
            style={styles.workshopImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.workshopTitle} numberOfLines={2}>{workshop.title}</Text>
          <View style={styles.workshopDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#8B0000" />
              <Text style={styles.detailText}>{workshop.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#8B0000" />
              <Text style={styles.detailText}>{workshop.location}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Enhanced workshop section component
const WorkshopSection = ({ title, workshops, loading }) => {
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#8B0000', '#600000']}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.sectionTitleGradient}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
        </LinearGradient>
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

  // Enhanced retry button
  const RetryButton = () => (
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={() => {
        setError(null);
        fetchWorkshops();
      }}
    >
      <LinearGradient
        colors={['#8B0000', '#600000']}
        style={styles.retryButtonGradient}
      >
        <Text style={styles.retryButtonText}>Thử lại</Text>
        <Ionicons name="refresh" size={16} color="#FFF" style={{marginLeft: 6}} />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(139,0,0,0.05)', 'rgba(255,255,255,0)']}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Discover</Text>
          <Text style={styles.headerTitle}>What Suits You?</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <View style={styles.moreButtonCircle}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#8B0000" />
          </View>
        </TouchableOpacity>
      </View>
    {/* Search Bar */}
    <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8B0000" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search workshops..."
              placeholderTextColor="#999"
            />
          </View>
        </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={32} color="#8B0000" />
            <Text style={styles.errorText}>{error}</Text>
            <RetryButton />
          </View>
        )}
        
        {/* Workshop Sections */}
        <WorkshopSection 
          title="Workshop nổi bật" 
          workshops={trendingWorkshops}
          loading={loading}
        />

        <WorkshopSection 
          title="Workshop mới nhất" 
          workshops={newestWorkshops}
          loading={loading}
        />
        
        {/* Bottom spacer */}
        <View style={{height: 100}} />
      </ScrollView>
      
      {/* Keep CustomTabBar as is */}
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  moreButton: {
    padding: 5,
  },
  moreButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#8B0000',
    marginRight: 4,
  },
  workshopList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  workshopListReversed: {
    flexDirection: 'row-reverse',
    paddingLeft: 10,
    paddingRight: 20,
  },
  workshopCard: {
    width: width * 0.65,
    marginRight: 15,
    marginBottom: 5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  cardInner: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  workshopImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentContainer: {
    padding: 16,
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    lineHeight: 22,
  },
  workshopDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  errorContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(139,0,0,0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#8B0000',
    marginVertical: 10,
    textAlign: 'center',
    fontSize: 15,
  },
  retryButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
