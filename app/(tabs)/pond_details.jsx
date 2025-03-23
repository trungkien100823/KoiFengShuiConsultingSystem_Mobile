import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '../../components/BackButton';
import LikeButton from '../../components/LikeButton';
import { pondAPI } from '../../constants/koiPond';
import { useState, useEffect } from 'react';

const elementColors = {
  Hỏa: '#FF4500',
  Kim: '#C0C0C0', 
  Thủy: '#006994',
  Mộc: '#228B22',
  Thổ: '#DEB887',
};

export default function PondDetails() {
  const params = useLocalSearchParams();
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

  const getPondImageSource = (imageName) => {
    try {
      if (imageName && typeof imageName === 'string') {
        return { uri: imageName };
      }
      return require('../../assets/images/buddha.png');
    } catch (error) {
      console.error('Error loading pond image:', error);
      return require('../../assets/images/buddha.png');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (!pondDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text>Failed to load pond details</Text>
      </View>
    );
  }

  const features = pondDetails.features || [];

  // Thêm dữ liệu mẫu khi API trả về null
  const defaultIntroduction = "Cá Koi là một trong những loài cá cảnh được yêu thích nhất trong phong thủy. Với màu sắc đặc trưng và ý nghĩa tâm linh sâu sắc, chúng không chỉ mang lại vẻ đẹp thẩm mỹ mà còn được tin là mang đến may mắn và thịnh vượng cho gia chủ.";

  const defaultDescription = "Việc lựa chọn cá Koi phù hợp với phong thủy nhà ở có thể tăng cường năng lượng tích cực và tạo nên sự hài hòa trong không gian sống. Hồ cá được thiết kế với sự cân nhắc kỹ lưỡng về vị trí, hình dạng và kích thước để đảm bảo sự phát triển tốt nhất cho cá và mang lại may mắn cho gia chủ.";

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={getPondImageSource(pondDetails.imageName)}
        style={styles.backgroundImage}
        resizeMode="cover"
        defaultSource={require('../../assets/images/buddha.png')}
      >
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />
          <View style={styles.detailsCard}>
            <View style={styles.likeButtonContainer}>
              <View style={styles.likeButtonBackground}>
                <LikeButton initialLiked={pondDetails.liked === 'true'} />
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <Text style={styles.pondName}>{pondDetails.pondName}</Text>
                  <Text style={styles.shapeLabel}>Hình dạng: <Text style={styles.shapeValue}>{pondDetails.shapeName}</Text></Text>
                </View>
                <Text style={[
                  styles.element, 
                  { color: elementColors[pondDetails.element] || '#8B0000' }
                ]}>
                  {pondDetails.element}
                </Text>
              </View>

              <View style={styles.sizeSection}>
                <Text style={styles.shortDescription}>
                  {pondDetails.introduction || defaultIntroduction}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.fullDescription}>
                {pondDetails.description || defaultDescription}
              </Text>
            </ScrollView>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  spacer: {
    height: 450,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
    minHeight: '100%',
  },
  likeButtonContainer: {
    position: 'absolute',
    top: -0,
    left: 0,
    zIndex: 1,
  },
  likeButtonBackground: {
    borderRadius: 30,
    padding: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
  },
  titleContainer: {
    flex: 1,
  },
  pondName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  shapeLabel: {
    fontSize: 16,
    color: '#666',
  },
  shapeValue: {
    color: '#8B0000',
    fontWeight: '500',
  },
  element: {
    fontSize: 24,
    color: '#8B0000',
    fontWeight: '500',
  },
  sizeSection: {
    marginBottom: 20,
  },
  shortDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
  fullDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});