import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function MoreButton({ item, type }) {
  const router = useRouter();

  const handlePress = () => {
    if (!item || !item.id) {
      console.error('Invalid item data:', item);
      return;
    }

    try {
      if (type === 'Koi') {
        router.push({
          pathname: '/(tabs)/fish_details',
          params: { id: item.id }
        });
      } else if (type === 'Pond') {
        router.push({
          pathname: '/(tabs)/pond_details',
          params: { id: item.id }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handlePress}
    >
      <Text style={styles.buttonText}>Tìm hiểu thêm</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});