import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  Platform, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  Dimensions,
  BackHandler,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { pondAPI } from '../../constants/koiPond';

const windowDimensions = Dimensions.get('window');
const { width, height } = windowDimensions;

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 56 + STATUSBAR_HEIGHT;

const elementColors = {
  Hỏa: '#FF4500',
  Kim: '#C0C0C0', 
  Thủy: '#006994',
  Mộc: '#228B22',
  Thổ: '#DEB887',
};

const elementIcons = {
  Hỏa: 'fire',
  Kim: 'diamond',
  Thủy: 'water',
  Mộc: 'leaf',
  Thổ: 'terrain',
};

export default function PondDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [pondDetails, setPondDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const imageAnimatedValue = new Animated.Value(220);

  useEffect(() => {
    const fetchPondDetails = async () => {
      try {
        setLoading(true);
        const details = await pondAPI.getPondDetails(params.id);
        setPondDetails(details);
      } catch (error) {
        console.error('Error fetching pond details:', error);
        Alert.alert('Error', 'Failed to load pond details');
      } finally {
        setLoading(false);
      }
    };

    fetchPondDetails();
  }, [params.id]);
  
  // Handle back button to go to menu
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.push('/menu');
      return true;
    });

    return () => backHandler.remove();
  }, [router]);

  const getPondImageSource = (imageName) => {
    try {
      if (imageName && typeof imageName === 'string') {
        // If imageName is a full URL
        if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
          return { uri: imageName };
        }
        // If imageName is just a filename or partial path
        else if (imageName.length > 0) {
          // You might need to prepend the API base URL if this is just a relative path
          return { uri: imageName };
        }
      }
      // Default image if no valid imageName
      return require('../../assets/images/natural_pond.jpg');
    } catch (error) {
      console.error('Error loading pond image:', error);
      return require('../../assets/images/natural_pond.jpg');
    }
  };

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
        toValue: 220,
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

  if (!pondDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải thông tin hồ</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.push('/menu')}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default data when API returns null
  const defaultIntroduction = "Cá Koi là một trong những loài cá cảnh được yêu thích nhất trong phong thủy. Với màu sắc đặc trưng và ý nghĩa tâm linh sâu sắc, chúng không chỉ mang lại vẻ đẹp thẩm mỹ mà còn được tin là mang đến may mắn và thịnh vượng cho gia chủ.";
  const defaultDescription = "Việc lựa chọn cá Koi phù hợp với phong thủy nhà ở có thể tăng cường năng lượng tích cực và tạo nên sự hài hòa trong không gian sống. Hồ cá được thiết kế với sự cân nhắc kỹ lưỡng về vị trí, hình dạng và kích thước để đảm bảo sự phát triển tốt nhất cho cá và mang lại may mắn cho gia chủ.";

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
          onPress={() => router.push('/menu')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-circle" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hồ</Text>
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
                source={getPondImageSource(pondDetails.imageUrl || pondDetails.imageName)}
                style={styles.pondImage}
                resizeMode={showFullImage ? "contain" : "cover"}
              >
                {!showFullImage && (
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.6, 1]}
                    style={styles.heroOverlay}
                  >
                    <View style={styles.heroContent}>
                      <Text style={styles.pondNameOverlay}>{pondDetails.pondName}</Text>
                      <View style={styles.tagContainer}>
                        <View style={styles.tag}>
                          <MaterialCommunityIcons 
                            name={elementIcons[pondDetails.element] || 'water'} 
                            size={12} 
                            color="#D4AF37" 
                          />
                          <Text style={styles.tagText}>{pondDetails.element}</Text>
                        </View>
                        <View style={styles.tag}>
                          <Feather name="box" size={12} color="#D4AF37" />
                          <Text style={styles.tagText}>{pondDetails.shapeName}</Text>
                        </View>
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
          {/* Pond Info Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>Thông tin</Text>
            </View>
            
            <View style={styles.pondInfoSection}>
              <Text style={styles.pondName}>{pondDetails.pondName}</Text>
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons 
                    name={elementIcons[pondDetails.element] || 'water'} 
                    size={18} 
                    color={elementColors[pondDetails.element] || '#8B0000'} 
                  />
                  <Text style={styles.metaText}>{pondDetails.element}</Text>
                </View>
                
                <View style={styles.metaDivider} />
                
                <View style={styles.metaItem}>
                  <Feather name="box" size={16} color="#8B0000" />
                  <Text style={styles.metaText}>{pondDetails.shapeName}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            {/* Introduction Section */}
            <Text style={styles.sectionContent}>
              {pondDetails.introduction || defaultIntroduction}
            </Text>
          </View>
          
          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="description" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>Mô Tả Chi Tiết</Text>
            </View>
            
            <Text style={styles.sectionContent}>
              {pondDetails.description || defaultDescription}
            </Text>
          </View>
      
          
          {/* Features Card */}
          {pondDetails.features && pondDetails.features.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Feather name="list" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.cardTitle}>Đặc Điểm</Text>
              </View>
              
              <View style={styles.featuresList}>
                {pondDetails.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Feather name="check" size={14} color="#fff" />
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
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
    backgroundColor: '#8B0000',
    zIndex: 10,
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
  },
  scrollView: {
    flex: 1,
  },
  heroSectionContainer: {
    position: 'relative',
    zIndex: 5,
  },
  heroSection: {
    height: 220,
    position: 'relative',
    backgroundColor: '#000',
  },
  pondImage: {
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
  pondNameOverlay: {
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
  pondInfoSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pondName: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  metaText: {
    color: '#8B0000',
    marginLeft: 6,
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 10,
  },
  sectionContent: {
    fontSize: Math.min(15, width * 0.038),
    lineHeight: Math.min(24, width * 0.06),
    color: '#555',
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  specItem: {
    width: width > 400 ? '50%' : '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  specIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  specTextContainer: {
    flex: 1,
  },
  specLabel: {
    fontSize: Math.min(12, width * 0.03),
    color: '#777',
    marginBottom: 2,
  },
  specValue: {
    fontSize: Math.min(15, width * 0.038),
    fontWeight: '600',
    color: '#333',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    flex: 1,
    fontSize: Math.min(15, width * 0.038),
    color: '#444',
    lineHeight: Math.min(20, width * 0.05),
  },
  bottomPadding: {
    height: 40,
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