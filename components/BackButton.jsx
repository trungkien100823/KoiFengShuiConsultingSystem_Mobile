import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/(tabs)/menu");
  };

  return (
    <TouchableOpacity 
      onPress={handleBack}
      style={styles.backButton}
    >
      <Ionicons name="chevron-back-circle" size={32} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    left: 20,
    padding: 8,
  },
}); 