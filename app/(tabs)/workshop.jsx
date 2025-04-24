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

const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);

// Featured workshop card with larger display
const FeaturedWorkshopCard = ({ workshop }) => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      style={styles.featuredCard}
      activeOpacity={0.9}
      onPress={() => {
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
    >
      <View style={styles.featuredImageContainer}>
        <Image
          source={workshop.image}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        />
        <View style={styles.featuredDetails}>
          <View style={styles.featuredBadge}>
            <Ionicons name="flame" size={scale(12)} color="#FFF" />
            <Text style={styles.featuredBadgeText}>Trending</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{workshop.title}</Text>
          
          <View style={styles.featuredMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={scale(14)} color="#FFF" />
              <Text style={styles.metaText} numberOfLines={1}>{workshop.location}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={scale(14)} color="#FFF" />
              <Text style={styles.metaText}>{workshop.date}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Regular workshop card for horizontal lists
const WorkshopCard = ({ workshop }) => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      style={styles.workshopCard}
      activeOpacity={0.9}
      onPress={() => {
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
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={workshop.image}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{workshop.title}</Text>
        
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaItem}>
            <Ionicons name="location-outline" size={scale(12)} color="#8B0000" />
            <Text style={styles.cardMetaText} numberOfLines={1}>{workshop.location}</Text>
          </View>
          
          <View style={styles.cardMetaItem}>
            <Ionicons name="calendar-outline" size={scale(12)} color="#8B0000" />
            <Text style={styles.cardMetaText}>{workshop.date}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Section component with improved styling
const WorkshopSection = ({ title, workshops, loading, icon }) => {
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={icon} size={scale(18)} color="#8B0000" />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      </View>
    );
  }

  if (workshops.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={icon} size={scale(18)} color="#8B0000" />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={scale(36)} color="#8B0000" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No workshops available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon} size={scale(18)} color="#8B0000" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      
      <FlatList
        horizontal
        data={workshops}
        renderItem={({ item }) => <WorkshopCard workshop={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.cardList}
        showsHorizontalScrollIndicator={false}
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
  const [featuredWorkshop, setFeaturedWorkshop] = useState(null);
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
  
      // Set featured workshop from trending
      if (processedTrending.length > 0) {
        setFeaturedWorkshop(processedTrending[0]);
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
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(139,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          
          {/* Updated Header Section to match courses.jsx */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
          </View>
          
          {/* Enhanced Search Bar to match courses.jsx */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ở đây"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(searchQuery)}>
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={scale(50)} color="#FF9999" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton />
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Featured Workshop */}
              {!loading && featuredWorkshop && (
                <View style={styles.featuredSection}>
                  <Text style={styles.featuredHeading}>Featured Workshop</Text>
                  <FeaturedWorkshopCard workshop={featuredWorkshop} />
                </View>
              )}
              
              {/* Search Results Section */}
              {searchQuery.trim() !== '' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Ionicons name="search" size={scale(18)} color="#8B0000" />
                      <Text style={styles.sectionTitle}>Search Results</Text>
                    </View>
                  </View>
                  
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#8B0000" />
                    </View>
                  ) : (
                    <View>
                      {filterWorkshops([...trendingWorkshops, ...newestWorkshops]).length > 0 ? (
                        <FlatList
                          horizontal
                          data={filterWorkshops([...trendingWorkshops, ...newestWorkshops])}
                          renderItem={({ item }) => <WorkshopCard workshop={item} />}
                          keyExtractor={(item, index) => `search-${item.id}-${index}`}
                          contentContainerStyle={styles.cardList}
                          showsHorizontalScrollIndicator={false}
                        />
                      ) : (
                        <View style={styles.emptyContainer}>
                          <Ionicons name="search-outline" size={scale(36)} color="#8B0000" style={styles.emptyIcon} />
                          <Text style={styles.emptyText}>No workshops match your search</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
              
              {/* Trending Workshops Section */}
              <WorkshopSection 
                title="Workshop đang nổi" 
                workshops={trendingWorkshops}
                loading={loading}
                icon="flame-outline"
              />

              {/* Newest Workshops Section */}
              <WorkshopSection 
                title="Workshop mới nhất" 
                workshops={newestWorkshops}
                loading={loading}
                icon="time-outline"
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
    paddingHorizontal: width * 0.04,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight + 10,
    paddingBottom: width * 0.03,
    marginTop: Platform.OS === 'ios' ? -20 : -10,
  },
  headerTitle: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: width * 0.04,
    marginBottom: width * 0.04,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 30, 30, 0.6)',
    borderRadius: width * 0.06,
    paddingHorizontal: width * 0.04,
    height: width * 0.12,
  },
  searchInput: {
    flex: 1,
    fontSize: width * 0.04,
    color: '#FFFFFF',
    paddingVertical: width * 0.025,
  },
  searchButton: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: width * 0.0375,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: scale(100),
  },
  
  // Featured Workshop Styles
  featuredSection: {
    marginBottom: scale(24),
    paddingHorizontal: scale(16),
  },
  featuredHeading: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: scale(12),
  },
  featuredCard: {
    width: '100%',
    height: scale(200),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  featuredImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  featuredDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(16),
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(12),
    alignSelf: 'flex-start',
    marginBottom: scale(8),
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: 'bold',
    marginLeft: scale(4),
  },
  featuredTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: scale(8),
  },
  featuredMeta: {
    marginTop: scale(4),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: scale(14),
    marginLeft: scale(6),
  },
  
  // Section Styles
  section: {
    marginBottom: scale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: scale(12),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: scale(8),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: scale(14),
    color: '#FFF',
    fontWeight: '500',
  },
  
  // Card List
  cardList: {
    paddingLeft: scale(16),
    paddingRight: scale(8),
  },
  
  // Card Styles
  workshopCard: {
    width: width * 0.65,
    marginRight: scale(12),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
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
  cardImageContainer: {
    width: '100%',
    height: scale(120),
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
  },
  cardContent: {
    padding: scale(12),
  },
  cardTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(8),
    height: scale(44),
  },
  cardMeta: {
    marginTop: scale(4),
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  cardMetaText: {
    color: '#666',
    fontSize: scale(12),
    marginLeft: scale(4),
  },
  
  // Loading Styles
  loadingContainer: {
    padding: scale(20),
    alignItems: 'center',
  },
  
  // Empty States
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: scale(20),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(16),
    height: scale(150),
  },
  emptyIcon: {
    marginBottom: scale(8),
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    textAlign: 'center',
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    padding: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    marginBottom: scale(10),
  },
  errorText: {
    color: '#FF9999',
    marginVertical: scale(10),
    textAlign: 'center',
    fontSize: scale(16),
  },
  retryButton: {
    marginTop: scale(20),
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(16),
  },
  
  bottomPadding: {
    height: scale(80),
  },
});
