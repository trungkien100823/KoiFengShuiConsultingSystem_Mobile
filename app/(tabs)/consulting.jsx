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
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { consultingCategories, consultingAPI, consultants as fallbackConsultants } from '../../constants/consulting';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.8;

export default function ConsultingScreen() {
  const router = useRouter();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState(consultingCategories[0]);
  const [sortVisible, setSortVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollX = React.useRef(new Animated.Value(0)).current;

  // Hàm xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Hàm lọc Master theo từ khóa tìm kiếm
  const filterConsultants = (consultants) => {
    if (!searchQuery.trim()) return consultants;
    
    return consultants.filter(consultant => 
      consultant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      const consultantData = await consultingAPI.getAllConsultants();
      console.log("Consultant data retrieved:", consultantData);
      
      setConsultants(consultantData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching consultants:', err);
      setError('Failed to load consultants. Using sample data.');
      setConsultants(Array.isArray(fallbackConsultants) ? fallbackConsultants : []);
      setLoading(false);
    }
  };

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

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.backgroundImage}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ở đây"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
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
                        key={`search-${consultant.id || index}`}
                        style={styles.searchConsultantCard}
                        onPress={() => router.push({
                          pathname: '/consultant_details',
                          params: { consultantId: consultant.id }
                        })}
                      >
                        <LinearGradient
                          colors={['rgba(139, 0, 0, 0.8)', 'rgba(80, 0, 0, 0.9)']}
                          style={styles.searchCardGradient}
                        >
                          <Image 
                            source={consultant.image} 
                            style={styles.searchConsultantImage}
                            resizeMode="cover" 
                          />
                          <View style={styles.searchCardContent}>
                            <Text style={styles.searchConsultantTitle}>{consultant.title || 'Master'}</Text>
                            <Text style={styles.searchConsultantName}>{consultant.name || 'Consultant'}</Text>
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
                      <View key={consultant.id || index} style={[styles.consultantWrapper, { width: cardWidth }]}>
                        <TouchableOpacity 
                          style={styles.consultantCard}
                          onPress={() => router.push({
                            pathname: '/consultant_details',
                            params: { consultantId: consultant.id }
                          })}
                        >
                          <View style={styles.imageWrapper}>
                            <Image 
                              source={consultant.image} 
                              style={styles.consultantImage}
                              resizeMode="cover" 
                            />
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.8)']}
                              style={styles.imageGradient}
                            />
                            <View style={styles.consultantTitleBadge}>
                              <Text style={styles.consultantTitle}>{consultant.title || 'Master'}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.cardContent}>
                            <Text style={styles.consultantName}>{consultant.name || 'Consultant'}</Text>
                            
                            <View style={styles.ratingContainer}>
                              <View style={styles.starsContainer}>
                                {renderStars(consultant.rating || 0)}
                              </View>
                              <Text style={styles.ratingText}>
                                {(consultant.rating || 0).toFixed(1)}/5.0
                              </Text>
                            </View>
                            
                            {consultant.specialty && (
                              <View style={styles.specialtyContainer}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.specialtyText}>{consultant.specialty}</Text>
                              </View>
                            )}

                            {consultant.tags && (
                              <View style={styles.tagsContainer}>
                                {consultant.tags.slice(0, 3).map((tag, i) => (
                                  <View key={i} style={styles.tagBadge}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
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
                      params: { consultantId: consultants[activeIndex]?.id }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 5,
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
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 10,
  },
  searchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentScrollView: {
    flex: 1,
  },
  searchResultsContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  searchScrollContent: {
    paddingTop: 8,
  },
  searchConsultantCard: {
    width: 160,
    height: 220,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchCardGradient: {
    flex: 1,
    borderRadius: 12,
  },
  searchConsultantImage: {
    width: '100%',
    height: 120,
  },
  searchCardContent: {
    padding: 10,
  },
  searchConsultantTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchConsultantName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  searchRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchRatingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 4,
  },
  emptySearchResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  emptySearchText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  scrollContent: {
    paddingVertical: 8,
  },
  consultantWrapper: {
    marginRight: 20,
    height: 450,
  },
  consultantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    height: '100%',
  },
  imageWrapper: {
    position: 'relative',
    height: 320,
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
  consultantTitleBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  consultantTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#8B0000',
    fontSize: 12,
  },
  bookButton: {
    marginBottom: 24,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookButtonIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    marginVertical: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
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
    borderRadius: 12,
    marginVertical: 20,
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
  }
});
