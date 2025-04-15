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
  Dimensions,
  ImageBackground,
  Platform,
  StatusBar
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
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

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
          price: workshop.price,
        };
        
        navigation.navigate('workshopDetails', { 
          workshop: workshopToSend,
          imageId: workshop.id,
          resetTicketCount: true
        });
      }}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={workshop.image}
          style={styles.workshopImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
      </View>
      <View style={styles.workshopInfo}>
        <Text style={styles.workshopTitle} numberOfLines={2}>{workshop.title}</Text>
        <View style={styles.workshopDetails}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#8B0000" />
            <Text style={styles.workshopLocation} numberOfLines={1}>{workshop.location}</Text>
          </View>
          
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#8B0000" />
            <Text style={styles.workshopDate}>{workshop.date}</Text>
          </View>
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
          <LinearGradient
            colors={['#8B0000', '#600000']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.sectionTitleGradient}
          >
            <Text style={styles.sectionTitleText}>{title}</Text>
          </LinearGradient>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải workshops...</Text>
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
          <Text style={styles.sectionTitleText}>{title}</Text>
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
        snapToInterval={width * 0.65 + 16}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
};

export default function Workshop() {
  const [trendingWorkshops, setTrendingWorkshops] = useState([]);
  const [newestWorkshops, setNewestWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  // Hàm xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Hàm lọc workshop theo từ khóa tìm kiếm
  const filterWorkshops = (workshops) => {
    if (!searchQuery.trim()) return workshops;
    
    return workshops.filter(workshop => 
      workshop.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Lỗi xác thực', 'Token không tồn tại, vui lòng đăng nhập lại');
        navigation.navigate('login');
        return;
      }
      
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
      
      // Gọi APIs riêng biệt không dùng Promise.all để xác định lỗi chính xác hơn
      let trendingData = [];
      let newestData = [];
      
      try {
        const trendingResponse = await axios.get(trendingUrl, config);
        trendingData = trendingResponse.data?.data || [];
      } catch (trendingError) {
        // Không hiển thị log lỗi
      }
      
      try {
        const newestResponse = await axios.get(newestUrl, config);
        newestData = newestResponse.data?.data || [];
      } catch (newestError) {
        // Không hiển thị log lỗi
      }
  
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
            image: { uri: workshop.imageUrl } // Sử dụng imageUrl từ API
          };
        } catch (error) {
          // Không hiển thị log lỗi
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
  
      // Kiểm tra và hiển thị alert khi không có dữ liệu
      if (processedTrending.length === 0 && processedNewest.length === 0) {
        Alert.alert('Thông báo', 'Không tìm thấy workshops nào');
      }
  
      // Cập nhật state ngay cả khi một trong các API thất bại
      setTrendingWorkshops(processedTrending);
      setNewestWorkshops(processedNewest);
  
      // Chỉ hiển thị lỗi khi cả hai API đều không trả về dữ liệu
      if (!processedTrending.length && !processedNewest.length) {
        setError('Không có workshop nào được tìm thấy');
      }
  
    } catch (error) {
      // Không hiển thị log lỗi
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
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#8B0000', '#600000']}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.retryButtonGradient}
      >
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.backgroundImage}
    >
      <StatusBar translucent barStyle="light-content" backgroundColor="rgba(0,0,0,0.3)" />
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(139,0,0,0.6)', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
          <View style={[styles.headerContainer, {paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 10}]}>
            <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ở đây"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor="#FFFFFF"
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={handleSearch}
                activeOpacity={0.7}
                hitSlop={{top: 8, right: 8, bottom: 8, left: 8}}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={50} color="#FF9999" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton />
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
              overScrollMode="never"
              bounces={Platform.OS === 'ios'}
            >
              {/* Hiển thị kết quả tìm kiếm khi có từ khóa */}
              {searchQuery.trim() !== '' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <LinearGradient
                      colors={['#8B0000', '#600000']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.sectionTitleGradient}
                    >
                      <Text style={styles.sectionTitleText}>Searching workshops</Text>
                    </LinearGradient>
                  </View>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#8B0000" />
                      <Text style={styles.loadingText}>Đang tải kết quả...</Text>
                    </View>
                  ) : (
                    <FlatList
                      horizontal
                      data={[...filterWorkshops(trendingWorkshops), ...filterWorkshops(newestWorkshops)]}
                      renderItem={({ item }) => <WorkshopCard workshop={item} />}
                      keyExtractor={(item, index) => `search-${item.id}-${index}`}
                      contentContainerStyle={styles.workshopList}
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={width * 0.65 + 16}
                      decelerationRate="fast"
                      snapToAlignment="start"
                      ListEmptyComponent={
                        <View style={styles.emptySearchResults}>
                          <Ionicons name="search-outline" size={40} color="#ccc" />
                          <Text style={styles.emptySearchText}>Không tìm thấy workshop nào phù hợp</Text>
                        </View>
                      }
                    />
                  )}
                </View>
              )}
              
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
              
              <View style={styles.bottomPadding} />
            </ScrollView>
          )}

          <CustomTabBar />
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: Platform.OS === 'android' ? 0 : 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 30, 30, 0.6)',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    height: Platform.OS === 'ios' ? 44 : 42,
  },
  searchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionTitleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500',
  },
  workshopList: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
  },
  workshopListReversed: {
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 16,
  },
  workshopCard: {
    width: width * 0.65,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  workshopImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  workshopInfo: {
    padding: 16,
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    height: 44,
  },
  workshopDetails: {
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workshopLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  workshopDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8B0000',
    fontSize: 16,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 235, 0.2)',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,153,153,0.5)',
  },
  errorIcon: {
    marginBottom: 10,
  },
  errorText: {
    color: '#FF9999',
    marginVertical: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptySearchResults: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  bottomPadding: {
    height: 80,
  },
});
