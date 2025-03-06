import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import SortPopup from '../../components/SortPopup';
import MoreButton from '../../components/MoreButton';
import { koiData } from '../../constants/koiData';
import { pondData } from '../../constants/koiPond';
import { images } from '../../constants/images';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Koi');
  const [sortVisible, setSortVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('all');
  const [displayData, setDisplayData] = useState(koiData);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (tab === 'Koi') {
      setDisplayData(koiData);
    } else if (tab === 'Pond') {
      setDisplayData(pondData);
    }
    setCurrentSort('all');
  };

  const handleSort = (sortType) => {
    setCurrentSort(sortType);
    let sortedList = [...displayData];
    switch (sortType) {
      case 'destiny':
        sortedList.sort((a, b) => a.variant.localeCompare(b.variant));
        break;
      case 'size':
        sortedList.sort((a, b) => a.size - b.size);
        break;
      case 'comp':
        sortedList.sort((a, b) => b.likes - a.likes);
        break;
      default:
        // 'all' case - restore original order
        sortedList = [...koiData];
    }
    setDisplayData(sortedList);
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
          <Text style={styles.tabText}>Hồ cá</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Other' && styles.selectedTab]}
          onPress={() => handleTabChange('Other')}
        >
          <Text style={styles.tabText}>Khác</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {displayData.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image 
                source={images[item.imageName]} 
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
                <MoreButton koi={item} />
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <SortPopup 
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        onSort={handleSort}
        currentSort={currentSort}
      />
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
});

