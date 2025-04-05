import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { workshopDetailsService } from '../../constants/workshopDetails';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const WorkshopDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Khai báo states
  const [loading, setLoading] = useState(true);
  const [workshopData, setWorkshopData] = useState(null);
  const [masterInfo, setMasterInfo] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  
  // Lấy ID workshop từ params
  const { workshop, imageId } = route.params || {};
  const workshopId = workshop?.id || null;
  
  const fetchData = async () => {
    if (!workshopId) {
      setLoading(false);
      setError('Không có ID workshop');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Gọi API lấy thông tin workshop
      const response = await workshopDetailsService.getWorkshopById(workshopId);
      console.log('Workshop Response:', response);
      
      if (response?.data?.isSuccess) {
        const workshopDetails = response.data.data;
        console.log('Workshop Details:', workshopDetails);
        
        // Cập nhật state workshop
        const processedWorkshop = {
          id: workshopDetails.workshopId,
          title: workshopDetails.workshopName,
          date: workshopDetails.startDate ? new Date(workshopDetails.startDate).toLocaleDateString('vi-VN') : '',
          location: workshopDetails.location,
          description: workshopDetails.description,
          status: workshopDetails.status,
          capacity: workshopDetails.capacity,
          price: `${workshopDetails.price}$`,
          image: getImageForId(imageId)
        };
        
        setWorkshopData(processedWorkshop);

        // Fetch thông tin master nếu có masterId
        if (workshopDetails.masterId) {
          try {
            console.log('Fetching master with ID:', workshopDetails.masterId);
            const masterResponse = await workshopDetailsService.getMasterById(workshopDetails.masterId);
            console.log('Master API Response:', masterResponse);
            
            if (masterResponse?.data?.isSuccess) {
              const masterDetails = masterResponse.data.data;
              console.log('Master Details:', masterDetails);
              
              setMasterInfo({
                id: masterDetails.masterId,
                name: masterDetails.masterName,
                title: masterDetails.title,
                rating: masterDetails.rating,
                experience: masterDetails.experience,
                expertise: masterDetails.expertise,
                description: masterDetails.biography,
                image: require('../../assets/images/buddha.png')
              });
            } else {
              console.error('Master API response not successful:', masterResponse?.data);
              throw new Error('Không thể lấy thông tin master');
            }
          } catch (masterError) {
            console.error('Error fetching master:', masterError);
            // Log thêm chi tiết lỗi
            if (masterError.response) {
              console.error('Error response:', masterError.response.data);
            }
            setMasterInfo({
              name: workshopDetails.masterName || 'Chưa có thông tin',
              title: 'Master',
              image: require('../../assets/images/buddha.png')
            });
          }
        } else {
          console.log('No masterId provided');
          setMasterInfo({
            name: workshopDetails.masterName,
            title: 'Master',
            image: require('../../assets/images/buddha.png')
          });
        }

        return;
      }
      
      setError('Không thể tải thông tin workshop');
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      setError('Không thể tải thông tin workshop. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };
  
  // Gọi fetchData khi component mount hoặc workshopId thay đổi
  useEffect(() => {
    fetchData();
  }, [workshopId, imageId]);
  
  const getImageForId = (id) => {
    if (id === '1' || id === '2' || id === '3') {
      return require('../../assets/images/buddha.png');
    }
    return require('../../assets/images/buddha.png');
  };
  
  // Hiển thị loader khi đang tải dữ liệu
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  // Hiển thị màn hình lỗi với nút thử lại
  if (error && !workshopData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          disabled={retrying}
          onPress={() => {
            setRetrying(true);
            fetchData();
          }}
        >
          <Text style={styles.retryButtonText}>
            {retrying ? 'Đang thử lại...' : 'Thử lại'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backToListButton}
          onPress={() => navigation.navigate('workshop')}
        >
          <Text style={styles.backToListText}>Quay lại danh sách</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Sử dụng dữ liệu từ API
  const displayWorkshop = workshopData || {};
  const displayMaster = masterInfo || {};

  // New helper function to format description with bullet points
  const formatDescription = (description) => {
    if (!description) return [];
    
    // Split by newlines or other potential delimiters
    return description.split(/\n|•/).filter(item => item.trim() !== '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('workshop')}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <ImageBackground
          source={{ uri: displayWorkshop.image || 'https://res.cloudinary.com/dzedpn3us/image/upload/v1714547103/3_cgq2wb.jpg' }}
          style={styles.heroImage}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.title}>{displayWorkshop.title || 'Workshop Title'}</Text>
              
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name={star <= (displayWorkshop.rating || 4) ? "star" : "star-outline"} 
                      size={16} 
                      color="#FFD700" 
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>{displayWorkshop.rating || 4.0}</Text>
                <Text style={styles.studentsCount}>• {displayWorkshop.numberAttendees || 100} người tham dự</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Workshop Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Thông tin Workshop</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ngày diễn ra</Text>
                <Text style={styles.detailValue}>{displayWorkshop.date}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{displayWorkshop.duration || '3 giờ'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Địa điểm</Text>
                <Text style={styles.detailValue}>{displayWorkshop.location || 'Đang cập nhật'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <FontAwesome name="dollar" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Giá vé</Text>
                <Text style={styles.detailValue}>{displayWorkshop.price || 'Miễn phí'}</Text>
              </View>
            </View>
          </View>

          {/* What You'll Learn Section */}
          <View style={styles.learnCard}>
            <Text style={styles.sectionTitle}>Bạn sẽ học được gì</Text>
            
            {formatDescription(displayWorkshop.description).map((point, index) => (
              <View key={index} style={styles.learningPoint}>
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
                <Text style={styles.learningPointText}>{point.trim()}</Text>
              </View>
            ))}
          </View>

          {/* Includes Section */}
          <View style={styles.includesCard}>
            <Text style={styles.sectionTitle}>Workshop bao gồm</Text>
            
            <View style={styles.includeRow}>
              <MaterialIcons name="access-time" size={20} color="#8B0000" />
              <Text style={styles.includeText}>{displayWorkshop.duration || '3 giờ'} học tập</Text>
            </View>
            
            <View style={styles.includeRow}>
              <MaterialIcons name="description" size={20} color="#8B0000" />
              <Text style={styles.includeText}>Tài liệu hướng dẫn</Text>
            </View>
            
            <View style={styles.includeRow}>
              <MaterialCommunityIcons name="certificate" size={20} color="#8B0000" />
              <Text style={styles.includeText}>Chứng chỉ hoàn thành</Text>
            </View>
            
            <View style={styles.includeRow}>
              <Ionicons name="people" size={20} color="#8B0000" />
              <Text style={styles.includeText}>Kết nối với cộng đồng</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.description}>{displayWorkshop.description || 'Đang cập nhật thông tin...'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Register Button */}
      <View style={styles.bookingButtonContainer}>
        <TouchableOpacity 
          style={styles.bookingButton}
          onPress={() => navigation.navigate('ticket_confirmation', { 
            workshopId: displayWorkshop.id,
            workshopName: displayWorkshop.title,
            workshopPrice: displayWorkshop.price
          })}
        >
          <Text style={styles.bookingButtonText}>Đăng ký tham gia</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: width,
    height: 250,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  studentsCount: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  learnCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  learningPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  learningPointText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  includesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  includeText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#444',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  bookingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bookingButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToListButton: {
    paddingVertical: 12,
  },
  backToListText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  smallErrorContainer: {
    padding: 10,
    backgroundColor: '#FFF3F3',
    borderRadius: 6,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  smallErrorText: {
    color: '#8B0000',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WorkshopDetailsScreen;