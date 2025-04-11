import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_CONFIG } from '../../constants/config';

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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
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
              <Ionicons name="chevron-back-circle" size={32} color="#FFF" />
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
                    <Text style={styles.ratingText}>{consultant.rating}/5.0</Text>
                  </View>
                </View>
                
                <View style={styles.nameSection}>
                  <Text style={styles.name}>{consultant.masterName}</Text>
                  <View style={styles.titleContainer}>
                    <Text style={styles.specialty}>{consultant.title}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.bioSection}>
                <Text style={styles.sectionTitle}>Giới thiệu</Text>
                <Text style={styles.bio}>{consultant.biography}</Text>
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
                      <Text style={styles.infoValue}>{consultant.expertise}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="time-outline" size={24} color="#8B0000" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Kinh nghiệm</Text>
                      <Text style={styles.infoValue}>{consultant.experience}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 200,
    paddingTop: 20,
    minHeight: '100%',
  },
  profileSection: {
    marginTop: -80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#FFF',
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
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  titleContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  specialty: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  bioSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    textAlign: 'justify',
  },
  infoSection: {
    paddingHorizontal: 20,
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
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bookingContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
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
    paddingVertical: 16,
  },
  bookingButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bookingButtonIcon: {
    marginLeft: 4,
  },
});
