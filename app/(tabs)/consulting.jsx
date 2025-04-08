import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, TextInput, ActivityIndicator } from 'react-native';
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Tư vấn</Text>
          <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <View style={styles.moreButtonCircle}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#8B0000" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8B0000" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm ở đây"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setSortVisible(true)}
        >
          <Ionicons name="filter" size={32} color="#8B0000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        {/* Hiển thị kết quả tìm kiếm khi có từ khóa */}
        {searchQuery.trim() !== '' && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Searching Masters</Text>
            {filterConsultants(consultants).length > 0 ? (
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.searchScrollContent}
              >
                {filterConsultants(consultants).map((consultant, index) => (
                  <View key={`search-${consultant.id || index}`} style={styles.searchConsultantWrapper}>
                    <TouchableOpacity 
                      style={styles.searchConsultantCard}
                      onPress={() => router.push({
                        pathname: '/consultant_details',
                        params: { consultantId: consultant.id }
                      })}
                    >
                      <Text style={styles.searchConsultantTitle}>{consultant.title || 'Master'}</Text>
                      <Image 
                        source={consultant.image} 
                        style={styles.searchConsultantImage}
                        resizeMode="cover" 
                      />
                      <View style={styles.cardContent}>
                        <Text style={styles.consultantName}>{consultant.name || 'Consultant'}</Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        {renderStars(consultant.rating || 0)}
                        <Text style={styles.ratingText}>{(consultant.rating || 0).toFixed(1)}/5.0</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
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
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Đang tải danh sách chuyên gia...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={50} color="#8B0000" style={styles.errorIcon} />
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
              
              <ScrollView 
                horizontal
                pagingEnabled
                snapToInterval={cardWidth + 20}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onMomentumScrollEnd={handleScroll}
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
                          colors={['transparent', 'rgba(0,0,0,0.7)']}
                          style={styles.imageGradient}
                        />
                        <Text style={styles.consultantTitle}>{consultant.title || 'Master'}</Text>
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
                            <Ionicons name="star" size={16} color="#8B0000" />
                            <Text style={styles.specialtyText}>{consultant.specialty}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.buttonContainer}>
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
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="person-outline" size={60} color="#e0e0e0" />
              <Text style={styles.noDataTitle}>Không tìm thấy chuyên gia</Text>
              <Text style={styles.noDataText}>Vui lòng thử lại sau</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginTop: 30,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  moreButton: {
    padding: 8,
  },
  moreButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 15,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  carouselContainer: {
    flex: 1,
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
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#8B0000',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
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
  consultantTitle: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#8B0000',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
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
  buttonContainer: {
    marginVertical: 16,
  },
  bookButton: {
    borderRadius: 12,
    marginTop: -50,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#8B0000',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchResultsContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 10,
    paddingHorizontal: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
    paddingLeft: 8,
  },
  searchScrollContent: {
    paddingBottom: 10,
  },
  searchConsultantWrapper: {
    marginRight: 10,
    height: 280,
    width: width * 0.43,
  },
  searchConsultantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    height: '100%',
  },
  searchConsultantTitle: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#8B0000',
    color: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 5,
    zIndex: 1,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchConsultantImage: {
    width: '100%',
    height: 180,
  },
  emptySearchResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }
});
