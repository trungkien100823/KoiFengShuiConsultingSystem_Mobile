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
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { images } from '../../constants/images';
import { certificateService } from '../../services/certificateService';

// Add these constants for responsive design
const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);
const isIOS = Platform.OS === 'ios';

// Calculate status bar height
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' 
  ? (Platform.isPad ? 20 : StatusBar.currentHeight || 44) 
  : StatusBar.currentHeight || 0;

export default function CertificateDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [learningItems, setLearningItems] = useState([]);

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
        backgroundColor="#8B0000"
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

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Certificate Image Card */}
        <View style={styles.certificateContainer}>
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
            </View>
          )}
          <Image
            source={certificate.certificateImageUrl ? { uri: certificate.certificateImageUrl } : images['buddha.png']}
            style={[styles.certificateImage, imageError && styles.errorImage]}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError && (
            <Text style={styles.errorText}>Không thể tải hình ảnh chứng chỉ</Text>
          )}
        </View>

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

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="trophy" size={scale(20)} color="#8B0000" />
              </View>
              <Text style={styles.infoText}>Điểm số: {certificate.point}/10</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
            <Text style={styles.description}>{certificate.description}</Text>
          </View>

          {/* Learning Outcomes Section */}
          <View style={styles.learningSection}>
            <Text style={styles.sectionTitle}>Bạn đã học được</Text>
            <View style={styles.learningList}>
              {learningItems.length > 0 ? (
                learningItems.map((item, index) => (
                  <View key={index} style={styles.learningItem}>
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={scale(20)} color="#8B0000" />
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
    backgroundColor: '#F8F8F8',
    borderRadius: scale(8),
    padding: scale(16),
  },
  learningList: {
    marginTop: scale(8),
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: scale(12),
    borderRadius: scale(8),
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
    marginTop: scale(8),
    fontSize: scale(14),
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
}); 