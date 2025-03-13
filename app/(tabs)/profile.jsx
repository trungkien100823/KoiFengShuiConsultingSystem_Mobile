import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../../components/BackButton';

const elementColors = {
  Hỏa: '#FF4500', // Orange Red for Fire
  Kim: '#C0C0C0', // Silver for Metal
  Thủy: '#006994', // Ocean Blue for Water
  Mộc: '#228B22', // Forest Green for Wood
  Thổ: '#DEB887', // Burlywood (Light Brown) for Earth
};

export default function UserInfo() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userData } = route.params;
  const elementColor = elementColors[userData.element] || '#FF4500';
  const params = useLocalSearchParams();
  const router = useRouter();
  const score = parseFloat(params.score) || 0;

  const getCompatibilityMessage = (score) => {
    if (score < 20) return "Rất không hợp, cần xem xét lại phong thủy.";
    if (score < 40) return "Hợp mức thấp, có thể cải thiện thêm.";
    if (score < 60) return "Hợp trung bình, có thể chấp nhận.";
    if (score < 80) return "Hợp tốt, có thể sử dụng.";
    return "Rất hợp phong thủy, lý tưởng!";
  };

  const getCompatibilityColor = (score) => {
    if (score < 20) return '#FF0000';      // Red for very incompatible
    if (score < 60) return '#FFD700';      // Yellow for moderate compatibility
    return '#008000';                      // Green for good compatibility
  };

  return (
    <ImageBackground
      source={require('../../assets/images/feng shui.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Kết quả tính toán</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Điểm tương hợp:</Text>
            <Text style={[
              styles.scoreText,
              { color: getCompatibilityColor(score) }
            ]}>
              {score}%
            </Text>
            <Text style={[
              styles.messageText,
              { color: getCompatibilityColor(score) }
            ]}>
              {getCompatibilityMessage(score)}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Chi tiết:</Text>
            <Text style={styles.detailItem}>Tỉ lệ màu sắc: {params.colorRatio || 'N/A'}</Text>
            <Text style={styles.detailItem}>Hình dạng hồ: {params.pondShape || 'N/A'}</Text>
            <Text style={styles.detailItem}>Hướng: {params.direction || 'N/A'}</Text>
            <Text style={styles.detailItem}>Số lượng cá: {params.fishCount || 'N/A'}</Text>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#8B0000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detailItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});