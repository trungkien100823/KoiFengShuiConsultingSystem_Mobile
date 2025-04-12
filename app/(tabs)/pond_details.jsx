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
  BackHandler
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
      <ImageBackground 
        source={getPondImageSource(pondDetails.imageName)}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/menu')}
            >
              <Ionicons name="chevron-back-circle" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentCard, { marginTop: 220 }]}>
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
              
              {/* Elegant Introduction */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <MaterialCommunityIcons 
                    name={elementIcons[pondDetails.element] || 'water'} 
                    size={18} 
                    color={elementColors[pondDetails.element]} 
                    style={styles.sectionIcon}
                  />
                  Giới Thiệu
                </Text>
                <Text style={styles.sectionContent}>
                  {pondDetails.introduction || defaultIntroduction}
                </Text>
              </View>
              
              {/* Main Info Card */}
              <View style={styles.mainCard}>
                {/* Description Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialIcons name="description" size={18} color="#8B0000" style={styles.sectionIcon} />
                    Mô Tả Chi Tiết
                  </Text>
                  <Text style={styles.sectionContent}>
                    {pondDetails.description || defaultDescription}
                  </Text>
                </View>
                
                {/* Specifications Grid */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <Feather name="info" size={18} color="#8B0000" style={styles.sectionIcon} />
                    Thông Số
                  </Text>
                  
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
                    <Text style={styles.sectionTitle}>
                      <Feather name="list" size={18} color="#8B0000" style={styles.sectionIcon} />
                      Đặc Điểm
                    </Text>
                    
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
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    minHeight: '100%',
    paddingHorizontal: 20,
  },
  pondInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pondName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#8B0000',
    marginLeft: 6,
    fontSize: 14,
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
    marginVertical: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
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
    marginBottom: 20,
  },
  
  // Các styles còn lại cập nhật để phù hợp với giao diện mới
  
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
    height: 40,
  },
  // Các styles cho loading và error state
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
});