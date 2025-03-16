import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { consultingAPI, consultants } from '../../constants/consulting';

// Sample comment data
const commentData = [
  {
    id: 1,
    username: '@JohnSmith',
    date: 'Jan 1, 2024',
    rating: 4.0,
    comment: 'Thầy thật giỏi trong việc nhìn nhận và phân tích phong thủy, những lời khuyên của thầy khiến mọi thứ trở nên hài hòa và đầy may mắn!'
  },
  {
    id: 2,
    username: '@MariaLe',
    date: 'Jan 2, 2024',
    rating: 5.0,
    comment: 'Tôi rất hài lòng với buổi tư vấn. Thầy phân tích rất chi tiết và đưa ra những giải pháp thiết thực.'
  },
  {
    id: 3,
    username: '@DavidNguyen',
    date: 'Jan 3, 2024',
    rating: 4.5,
    comment: 'Thầy có kiến thức sâu rộng về phong thủy. Những lời khuyên rất hữu ích cho gia đình tôi.'
  }
];

// Add this new component after your imports
const CommentItem = ({ comment }) => (
  <View style={styles.commentItem}>
    <View style={styles.commentHeader}>
      <View style={styles.userInfo}>
        <Image 
          source={require('../../assets/images/default-avatar.png')} 
          style={styles.userAvatar} 
        />
        <View>
          <Text style={styles.username}>{comment.username}</Text>
          <Text style={styles.commentDate}>{comment.date}</Text>
        </View>
      </View>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.commentRating}>{comment.rating}/5.0</Text>
      </View>
    </View>
    <Text style={styles.commentText}>{comment.comment}</Text>
  </View>
);

export default function ConsultantDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const consultantId = params.consultantId;
  
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (consultantId) {
      fetchConsultantDetails();
    } else {
      // If no ID provided, use the first sample consultant
      setConsultant(consultants[0]);
      setLoading(false);
    }
  }, [consultantId]);

  const fetchConsultantDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching details for consultant ID: ${consultantId}`);
      
      // This should now return either API data or fallback data
      const data = await consultingAPI.getConsultantById(consultantId);
      
      console.log("Consultant data received:", data?.name);
      setConsultant(data);
      setLoading(false);
    } catch (err) {
      console.error('Error in consultant details component:', err);
      setError(`Failed to load consultant details: ${err.message}`);
      
      // As a last resort, use the first consultant
      console.log("Using first consultant as fallback");
      setConsultant(consultants[0]);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading consultant details...</Text>
      </View>
    );
  }

  if (!consultant) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Consultant not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.push('/consulting')}
        >
          <Text style={styles.retryButtonText}>Back to Consultants</Text>
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
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#8B0000" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />
          <View style={styles.contentCard}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{consultant.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.rating}>{consultant.rating.toFixed(1)}/5.0</Text>
              </View>
            </View>
            
            <View style={styles.specialtyContainer}>
              <Text style={styles.specialty}>{consultant.specialty}</Text>
            </View>
            
            <Text style={styles.bio}>{consultant.bio}</Text>
            
            <Text style={styles.sectionTitle}>Chuyên môn:</Text>
            {consultant.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyItem}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quá trình làm việc:</Text>
              <Text style={styles.infoValue}>{consultant.experience}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thành tựu:</Text>
              <Text style={styles.infoValue}>{consultant.completedProjects}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.commentsSection}>
              <Text style={styles.commentsSectionTitle}>Comments</Text>
              {commentData.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.bookingContainer}>
          <TouchableOpacity 
            style={styles.bookingButton}
            onPress={() => router.push({
              pathname: '/booking',
              params: { consultantId: consultant.id }
            })}
          >
            <Text style={styles.bookingButtonText}>Booking</Text>
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
  menuButton: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  specialtyItem: {
    marginBottom: 5,
  },
  specialtyText: {
    fontSize: 14,
    color: '#333',
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
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  commentsSection: {
    paddingBottom: 100,
  },
  commentsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  commentItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentRating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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
