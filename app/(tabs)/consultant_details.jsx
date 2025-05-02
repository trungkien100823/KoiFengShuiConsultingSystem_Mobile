import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ImageBackground, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 56 + STATUSBAR_HEIGHT;

export default function ConsultantDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const masterId = params.masterId;
  
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const imageAnimatedValue = new Animated.Value(height * 0.3);

  useEffect(() => {
    const fetchMasterDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.baseURL}/api/Master/${masterId}`);
        const result = await response.json();
        
        if (result.isSuccess && result.data) {
          setConsultant(result.data);
        }
      } catch (error) {
        console.error('Error fetching master details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (masterId) {
      fetchMasterDetails();
    }
  }, [masterId]);

  const toggleImageView = () => {
    const newState = !showFullImage;
    setShowFullImage(newState);
    
    if (newState) {
      // Expanding to full screen
      Animated.spring(imageAnimatedValue, {
        toValue: height - HEADER_HEIGHT,
        useNativeDriver: false,
        friction: 7,
        tension: 40
      }).start();
    } else {
      // Collapsing back to normal size
      Animated.spring(imageAnimatedValue, {
        toValue: height * 0.3,
        useNativeDriver: false,
        friction: 7,
        tension: 40
      }).start();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (!consultant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải thông tin chuyên gia</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.push('/consulting')}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/consulting')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-circle" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyên gia</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Animated Image */}
        <View style={styles.heroSectionContainer}>
          <Animated.View style={[styles.heroSection, { 
            height: imageAnimatedValue,
            zIndex: showFullImage ? 20 : 5,
          }]}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={toggleImageView}
              style={{ flex: 1 }}
            >
              <ImageBackground 
                source={consultant.imageUrl ? { uri: consultant.imageUrl } : require('../../assets/images/consultant1.jpg')}
                style={styles.consultantImage}
                resizeMode={showFullImage ? "contain" : "cover"}
              >
                {!showFullImage && (
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.6, 1]}
                    style={styles.heroOverlay}
                  >
                    <View style={styles.heroContent}>
                      <Text style={styles.consultantNameOverlay}>{consultant.masterName}</Text>
                      <View style={styles.tagContainer}>
                        <View style={styles.tag}>
                          <MaterialCommunityIcons name="certificate" size={12} color="#D4AF37" />
                          <Text style={styles.tagText}>{consultant.title || 'Chuyên gia'}</Text>
                        </View>
                        {consultant.rating && (
                          <View style={styles.tag}>
                            <Ionicons name="star" size={12} color="#D4AF37" />
                            <Text style={styles.tagText}>{consultant.rating}/5.0</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                )}

                <TouchableOpacity
                  style={[
                    styles.expandButton,
                    showFullImage && styles.expandButtonFullscreen
                  ]}
                  onPress={toggleImageView}
                  activeOpacity={0.8}
                >
                  <View style={styles.expandButtonInner}>
                    <MaterialCommunityIcons 
                      name={showFullImage ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.expandButtonText}>
                      {showFullImage ? "Thu gọn" : "Xem đầy đủ"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </ImageBackground>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          
          {/* Bio Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="description" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>Giới thiệu</Text>
            </View>
            
            <Text style={styles.sectionContent}>
              {consultant.biography || 'Chưa cập nhật thông tin giới thiệu.'}
            </Text>
          </View>
          
          {/* Expertise Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Feather name="info" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>Thông tin chi tiết</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="medal-outline" size={24} color="#8B0000" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Chuyên môn</Text>
                  <Text style={styles.infoValue}>{consultant.expertise || 'Chưa cập nhật'}</Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#8B0000" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Kinh nghiệm</Text>
                  <Text style={styles.infoValue}>{consultant.experience || 'Chưa cập nhật'}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
      
      {/* Booking button only shown when image is not full screen */}
      {!showFullImage && (
        <View style={styles.bookingContainer}>
          <TouchableOpacity 
            style={styles.bookingButton}
            onPress={() => router.push({
              pathname: '/(tabs)/online_booking',
              params: { 
                selectedMasterId: consultant.masterId,
                selectedMasterName: consultant.masterName,
                fromMasterDetails: 'true'
              }
            })}
          >
            <LinearGradient
              colors={['#8B0000', '#600000']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.bookingButtonGradient}
            >
              <Text style={styles.bookingButtonText}>Đặt lịch tư vấn</Text>
              <Ionicons name="calendar-outline" size={24} color="#FFF" style={styles.bookingButtonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingTop: Platform.OS === 'ios' ? 50 : STATUSBAR_HEIGHT + 10,
    paddingBottom: 16,
    elevation: 4,
    zIndex: 10,
    backgroundColor: '#8b0000',
    height: HEADER_HEIGHT,
  },
  headerTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scrollView: {
    flex: 1,
  },
  heroSectionContainer: {
    position: 'relative',
    zIndex: 5,
  },
  heroSection: {
    height: height * 0.3,
    position: 'relative',
    backgroundColor: '#000',
  },
  consultantImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: width * 0.05,
  },
  consultantNameOverlay: {
    fontSize: Math.min(26, width * 0.065),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  tagText: {
    fontSize: Math.min(12, width * 0.03),
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  expandButton: {
    position: 'absolute',
    bottom: width > 350 ? 15 : 10,
    right: width > 350 ? 15 : 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: width > 350 ? 10 : 8,
    paddingHorizontal: width > 350 ? 16 : 12,
    zIndex: 10,
  },
  expandButtonFullscreen: {
    bottom: 'auto',
    top: width > 350 ? 15 : 10,
    right: width > 350 ? 15 : 10,
  },
  expandButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '500',
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mainContent: {
    padding: width * 0.04,
    gap: width * 0.04,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: width > 350 ? 16 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: width > 350 ? 16 : 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: 'bold',
    color: '#8B0000',
  },
  sectionContent: {
    fontSize: Math.min(15, width * 0.038),
    lineHeight: Math.min(24, width * 0.06),
    color: '#555',
    textAlign: 'justify',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 3,
    borderColor: '#8B0000',
    backgroundColor: '#e1e1e1',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  ratingText: {
    color: '#FFF',
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  name: {
    fontSize: Math.min(22, width * 0.055),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  specialty: {
    color: '#8B0000',
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Math.min(12, width * 0.03),
    color: '#777',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Math.min(15, width * 0.038),
    fontWeight: '500',
    color: '#333',
  },
  bookingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.05,
    zIndex: 20,
  },
  bookingButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  bookingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
  },
  bookingButtonText: {
    color: '#FFF',
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
    marginRight: 8,
  },
  bookingButtonIcon: {
    marginLeft: 4,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 80 : 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Math.min(16, width * 0.04),
    color: '#8B0000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: Math.min(16, width * 0.04),
    color: '#8B0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(16, width * 0.04),
  },
});
