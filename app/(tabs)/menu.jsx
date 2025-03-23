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
import { koiAPI } from '../../constants/koiData';
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
  const [hasShownAlert, setHasShownAlert] = useState(false);

  const fetchUserKoi = async () => {
    try {
      setIsLoading(true);
      const data = await koiAPI.getUserKoi();
      if (Array.isArray(data)) {
        setDisplayData(data);
        if (data[0]?.message && !hasShownAlert) {
          Alert.alert(
            "Thông báo",
            data[0].message,
            [{ text: "OK" }]
          );
          setHasShownAlert(true);
        }
      } else {
        setDisplayData([]);
      }
    } catch (error) {
      console.error('Error fetching Koi:', error);
      setDisplayData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPonds = async () => {
    try {
      setIsLoading(true);
      const data = await pondAPI.getAllPonds();
      if (Array.isArray(data)) {
        setDisplayData(data);
      } else {
        setDisplayData([]);
      }
    } catch (error) {
      console.error('Error fetching Ponds:', error);
      setDisplayData([]);
      Alert.alert(
        "Thông báo",
        "Không thể tải danh sách hồ cá",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (sortType) => {
    setCurrentSort(sortType);
    if (sortType === 'all' || sortType === 'destiny') {
      fetchUserKoi();
    }
  };

  const handleTabChange = async (tab) => {
    if (tab === selectedTab) return;
    
    setSelectedTab(tab);
    setIsLoading(true);
    try {
      if (tab === 'Koi') {
        await fetchUserKoi();
      } else if (tab === 'Pond') {
        await fetchUserPonds();
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

  useEffect(() => {
    fetchUserKoi();
    return () => {
      setDisplayData([]);
      setHasShownAlert(false);
    };
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
              <View key={`${selectedTab}-${item.koiPondId || index}`} style={styles.card}>
                <Image 
                  source={
                    selectedTab === 'Pond' 
                      ? (item.imageUrl ? {uri: item.imageUrl} : images['buddha.png'])
                      : (item.imageName && images[item.imageName] ? images[item.imageName] : images['buddha.png'])
                  } 
                  style={styles.image} 
                />
                <View style={styles.infoContainer}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.name}>
                      {selectedTab === 'Pond' ? item.pondName : item.name}
                    </Text>
                  </View>
                  <MoreButton 
                    item={{
                      ...item,
                      type: selectedTab
                    }} 
                    type={selectedTab}
                  />
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  variant: {
    fontSize: 24,
    color: '#8B0000',
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

