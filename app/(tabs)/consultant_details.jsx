import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ImageBackground, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');

export default function ConsultantDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const masterId = params.masterId;
  
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasterDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.baseURL}/api/Master/${masterId}`);
        const result = await response.json();
        
        if (result.isSuccess && result.data) {
          setConsultant(result.data);
        }
      } catch (error) {
        console.error('Error fetching master details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (masterId) {
      fetchMasterDetails();
    }
  }, [masterId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!consultant) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/consulting')}
        >
          <Ionicons name="chevron-back-circle" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground 
        source={consultant.imageUrl ? { uri: consultant.imageUrl } : require('../../assets/images/consultant1.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/consulting')}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.contentCard}>
              <View style={styles.profileSection}>
                <View style={styles.profileImageContainer}>
                  <Image 
                    source={consultant.imageUrl ? { uri: consultant.imageUrl } : require('../../assets/images/consultant1.jpg')}
                    style={styles.profileImage}
                  />
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{consultant.rating || 0}/5.0</Text>
                  </View>
                </View>
                
                <View style={styles.nameSection}>
                  <Text style={styles.name}>{consultant.masterName || 'Chưa có tên'}</Text>
                  <View style={styles.titleContainer}>
                    <Text style={styles.specialty}>{consultant.title || 'Chuyên gia'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.bioSection}>
                <Text style={styles.sectionTitle}>Giới thiệu</Text>
                <Text style={styles.bio}>{consultant.biography || 'Chưa cập nhật thông tin giới thiệu.'}</Text>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="medal-outline" size={24} color="#8B0000" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Chuyên môn</Text>
                      <Text style={styles.infoValue}>{consultant.expertise || 'Chưa cập nhật'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="time-outline" size={24} color="#8B0000" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Kinh nghiệm</Text>
                      <Text style={styles.infoValue}>{consultant.experience || 'Chưa cập nhật'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.bookingContainer}>
            <TouchableOpacity 
              style={styles.bookingButton}
              onPress={() => router.push({
                pathname: '/(tabs)/online_booking',
                params: { 
                  selectedMasterId: consultant.masterId,
                  selectedMasterName: consultant.masterName,
                  fromMasterDetails: 'true'
                }
              })}
            >
              <LinearGradient
                colors={['#8B0000', '#600000']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.bookingButtonGradient}
              >
                <Text style={styles.bookingButtonText}>Đặt lịch tư vấn</Text>
                <Ionicons name="calendar-outline" size={24} color="#FFF" style={styles.bookingButtonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B0000',
    marginTop: 12,
    fontSize: 16,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    zIndex: 1,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: height * 0.22,
    paddingTop: 20,
    minHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  profileSection: {
    marginTop: -80,
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#e1e1e1',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  ratingText: {
    color: '#FFF',
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 14,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  name: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  specialty: {
    color: '#8B0000',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 20,
    marginHorizontal: width * 0.05,
  },
  bioSection: {
    paddingHorizontal: width * 0.05,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bio: {
    fontSize: width * 0.038,
    color: '#666',
    lineHeight: width * 0.06,
    textAlign: 'justify',
  },
  infoSection: {
    paddingHorizontal: width * 0.05,
    marginBottom: 100,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: width * 0.035,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: width * 0.04,
    color: '#333',
    fontWeight: '500',
  },
  bookingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.05,
  },
  bookingButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  bookingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
  },
  bookingButtonText: {
    color: '#FFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bookingButtonIcon: {
    marginLeft: 4,
  },
});
