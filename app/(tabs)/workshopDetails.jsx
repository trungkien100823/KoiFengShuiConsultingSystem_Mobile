import React, { useState, useEffect, useCallback } from 'react';
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
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { workshopDetailsService } from '../../constants/workshopDetails';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

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
      setError('Không tìm thấy workshop');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Đang gọi API workshop với ID:', workshopId);
      
      // Fetch workshop details from the correct API endpoint
      const response = await workshopDetailsService.getWorkshopDetails(workshopId);
      
      console.log('Workshop details response:', JSON.stringify(response));
      
      if (response && response.isSuccess) {
        // Extract data from the response
        const workshopDetails = response.data;
        console.log('Workshop data extracted:', JSON.stringify(workshopDetails));
        
        // Format date if startDate exists
        if (workshopDetails.startDate) {
          console.log('Found startDate:', workshopDetails.startDate);
          const formattedDate = formatDate(workshopDetails.startDate);
          console.log('Formatted date result:', formattedDate);
          workshopDetails.formattedDate = formattedDate;
        }
        
        // Set workshop data to state
        setWorkshopData(workshopDetails);
        
        // If there's a masterId, fetch master details
        if (workshopDetails.masterId) {
          try {
            const masterResponse = await workshopDetailsService.getMasterDetails(workshopDetails.masterId);
            if (masterResponse && masterResponse.isSuccess) {
              setMasterInfo(masterResponse.data);
            }
          } catch (masterError) {
            console.error('Error fetching master info:', masterError);
            // Don't set error state here - we still have workshop data
          }
        }
      } else {
        throw new Error(response?.message || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      setError(error.message || 'Đã xảy ra lỗi khi lấy dữ liệu');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };
  
  // Thay thế useEffect bằng useFocusEffect
  useFocusEffect(
    useCallback(() => {
      console.log('Màn hình được focus, đang fetch dữ liệu...');
      fetchData();
    }, [workshopId, imageId])
  );
  
  const getImageForId = (id) => {
    if (id === '1' || id === '2' || id === '3') {
      return require('../../assets/images/buddha.png');
    }
    return require('../../assets/images/buddha.png');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      console.log('Formatting date string:', dateString);
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.log('Date không hợp lệ, trả về nguyên mẫu:', dateString);
        return dateString;
      }
      
      // Format date
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      
      // Combine date and time
      return `${formattedDate}`;
    } catch (error) {
      console.error('Lỗi định dạng ngày:', error);
      return dateString;
    }
  };
  
  // Hiển thị loader khi đang tải dữ liệu
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'right', 'left']}>
        <StatusBar translucent barStyle="light-content" backgroundColor="rgba(139,0,0,0.3)" />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  // Hiển thị màn hình lỗi với nút thử lại
  if (error && !workshopData) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'right', 'left']}>
        <StatusBar translucent barStyle="light-content" backgroundColor="rgba(139,0,0,0.3)" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          disabled={retrying}
          onPress={() => {
            setRetrying(true);
            fetchData();
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#8B0000', '#600000']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.retryButtonGradient}
          >
            <Text style={styles.retryButtonText}>
              {retrying ? 'Đang thử lại...' : 'Thử lại'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backToListButton}
          onPress={() => navigation.navigate('workshop')}
          activeOpacity={0.6}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
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
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <StatusBar translucent barStyle="light-content" backgroundColor="rgba(0,0,0,0.3)" />
      
      {/* Back button */}
      <TouchableOpacity 
        style={[styles.backButton, {top: Platform.OS === 'ios' ? 50 : STATUSBAR_HEIGHT + 10}]} 
        onPress={() => navigation.navigate('workshop')}
        activeOpacity={0.7}
        hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
        bounces={true}
      >
        {/* Hero Image Section */}
        <ImageBackground
          source={{ uri: displayWorkshop.imageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
          defaultSource={require('../../assets/images/buddha.png')}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.title}>{displayWorkshop.workshopName || 'Workshop Title'}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Workshop Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="information-circle-outline" size={22} color="#8B0000" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Thông tin Workshop</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Thời gian diễn ra</Text>
                <Text style={styles.detailValue}>{displayWorkshop.formattedDate || formatDate(displayWorkshop.startDate) || 'Đang cập nhật'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Giờ bắt đầu - kết thúc</Text>
                <Text style={styles.detailValue}>
                  {displayWorkshop.startTime ? `${displayWorkshop.startTime} - ${displayWorkshop.endTime || 'N/A'}` : 'Đang cập nhật'}
                </Text>
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
                <Ionicons name="people" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Sức chứa</Text>
                <Text style={styles.detailValue}>{displayWorkshop.capacity || 0} người</Text>
              </View>
            </View>
          </View>
          
          {/* Description Section */}
          <View style={styles.descriptionCard}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="document-text-outline" size={22} color="#8B0000" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            </View>
            <Text style={styles.description}>{displayWorkshop.description || 'Đang cập nhật thông tin...'}</Text>
          </View>

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="pricetag-outline" size={22} color="#8B0000" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Thông tin giá vé</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá vé tham dự:</Text>
              <Text style={styles.priceValue}>
                {displayWorkshop.price 
                  ? `${displayWorkshop.price.toLocaleString('vi-VN')} VND` 
                  : 'Miễn phí'}
              </Text>
            </View>
          </View>

          {/* Master Info Section */}
          {displayWorkshop.masterName && (
            <View style={styles.masterCard}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="person-outline" size={22} color="#8B0000" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Thông tin người chủ trì</Text>
              </View>
              
              <View style={styles.masterInfo}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="person" size={18} color="#8B0000" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Họ và tên</Text>
                    <Text style={styles.detailValue}>{displayWorkshop.masterName}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {/* Spacer for bottom button */}
          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Bottom Register Button */}
      <View style={styles.bookingButtonContainer}>
        <TouchableOpacity 
          style={styles.bookingButton}
          onPress={() => navigation.navigate('ticket_confirmation', { 
            workshopId: displayWorkshop.workshopId,
            workshopName: displayWorkshop.workshopName,
            workshopPrice: displayWorkshop.price,
            resetTicketCount: route.params?.resetTicketCount || true
          })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B0000', '#600000']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.bookingButtonGradient}
          >
            <Text style={styles.bookingButtonText}>Đăng ký tham gia</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heroImage: {
    width: width,
    height: Platform.OS === 'ios' ? height * 0.35 : height * 0.32,
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
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  priceValue: {
    fontSize: 20,
    color: '#8B0000',
    fontWeight: 'bold',
  },
  masterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  masterInfo: {
    marginTop: 5,
  },
  bookingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  bookingButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  bookingButtonGradient: {
    height: '100%',
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
    backgroundColor: '#f7f7f7',
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
    backgroundColor: '#f7f7f7',
    padding: 20,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToListButton: {
    padding: 12,
    marginTop: 12,
  },
  backToListText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  spacer: {
    height: 40,
  },
});

export default WorkshopDetailsScreen;