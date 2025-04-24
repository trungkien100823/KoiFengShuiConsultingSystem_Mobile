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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { images } from '../../constants/images';
import { certificateService } from '../../services/certificateService';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
  const scale = useSharedValue(1);
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
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
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
      scale.value = withTiming(2.5, { duration: 300 });
    } else {
      // Trở về vị trí ban đầu
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
    }
    
    setIsZoomed(!isZoomed);
  };

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleOpenModal = () => {
    setModalVisible(true);
    setIsZoomed(false);
    scale.value = 1;
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/your_certificate')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chứng chỉ</Text>
      </View>

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
            source={certificate.certificateImageUrl ? { uri: certificate.certificateImageUrl } : images['buddha.png']}
            style={[
              styles.certificateImage,
              imageError && styles.errorImage
            ]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError ? (
            <Text style={styles.errorText}>Không thể tải hình ảnh chứng chỉ</Text>
          ) : (
            <Text style={styles.zoomHint}>Nhấn vào ảnh để xem</Text>
          )}
        </TouchableOpacity>

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{certificate.courseName}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.infoText}>Giảng viên: {certificate.masterName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>Ngày hoàn thành: {new Date(certificate.createDate).toLocaleDateString()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="trophy" size={20} color="#666" />
            <Text style={styles.infoText}>Điểm số: {formatPoint(certificate.point)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
          <Text style={styles.description}>{certificate.description}</Text>

          <Text style={styles.sectionTitle}>Bạn đã học được</Text>
          <View style={styles.learningSection}>
            {learningItems.length > 0 ? (
              learningItems.map((item, index) => (
                <View key={index} style={styles.learningItem}>
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark" size={20} color="#8B0000" />
                  </View>
                  <Text style={styles.learningText}>{item}</Text>
                </View>
              ))
            ) : (
              <View style={styles.learningItem}>
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="information-circle" size={20} color="#666" />
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
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9}
            style={styles.modalImageWrapper}
            onPress={toggleZoom}
          >
            <Animated.View style={[styles.modalImageContainer, rStyle]}>
              <Image
                source={certificate.certificateImageUrl ? { uri: certificate.certificateImageUrl } : images['buddha.png']}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#8B0000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  certificateContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  certificateImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  errorImage: {
    opacity: 0.5,
  },
  errorText: {
    color: '#d9534f',
    marginTop: 8,
    textAlign: 'center',
  },
  zoomHint: {
    color: '#8B0000',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#8B0000',
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
  },
  learningSection: {
    paddingTop: 10,
    gap: 10,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  learningText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
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
}); 