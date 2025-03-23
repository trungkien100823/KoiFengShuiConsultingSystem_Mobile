import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CalculationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Xanh lá - Rất tốt
    if (score >= 60) return '#8BC34A'; // Xanh nhạt - Tốt
    if (score >= 40) return '#FFC107'; // Vàng - Trung bình
    if (score >= 20) return '#FF9800'; // Cam - Kém
    return '#F44336'; // Đỏ - Rất kém
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Rất tốt! Sự kết hợp này mang lại may mắn và thịnh vượng.';
    if (score >= 60) return 'Tốt! Sự kết hợp này khá hài hòa.';
    if (score >= 40) return 'Trung bình. Có thể cải thiện thêm.';
    if (score >= 20) return 'Chưa tốt. Nên xem xét thay đổi.';
    return 'Không phù hợp. Cần thay đổi để cải thiện phong thủy.';
  };

  // Đảm bảo lấy đúng giá trị số và không làm tròn
  const score = Number(params.result);
  const message = params.message || getScoreMessage(score);

  console.log('Raw result:', params.result);
  console.log('Parsed score:', score);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kết Quả Phong Thủy</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: getScoreColor(score) }]}>
          {score}%
        </Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Chi tiết:</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Tên cá:</Text>
          <Text style={styles.value}>{params.koiName || 'Chưa có tên'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Tên hồ:</Text>
          <Text style={styles.value}>{params.name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Hình dạng:</Text>
          <Text style={styles.value}>{params.shapeName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Hướng:</Text>
          <Text style={styles.value}>{params.direction}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Số lượng cá:</Text>
          <Text style={styles.value}>{params.fishCount} con</Text>
        </View>

        <Text style={styles.colorTitle}>Tỷ lệ màu sắc:</Text>
        <View style={styles.colorContainer}>
          {Object.entries(params)
            .filter(([key]) => key.endsWith('Percentage'))
            .map(([key, value]) => (
              <View key={key} style={styles.colorRow}>
                <Text style={styles.colorLabel}>
                  {key.replace('Percentage', '').charAt(0).toUpperCase() + 
                   key.replace('Percentage', '').slice(1)}:
                </Text>
                <Text style={styles.colorValue}>{value}%</Text>
              </View>
            ))
          }
        </View>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.push({
          pathname: '/(tabs)/fish_details',
          params: {
            id: params.koiVarietyId, // Truyền lại ID của cá
            koiVarietyId: params.koiVarietyId,
            name: params.koiName || 'Unknown',
            description: params.description || 'Chưa có mô tả.',
            introduction: params.introduction || '',
            imageName: params.imageName || 'buddha.png',
            liked: params.liked || 'false',
            size: params.size || '2'
          }
        })}
      >
        <Ionicons name="arrow-back-circle" size={24} color="#fff" style={styles.backIcon} />
        <Text style={styles.backButtonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  score: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 25,
    borderRadius: 15,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    width: 120,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  colorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  colorContainer: {
    marginTop: 10,
    width: '100%',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginBottom: 5,
  },
  colorLabel: {
    fontSize: 14,
    color: '#666',
  },
  colorValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backIcon: {
    marginRight: 5,
  },
});