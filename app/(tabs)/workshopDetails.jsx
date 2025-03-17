import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WorkshopDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Lấy dữ liệu workshop và imageId từ params
  const { workshop, imageId } = route.params || {};
  
  const getImageForId = (id) => {
    if (id === '1' || id === '2' || id === '3') {
      return require('../../assets/images/buddha.png');
    }
    return require('../../assets/images/buddha.png');
  };
  
  // Tạo đối tượng workshop đầy đủ kèm hình ảnh
  const workshopData = workshop ? {
    ...workshop,
    image: getImageForId(imageId),
    price: '100$'
  } : {
    title: 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học',
    date: '1/5/2021',
    location: 'Đại học FPT',
    image: require('../../assets/images/buddha.png'),
    price: '100$'
  };

  // Dữ liệu cho master (có thể truyền qua params hoặc cố định)
  const masterInfo = {
    name: 'Nguyễn Trọng Mạnh',
    title: 'Koi Feng Shui Master',
    image: require('../../assets/images/buddha.png'),
    description: 'Master has more than 8 years teaching experience in Feng Shui and shared to everyone through feng shui applications. He believes that analyzing and studying spaces around human users, each individual will understand and be mindful of their own well-being. Feng Shui is not only the science of spatial arrangement but also a bridge that connects people with their environment, thereby building a thriving life.',
    experience: '5+ Years',
    achievements: '200+ Profiles'
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header với nút back */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('workshop')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Banner ảnh */}
        <View style={styles.bannerContainer}>
          <Image 
            source={workshopData.image} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Thông tin workshop */}
        <View style={styles.workshopInfoSection}>
          <Text style={styles.workshopTitle}>{workshopData.title}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#333" />
            <Text style={styles.infoText}>Date: {workshopData.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#333" />
            <Text style={styles.infoText}>{workshopData.location}</Text>
          </View>
        </View>

        {/* Chi tiết workshop */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Description:</Text>
          <Text style={styles.description}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ulaboris nisi ut aliquip ex ea commodo
            consequat. Duis aute irure dolor in reprehenderit in voluptate velit...
          </Text>
          <TouchableOpacity>
            <Text style={styles.readMoreText}>Read more</Text>
          </TouchableOpacity>
        </View>

        {/* Thông tin về Master */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>About Master:</Text>
          <View style={styles.masterSection}>
            <Image source={masterInfo.image} style={styles.masterImage} />
            <View style={styles.masterInfo}>
              <Text style={styles.masterName}>{masterInfo.name}</Text>
              <Text style={styles.masterTitle}>{masterInfo.title}</Text>
            </View>
          </View>
          <Text style={styles.description}>{masterInfo.description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="briefcase-outline" size={20} color="#333" />
              <Text style={styles.statLabel}>Work Experience: {masterInfo.experience}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={20} color="#333" />
              <Text style={styles.statLabel}>Achievements: {masterInfo.achievements}</Text>
            </View>
          </View>
        </View>

        {/* Phí tham gia */}
        <View style={styles.feesSection}>
          <Text style={styles.feesLabel}>Entry Fee:</Text>
          <Text style={styles.feesAmount}>{workshopData.price}</Text>
        </View>

        {/* Nút đăng ký */}
        <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('ticket_confirmation')}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    height: 250,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  workshopInfoSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  workshopTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoText: {
    color: '#666',
    marginLeft: 6,
    fontSize: 14,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  readMoreText: {
    color: '#8B0000',
    marginTop: 5,
    fontWeight: '500',
  },
  masterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  masterImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  masterInfo: {
    flex: 1,
  },
  masterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  masterTitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  feesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  feesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  feesAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#E53935',
  },
  registerButton: {
    backgroundColor: '#8B0000',
    marginHorizontal: 120,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkshopDetailsScreen;