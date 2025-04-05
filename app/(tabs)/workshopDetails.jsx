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
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Dimensions,
  Platform,
  Animated,
  BlurView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { workshopDetailsService } from '../../constants/workshopDetails';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WorkshopDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Khai báo states
  const [loading, setLoading] = useState(true);
  const [workshopData, setWorkshopData] = useState(null);
  const [masterInfo, setMasterInfo] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
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
        <StatusBar barStyle="dark-content" />
        <Ionicons name="cloud-offline-outline" size={60} color="#8B0000" />
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Image with Gradient Overlay */}
      <ImageBackground 
        source={require('../../assets/images/buddha.png')} 
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(139, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)']}
          style={styles.gradientOverlay}
        >
          {/* Header with Back Button */}
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('workshop')}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            {/* Main Scrollable Content */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Workshop Image Card */}
              <View style={styles.imageCardContainer}>
                <Image 
                  source={displayWorkshop.image}
                  style={styles.workshopImage}
                  resizeMode="cover"
                />
                <View style={styles.imageTextOverlay}>
                  <View style={styles.badgeContainer}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{displayWorkshop.status || 'Đang Mở'}</Text>
                    </View>
                    <View style={styles.capacityBadge}>
                      <Ionicons name="people" size={14} color="#FFF" />
                      <Text style={styles.capacityText}>{displayWorkshop.capacity || 'Chưa có thông tin'} người</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Workshop Title and Details */}
              <View style={styles.titleContainer}>
                <Text style={styles.workshopTitle}>{displayWorkshop.title}</Text>
              </View>
              
              {/* Workshop Details Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Chi Tiết Hội Thảo:</Text>
                <View style={styles.includesGrid}>
                  <View style={styles.includeItem}>
                    <View style={styles.includeIconContainer}>
                      <Ionicons name="calendar" size={22} color="#FFF" />
                    </View>
                    <Text style={styles.includeText}>
                      <Text style={styles.detailLabel}>Ngày: </Text>
                      {displayWorkshop.date || 'Sẽ thông báo sau'}
                    </Text>
                  </View>
                  <View style={styles.includeItem}>
                    <View style={styles.includeIconContainer}>
                      <Ionicons name="time" size={22} color="#FFF" />
                    </View>
                    <Text style={styles.includeText}>
                      <Text style={styles.detailLabel}>Thời gian: </Text>
                      10:00 - 17:00
                    </Text>
                  </View>
                  <View style={styles.includeItem}>
                    <View style={styles.includeIconContainer}>
                      <Ionicons name="location" size={22} color="#FFF" />
                    </View>
                    <Text style={styles.includeText}>
                      <Text style={styles.detailLabel}>Địa điểm: </Text>
                      {displayWorkshop.location || 'Sẽ thông báo sau'}
                    </Text>
                  </View>
                  <View style={styles.includeItem}>
                    <View style={styles.includeIconContainer}>
                      <Ionicons name="people" size={22} color="#FFF" />
                    </View>
                    <Text style={styles.includeText}>
                      <Text style={styles.detailLabel}>Sức chứa: </Text>
                      {displayWorkshop.capacity || 'Chưa có thông tin'} người
                    </Text>
                  </View>
                </View>
              </View>
              {/* Description Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Mô Tả:</Text>
                <Text style={styles.descriptionText} numberOfLines={showFullDescription ? undefined : 4}>
                  {displayWorkshop.description || 'Không có mô tả cho hội thảo này.'}
                </Text>
                {displayWorkshop.description && displayWorkshop.description.length > 150 && (
                  <TouchableOpacity 
                    style={styles.showMoreButton}
                    onPress={() => setShowFullDescription(!showFullDescription)}
                  >
                    <Text style={styles.showMoreText}>
                      {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                    </Text>
                    <Ionicons 
                      name={showFullDescription ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#FFD700" 
                    />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Master Info Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Giảng Viên Hướng Dẫn:</Text>
                <View style={styles.masterContainer}>
                  <Image 
                    source={displayMaster.image}
                    style={styles.masterImage}
                  />
                  <View style={styles.masterInfo}>
                    <Text style={styles.masterName}>{displayMaster.name}</Text>
                    <Text style={styles.masterTitle}>{displayMaster.title}</Text>
                    {displayMaster.rating && (
                      <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons 
                            key={star}
                            name={star <= Math.floor(displayMaster.rating) ? "star" : star <= displayMaster.rating ? "star-half" : "star-outline"}
                            size={16}
                            color="#FFD700"
                            style={{marginRight: 2}}
                          />
                        ))}
                        <Text style={styles.ratingText}>{displayMaster.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    {displayMaster.expertise && (
                      <Text style={styles.expertiseText}>
                        <Ionicons name="ribbon-outline" size={14} color="#FFD700" /> {displayMaster.expertise}
                      </Text>
                    )}
                  </View>
                </View>
                {displayMaster.description && (
                  <Text style={styles.masterBio} numberOfLines={3}>
                    {displayMaster.description}
                  </Text>
                )}
              </View>
              
              {/* Pricing Section */}
              <View style={styles.pricingContainer}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Phí Tham Gia:</Text>
                  <Text style={styles.priceValue}>{displayWorkshop.price}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={() => {
                    Alert.alert(
                      'Đăng ký',
                      `Bạn muốn đăng ký tham gia workshop "${displayWorkshop.title}" chứ?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Đăng ký',
                          onPress: () => {
                            navigation.navigate('ticket_confirmation', {
                              workshop: displayWorkshop,
                              masterId: displayMaster.id
                            });
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.registerButtonText}>Đăng Ký Ngay</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              {/* Space at bottom for better scrolling */}
              <View style={{height: 40}} />
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageCardContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  workshopImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  imageTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  capacityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  workshopTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  detailText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  includeItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  includeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  includeText: {
    color: '#FFF',
    flex: 1,
    fontSize: 14,
  },
  learningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  learningText: {
    color: '#333',
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  descriptionText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  showMoreText: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 4,
  },
  masterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  masterImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  masterInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  masterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  masterTitle: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    color: '#FFF',
    marginLeft: 4,
    fontSize: 14,
  },
  expertiseText: {
    color: '#FFF',
    fontSize: 13,
  },
  masterBio: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  pricingContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  registerButton: {
    backgroundColor: '#8B0000',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8B0000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#8B0000',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backToListButton: {
    paddingVertical: 8,
  },
  backToListText: {
    color: '#8B0000',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
});

export default WorkshopDetailsScreen;