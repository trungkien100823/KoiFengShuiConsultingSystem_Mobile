import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '../../components/BackButton';
import LikeButton from '../../components/LikeButton';
import { images } from '../../constants/images';

export default function PondDetails() {
  const params = useLocalSearchParams();
  const features = params.features ? params.features.split(',') : [];

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={images[params.imageName]} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />
          <View style={styles.detailsCard}>
            <View style={styles.likeButtonContainer}>
              <View style={styles.likeButtonBackground}>
                <LikeButton initialLiked={params.liked === 'true'} />
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.titleSection}>
                <Text style={styles.pondName}>{params.name}</Text>
                <Text style={styles.pondShape}>{params.shape}</Text>
              </View>

              <View style={styles.specificationGrid}>
                <View style={styles.specBox}>
                  <Ionicons name="resize" size={24} color="#666" />
                  <Text style={styles.specLabel}>Kích thước</Text>
                  <Text style={styles.specValue}>{params.size}</Text>
                </View>
                <View style={styles.specBox}>
                  <Ionicons name="water" size={24} color="#666" />
                  <Text style={styles.specLabel}>Độ sâu</Text>
                  <Text style={styles.specValue}>{params.depth}</Text>
                </View>
                <View style={styles.specBox}>
                  <Ionicons name="fish" size={24} color="#666" />
                  <Text style={styles.specLabel}>Số cá phù hợp</Text>
                  <Text style={styles.specValue}>{params.idealFishCount}</Text>
                </View>
              </View>

              <View style={styles.shortDescriptionContainer}>
                <Text style={styles.shortDescription}>{params.description}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.featuresTitle}>Tính năng chính:</Text>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#8B0000" />
                  <Text style={styles.featureText}>{feature.trim()}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  spacer: {
    height: 450, // Adjust this value to control when the white card appears
  },
  detailsCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
    minHeight: '100%', // This ensures the white background extends to the bottom
  },
  likeButtonContainer: {
    position: 'absolute',
    top: -0,
    left: 0,
    zIndex: 1,
  },
  likeButtonBackground: {
    borderRadius: 30,
    padding: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  pondName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  pondShape: {
    fontSize: 22,
    color: '#8B0000',
  },
  specificationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  specBox: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.5,
    marginHorizontal: 5,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  specValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shortDescriptionContainer: {
    marginBottom: 20,
  },
  shortDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});