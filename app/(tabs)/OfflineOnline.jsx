import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const YinYang = () => {
  return (
    <View style={styles.yinyang}>
      <View style={styles.yinyangMain} />
      <View style={styles.yinyangBefore} />
      <View style={styles.yinyangAfter} />
    </View>
  );
};

export default function OfflineOnlineScreen() {
  const router = useRouter();

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/consulting')}
        >
          <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <TouchableOpacity 
          style={styles.offlineButton}
          onPress={() => router.push('/offline_booking')}
        >
          <Text style={styles.buttonText}>Offline</Text>
        </TouchableOpacity>
        
        <View style={styles.yinYangContainer}>
          <YinYang />
        </View>
        
        <TouchableOpacity 
          style={styles.onlineButton}
          onPress={() => router.push('/online_booking')}
        >
          <Text style={styles.buttonText}>Online</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 5,
  },
  menuButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  yinYangContainer: {
    transform: [{ scale: 1.5 }],
  },
  offlineButton: {
    backgroundColor: '#1A0000',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  onlineButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // YinYang styles
  yinyang: {
    width: 100,
    height: 100,
  },
  yinyangMain: {
    width: 100,
    height: 100,
    borderColor: "#8B0000",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 50,
    borderRightWidth: 2,
    borderRadius: 50,
  },
  yinyangBefore: {
    position: "absolute",
    top: 24,
    left: 0,
    borderColor: "#8B0000",
    borderWidth: 24,
    borderRadius: 30,
  },
  yinyangAfter: {
    position: "absolute",
    top: 24,
    right: 2,
    backgroundColor: "#8B0000",
    borderColor: "#1A0000",
    borderWidth: 25,
    borderRadius: 30,
  },
});
