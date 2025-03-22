import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CoursePaymentSuccessScreen() {
  const router = useRouter();
  const { courseId, courseTitle, courseImage } = useLocalSearchParams();

  const handleContinue = () => {
    router.push('/(tabs)/course_chapter');
  };

  const handleBack = () => {
    router.push('/(tabs)/courses');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Xác nhận thanh toán</Text>
        
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark" size={60} color="#fff" />
        </View>
        
        <Text style={styles.successMessage}>
          Dịch vụ đã được thanh toán thành công
        </Text>
        
        <Text style={styles.purchaseTitle}>Khóa học bạn đã mua</Text>
        
        {/* Course Card using styles from courses_list.jsx */}
        <View style={styles.courseCardContainer}>
          <View style={styles.courseCard}>
            <Image 
              source={courseImage ? { uri: courseImage } : require('../../assets/images/koi_image.jpg')}
              style={styles.courseImage}
            />
            <View style={styles.cardOverlay}>
              <Text style={styles.courseTitle}>
                {courseTitle || 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học'}
              </Text>
            </View>
          </View>
          <Image 
            source={require('../../assets/images/f2.png')}
            style={styles.fengShuiLogo}
          />
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Tiếp tục</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Trở lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 40,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  purchaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    alignSelf: 'center',
    marginTop: -10,
    marginBottom: 20,
  },
  // Copied styles from courses_list.jsx
  courseCardContainer: {
    position: 'relative',
    marginBottom: 60,
    paddingLeft: 8,
    width: '100%',
  },
  courseCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(139,0,0,0.6)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'flex-end',
  },
  courseTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
    marginLeft: 10,
  },
  fengShuiLogo: {
    position: 'absolute',
    left: -5,
    bottom: -45,
    width: 100,
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 0,
    gap: 20,
  },
  continueButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B0000',
    flex: 1,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B0000',
    flex: 1,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
