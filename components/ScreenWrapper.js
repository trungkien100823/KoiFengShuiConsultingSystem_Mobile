import React from 'react';
import { View, StatusBar, StyleSheet, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenWrapper({ 
  children, 
  backgroundImage,
  gradientColors = ['rgba(0,0,0,0.7)', 'rgba(139,0,0,0.6)', 'rgba(0,0,0,0.8)'],
  statusBarStyle = "light-content"
}) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <StatusBar 
        translucent={true}
        backgroundColor="transparent"
        barStyle={statusBarStyle}
      />
      
      {backgroundImage ? (
        <ImageBackground 
          source={backgroundImage} 
          style={styles.backgroundImage}
        >
          <LinearGradient
            colors={gradientColors}
            style={styles.fullSize}
          >
            <View style={[
              styles.content, 
              { 
                paddingTop: insets.top,
                paddingBottom: 60 // For tab bar
              }
            ]}>
              {children}
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={gradientColors}
          style={styles.fullSize}
        >
          <View style={[
            styles.content, 
            { 
              paddingTop: insets.top,
              paddingBottom: 60 // For tab bar
            }
          ]}>
            {children}
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  fullSize: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  }
});
