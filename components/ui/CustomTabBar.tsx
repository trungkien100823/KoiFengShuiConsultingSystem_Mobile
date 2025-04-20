import { View, TouchableOpacity, StyleSheet, Platform, Text, Dimensions, SafeAreaView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define types for our tabs
type TabRoute = '/(tabs)/menu' | '../../(tabs)/consulting' | '/(tabs)/courses' | 
                '../../(tabs)/workshop' | '../../(tabs)/your_order' | '../../(tabs)/profile';
                
type TabIcon = 'home' | 'people' | 'book' | 'construct' | 'receipt-outline' | 'person';

interface TabItem {
  name: string;
  route: TabRoute;
  icon: TabIcon;
}

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Define tabs with their routes and icons
  const tabs: TabItem[] = [
    { name: 'Trang chủ', route: '/(tabs)/menu', icon: 'home' },
    { name: 'Tư vấn', route: '../../(tabs)/consulting', icon: 'people' },
    { name: 'Khóa học', route: '/(tabs)/courses', icon: 'book' },
    { name: 'Workshop', route: '../../(tabs)/workshop', icon: 'construct' },
    { name: 'Profile', route: '../../(tabs)/profile', icon: 'person' }
  ];

  // Determine if tab is active (fixed type error)
  const isActive = (route: string): boolean => {
    return pathname.includes(route.split('/').pop() || '');
  };

  // Calculate responsive dimensions
  const isSmallDevice = SCREEN_WIDTH < 375;
  const isLargeDevice = SCREEN_WIDTH >= 428;
  
  // Calculate bottom position based on device size
  const getBottomPosition = () => {
    if (Platform.OS === 'ios') {
      // Responsive bottom position for iOS
      if (insets.bottom > 20) {
        // Devices with large bottom safe area (iPhone X and newer)
        return 20;
      } else {
        // Older devices or iPad
        return 16; 
      }
    } else {
      // Android positioning
      return 16;
    }
  };

  return (
    <View style={[
      styles.container,
      { 
        bottom: getBottomPosition(),
        // Adjust horizontal padding based on screen width
        left: isSmallDevice ? 8 : isLargeDevice ? 16 : 12,
        right: isSmallDevice ? 8 : isLargeDevice ? 16 : 12
      }
    ]}>
      <LinearGradient
        colors={['#8B0000', '#600000']}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.gradient}
      >
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab.route}
            style={[
              styles.tabItem, 
              isActive(tab.route) && styles.activeTab
            ]} 
            // Type safe router.push usage
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <View style={[
                styles.iconContainer,
                isActive(tab.route) && styles.activeIconContainer,
                // Adjust icon container size based on device size
                {
                  width: isSmallDevice ? 32 : 40,
                  height: isSmallDevice ? 32 : 40,
                }
              ]}>
                <Ionicons 
                  name={tab.icon} 
                  size={isSmallDevice ? 18 : 22} 
                  color={isActive(tab.route) ? '#FFFFFF' : '#F0D0D0'} 
                />
              </View>
              <Text style={[
                styles.tabText,
                isActive(tab.route) && styles.activeTabText,
                // Adjust text size based on device size
                { fontSize: isSmallDevice ? 8 : isLargeDevice ? 11 : 10 }
              ]}>
                {tab.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    width: 'auto', // Let it calculate based on left/right
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 5,
  },
  tabItem: {
    flex: 1, // This makes each tab take equal width
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    position: 'relative',
    height: Platform.OS === 'ios' ? (SCREEN_HEIGHT > 800 ? 60 : 55) : 50,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabText: {
    color: '#F0D0D0',
    marginTop: 0,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeTab: {
    transform: [{scale: 1.05}],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  }
});