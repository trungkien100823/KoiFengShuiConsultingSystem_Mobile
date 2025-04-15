import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  Dimensions, 
  Platform,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function CalculationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const score = Number(params.result);
  const message = params.message || getScoreMessage(score);
  
  // Animation values
  const scoreOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0.8);
  const detailsOpacity = useSharedValue(0);
  const detailsTranslateY = useSharedValue(50);
  const colorsOpacity = useSharedValue(0);
  const colorsTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  
  useEffect(() => {
    // Sequence animations for a nicer entry
    scoreOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    scoreScale.value = withDelay(300, withTiming(1, { duration: 800 }));
    detailsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    detailsTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
    colorsOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    colorsTranslateY.value = withDelay(900, withTiming(0, { duration: 600 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    buttonScale.value = withDelay(1200, withTiming(1, { duration: 500 }));
  }, []);
  
  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ scale: scoreScale.value }]
  }));
  
  const detailsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: detailsOpacity.value,
    transform: [{ translateY: detailsTranslateY.value }]
  }));
  
  const colorsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: colorsOpacity.value,
    transform: [{ translateY: colorsTranslateY.value }]
  }));
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }]
  }));

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#8BC34A'; // Light green
    if (score >= 40) return '#FFC107'; // Yellow
    if (score >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Rất tốt! Sự kết hợp này mang lại may mắn và thịnh vượng.';
    if (score >= 60) return 'Tốt! Sự kết hợp này khá hài hòa.';
    if (score >= 40) return 'Trung bình. Có thể cải thiện thêm.';
    if (score >= 20) return 'Chưa tốt. Nên xem xét thay đổi.';
    return 'Không phù hợp. Cần thay đổi để cải thiện phong thủy.';
  };

  const getRatingText = (score) => {
    if (score >= 80) return 'Xuất sắc';
    if (score >= 60) return 'Tốt';
    if (score >= 40) return 'Trung bình';
    if (score >= 20) return 'Thấp';
    return 'Không phù hợp';
  };

  const scoreColor = getScoreColor(score);
  const ratingText = getRatingText(score);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/feng shui.png')} 
          style={styles.patternBackground}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(139, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.headerOverlay}
        >
          <Text style={styles.headerTitle}>Kết Quả Phong Thủy</Text>
        </LinearGradient>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Section */}
        <Animated.View style={[styles.scoreSection, scoreAnimatedStyle]}>
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
              <Text style={styles.scoreText}>{score}%</Text>
            </View>
            <Text style={styles.ratingText}>{ratingText}</Text>
          </View>
          
          <View style={styles.messagePaper}>
            <View style={styles.paperTopEdge}>
              {Array.from({ length: 7 }).map((_, i) => (
                <View key={i} style={styles.paperEdgeDetail} />
              ))}
            </View>
            <Text style={styles.messageText}>{message}</Text>
            <View style={styles.paperShadow} />
          </View>
        </Animated.View>
        
        {/* Details Section */}
        <Animated.View style={[styles.detailsSection, detailsAnimatedStyle]}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.decorativeLine} />
            <View style={styles.titleBackground}>
              <Text style={styles.sectionTitle}>Chi Tiết Phân Tích</Text>
            </View>
            <View style={styles.decorativeLine} />
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <FontAwesome5 name="fish" size={16} color="#8B0000" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Tên cá:</Text>
                <Text style={styles.detailValue}>{params.koiName || 'Chưa có tên'}</Text>
              </View>
            </View>
            
            <View style={styles.separatorLine} />
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Ionicons name="water" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Tên hồ:</Text>
                <Text style={styles.detailValue}>{params.name}</Text>
              </View>
            </View>
            
            <View style={styles.separatorLine} />
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <MaterialIcons name="category" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Hình dạng:</Text>
                <Text style={styles.detailValue}>{params.shapeName}</Text>
              </View>
            </View>
            
            <View style={styles.separatorLine} />
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Feather name="compass" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Hướng:</Text>
                <Text style={styles.detailValue}>{params.direction}</Text>
              </View>
            </View>
            
            <View style={styles.separatorLine} />
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <AntDesign name="calculator" size={18} color="#8B0000" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Số lượng cá:</Text>
                <Text style={styles.detailValue}>{params.fishCount} con</Text>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Colors Section */}
        <Animated.View style={[styles.colorsSection, colorsAnimatedStyle]}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.decorativeLine} />
            <View style={styles.titleBackground}>
              <Text style={styles.sectionTitle}>Tỷ Lệ Màu Sắc</Text>
            </View>
            <View style={styles.decorativeLine} />
          </View>
          
          <View style={styles.colorPalette}>
            {Object.entries(params)
              .filter(([key]) => key.endsWith('Percentage'))
              .map(([key, value], index) => {
                const colorName = key.replace('Percentage', '');
                const colorKey = colorName.charAt(0).toUpperCase() + colorName.slice(1);
                const colorHex = getColorCode(colorKey);
                const percentage = Number(value);
                
                return (
                  <View key={key} style={styles.colorItem}>
                    <View style={styles.colorHeaderRow}>
                      <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
                      <Text style={styles.colorName}>{colorKey}</Text>
                      <Text style={styles.colorPercentage}>{percentage}%</Text>
                    </View>
                    
                    <View style={styles.colorBarContainer}>
                      <View 
                        style={[
                          styles.colorBar, 
                          { width: `${percentage}%`, backgroundColor: colorHex }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })
            }
          </View>
        </Animated.View>
        
        {/* Back Button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
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
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to get color codes
const getColorCode = (colorName) => {
  const colorMap = {
    'Trắng': '#FFFFFF',
    'Xám': '#808080',
    'Ghi': '#A9A9A9',
    'Vàng': '#FFD700',
    'Nâu': '#8B4513',
    'XanhLá': '#008000',
    'XanhDương': '#0000FF',
    'Đen': '#000000',
    'Đỏ': '#FF0000',
    'Hồng': '#FFC0CB',
    'Cam': '#FFA500',
    'Tím': '#800080'
  };
  
  return colorMap[colorName] || '#666666';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 110,
    justifyContent: 'flex-end',
    paddingBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  scoreSection: {
    marginBottom: 25,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  messagePaper: {
    backgroundColor: '#FFF',
    borderRadius: 2,
    padding: 20,
    marginHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  paperTopEdge: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    height: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  paperEdgeDetail: {
    width: 8,
    height: 4,
    backgroundColor: '#8B0000',
    opacity: 0.5,
    borderRadius: 1,
  },
  paperShadow: {
    position: 'absolute',
    bottom: -3,
    left: 4,
    right: 4,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailsSection: {
    marginBottom: 30,
  },
  colorsSection: {
    marginBottom: 30,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
  },
  titleBackground: {
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B0000',
  },
  detailsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 6,
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  separatorLine: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 15,
    marginLeft: 48,
  },
  colorPalette: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  colorItem: {
    marginBottom: 15,
  },
  colorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  colorPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  colorBarContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 20,
  },
  colorBar: {
    height: '100%',
    borderRadius: 3,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
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
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});