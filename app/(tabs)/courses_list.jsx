import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Sample data for category courses
const categoryCourses = [
  {
    id: '1',
    title: 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học',
    image: require('../../assets/images/koi_image.jpg'),
    price: 2400000,
    rating: 4.5,
    reviews: 50,
    isBestSeller: true,
  },
  {
    id: '2',
    title: 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học',
    image: require('../../assets/images/koi_image.jpg'),
    price: 2400000,
    rating: 4.5,
    reviews: 50,
    isBestSeller: true,
  },
  // Add more courses as needed
];

export default function CoursesListScreen() {
  const { categoryId, categoryTitle } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('John Smith');
  const router = useRouter();

  const renderCourseCard = ({ item }) => (
    <View style={styles.courseCardContainer}>
      <TouchableOpacity 
        style={styles.courseCard}
        onPress={() => router.push({
          pathname: '/(tabs)/course_details',
          params: { 
            courseId: item.id,
            source: 'courses_list'
          }
        })}
      >
        <Image source={item.image} style={styles.courseImage} />
        <View style={styles.cardOverlay}>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? "star" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
            <Text style={styles.rating}>{item.rating}/5.0</Text>
          </View>
          <Text style={styles.courseTitle}>{item.title}</Text>
          <Text style={styles.price}>{item.price.toLocaleString('vi-VN')} đ</Text>
        </View>
      </TouchableOpacity>
      <Image 
        source={require('../../assets/images/f2.png')} 
        style={styles.fengShuiLogo}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hi, {userName}</Text>
            <Text style={styles.subGreeting}>Choose your course today</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="cart-outline" size={35} color="#8B0000" style={{ marginTop: 20, marginRight: 5 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search" size={20} color="#666" />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Top courses for {categoryTitle}</Text>
        <View style={styles.coursesList}>
          {categoryCourses.map((course) => (
            <React.Fragment key={course.id}>
              {renderCourseCard({ item: course })}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#8B0000',
    marginTop: 10,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    marginVertical: 16,
  },
  coursesList: {
    paddingBottom: 100,
  },
  courseCardContainer: {
    position: 'relative',
    marginBottom: 60,
    paddingLeft: 8,
  },
  courseCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(139,0,0,0.6)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'flex-end',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  price: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  fengShuiLogo: {
    position: 'absolute',
    left: -5,
    bottom: -45,
    width: 100,
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
});
