import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function LikeButton({ initialLiked = false }) {
  const [isLiked, setIsLiked] = useState(initialLiked);

  const handleLike = () => {
    setIsLiked(prev => !prev);
  };

  return (
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
          color="#FF1493"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  likeButton: {
    position: 'absolute',
    top: -28,
    left: 40,
    zIndex: 1,
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
    backgroundColor: 'white',
  },
}); 