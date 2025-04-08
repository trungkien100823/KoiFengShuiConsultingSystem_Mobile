import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { consultingCategories, consultingAPI, consultants as fallbackConsultants } from '../../constants/consulting';

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
        <Text style={styles.title}>Bạn Thích Gì?</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Tìm kiếm Master..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={20} color="#666" />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setSortVisible(true)}
        >
          <Ionicons name="filter" size={32} color="#8B0000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <View style={styles.carouselContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Loading consultants...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchConsultants}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : consultants && consultants.length > 0 ? (
            <>
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

              <ScrollView 
                horizontal
                pagingEnabled
                snapToInterval={cardWidth + 20}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onMomentumScrollEnd={handleScroll}
              >
                {consultants.map((consultant, index) => {
                  
                  return (
                    <View key={consultant.id || index} style={[styles.consultantWrapper, { width: cardWidth }]}>
                      <TouchableOpacity 
                        style={styles.consultantCard}
                        onPress={() => router.push({
                          pathname: '/consultant_details',
                          params: { consultantId: consultant.id }
                        })}
                      >
                        <Text style={styles.consultantTitle}>{consultant.title || 'Master'}</Text>
                        <Image 
                          source={consultant.image} 
                          style={styles.consultantImage}
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
                  );
                })}
              </ScrollView>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => router.push({
                    pathname: '/(tabs)/OfflineOnline',
                    params: { consultantId: consultants[activeIndex]?.id }
                  })}
                >
                  <Text style={styles.bookButtonText}>Book now</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No consultants available</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  filterButton: {
    padding: 8,
    marginRight: -8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 5,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B0000',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  selectedTabText: {
    color: '#8B0000',
    fontWeight: '500',
  },
  carouselContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingRight: -30,
    paddingBottom: 20,
  },
  consultantWrapper: {
    marginLeft: -10,
    marginRight: 20,
    height: 420,
  },
  consultantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginRight: 20,
  },
  consultantTitle: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#8B0000',
    color: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    zIndex: 1,
    fontSize: 12,
    fontWeight: 'bold',
  },
  consultantImage: {
    width: '100%',
    height: 320,
  },
  cardContent: {
    padding: 10,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 5,
    marginLeft: 10,
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  bookButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
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
    minHeight: 300,
  },
  errorText: {
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
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
