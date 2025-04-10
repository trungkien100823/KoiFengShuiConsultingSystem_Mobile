import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { consultingAPI, consultants } from '../../constants/consulting';

export default function ConsultantDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const consultantId = params.consultantId;
  
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultantDetails();
  }, [consultantId]);

  const fetchConsultantDetails = async () => {
    try {
      setLoading(true);
      if (consultingAPI && typeof consultingAPI.getConsultantDetails === 'function') {
        const details = await consultingAPI.getConsultantDetails(consultantId);
        setConsultant(details);
      } else {
        console.log('Using fallback data for consultant details');
        const foundConsultant = consultants.find(c => c.id.toString() === consultantId.toString());
        setConsultant(foundConsultant || consultants[0]);
      }
    } catch (error) {
      console.error('Error fetching consultant details:', error);
      const foundConsultant = consultants.find(c => c.id.toString() === consultantId.toString());
      setConsultant(foundConsultant || consultants[0]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !consultant) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Không tìm thấy thông tin master</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.push('/consulting')}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={consultant.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/consulting')}
          >
            <Ionicons name="chevron-back-circle" size={32} color="#8B0000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.spacer} />
          <View style={styles.contentCard}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{consultant.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.rating}>{consultant.rating}/5.0</Text>
              </View>
            </View>
            
            <View style={styles.specialtyContainer}>
              <Text style={styles.specialty}>{consultant.title}</Text>
            </View>
            
            <Text style={styles.bio}>{consultant.biography}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chuyên môn:</Text>
              <Text style={styles.infoValue}>{consultant.expertise}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kinh nghiệm:</Text>
              <Text style={styles.infoValue}>{consultant.experience}</Text>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.bookingContainer}>
          <TouchableOpacity 
            style={styles.bookingButton}
            onPress={() => router.push({
              pathname: '/(tabs)/online_booking',
              params: { 
                selectedMasterId: consultant.id,
                selectedMasterName: consultant.name,
                fromMasterDetails: 'true'
              }
            })}
          >
            <Text style={styles.bookingButtonText}>Đặt lịch tư vấn</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  backButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  spacer: {
    height: 500, // Adjust this value to control when the white card appears
  },
  contentCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 30,
    minHeight: '100%', // This ensures the white background extends to the bottom
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  specialty: {
    fontSize: 14,
    color: '#8B4513',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  bookingContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    padding: 15,
    zIndex: 10,
  },
  bookingButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
