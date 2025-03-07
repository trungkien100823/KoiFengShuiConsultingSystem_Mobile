import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomTabBar() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => router.push('/(tabs)/menu')}
      >
        <Ionicons name="home" size={24} color="#fff" />
        <Text style={styles.tabText}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => router.push('../../(tabs)/consulting')}
      >
        <Ionicons name="people" size={24} color="#fff" />
        <Text style={styles.tabText}>Consulting</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => router.push('../../(tabs)/courses')}
      >
        <Ionicons name="book" size={24} color="#fff" />
        <Text style={styles.tabText}>Courses</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => router.push('../../(tabs)/workshop')}
      >
        <Ionicons name="construct" size={24} color="#fff" />
        <Text style={styles.tabText}>Workshop</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tabItem}
        onPress={() => router.push('../../(tabs)/profile')}
      >
        <Ionicons name="person" size={24} color="#fff" />
        <Text style={styles.tabText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#8B0000',
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    height: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.OS === 'ios' ? 0 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  icon: {
    marginTop: 10,
    width: 24,
    height: 24,
    tintColor: '#fff'
  }
}); 