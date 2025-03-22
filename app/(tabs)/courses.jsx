import React, { useState, useEffect } from 'react';
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
  FlatList
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { useRouter } from 'expo-router';

// Sample data for courses and categories
const featuredCourses = [
  {
    id: '1',
    title: 'Exploring the World of Koi Fish: The Art of Expert Care and Cultivation',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Exploring the World of Koi Fish: The Art of Expert Care and Cultivation',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '3',
    title: 'Exploring the World of Koi Fish: The Art of Expert Care and Cultivation',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '4',
    title: 'Exploring the World of Koi Fish: The Art of Expert Care and Cultivation',
    image: require('../../assets/images/koi_image.jpg'),
  },
];

const categories = [
  {
    id: '1',
    title: 'Feng Shui',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Koi Care',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '3',
    title: 'Koi Breeding',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '4',
    title: 'Koi Diseases',
    image: require('../../assets/images/koi_image.jpg'),
  },
];

const topCourses = [
  {
    id: '1',
    title: 'Exploring the World of Koi Fish: The Art of Expert Care and Cultivation',
    image: require('../../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Exploring the World of Koi Fish: The Art of Expert Care and Cultivation',
    image: require('../../assets/images/koi_image.jpg'),
  },
];

export default function CoursesScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('John Smith');

  // Load user data
  useEffect(() => {
    // Here you would fetch user data from your API
    // For now we're using static data
  }, []);

  const renderFeaturedCourse = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => router.push({
        pathname: '/(tabs)/course_details',
        params: { courseId: item.id, source: 'courses' }
      })}
    >
      <Image source={item.image} style={styles.featuredImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => router.push({
        pathname: '/(tabs)/courses_list',
        params: { 
          categoryId: item.id,
          categoryTitle: item.title,
          source: 'courses'
        }
      })}
    >
      <Image source={item.image} style={styles.categoryImage} />
      <View style={styles.categoryOverlay}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTopCourse = ({ item }) => (
    <TouchableOpacity 
      style={styles.topCourseCard}
      onPress={() => router.push({
        pathname: '/(tabs)/course_details',
        params: { 
          courseId: item.id,
          source: 'courses'
        }
      })}
    >
      <Image source={item.image} style={styles.topCourseImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.topCourseTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hi, {userName}</Text>
            <Text style={styles.subGreeting}>Choose your course today</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="cart-outline" size={35} color="#8B0000" style={{ marginTop: 20, marginRight: 5 }} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
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
        {/* Featured Courses */}
        <View style={styles.sectionContainer}>
          <FlatList
            data={featuredCourses}
            renderItem={renderFeaturedCourse}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
        
        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
        
        {/* Top Courses */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top courses</Text>
          <FlatList
            data={topCourses}
            renderItem={renderTopCourse}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topCoursesList}
          />
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
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featuredList: {
    paddingLeft: 16,
  },
  featuredCard: {
    width: 220,
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesList: {
    paddingLeft: 16,
  },
  categoryCard: {
    width: 160,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  topCoursesList: {
    paddingLeft: 16,
    paddingBottom: 100,
  },
  topCourseCard: {
    width: 220,
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topCourseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topCourseTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
