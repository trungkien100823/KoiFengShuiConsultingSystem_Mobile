import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function MoreButton({ koi }) {
  const router = useRouter();

  const handlePress = () => {
    const isPond = 'shape' in koi;
    router.push({
      pathname: isPond ? '/pond_details' : '/fish_details',
      params: {
        name: koi.name,
        variant: koi.variant,
        shape: koi.shape,
        description: koi.description,
        imageName: koi.imageName,
        likes: koi.likes,
        liked: koi.liked,
        size: koi.size,
        depth: koi.depth,
        idealFishCount: koi.idealFishCount,
        features: koi.features?.join(','),
      }
    });
  };

  return (
    <TouchableOpacity 
      style={styles.moreButton}
      onPress={handlePress}
    >
      <Text style={styles.moreButtonText}>Tìm hiểu thêm</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  moreButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  moreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});