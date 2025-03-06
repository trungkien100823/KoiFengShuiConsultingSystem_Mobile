import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '../../components/BackButton';
import LikeButton from '../../components/LikeButton';

// Create an image mapping object
const fishImages = {
  'asagi.jpg': require('../../assets/images/asagi.jpg'),
  'kohaku.jpg': require('../../assets/images/kohaku.jpg'),
  'showa.jpg': require('../../assets/images/showa.jpg'),
  'shiro.jpg': require('../../assets/images/shiro.jpg'),
  'kujaku.jpg': require('../../assets/images/kujaku.jpg'),
};

export default function FishDetails() {
  const params = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={fishImages[params.imageName]} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Fish Details Card */}
          <View style={styles.detailsCard}>
            <LikeButton initialLiked={params.liked === 'true'} />

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.fishName}>{params.name}</Text>
              <Text style={styles.fishVariant}>{params.variant}</Text>
            </View>

            {/* Size Section */}
            <View style={styles.sizeSection}>
              <View style={styles.sizeIconContainer}>
                <Ionicons name="fish-outline" size={24} color="#666" />
              </View>
              <View style={styles.sizeTextContainer}>
                <Text style={styles.sizeLabel}>Kích thước</Text>
                <Text style={styles.sizeValue}>2</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Description Section */}
            <Text style={styles.description}>{params.description}</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  menuButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  fishName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  fishVariant: {
    fontSize: 28,
    color: '#FFA500',
  },
  sizeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sizeIconContainer: {
    marginRight: 10,
  },
  sizeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  sizeValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 