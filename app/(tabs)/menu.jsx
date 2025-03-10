import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import SortPopup from '../../components/SortPopup';
import MoreButton from '../../components/MoreButton';
import { koiAPI, koiData } from '../../constants/koiData';
import { pondAPI, pondData, pondImages } from '../../constants/koiPond';
import { images } from '../../constants/images';
import CustomTabBar from '../../components/ui/CustomTabBar';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Koi');
  const [sortVisible, setSortVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('all');
  const [displayData, setDisplayData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllKoi = async () => {
    try {
      setIsLoading(true);
      const data = await koiAPI.getAllKoi();
      setDisplayData(data);
    } catch (error) {
      console.error('Error fetching Koi:', error);
      setDisplayData(koiData);
      Alert.alert(
        "Loading Data",
        "Unable to fetch from server. Using local data instead.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserKoi = async () => {
    try {
      setIsLoading(true);
      const data = await koiAPI.getUserKoi();
      setDisplayData(data);
    } catch (error) {
      console.error('Error fetching user Koi:', error);
      const filteredKoi = koiData.filter(koi => koi.variant === 'Jin');
      setDisplayData(filteredKoi);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (sortType) => {
    setCurrentSort(sortType);
    if (sortType === 'all') {
      fetchAllKoi();
    } else if (sortType === 'destiny') {
      fetchUserKoi();
    }
  };

  const handleTabChange = async (tab) => {
    setSelectedTab(tab);
    setIsLoading(true);
    try {
      if (tab === 'Koi') {
        const data = await koiAPI.getAllKoi();
        setDisplayData(data);
      } else if (tab === 'Pond') {
        const data = await pondAPI.getAllPonds();
        setDisplayData(data);
      } else {
        setDisplayData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setDisplayData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (id) => {
    setDisplayData(prevData => 
      prevData.map(item => {
        if (item.id === id) {
          return {
            ...item,
            likes: item.liked ? item.likes - 1 : item.likes + 1,
            liked: !item.liked,
          };
        }
        return item;
      })
    );
  };

  const handleItemPress = (item) => {
    console.log('Selected item:', item);
    if (selectedTab === 'Koi') {
      router.push({
        pathname: '/(tabs)/fish_details',
        params: { id: item.id }
      });
    } else if (selectedTab === 'Pond') {
      router.push({
        pathname: '/(tabs)/pond_details',
        params: { id: item.id }
      });
    }
  };

  const renderItem = (item, index) => {
    if (!item) {
      console.log('Invalid item:', item);
      return null;
    }

    // Generate a unique key using both id and index
    const uniqueKey = `${selectedTab}-${item.id || index}`;

    return (
      <TouchableOpacity
        key={uniqueKey}
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.itemName}>
            {item.name || 'Unknown Name'}
          </Text>
          <Text style={styles.itemVariant}>
            {selectedTab === 'Koi' ? (item.variant || 'Unknown Variant') : (item.shape || 'Unknown Shape')}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          <MoreButton 
            item={item} 
            type={selectedTab}
          />
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    handleTabChange(selectedTab);
  }, []);

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
            placeholder="Tìm kiếm ở đây"
            style={styles.searchInput}
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

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Koi' && styles.selectedTab]}
          onPress={() => handleTabChange('Koi')}
        >
          <Text style={[styles.tabText, selectedTab === 'Koi' && styles.selectedTabText]}>Cá Koi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Pond' && styles.selectedTab]}
          onPress={() => handleTabChange('Pond')}
        >
          <Text style={[styles.tabText, selectedTab === 'Pond' && styles.selectedTabText]}>Hồ cá</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Other' && styles.selectedTab]}
          onPress={() => handleTabChange('Other')}
        >
          <Text style={[styles.tabText, selectedTab === 'Other' && styles.selectedTabText]}>Khác</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
          </View>
        ) : displayData && displayData.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {displayData.map((item, index) => (
              <View key={`${selectedTab}-${item.id || index}`} style={styles.card}>
                <Image 
                  source={selectedTab === 'Pond' ? pondImages[item.imageName] : images[item.imageName]} 
                  style={styles.image} 
                />
                <View style={styles.infoContainer}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.name}>
                      {item.name} 
                      {selectedTab === 'Koi' ? 
                        <Text style={styles.variant}> - {item.variant}</Text> :
                        <Text style={styles.variant}> - {item.shape}</Text>
                      }
                    </Text>
                    <TouchableOpacity 
                      style={styles.likesContainer}
                      onPress={() => handleLike(item.id)}
                    >
                      <Ionicons 
                        name={item.liked ? "heart" : "heart-outline"} 
                        size={28} 
                        color={item.liked ? "#FF0000" : "#666"} 
                      />
                      <Text style={styles.likesCount}>{item.likes}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.description}>{item.description}</Text>
                  {selectedTab === 'Pond' && item.features && (
                    <View style={styles.featuresContainer}>
                      {item.features.map((feature, index) => (
                        <Text key={index} style={styles.feature}>• {feature}</Text>
                      ))}
                    </View>
                  )}
                  <MoreButton item={item} type={selectedTab} />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available</Text>
          </View>
        )}
      </ScrollView>

      <SortPopup 
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        onSort={handleSort}
        currentSort={currentSort}
        isLoading={isLoading}
      />
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 70 : 50,
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
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  card: {
    width: width,
    padding: 20,
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    marginBottom: 15,
  },
  infoContainer: {
    padding: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  variant: {
    color: '#8B0000',
  },
  likesContainer: {
    padding: 8,
    marginRight: -8,
  },
  likesCount: {
    marginLeft: 5,
  },
  description: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  featuresContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  feature: {
    color: '#666',
    marginBottom: 5,
    fontSize: 14,
  },
});

