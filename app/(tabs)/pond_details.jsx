import React, { useState, useEffect } from 'react';
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
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { pondAPI } from '../../constants/koiPond';

const { width, height } = Dimensions.get('window');

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
  Thổ: 'mountain',
};

export default function PondDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [pondDetails, setPondDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollY = new Animated.Value(0);

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

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
        return { uri: imageName };
      }
      return require('../../assets/images/natural_pond.jpg');
    } catch (error) {
      console.error('Error loading pond image:', error);
      return require('../../assets/images/natural_pond.jpg');
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.animatedHeader,
        { opacity: headerOpacity }
      ]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pondDetails.pondName}
        </Text>
      </Animated.View>
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.push('/menu')}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>
      
      <Animated.ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={getPondImageSource(pondDetails.imageName)}
            style={styles.heroImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{pondDetails.pondName}</Text>
                <View style={styles.heroMetaContainer}>
                  <View style={styles.heroMeta}>
                    <MaterialCommunityIcons 
                      name={elementIcons[pondDetails.element] || 'water'} 
                      size={18} 
                      color={elementColors[pondDetails.element] || '#FFF'} 
                    />
                    <Text style={styles.heroMetaText}>{pondDetails.element}</Text>
                  </View>
                  
                  <View style={styles.heroMetaDivider} />
                  
                  <View style={styles.heroMeta}>
                    <Feather name="box" size={16} color="#FFD700" />
                    <Text style={styles.heroMetaText}>{pondDetails.shapeName}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
        
        <View style={styles.contentContainer}>
          {/* Elegant Introduction */}
          <View style={styles.introContainer}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <MaterialCommunityIcons 
                name={elementIcons[pondDetails.element] || 'water'} 
                size={22} 
                color={elementColors[pondDetails.element]} 
                style={styles.dividerIcon}
              />
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.introText}>
              {pondDetails.introduction || defaultIntroduction}
            </Text>
          </View>
          
          {/* Main Info Card */}
          <View style={styles.mainCard}>
            {/* Description Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={22} color="#8B0000" />
                <Text style={styles.sectionTitle}>Mô Tả Chi Tiết</Text>
              </View>
              <Text style={styles.sectionContent}>
                {pondDetails.description || defaultDescription}
              </Text>
            </View>
            
            {/* Specifications Grid */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="info" size={22} color="#8B0000" />
                <Text style={styles.sectionTitle}>Thông Số</Text>
              </View>
              
              <View style={styles.specsContainer}>
                <View style={styles.specItem}>
                  <View style={[styles.specIconContainer, { backgroundColor: '#f0f8ff' }]}>
                    <Feather name="box" size={18} color="#006994" />
                  </View>
                  <View style={styles.specTextContainer}>
                    <Text style={styles.specLabel}>Hình dạng</Text>
                    <Text style={styles.specValue}>{pondDetails.shapeName}</Text>
                  </View>
                </View>
                
                <View style={styles.specItem}>
                  <View style={[styles.specIconContainer, { 
                    backgroundColor: `${elementColors[pondDetails.element]}20` 
                  }]}>
                    <MaterialCommunityIcons 
                      name={elementIcons[pondDetails.element]} 
                      size={18} 
                      color={elementColors[pondDetails.element]} 
                    />
                  </View>
                  <View style={styles.specTextContainer}>
                    <Text style={styles.specLabel}>Nguyên tố</Text>
                    <Text style={[styles.specValue, { 
                      color: elementColors[pondDetails.element] 
                    }]}>
                      {pondDetails.element}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Features List */}
            {pondDetails.features && pondDetails.features.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="list" size={22} color="#8B0000" />
                  <Text style={styles.sectionTitle}>Đặc Điểm</Text>
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
          </View>
          
          <View style={styles.bottomPadding} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#8B0000',
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 45 : 30,
    paddingHorizontal: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: height * 0.45,
    width: width,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  heroMetaDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 12,
  },
  contentContainer: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  introContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerIcon: {
    marginHorizontal: 10,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  specItem: {
    width: '50%',
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
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 15,
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
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 30,
  },
});