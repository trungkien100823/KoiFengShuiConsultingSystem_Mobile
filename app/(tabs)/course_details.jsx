import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';

const { width } = Dimensions.get('window');

export default function CourseDetailsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { courseId, source } = useLocalSearchParams();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Handle back navigation based on source
  const handleBackNavigation = () => {
    console.log("Back navigation source:", source); // Debug
    
    if (source === 'courses_list') {
      // Go back to courses_list
      router.push({
        pathname: '/(tabs)/courses_list',
        params: { 
          categoryId: '1',
          categoryTitle: 'Feng Shui'
        }
      });
    } else {
      // Go back to courses tab
      router.push('/(tabs)/courses');
    }
  };

  // Update the sample course data to include discounted price and more instructor details
  const course = {
    id: '1',
    title: 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học',
    image: require('../../assets/images/koi_image.jpg'),
    price: 2400000,
    originalPrice: 4800000, // Added original price for discount display
    discount: 50, // Discount percentage
    rating: 4.0,
    reviews: 100,
    includes: [
      '1h45m5s',
      '5 Videos',
      '15 Question Patterns',
      'Support files',
      'Access on all Devices',
      'Certificate of Completions'
    ],
    learning: [
      'Philosophy of Simplicity: Understanding harmony through balance',
      'Ancient Chinese Feng Shui principles for enhancing energy and prosperity',
      'Five Elements (Ngũ Hành): Utilizing elemental interactions for health and wealth',
      'Symbolic meanings of shapes and colors for balance and success',
      'Practical Wisdom: Connecting with nature and implementing proven solutions'
    ],
    description: 'Khóa học Đại Đạo Chỉ Giản - Phong Thủy Cổ Học I mang đến triết lý cổ xưa về Đạo Phong Thủy. Bạn sẽ tìm hiểu về những nguyên tắc căn bản từ các văn bản truyền thống và ứng dụng trong đời sống hiện đại. Dưới sự hướng dẫn của Phong Thủy sư Nguyễn Trung Hiếu, hành trình khám phá nguồn năng lượng tự nhiên này sẽ mở ra một thế giới mới về sự cân bằng và hòa hợp. Lý tưởng cho người mới bắt đầu và những người sâu sắc hơn muốn mở rộng kiến thức.',
    instructor: {
      name: 'Master Nguyen Trong Manh',
      title: 'Top Rated Master',
      rating: 4.0,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit.',
      image: require('../../assets/images/consultant1.jpg'),
      achievements: [
        '100 Courses Uploaded',
        'Best Seller Adward',
        '1+ Hundred Students Followed'
      ]
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Fixed Header with back button, title and cart */}
        <SafeAreaView style={styles.fixedHeader}>
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackNavigation}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCartButton}>
              <Ionicons name="cart-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.courseTitle}>{course.title}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingScore}>{course.rating}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= course.rating ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>• {course.reviews} enrolled Students</Text>
          </View>
        </SafeAreaView>
        
        {/* Thumbnail Image */}
        
        
        {/* Scrollable Content */}
        <ScrollView style={styles.scrollContent}>
        <Image 
          source={course.image} 
          style={styles.thumbnailImage}
        />
          {/* Course Includes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This course includes:</Text>
            <View style={styles.includesContainer}>
              {course.includes.map((item, index) => (
                <View key={index} style={styles.includeItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  <Text style={styles.includeText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* What You'll Learn Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What will you learn:</Text>
            {course.learning.map((item, index) => (
              <View key={index} style={styles.learningItem}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.learningText}>{item}</Text>
              </View>
            ))}
          </View>
          
          {/* Description Section - Now Collapsible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description:</Text>
            <Text style={styles.descriptionText}>
              {showFullDescription 
                ? course.description 
                : course.description.substring(0, 150) + '...'}
            </Text>
            
            {showFullDescription ? (
              <>
                {/* About Master Section - Only visible when expanded */}
                <View style={styles.masterSection}>
                  <Text style={styles.subSectionTitle}>About Master:</Text>
                  <View style={styles.instructorContainer}>
                    <Image source={course.instructor.image} style={styles.instructorImage} />
                    <View style={styles.instructorInfo}>
                      <Text style={styles.instructorName}>{course.instructor.name}</Text>
                      <Text style={styles.instructorTitle}>{course.instructor.title}</Text>
                      <View style={styles.instructorRating}>
                        <Text style={{color: '#fff', marginRight: 5}}>{course.instructor.rating}</Text>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= course.instructor.rating ? "star" : "star-outline"}
                            size={14}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                      <Text style={styles.instructorBio}>{course.instructor.bio}</Text>
                    </View>
                  </View>
                  
                  {/* Instructor Achievements */}
                  <View style={styles.achievementsContainer}>
                    {course.instructor.achievements.map((achievement, index) => (
                      <View key={index} style={styles.achievementItem}>
                        <Ionicons 
                          name={index === 0 ? "videocam" : index === 1 ? "trophy" : "people"} 
                          size={20} 
                          color="#FFD700" 
                        />
                        <Text style={styles.achievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {/* See Less Button */}
                <TouchableOpacity 
                  style={styles.seeMoreButton}
                  onPress={() => setShowFullDescription(false)}
                >
                  <Text style={styles.seeMoreText}>See less</Text>
                  <Ionicons name="chevron-up" size={16} color="#FFD700" />
                </TouchableOpacity>
              </>
            ) : (
              /* See More Button */
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setShowFullDescription(true)}
              >
                <Text style={styles.seeMoreText}>See more</Text>
                <Ionicons name="chevron-down" size={16} color="#FFD700" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Price and Buy Button */}
          <View style={styles.buySection}>
            <View style={styles.bestDealContainer}>
              <Text style={styles.bestDealText}>BEST DEAL</Text>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.discountedPrice}>2,400,000</Text>
              <View style={styles.priceRow}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-50%</Text>
                </View>
                <Text style={styles.originalPrice}>4,800,000</Text>
              </View>
            </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.buyButton}
                onPress={() => router.push({
                  pathname: '/(tabs)/course_payment',
                  params: {
                    courseId: course.id,
                    courseTitle: course.title,
                    coursePrice: course.price,
                    courseImage: 'assets/images/koi_image.jpg' // You'll need to handle this path properly
                  }
                })}
              >
                <Text style={styles.buyButtonText}>Buy now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addToCartButton}>
                <Text style={styles.addToCartButtonText}>Add to cart</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Space at the bottom for tab bar */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        {/* Custom Tab Bar */}
        <CustomTabBar />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  fixedHeader: {
    width: '100%',
    height: '230',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20
  },
  headerCartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginLeft: 25,
    marginRight: 10

  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 25,
    marginRight: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewCount: {
    color: '#fff',
    fontSize: 14,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  includesContainer: {
    flexDirection: 'column',
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  includeText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, 
  },
  learningText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  buySection: {
    padding: 16,
  },
  bestDealContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  bestDealText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingRight: 0,
  },
  discountedPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#FFFFF0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  originalPrice: {
    color: '#aaaaaa',
    fontSize: 24,
    textDecorationLine: 'line-through',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buyButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#8B0000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#8B0000',
    borderColor: '#fff',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructorContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructorImage: {
    width: 100,
    height: 250,
    borderRadius: 8,
    marginRight: 16,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  instructorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  instructorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructorBio: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 20,
  },
  achievementsContainer: {
    marginTop: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  thumbnailImage: {
    width: '100%',
    height: 300, // Adjust height as needed
    resizeMode: 'cover',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  seeMoreText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 5,
  },
  masterSection: {
    marginTop: 20,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
});
