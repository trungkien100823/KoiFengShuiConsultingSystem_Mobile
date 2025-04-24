import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CalculationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  };

  const parseMessage = (message) => {
    if (!message) return { summary: '', impacts: [], suggestions: [], tips: [] };
    
    const sections = message.split('\n\n');
    let result = {
      summary: '',
      element: '',
      impacts: [],
      suggestions: '',
      tips: []
    };

    sections.forEach(section => {
      if (section.startsWith('✅')) {
        result.summary = section.replace('✅ ', '').replace(/\*\*/g, '');
      } else if (section.startsWith('🌱')) {
        result.element = section.replace('🌱 ', '').replace(/\*\*/g, '');
      } else if (section.startsWith('📊')) {
        result.impacts = section
          .split('\n')
          .slice(1)
          .map(impact => impact.replace('- ', ''));
      } else if (section.startsWith('🧭')) {
        result.suggestions = section.replace('🧭 **Gợi ý điều chỉnh:**\n', '').replace(/\*\*/g, '');
      } else if (section.startsWith('💡')) {
        result.tips = section
          .split('\n')
          .slice(1)
          .map(tip => tip.replace('- ', ''));
      }
    });

    return result;
  };

  const score = Number(params.result);
  const parsedMessage = parseMessage(params.message);
  const scoreColor = getScoreColor(score);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={scoreColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: scoreColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push({
            pathname: '/(tabs)/fish_details',
            params: {
              id: params.koiVarietyId,
              koiVarietyId: params.koiVarietyId,
              name: params.koiName || 'Unknown',
              description: params.description || 'Chưa có mô tả.',
              introduction: params.introduction || '',
              imageName: params.imageName || 'buddha.png',
              liked: params.liked || 'false',
              size: params.size || '2',
              timestamp: Date.now()
            }
          })}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết Quả Phong Thủy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Score Section */}
        <View style={styles.scoreSection}>
          <LinearGradient
            colors={[scoreColor, scoreColor + '80']}
            style={styles.scoreContainer}
          >
            <Text style={styles.scoreValue}>{score}%</Text>
            <Text style={styles.scoreSummary}>{parsedMessage.summary}</Text>
          </LinearGradient>
        </View>

        {/* Element Info */}
        {parsedMessage.element && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="fire" size={24} color={scoreColor} />
              <Text style={styles.cardTitle}>Ngũ Hành</Text>
            </View>
            <Text style={styles.elementText}>{parsedMessage.element}</Text>
          </View>
        )}

        {/* Impacts */}
        {parsedMessage.impacts.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color={scoreColor} />
              <Text style={styles.cardTitle}>Tác Động Phong Thủy</Text>
            </View>
            {parsedMessage.impacts.map((impact, index) => (
              <View key={index} style={styles.impactItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={scoreColor} />
                <Text style={styles.impactText}>{impact}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {parsedMessage.suggestions && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightbulb" size={24} color={scoreColor} />
              <Text style={styles.cardTitle}>Gợi Ý Điều Chỉnh</Text>
            </View>
            <Text style={styles.suggestionText}>{parsedMessage.suggestions}</Text>
          </View>
        )}

        {/* Tips */}
        {parsedMessage.tips.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="star" size={24} color={scoreColor} />
              <Text style={styles.cardTitle}>Mẹo Tăng Cường Vận Khí</Text>
            </View>
            {parsedMessage.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <MaterialCommunityIcons name="arrow-right-circle" size={20} color={scoreColor} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Configuration Details */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cog" size={24} color={scoreColor} />
            <Text style={styles.cardTitle}>Chi Tiết Cấu Hình</Text>
          </View>
          <DetailRow label="Tên cá" value={params.koiName || 'Chưa có tên'} />
          <DetailRow label="Số lượng" value={`${params.fishCount} con`} />
          <DetailRow label="Tên hồ" value={params.name} />
          <DetailRow label="Hình dạng" value={params.shapeName} />
          <DetailRow label="Hướng" value={params.direction} />
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: scoreColor }]}
        onPress={() => router.push({
          pathname: '/(tabs)/fish_details',
          params: { id: params.koiVarietyId, timestamp: Date.now() }
        })}
      >
        <Text style={styles.actionButtonText}>Điều Chỉnh Cấu Hình</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Helper component for detail rows
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    width: 28,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollView: {
    flex: 1,
  },
  scoreSection: {
    padding: 16,
  },
  scoreContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  scoreSummary: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  elementText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  impactText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    marginLeft: 8,
    lineHeight: 20,
  },
  suggestionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    marginLeft: 8,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    margin: 16,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});