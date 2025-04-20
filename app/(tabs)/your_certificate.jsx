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

  const onRefresh = () => {
    setRefreshing(true);
    checkAuthAndFetchCertificates();
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải chứng chỉ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={checkAuthAndFetchCertificates}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chứng chỉ</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm chứng chỉ..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      </View>

      <ScrollView 
        style={styles.certificateList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B0000']}
          />
        }
      >
        {filteredCertificates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy chứng chỉ nào</Text>
          </View>
        ) : (
          filteredCertificates.map((cert) => (
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
            >
              <Image 
                source={cert.courseImageUrl ? { uri: cert.courseImageUrl } : images['buddha.png']}
                style={styles.certificatePreview}
                resizeMode="cover"
              />
              <View style={styles.certificateInfo}>
                <Text style={styles.certificateTitle}>{cert.courseName}</Text>
                <Text style={styles.instructorName}>{cert.masterName}</Text>
                <Text style={styles.certificateDate}>
                  Ngày hoàn thành: {new Date(cert.createDate).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.viewMoreButton}
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
              >
                <Text style={styles.viewMoreText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <CustomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  searchContainer: {
    margin: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    paddingLeft: 40,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  certificateList: {
    padding: 16,
  },
  certificateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  certificatePreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  certificateInfo: {
    flex: 1,
    marginRight: 10,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  instructorName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  certificatePoint: {
    fontSize: 12,
    color: '#8B0000',
    fontWeight: '500',
  },
  viewMoreButton: {
    backgroundColor: '#8B0000',
    padding: 8,
    borderRadius: 6,
  },
  viewMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
}); 