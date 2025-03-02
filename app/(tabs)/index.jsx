import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const navigation = useNavigation();

  const handleSignIn = () => {
    try {
      navigation.navigate('SignIn');
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  const handleSignUp = () => {
    try {
      navigation.navigate('SignUp');
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B0000', '#000000']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/BitKoi-dark.png')}
            style={styles.logo}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSignIn}
          >
            <Text style={styles.buttonTextPrimary}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSignUp}
          >
            <Text style={styles.buttonTextSecondary}>Đăng ký</Text>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Hoặc</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.googleContainer}>
            <TouchableOpacity style={styles.googleButton}>
              <FontAwesome name="google" size={24} color="white" />
              <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 50,
    color: 'white',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'white',
  },
  buttonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  separatorText: {
    marginHorizontal: 10,
    color: 'white',
  },
  googleContainer: {
    marginTop: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 25,
    gap: 10,
  },
  googleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  socialText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'white',
  },
  logo: {
    width: 330,  // Adjust size as needed
    height: 200, // Adjust size as needed
    alignSelf: 'center',
    resizeMode: 'contain',
  },
});
