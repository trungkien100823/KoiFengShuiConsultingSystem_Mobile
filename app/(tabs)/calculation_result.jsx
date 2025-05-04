import React, { useEffect } from 'react';
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
  
  useEffect(() => {
    console.log('Calculation Result Params:', JSON.stringify(params, null, 2));
    console.log('Score:', params.result);
    console.log('Message:', params.message);
    console.log('Fish Details:', {
      koiVarietyId: params.koiVarietyId,
      koiName: params.koiName,
      fishCount: params.fishCount,
      pondName: params.name,
      shapeName: params.shapeName,
      direction: params.direction
    });
    
    const parsedMsg = parseMessage(params.message);
    console.log('Parsed Message Structure:', JSON.stringify(parsedMsg, null, 2));
  }, [params]);
  
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
              imageName: params.imageName,
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

        {/* Suggestions - Updated display */}
        {parsedMessage.suggestions && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightbulb" size={24} color={scoreColor} />
              <Text style={styles.cardTitle}>Gợi Ý Điều Chỉnh</Text>
            </View>
            
            {/* Parse and display the suggestions in formatted sections */}
            {parsedMessage.suggestions.split('\n\n').map((section, sectionIndex) => {
              // Get the title from the first line
              const lines = section.split('\n');
              const title = lines[0];
              const details = lines.slice(1);
              
              return (
                <View key={sectionIndex} style={styles.suggestionSection}>
                  {/* Section title */}
                  <Text style={styles.suggestionTitle}>{title}</Text>
                  
                  {/* Bulleted content */}
                  {details.map((detail, detailIndex) => {
                    // Check if it's a bullet point
                    if (detail.startsWith('-')) {
                      const bulletContent = detail.substring(2); // Remove "- " prefix
                      return (
                        <View key={detailIndex} style={styles.bulletPoint}>
                          <View style={[styles.bullet, {backgroundColor: scoreColor}]} />
                          <Text style={styles.bulletText}>{bulletContent}</Text>
                        </View>
                      );
                    } else if (detail.startsWith('  -')) {
                      // Sub-bullet points (indented)
                      const subBulletContent = detail.substring(4); // Remove "  - " prefix
                      return (
                        <View key={detailIndex} style={styles.subBulletPoint}>
                          <View style={[styles.subBullet, {borderColor: scoreColor}]} />
                          <Text style={styles.subBulletText}>{subBulletContent}</Text>
                        </View>
                      );
                    } else {
                      // Regular paragraph
                      return (
                        <Text key={detailIndex} style={styles.suggestionParagraph}>
                          {detail}
                        </Text>
                      );
                    }
                  })}
                  
                  {/* Add divider between sections except for the last one */}
                  {sectionIndex < parsedMessage.suggestions.split('\n\n').length - 1 && (
                    <View style={styles.sectionDivider} />
                  )}
                </View>
              );
            })}
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
  suggestionSection: {
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  suggestionParagraph: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    lineHeight: 22,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  subBulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 24, // More indentation
  },
  subBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginTop: 8,
    marginRight: 8,
  },
  subBulletText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
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