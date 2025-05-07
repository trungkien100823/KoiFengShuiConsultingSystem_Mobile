import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { images } from '../../constants/images';
import { certificateService } from '../../services/certificateService';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Add scale function for responsive sizing
const scale = size => Math.round(width * size / 375);

// Add platform-specific constants
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? (IS_IPHONE_X ? 44 : 20) : StatusBar.currentHeight || 0;
const HEADER_HEIGHT = scale(60) + STATUS_BAR_HEIGHT;

export default function CertificateDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [learningItems, setLearningItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Animated values for zoom
  const zoomScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  useEffect(() => {
    fetchCertificateDetails();
  }, [id]);

  const fetchCertificateDetails = async () => {
    try {
      setLoading(true);
      const response = await certificateService.getEnrollCertificateByEnrollCourseId(id);
      if (response.isSuccess) {
        console.log('Certificate image URL:', response.data.certificateImageUrl);
        setCertificate(response.data);
        if (response.data.introduction) {
          const items = response.data.introduction.split(',').map(item => item.trim());
          setLearningItems(items);
        }
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi tải chi tiết chứng chỉ');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    console.log('Certificate image loaded successfully');
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('Failed to load certificate image:', certificate.certificateImageUrl);
    setImageLoading(false);
    setImageError(true);
  };

  const retryImageLoad = () => {
    console.log('Retrying image load');
    setImageLoading(true);
    setImageError(false);
    // Force a remount of the Image component by toggling a key
    setCertificate({...certificate, _imageKey: Date.now()});
  };

  const toggleZoom = (event) => {
    // Lấy tọa độ nhấn trên màn hình
    const { locationX, locationY } = event.nativeEvent;
    
    // Tính toán vị trí trung tâm của vùng hiển thị
    const centerX = width / 2;
    const centerY = height * 0.35; // Điều chỉnh để phù hợp với vị trí của ảnh

    if (!isZoomed) {
      // Tính toán vị trí dịch chuyển để điểm nhấn trở thành trung tâm khi zoom
      const newTranslateX = (centerX - locationX) * 1.5;
      const newTranslateY = (centerY - locationY) * 1.5;
      
      translateX.value = withTiming(newTranslateX, { duration: 300 });
      translateY.value = withTiming(newTranslateY, { duration: 300 });
      zoomScale.value = withTiming(2.5, { duration: 300 });
    } else {
      // Trở về vị trí ban đầu
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      zoomScale.value = withTiming(1, { duration: 300 });
    }
    
    setIsZoomed(!isZoomed);
  };

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: zoomScale.value },
      ],
    };
  });

  const handleOpenModal = () => {
    setModalVisible(true);
    setIsZoomed(false);
    zoomScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  };

  const formatPoint = (point) => {
    // Nếu điểm là 100 hoặc bằng 100 (có thể có dạng 100.00, 100.0)
    if (Math.floor(point) === 100) {
      return "100/100";
    }
    // Ngược lại, giữ nguyên giá trị
    return `${point}/100`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchCertificateDetails}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Status Bar Spacer */}
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
      
      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/your_certificate')}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết chứng chỉ</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content}>
        <TouchableOpacity 
          style={styles.certificateContainer}
          onPress={handleOpenModal}
          activeOpacity={0.9}
        >
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
            </View>
          )}
          <Image
            source={{ uri: certificate.certificateImageUrl }}
            style={[styles.certificateImage, imageError && styles.errorImage]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError ? (
            <View style={styles.imageErrorContainer}>
              <Ionicons name="image-outline" size={scale(40)} color="#8B0000" />
              <Text style={styles.errorText}>Không thể tải hình ảnh chứng chỉ</Text>
              <TouchableOpacity onPress={retryImageLoad} style={styles.retryImageButton}>
                <Text style={styles.retryImageText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.zoomHint}>Nhấn vào ảnh để xem</Text>
          )}
        </TouchableOpacity>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.courseTitle}>{certificate.courseName}</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={scale(20)} color="#8B0000" />
              </View>
              <Text style={styles.infoText}>Giảng viên: {certificate.masterName}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={scale(20)} color="#8B0000" />
              </View>
              <Text style={styles.infoText}>
                Ngày hoàn thành: {new Date(certificate.createDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
            <Text style={styles.description}>{certificate.description}</Text>
          </View>

          <Text style={styles.sectionTitle}>Bạn đã học được</Text>
          <View style={styles.learningSection}>
            {learningItems.length > 0 ? (
              learningItems.map((item, index) => (
                <View key={index} style={styles.learningItem}>
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark" size={scale(20)} color="#8B0000" />
                  </View>
                  <Text style={styles.learningText}>{item}</Text>
                </View>
              ))
            ) : (
              <View style={styles.learningItem}>
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="information-circle" size={scale(20)} color="#666" />
                </View>
                <Text style={styles.learningText}>Chưa có thông tin về nội dung đã học</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close-circle" size={scale(40)} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9}
            style={styles.modalImageWrapper}
            onPress={toggleZoom}
          >
            <Animated.View style={[styles.modalImageContainer, rStyle]}>
              <Image
                source={{ uri: certificate.certificateImageUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    backgroundColor: '#8B0000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: '#8B0000',
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: scale(16),
  },
  backButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
  },
  certificateContainer: {
    margin: scale(16),
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  certificateImage: {
    width: '100%',
    height: scale(200),
    borderRadius: scale(12),
  },
  detailsCard: {
    margin: scale(16),
    marginTop: 0,
    backgroundColor: '#FFF',
    borderRadius: scale(12),
    padding: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  courseTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(16),
  },
  infoSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(16),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  iconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  infoText: {
    fontSize: scale(15),
    color: '#444',
    flex: 1,
  },
  descriptionSection: {
    marginBottom: scale(16),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(8),
  },
  description: {
    fontSize: scale(15),
    color: '#666',
    lineHeight: scale(22),
  },
  learningSection: {
    marginTop: scale(8),
    gap: scale(10),
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: scale(12),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.3)',
    marginBottom: scale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checkmarkContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    marginTop: scale(2),
  },
  learningText: {
    fontSize: scale(15),
    color: '#444',
    flex: 1,
    lineHeight: scale(22),
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  errorImage: {
    opacity: 0.5,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    padding: scale(8),
  },
  zoomHint: {
    color: '#8B0000',
    marginTop: scale(8),
    marginBottom: scale(8),
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: scale(14),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  retryButton: {
    backgroundColor: '#8B0000',
    padding: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    marginTop: scale(16),
  },
  retryText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + scale(20),
    right: scale(20),
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: scale(20),
  },
  modalImageWrapper: {
    width: width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalImageContainer: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '90%',
  },
  imageErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(16),
  },
  retryImageButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    marginTop: scale(8),
  },
  retryImageText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: scale(14),
  },
}); 