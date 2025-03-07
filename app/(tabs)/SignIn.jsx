import React, { useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B0000', '#000000']}
        style={styles.gradient}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Xin chào</Text>
              <Text style={styles.subtitle}>Hãy điền thông tin sau để tạo tài khoản nhé!</Text>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="JohnSmith@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                  />
                  <Ionicons name="checkmark" size={24} color="#8B0000" style={styles.checkIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="#8B0000"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(tabs)/menu')} style={styles.signInButton}>
                <Text style={styles.signInButtonText}>Đăng nhập</Text>
              </TouchableOpacity>

              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>hoặc</Text>
                <View style={styles.separatorLine} />
              </View>

              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome name="google" size={20} color="white" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton}>
                  <FontAwesome name="facebook" size={20} color="white" />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.signUpContainer}>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text style={styles.signUpText}>
                    Chưa có tài khoản?{' '}
                    <Text style={styles.signUpLink}>
                      Đăng ký
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
  header: {
    padding: 20,
    paddingTop: 40,
  },
  menuButton: {
    position: 'absolute',
    right: 20,
    top: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: 'white',
    marginTop: -5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#8B0000',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  checkIcon: {
    marginLeft: 10,
  },
  forgotPassword: {
    color: '#333',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#666',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    padding: 12,
    borderRadius: 20,
    width: '48%',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  signUpContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    alignItems: 'center',
  },
  signUpText: {
    color: '#666',
  },
  signUpLink: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
  },
});