import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function OnlinePackageScreen() {
  const router = useRouter();
  
  const consultingPackages = [
    {
      id: '1',
      title: 'CƠ BẢN',
      label: 'Gói tư vấn',
      image: require('../../assets/images/koi_image.jpg'),
    },
    {
      id: '2',
      title: 'NÂNG CAO',
      label: 'Gói tư vấn',
      image: require('../../assets/images/koi_image.jpg'),
    },
    {
      id: '3',
      title: 'CHUYÊN SÂU',
      label: 'Gói tư vấn',
      image: require('../../assets/images/koi_image.jpg'),
    },
    {
      id: '4',
      title: 'DOANH NGHIỆP',
      label: 'Gói tư vấn',
      image: require('../../assets/images/koi_image.jpg'),
    },
  ];

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
            <View style={styles.fixedHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/(tabs)/online_booking')}
            >
              <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đặt lịch tư vấn{'\n'} trực tuyến</Text>
          </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
      
          <Text style={styles.sectionTitle}>Các gói tư vấn phong thủy</Text>

          {consultingPackages.map((pkg, index) => (
            <TouchableOpacity 
              key={pkg.id}
              style={styles.packageCard}
              onPress={() => {
                console.log(`Selected package: ${pkg.title}`);
                // Navigate to schedule screen
                router.push('/(tabs)/online_schedule');
              }}
            >
              <ImageBackground
                source={pkg.image}
                style={styles.packageImage}
                imageStyle={styles.packageImageStyle}
              >
                <View style={styles.packageContent}>
                  <Text style={styles.packageLabel}>{pkg.label}</Text>
                  <Text style={styles.packageTitle}>{pkg.title}</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  backgroundImage: {
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: 120,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
    backgroundColor: 'rgba(26, 0, 0, 0)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
    lineHeight: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  packageCard: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  packageImageStyle: {
    borderRadius: 10,
  },
  packageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  packageLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 4,
  },
  packageTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
