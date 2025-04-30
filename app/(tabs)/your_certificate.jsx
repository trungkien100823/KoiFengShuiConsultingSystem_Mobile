import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { images } from '../../constants/images';
import { certificateService } from '../../services/certificateService';
import { getAuthToken } from '../../services/authService';
import { useFocusEffect } from '@react-navigation/native';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const scale = size => Math.round(width * size / 375);
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? (IS_IPHONE_X ? 44 : 20) : StatusBar.currentHeight || 0;

export default function YourCertificateScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      checkAuthAndFetchCertificates();
    }, [])
  );

  const checkAuthAndFetchCertificates = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(
          'Thông báo',
          'Vui lòng đăng nhập để xem chứng chỉ',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.push('/(auth)/login'),
            },
            {
              text: 'Hủy',
              onPress: () => router.push('/(tabs)/profile'),
              style: 'cancel',
            },
          ]
        );
        return;
      }
      await fetchCertificates();
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Có lỗi xảy ra khi kiểm tra đăng nhập');
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      
      if (!token) {
        setError('Vui lòng đăng nhập để tiếp tục');
        return;
      }

      const params = {
        _t: new Date().getTime(),
        _nc: Math.random()
      };

      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/RegisterCourse/get-enrollcertificates-current-customer`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Mobile-App': 'true'
          },
          timeout: 30000,
          cache: false,
          withCredentials: false
        }
      );

      if (response.data && response.data.isSuccess) {
        const certificatesData = Array.isArray(response.data.data) 
          ? response.data.data 
          : [response.data.data];
        setCertificates(certificatesData || []);
      } else {
        setError(response.data?.message || 'Có lỗi xảy ra khi tải danh sách chứng chỉ');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          'Thông báo',
          'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.push('/(auth)/login'),
            },
            {
              text: 'Hủy',
              onPress: () => router.push('/(tabs)/profile'),
              style: 'cancel',
            },
          ]
        );
      } else {
        setError(error.message || 'Có lỗi xảy ra khi tải danh sách chứng chỉ');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setCertificates([]);
      console.log('Refreshing certificates data...');
      await checkAuthAndFetchCertificates();
    } catch (error) {
      console.error('Error during refresh:', error);
      Alert.alert('Thông báo', 'Đã có lỗi xảy ra khi làm mới dữ liệu');
      setRefreshing(false);
    }
  }, []);

  const filteredCertificates = certificates.filter(cert =>
    cert.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Đang tải chứng chỉ...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={scale(50)} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={checkAuthAndFetchCertificates}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B0000', '#600000']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.retryButtonGradient}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
                <Ionicons name="refresh" size={scale(16)} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" translucent={true} />
      
      <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8B0000' }} />
      
      <LinearGradient
        colors={['#8B0000', '#600000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/profile')}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chứng chỉ của bạn</Text>
          <Text style={styles.headerSubtitle}>
            {certificates.length > 0 
              ? `${certificates.length} chứng chỉ đã nhận` 
              : 'Hoàn thành khóa học để nhận chứng chỉ'
            }
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={scale(18)} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chứng chỉ..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <Ionicons name="close-circle" size={scale(18)} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.certificateList}
        contentContainerStyle={styles.certificateListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B0000']}
            tintColor="#8B0000"
            title="Đang làm mới..."
            titleColor="#8B0000"
            progressBackgroundColor="rgba(255, 255, 255, 0.8)"
          />
        }
      >
        {filteredCertificates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={scale(60)} color="#8B0000" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Không tìm thấy chứng chỉ</Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `Không có chứng chỉ nào phù hợp với từ khóa "${searchQuery}"`
                : 'Bạn chưa có chứng chỉ nào. Hãy hoàn thành khóa học để nhận chứng chỉ.'
              }
            </Text>
            {searchQuery ? (
              <TouchableOpacity 
                style={styles.clearSearchButton} 
                onPress={() => setSearchQuery('')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B0000', '#600000']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.clearSearchButtonGradient}
                >
                  <Text style={styles.clearSearchButtonText}>Xóa tìm kiếm</Text>
                  <Ionicons name="close-circle" size={scale(16)} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.browseCourseButton} 
                onPress={() => router.push('/(tabs)/courses')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B0000', '#600000']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.browseCourseButtonGradient}
                >
                  <Text style={styles.browseCourseButtonText}>Khám phá khóa học</Text>
                  <Ionicons name="arrow-forward" size={scale(16)} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {filteredCertificates.map((cert) => (
              <TouchableOpacity
                key={cert.enrollCertId}
                style={styles.certificateCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/certificate_details',
                  params: { 
                    id: cert.enrollCertId,
                    imageUrl: cert.certificateImageUrl,
                    courseName: cert.courseName,
                    masterName: cert.masterName,
                    createDate: cert.createDate,
                    point: cert.point,
                    description: cert.description,
                    introduction: cert.introduction
                  }
                })}
                activeOpacity={0.9}
              >
                <View style={styles.certificateCardInner}>
                  <View style={styles.certificateImageContainer}>
                    <Image 
                      source={cert.courseImageUrl}
                      style={styles.certificateImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.imageGradient}
                    />
                  </View>
                  
                  <View style={styles.certificateContent}>
                    <View style={styles.certificateHeader}>
                      <Text style={styles.certificateTitle} numberOfLines={2}>
                        {cert.courseName}
                      </Text>
                      
                      <View style={styles.certificateMetaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="person" size={scale(14)} color="#666" />
                          <Text style={styles.instructorName}>
                            {cert.masterName || 'Chưa có thông tin'}
                          </Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar" size={scale(14)} color="#666" />
                          <Text style={styles.certificateDate}>
                            {formatDate(cert.createDate)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.certificateFooter}>
                      {cert.point && (
                        <View style={styles.pointBadge}>
                          <Text style={styles.pointText}>{cert.point} điểm</Text>
                        </View>
                      )}
                      
                      <View style={styles.viewDetailsButton}>
                        <Text style={styles.viewDetailsText}>Chi tiết</Text>
                        <Ionicons name="chevron-forward" size={scale(14)} color="#8B0000" />
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      <CustomTabBar />
    </SafeAreaView>
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
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTitleContainer: {
    marginLeft: scale(16),
    flex: 1,
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: scale(4),
  },
  headerSubtitle: {
    fontSize: scale(14),
    color: 'rgba(255,255,255,0.8)',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  searchContainer: {
    padding: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(8),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    height: scale(44),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    color: '#333',
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    padding: scale(4),
  },
  
  certificateList: {
    flex: 1,
  },
  certificateListContent: {
    padding: scale(16),
    paddingTop: scale(12),
  },
  
  certificateCard: {
    marginBottom: scale(16),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  certificateCardInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  certificateImageContainer: {
    width: scale(100),
    height: scale(100),
    position: 'relative',
  },
  certificateImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  certificateContent: {
    flex: 1,
    padding: scale(12),
    justifyContent: 'space-between',
  },
  certificateHeader: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(6),
  },
  certificateMetaRow: {
    marginTop: scale(2),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  instructorName: {
    fontSize: scale(13),
    color: '#666',
    marginLeft: scale(6),
  },
  certificateDate: {
    fontSize: scale(13),
    color: '#666',
    marginLeft: scale(6),
  },
  certificateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(4),
  },
  pointBadge: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  pointText: {
    fontSize: scale(12),
    color: '#8B0000',
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(6),
  },
  viewDetailsText: {
    fontSize: scale(13),
    color: '#8B0000',
    fontWeight: '600',
    marginRight: scale(2),
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  loadingCard: {
    backgroundColor: '#FFF',
    padding: scale(24),
    borderRadius: scale(16),
    alignItems: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginTop: scale(16),
    fontSize: scale(16),
    color: '#666',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorCard: {
    backgroundColor: '#FFF',
    padding: scale(24),
    borderRadius: scale(16),
    alignItems: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorIcon: {
    marginBottom: scale(16),
  },
  errorText: {
    color: '#666',
    fontSize: scale(16),
    textAlign: 'center',
    marginBottom: scale(20),
  },
  retryButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(60),
    paddingHorizontal: scale(20),
  },
  emptyIcon: {
    marginBottom: scale(16),
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale(12),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: scale(15),
    color: '#666',
    marginBottom: scale(24),
    textAlign: 'center',
    lineHeight: scale(22),
  },
  clearSearchButton: {
    borderRadius: scale(25),
    overflow: 'hidden',
    marginTop: scale(8),
  },
  clearSearchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  clearSearchButtonText: {
    color: '#FFF',
    fontSize: scale(15),
    fontWeight: '600',
    marginRight: scale(8),
  },
  browseCourseButton: {
    borderRadius: scale(25),
    overflow: 'hidden',
    marginTop: scale(8),
  },
  browseCourseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
  },
  browseCourseButtonText: {
    color: '#FFF',
    fontSize: scale(15),
    fontWeight: '600',
    marginRight: scale(8),
  },
  
  bottomSpacer: {
    height: scale(100),
  },
}); 