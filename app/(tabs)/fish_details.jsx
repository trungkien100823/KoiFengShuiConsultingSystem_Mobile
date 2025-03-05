import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

// Create an image mapping object
const fishImages = {
  'asagi.jpg': require('../../assets/images/asagi.jpg'),
  'kohaku.jpg': require('../../assets/images/kohaku.jpg'),
  'showa.jpg': require('../../assets/images/showa.jpg'),
  'shiro.jpg': require('../../assets/images/shiro.jpg'),
  'kujaku.jpg': require('../../assets/images/kujaku.jpg'),
};

export default function FishDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLiked, setIsLiked] = useState(params.liked === 'true');
  const [likeCount, setLikeCount] = useState(parseInt(params.likes) || 0);

  const handleBack = () => {
    router.push("/(tabs)/menu"); // Explicitly navigate to menu
  };

  const handleLike = () => {
    setIsLiked(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={fishImages[params.imageName]} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back-circle" size={32} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Fish Details Card */}
          <View style={styles.detailsCard}>
            {/* Like Button with Count */}
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={handleLike}
            >
              <View style={[
                styles.likeButtonInner,
                isLiked && styles.likeButtonInnerActive
              ]}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={30} 
                  color="#FF1493"  // Always pink
                />
              </View>
              <View style={styles.likeCountContainer}>
                <Text style={styles.likeCount}>{likeCount}</Text>
              </View>
            </TouchableOpacity>

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
                <Text style={styles.sizeLabel}>Size</Text>
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
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  likeButton: {
    position: 'absolute',
    top: -28,
    left: 40,
    zIndex: 1,
    alignItems: 'center',
  },
  likeButtonInner: {
    backgroundColor: 'white',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  likeButtonInnerActive: {
    backgroundColor: 'white', // Stays white when active
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