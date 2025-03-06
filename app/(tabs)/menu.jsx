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

const { width } = Dimensions.get('window');

// Create an image mapping object
const fishImages = {
  'asagi.jpg': require('../../assets/images/asagi.jpg'),
  'kohaku.jpg': require('../../assets/images/kohaku.jpg'),
  'showa.jpg': require('../../assets/images/showa.jpg'),
  'shiro.jpg': require('../../assets/images/shiro.jpg'),
  'kujaku.jpg': require('../../assets/images/kujaku.jpg'),
};

const koiData = [
  {
    id: 1,
    name: 'Asagi',
    variant: 'Jin',
    description: 'Cá Koi Asagi là một trong những giống cá Koi cổ xưa và mang tính biểu tượng nhất, được đánh giá cao về màu sắc hài hòa và thanh lịch.',
    imageName: 'asagi.jpg',
    likes: 21,
    liked: false,
  },
  {
    id: 2,
    name: 'Kohaku',
    variant: 'Tancho',
    description: 'Kohaku được coi là vua của các loài Koi, với thân hình trắng và các hoa văn đỏ. Biến thể Tancho có một đốm đỏ duy nhất trên đầu.',
    imageName: 'kohaku.jpg',
    likes: 18,
    liked: false,
  },
  {
    id: 3,
    name: 'Showa',
    variant: 'Sanshoku',
    description: 'Showa Sanshoku là cá Koi ba màu với nền đen, điểm xuyết các hoa văn đỏ và trắng, tạo nên vẻ ngoài đậm nét và ấn tượng.',
    imageName: 'showa.jpg',
    likes: 15,
    liked: false,
  },
  {
    id: 4,
    name: 'Shiro Utsuri',
    variant: 'Platinum',
    description: 'Shiro Utsuri là cá Koi hai màu với nền trắng và các đốm đen. Nổi tiếng với sự tương phản ấn tượng và kiểu bơi thanh lịch.',
    imageName: 'shiro.jpg',
    likes: 25,
    liked: false,
  },
  {
    id: 5,
    name: 'Kujaku',
    variant: 'Metallic',
    description: 'Kujaku là giống Koi ánh kim với nền trắng cùng các hoa văn cam, đỏ và đen chảy dọc thân, giống như bộ lông của chim công.',
    imageName: 'kujaku.jpg',
    likes: 19,
    liked: false,
  },
];

export default function MenuScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState('Koi');
  const [koiList, setKoiList] = useState(koiData);
  const navigation = useNavigation();
  const router = useRouter();

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  const handleLike = (id) => {
    setKoiList(prevData => 
      prevData.map(koi => {
        if (koi.id === id) {
          return {
            ...koi,
            likes: koi.liked ? koi.likes - 1 : koi.likes + 1,
            liked: !koi.liked,
          };
        }
        return koi;
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
            placeholder="Search content..."
            style={styles.searchInput}
          />
          <Ionicons name="search" size={20} color="#666" />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#8B0000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Koi' && styles.selectedTab]}
          onPress={() => setSelectedTab('Koi')}
        >
          <Text style={[styles.tabText, selectedTab === 'Koi' && styles.selectedTabText]}>Koi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Pond' && styles.selectedTab]}
          onPress={() => setSelectedTab('Pond')}
        >
          <Text style={styles.tabText}>Pond</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'Other' && styles.selectedTab]}
          onPress={() => setSelectedTab('Other')}
        >
          <Text style={styles.tabText}>Other</Text>
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {koiList.map((koi) => (
            <View key={koi.id} style={styles.card}>
              <Image source={fishImages[koi.imageName]} style={styles.image} />
              <View style={styles.infoContainer}>
                <View style={styles.nameContainer}>
                  <Text style={styles.name}>{koi.name} - <Text style={styles.variant}>{koi.variant}</Text></Text>
                  <TouchableOpacity 
                    style={styles.likesContainer}
                    onPress={() => handleLike(koi.id)}
                  >
                    <Text style={styles.likes}>{koi.likes}</Text>
                    <Ionicons 
                      name={koi.liked ? "heart" : "heart-outline"} 
                      size={20} 
                      color={koi.liked ? "#FF0000" : "#666"} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.description}>{koi.description}</Text>
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => router.push({
                    pathname: '/fish_details',
                    params: {
                      name: koi.name,
                      variant: koi.variant,
                      description: koi.description,
                      imageName: koi.imageName,
                      likes: koi.likes,
                      liked: koi.liked,
                    }
                  })}
                >
                  <Text style={styles.moreButtonText}>More</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likes: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  moreButton: {
    backgroundColor: '#8B0000',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    width: 100,
  },
  moreButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

