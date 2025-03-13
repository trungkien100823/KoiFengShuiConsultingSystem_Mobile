import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.8;

// Sample consultant data
const consultants = [
  {
    id: '1',
    name: 'Nguyen Trong Manh',
    title: 'Master',
    rating: 4.0,
    image: require('../../assets/images/consultant1.jpg'),
  },
  {
    id: '2',
    name: 'Tran Minh Duc',
    title: 'Senior Expert',
    rating: 4.8,
    image: require('../../assets/images/consultant2.jpg'),
  },
  {
    id: '3',
    name: 'Le Van Hung',
    title: 'Expert',
    rating: 4.5,
    image: require('../../assets/images/consultant3.jpg'),
  },
  {
    id: '4',
    name: 'Pham Thi Mai',
    title: 'Master',
    rating: 4.9,
    image: require('../../assets/images/consultant4.jpg'),
  }
];


export default function ConsultingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState('Master');
  const [sortVisible, setSortVisible] = useState(false);

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


      <View style={styles.carouselContainer}>
        <ScrollView 
          horizontal
          pagingEnabled
          snapToInterval={cardWidth + 20}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={handleScroll}
        >
          {consultants.map((consultant) => (
            <View key={consultant.id} style={[styles.consultantWrapper, { width: cardWidth }]}>
              <TouchableOpacity 
                style={styles.consultantCard}
                onPress={() => router.push({
                  pathname: '/consultant_details',
                  params: { consultantId: consultant.id }
                })}
              >
                <Text style={styles.consultantTitle}>{consultant.title}</Text>
                <Image source={consultant.image} style={styles.consultantImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.consultantName}>{consultant.name}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  {renderStars(consultant.rating)}
                  <Text style={styles.ratingText}>{consultant.rating.toFixed(1)}/5.0</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => router.push({
              pathname: '/booking',
              params: { consultantId: consultants[activeIndex].id }
            })}
          >
            <Text style={styles.bookButtonText}>Book now</Text>
          </TouchableOpacity>
        </View>
      </View>
      
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
    paddingBottom: 20,
  },
  consultantWrapper: {
    marginRight: 20,
  },
  consultantCard: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingBottom: 15,
  },
  consultantTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  consultantImage: {
    width: '100%',
    height: 350,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  ratingText: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
    marginLeft: 5,
  },
  buttonContainer: {
    alignItems: 'flex-start',
    marginTop: 10,
    marginLeft: 15,
    marginBottom: 20
  },
  bookButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
