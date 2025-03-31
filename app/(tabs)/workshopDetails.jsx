import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { workshopDetailsService } from '../../constants/workshopDetails';

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
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  // Hiển thị màn hình lỗi với nút thử lại
  if (error && !workshopData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header với nút back */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('workshop')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Banner ảnh */}
        <View style={styles.bannerContainer}>
          <Image 
            source={displayWorkshop.image} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Thông tin workshop */}
        <View style={styles.workshopInfoSection}>
          <Text style={styles.workshopTitle}>{displayWorkshop.title}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#333" />
            <Text style={styles.infoText}>Date: {displayWorkshop.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#333" />
            <Text style={styles.infoText}>{displayWorkshop.location}</Text>
          </View>
          {displayWorkshop.status && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#333" />
              <Text style={styles.infoText}>Trạng thái: {displayWorkshop.status}</Text>
            </View>
          )}
          {displayWorkshop.capacity && (
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={16} color="#333" />
              <Text style={styles.infoText}>Sức chứa: {displayWorkshop.capacity} người</Text>
            </View>
          )}
        </View>

        {/* Chi tiết workshop */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Mô tả:</Text>
          <Text style={styles.description}>{displayWorkshop.description}</Text>
        </View>

        {/* Thông tin về Master */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Thông tin Master:</Text>
          <View style={styles.masterSection}>
            <Image source={displayMaster.image} style={styles.masterImage} />
            <View style={styles.masterInfo}>
              <Text style={styles.masterName}>{displayMaster.name}</Text>
              <Text style={styles.masterTitle}>{displayMaster.title}</Text>
              {displayMaster.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{displayMaster.rating}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.description}>{displayMaster.description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="briefcase-outline" size={20} color="#333" />
              <Text style={styles.statLabel}>Kinh nghiệm: {displayMaster.experience}</Text>
            </View>
            {displayMaster.expertise && (
              <View style={styles.statItem}>
                <Ionicons name="ribbon-outline" size={20} color="#333" />
                <Text style={styles.statLabel}>Chuyên môn: {displayMaster.expertise}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Phí tham gia */}
        <View style={styles.feesSection}>
          <Text style={styles.feesLabel}>Phí tham gia:</Text>
          <Text style={styles.feesAmount}>{displayWorkshop.price}</Text>
        </View>

        {/* Thêm thông báo lỗi nhỏ khi không thể tải thông tin master */}
        {error && !masterInfo && (
          <View style={styles.smallErrorContainer}>
            <Text style={styles.smallErrorText}>
              {error.includes('master') ? error : 'Không thể tải thông tin master'}
            </Text>
          </View>
        )}

        {/* Nút đăng ký */}
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={() => navigation.navigate('ticket_confirmation', { 
            workshopId: displayWorkshop.id,
            workshopName: displayWorkshop.title,
            workshopPrice: displayWorkshop.price
          })}
        >
          <Text style={styles.registerButtonText}>Đăng ký tham gia</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    height: 250,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  workshopInfoSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  workshopTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoText: {
    color: '#666',
    marginLeft: 6,
    fontSize: 14,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  masterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  masterImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  masterInfo: {
    flex: 1,
  },
  masterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  masterTitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  feesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  feesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  feesAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#E53935',
  },
  registerButton: {
    backgroundColor: '#8B0000',
    marginHorizontal: 120,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
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