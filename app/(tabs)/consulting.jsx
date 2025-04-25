import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  TextInput, 
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  Animated,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { consultingCategories } from '../../constants/consulting';
import { API_CONFIG } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.8;

// Define scale function directly in the component
const scale = (size) => Math.round(width * size / 375);

export default function ConsultingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState(consultingCategories[0]);
  const [sortVisible, setSortVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Hàm xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Hàm lọc Master theo từ khóa tìm kiếm
  const filterConsultants = (consultants) => {
    if (!searchQuery.trim()) return consultants;
    
    return consultants.filter(consultant => {
      const consultantName = consultant.masterName || '';
      return consultantName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_CONFIG.baseURL}/api/Master/get-all`);
      
      const responseData = await response.json();
      console.log("API Response:", responseData);
      
      if (responseData.isSuccess && Array.isArray(responseData.data)) {
        setConsultants(responseData.data);
      } else {
        throw new Error(responseData.message || 'Không thể tải danh sách master');
      }
    } catch (err) {
      console.error('Error fetching consultants:', err);
      setError(err.message || 'Không thể tải danh sách master');
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused - fetching consultants...');
      let isActive = true;

      const loadData = async () => {
        try {
          await fetchConsultants();
        } catch (error) {
          console.error('Error in loadData:', error);
        }
      };

      loadData();

      return () => {
        isActive = false;
        // Cleanup function when screen loses focus
        setLoading(false);
        setError(null);
      };
    }, [])
  );

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (cardWidth + 20));
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    // Filter consultants based on tab selection
    // This would be implemented with actual filtering logic
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={16} color="#FFD700" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color="#FFD700" />
        );
      }
    }
    
    return stars;
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {consultants.map((_, i) => {
          const inputRange = [
            (i - 1) * (cardWidth + 20),
            i * (cardWidth + 20),
            (i + 1) * (cardWidth + 20),
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`dot-${i}`}
              style={[
                styles.paginationDot,
                { 
                  width: dotWidth,
                  opacity: opacity
                },
                i === activeIndex && styles.paginationDotActive
              ]}
            />
          );
        })}
      </View>
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    fetchConsultants()
      .then(() => {
        console.log('Data refreshed successfully');
        setRefreshing(false);
      })
      .catch(error => {
        console.error('Error refreshing data:', error);
        setRefreshing(false);
      });
  }, []);

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.backgroundImage}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={[styles.container, {paddingTop: insets.top}]}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ở đây"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={handleSearch}
                onSubmitEditing={() => {/* preserve existing search functionality */}}
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={() => {/* preserve existing search functionality */}}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false} refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8B0000']}
              tintColor="#FFFFFF"
              title="Refreshing..."
              titleColor="#FFFFFF"
              progressBackgroundColor="rgba(255, 255, 255, 0.2)"
            />
          }>
            {/* Hiển thị kết quả tìm kiếm khi có từ khóa */}
            {searchQuery.trim() !== '' && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchResultsTitle}>Kết Quả Tìm Kiếm</Text>
                {filterConsultants(consultants).length > 0 ? (
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.searchScrollContent}
                  >
                    {filterConsultants(consultants).map((consultant, index) => (
                      <TouchableOpacity 
                        key={`search-${consultant.masterId || index}`}
                        style={styles.searchConsultantCard}
                        onPress={() => router.push({
                          pathname: '/consultant_details',
                          params: { masterId: consultant.masterId }
                        })}
                      >
                        <LinearGradient
                          colors={['rgba(139, 0, 0, 0.8)', 'rgba(80, 0, 0, 0.9)']}
                          style={styles.searchCardGradient}
                        >
                          <Image 
                            source={consultant.imageUrl ? { uri: consultant.imageUrl } : require('../../assets/images/buddha.png')} 
                            style={styles.searchConsultantImage}
                            resizeMode="cover" 
                          />
                          <View style={styles.searchCardContent}>
                            <Text style={styles.searchConsultantTitle}>{consultant.title || 'Master'}</Text>
                            <Text style={styles.searchConsultantName}>{consultant.masterName || 'Chưa có tên'}</Text>
                            <View style={styles.searchRatingContainer}>
                              {renderStars(consultant.rating || 0)}
                              <Text style={styles.searchRatingText}>{(consultant.rating || 0).toFixed(1)}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptySearchResults}>
                    <Text style={styles.emptySearchText}>Không tìm thấy Master nào phù hợp</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.carouselContainer}>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Đang tải danh sách chuyên gia...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={50} color="#FFFFFF" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchConsultants}>
                    <LinearGradient
                      colors={['#8B0000', '#600000']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.retryButtonGradient}
                    >
                      <Text style={styles.retryButtonText}>Thử lại</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : consultants && consultants.length > 0 ? (
                <>
                  <Animated.ScrollView 
                    horizontal
                    pagingEnabled
                    snapToInterval={cardWidth + 20}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    onScroll={Animated.event(
                      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                      { useNativeDriver: false }
                    )}
                    onMomentumScrollEnd={handleScroll}
                    scrollEventThrottle={16}
                  >
                    {consultants.map((consultant, index) => (
                      <View key={consultant.masterId || index} style={[styles.consultantWrapper, { width: cardWidth }]}>
                        <TouchableOpacity 
                          style={styles.consultantCard}
                          onPress={() => router.push({
                            pathname: '/consultant_details',
                            params: { masterId: consultant.masterId }
                          })}
                        >
                          <View style={styles.imageWrapper}>
                            <Image 
                              source={consultant.imageUrl ? { uri: consultant.imageUrl } : require('../../assets/images/buddha.png')} 
                              style={styles.consultantImage}
                              resizeMode="cover"
                            />
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.8)']}
                              style={styles.imageGradient}
                            />
                          </View>
                          
                          <View style={styles.cardContent}>
                            <Text style={styles.consultantName}>{consultant.masterName || 'Chưa có tên'}</Text>
                            <View style={styles.ratingContainer}>
                              <View style={styles.starsContainer}>
                                {renderStars(consultant.rating || 0)}
                              </View>
                              <Text style={styles.ratingText}>{(consultant.rating || 0).toFixed(1)}/5.0</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </Animated.ScrollView>
                  
                  {renderPagination()}
                  
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={() => router.push({
                      pathname: '/(tabs)/OfflineOnline',
                      params: { consultantId: consultants[activeIndex]?.masterId }
                    })}
                  >
                    <LinearGradient
                      colors={['#8B0000', '#600000']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.bookButtonGradient}
                    >
                      <Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
                      <Ionicons name="calendar-outline" size={20} color="#FFFFFF" style={styles.bookButtonIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Ionicons name="person-outline" size={60} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.noDataTitle}>Không tìm thấy chuyên gia</Text>
                  <Text style={styles.noDataText}>Vui lòng thử lại sau</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
      
      <CustomTabBar />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    alignItems: 'flex-start',
    marginTop: Platform.OS === 'ios' ? -20 : 5,
  },
  headerTitle: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    marginBottom: scale(16),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 30, 30, 0.6)',
    borderRadius: scale(20),
    paddingHorizontal: scale(16),
    height: Platform.OS === 'ios' ? 50 : 44,
  },
  searchInput: {
    flex: 1,
    fontSize: scale(16),
    color: '#FFFFFF',
    paddingVertical: scale(10),
  },
  searchButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  contentScrollView: {
    flex: 1,
  },
  searchResultsContainer: {
    marginBottom: 20,
    paddingHorizontal: width * 0.05,
  },
  searchResultsTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  searchScrollContent: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchConsultantCard: {
    width: width * 0.4,
    height: width * 0.55,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  searchCardGradient: {
    flex: 1,
    borderRadius: 16,
  },
  searchConsultantImage: {
    width: '100%',
    height: width * 0.3,
  },
  searchCardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  searchConsultantTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  searchConsultantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  searchRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  searchRatingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptySearchResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    height: 100,
  },
  emptySearchText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  carouselContainer: {
    paddingHorizontal: width * 0.05,
  },
  consultantWrapper: {
    marginRight: 20,
    height: width * 0.95,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  consultantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    height: '100%',
  },
  imageWrapper: {
    position: 'relative',
    height: '75%',
  },
  consultantImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flex: 1,
    justifyContent: 'center',
  },
  consultantName: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  bookButton: {
    marginBottom: 24,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  bookButtonIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    marginVertical: 20,
    height: width * 0.6,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.08,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    marginVertical: 20,
    minHeight: width * 0.6,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  retryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    marginVertical: 20,
    minHeight: width * 0.5,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
