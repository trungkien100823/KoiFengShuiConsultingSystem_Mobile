import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  ImageBackground,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(new Date('2000-01-01'));
  const [gender, setGender] = useState(true);
  
  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Bank details
  const [bankId, setBankId] = useState(0);
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // Get user data on load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        
        if (!token) {
          console.log('No token found, user not logged in');
          setLoading(false);
          router.replace('/(tabs)/profile');
          return;
        }
        
        const response = await axios.get(`${API_CONFIG.baseURL}/api/Account/current-user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data) {
          const userData = response.data;
          setName(userData.userName || userData.fullName || '');
          setEmail(userData.email || '');
          setPhone(userData.phoneNumber || '');
          
          // Store the bank details as they are in the system
          setBankId(userData.bankId || 0);
          setAccountNo(userData.accountNo || '');
          setAccountName(userData.accountName || '');
          
          // Parse date if available
          if (userData.dob) {
            setDob(new Date(userData.dob));
          }
          
          setGender(userData.gender !== undefined ? userData.gender : true);
        }
      } catch (error) {
        console.error('Error fetching user profile for editing:', error);
        Alert.alert('Error', 'Could not load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);
  
  // Replace the Alert.alert calls in handleSave with this custom alert
  const showAlert = (title, message, callback = null) => {
    // Small delay to ensure the alert appears centered on the screen
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        callback ? [{ text: 'OK', onPress: callback }] : [{ text: 'OK' }],
        { cancelable: false }
      );
    }, 100); // Short delay helps with positioning
  };
  
  // Modify the handleSave function to use showCustomAlert instead of Alert.alert
  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!name.trim()) {
        showAlert('Error', 'Name cannot be empty');
        setSubmitting(false);
        return;
      }
      
      if (!phone.trim()) {
        showAlert('Error', 'Phone number cannot be empty');
        setSubmitting(false);
        return;
      }
      
      const formattedDob = dob.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const userData = {
        userName: name,
        email: email,
        phoneNumber: phone,
        fullName: name,
        dob: formattedDob,
        gender: gender,
        bankId: bankId,            
        accountNo: accountNo,      
        accountName: accountName   
      };
      
      const token = await getAuthToken();
      if (!token) {
        showAlert('Error', 'You are not logged in');
        setSubmitting(false);
        return;
      }
      
      const response = await axios.put(
        `${API_CONFIG.baseURL}/api/Account/edit-profile`,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.isSuccess) {
        // Set a flag in AsyncStorage to indicate profile was updated
        await AsyncStorage.setItem('profileUpdated', 'true');
        
        // Use router.push instead of router.back to ensure the profile screen is reloaded
        showAlert('Success', 'Profile updated successfully', () => {
          router.push('/(tabs)/profile');
        });
      } else {
        showAlert('Error', response.data?.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', error.response?.data?.message || 'Could not update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDob(selectedDate);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.spacer} />
        </View>
        
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{dob.toISOString().split('T')[0]}</Text>
                <Ionicons name="calendar-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderToggle}>
                <Text style={[styles.genderLabel, !gender && styles.activeGenderLabel]}>Female</Text>
                <Switch
                  value={gender}
                  onValueChange={setGender}
                  trackColor={{ false: '#d35f5f', true: '#5f7ed3' }}
                  thumbColor={gender ? '#FFD700' : '#FFD700'}
                  ios_backgroundColor="#d35f5f"
                  style={styles.genderSwitch}
                />
                <Text style={[styles.genderLabel, gender && styles.activeGenderLabel]}>Male</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, submitting && styles.disabledButton]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color="#fff" style={styles.saveIcon} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent overlay
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)', // Changed to white tint
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139,0,0,0.7)', // Semi-transparent red
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff', // Gold color
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  spacer: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)', // Gold tint border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ffffff', // Changed to white
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', // Changed to white-tinted border
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledInput: {
    backgroundColor: 'rgba(80,80,80,0.3)',
    color: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dateInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', // Changed to white-tinted border
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: 'white',
  },
  genderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', // Changed to white-tinted border
  },
  genderSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
    marginHorizontal: 20,
  },
  genderLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  activeGenderLabel: {
    color: '#ffffff', // Changed to white
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  saveButton: {
    backgroundColor: 'rgba(139,0,0,0.9)', // Semi-transparent deep red
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    flexDirection: 'row',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  saveIcon: {
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: 'rgba(80,80,80,0.7)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff', // Changed to white
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
  buttonClose: {
    backgroundColor: 'rgba(139,0,0,0.9)',
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 30,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
