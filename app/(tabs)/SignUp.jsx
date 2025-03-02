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
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState('');

  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
              <Text style={styles.title}>Create Your</Text>
              <Text style={styles.title}>Account</Text>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="John Smith"
                    placeholderTextColor="#999"
                  />
                  <Ionicons name="checkmark" size={24} color="#8B0000" style={styles.checkIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone or Gmail</Text>
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
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="************"
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="************"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="#8B0000"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity 
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
                    onPress={() => setGender('male')}
                  >
                    <View style={styles.radioButton}>
                      {gender === 'male' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.genderText}>Male</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
                    onPress={() => setGender('female')}
                  >
                    <View style={styles.radioButton}>
                      {gender === 'female' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.genderText}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.signUpButton}>
                <Text style={styles.signUpButtonText}>SIGN UP</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.signInContainer}
                onPress={() => navigation.navigate('SignIn')}
              >
                <Text style={styles.signInText}>
                  Already have account? <Text style={styles.signInLink}>Sign in</Text>
                </Text>
              </TouchableOpacity>
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
  scrollContainer: {
    flexGrow: 1,
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
    lineHeight: 40,
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
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioButtonSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#8B0000',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  signUpButton: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signInText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
}); 