import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OfflineOnlineScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background with gradient overlay */}
      <ImageBackground 
        source={require('../../assets/images/feng shui.png')} 
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(139,0,0,0.8)']}
          style={styles.gradient}
        />
      </ImageBackground>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/consulting')}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn phương thức tư vấn</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main content */}
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>Bạn muốn được tư vấn theo phương thức nào?</Text>
        
        {/* Option cards */}
        <View style={styles.optionsContainer}>
          {/* Offline Option */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => router.push('/offline_booking')}
          >
            <View style={styles.optionIconContainer}>
              <LinearGradient 
                colors={['#8B0000', '#600000']} 
                style={styles.iconBackground}
              >
                <MaterialCommunityIcons name="store" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text style={styles.optionTitle}>Trực tiếp</Text>
            <Text style={styles.optionDescription}>
              Tư vấn trực tiếp tại gia bởi các chuyên gia tư vấn của chúng tôi
            </Text>
            
            <View style={styles.optionFooter}>
              <View style={styles.optionBadge}>
                <Text style={styles.badgeText}>Offline</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B0000" />
            </View>
          </TouchableOpacity>

          {/* Online Option */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => router.push('/online_booking')}
          >
            <View style={styles.optionIconContainer}>
              <LinearGradient 
                colors={['#8B0000', '#600000']} 
                style={styles.iconBackground}
              >
                <MaterialCommunityIcons name="video" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text style={styles.optionTitle}>Trực tuyến</Text>
            <Text style={styles.optionDescription}>
              Tư vấn online qua video call với các chuyên gia của chúng tôi
            </Text>
            
            <View style={styles.optionFooter}>
              <View style={styles.optionBadge}>
                <Text style={styles.badgeText}>Online</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B0000" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height * 0.4,
    top: 0,
    left: 0,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40, // Same width as back button for balanced layout
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  optionIconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  optionBadge: {
    backgroundColor: 'rgba(139,0,0,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 12,
  }
});
