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
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

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
  
  // Image URL
  const [imageUrl, setImageUrl] = useState(null);
  
  // Set up a focus listener to refetch data when returning to this screen
  useEffect(() => {
    // Function to fetch user data
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
          
          // Add this line to store imageUrl
          setImageUrl(userData.imageUrl);
          
          // Parse date if available
          if (userData.dob) {
            setDob(new Date(userData.dob));
          }
          
          setGender(userData.gender !== undefined ? userData.gender : true);
        }
      } catch (error) {
        console.error('Error fetching user profile for editing:', error);
        Alert.alert('Lỗi', 'Không thể tải dữ liệu người dùng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUserData();
    
    // Add listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Edit profile screen focused - refreshing data');
      fetchUserData();
    });
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, []); // Empty dependency array - only run once during mount
  
  // Replace the Alert.alert calls in handleSave with this custom alert
  const showAlert = (title, message, callback = null) => {
    // Small delay to ensure the alert appears centered on the screen
    setTimeout(() => {
      Alert.alert(
        title,
        message,
        callback ? [{ text: "OK", onPress: callback }] : [{ text: "OK" }],
        { cancelable: false }
      );
    }, 100); // Short delay helps with positioning
  };
  
  // Modify the handleSave function to use showCustomAlert instead of Alert.alert
  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      if (!name.trim()) {
        showAlert('Lỗi', 'Tên không được để trống');
        setSubmitting(false);
        return;
      }
      
      if (!phone.trim()) {
        showAlert('Lỗi', 'Số điện thoại không được để trống');
        setSubmitting(false);
        return;
      }
      
      // Format date as YYYY-MM-DD string
      const formattedDob = dob.toISOString().split('T')[0];
      
      const userData = {
        userName: name,
        email: email,
        phoneNumber: phone,
        fullName: name,
        dob: formattedDob,
        gender: gender,
        bankId: bankId,            
        accountNo: accountNo,      
        accountName: accountName,
        imageUrl: imageUrl
      };
      
      const token = await getAuthToken();
      if (!token) {
        showAlert('Lỗi', 'Bạn chưa đăng nhập');
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
        
        // Force refresh the profile page by setting a timestamp
        await AsyncStorage.setItem('profileRefreshTimestamp', Date.now().toString());
        
        // Show success message and navigate with refresh params
        showAlert('Thành Công', 'Cập nhật hồ sơ thành công', () => {
          // Navigate and pass refresh parameter
          router.replace({
            pathname: '/(tabs)/profile',
            params: { refresh: Date.now() }
          });
        });
      } else {
        showAlert('Lỗi', response.data?.message || 'Đã xảy ra lỗi không xác định');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Lỗi', error.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
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
  
  // Add this function after the onDateChange function
  const handleBack = () => {
    Alert.alert(
      "Xác Nhận Thoát",
      "Bạn có chắc muốn quay lại? Mọi thay đổi chưa lưu sẽ bị mất.",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        { 
          text: "Thoát", 
          onPress: async () => {
            // Set refresh flag in AsyncStorage
            await AsyncStorage.setItem('profileRefreshTimestamp', Date.now().toString());
            
            // Navigate and pass refresh parameter
            router.replace({
              pathname: '/(tabs)/profile',
              params: { refresh: Date.now() }
            });
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };
  
  // Add this function to pick an image
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showAlert('Lỗi', 'Cần quyền truy cập thư viện ảnh để thay đổi ảnh đại diện');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Here you would typically upload the image to your server
        // For now, just update the local state
        setImageUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Đang tải hồ sơ của bạn...</Text>
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh Sửa Hồ Sơ</Text>
          <View style={styles.spacer} />
        </View>
        
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                <View style={styles.avatarEditButton}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarText}>Ảnh đại diện</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên của bạn"
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
              <Text style={styles.helperText}>Email không thể thay đổi</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Số Điện Thoại</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại của bạn"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày Sinh</Text>
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
              <Text style={styles.label}>Giới Tính</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderOption, !gender && styles.activeGenderOption]}
                  onPress={() => setGender(false)}
                >
                  <Ionicons 
                    name="woman-outline" 
                    size={22} 
                    color={!gender ? "#fff" : "rgba(255,255,255,0.6)"} 
                  />
                  <Text style={[styles.genderText, !gender && styles.activeGenderText]}>Nữ</Text>
                </TouchableOpacity>
                
                <View style={styles.genderDivider} />
                
                <TouchableOpacity 
                  style={[styles.genderOption, gender && styles.activeGenderOption]}
                  onPress={() => setGender(true)}
                >
                  <Ionicons 
                    name="man-outline" 
                    size={22} 
                    color={gender ? "#fff" : "rgba(255,255,255,0.6)"} 
                  />
                  <Text style={[styles.genderText, gender && styles.activeGenderText]}>Nam</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Thông Tin Ngân Hàng</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mã Ngân Hàng</Text>
              <TextInput
                style={styles.input}
                value={bankId.toString()}
                onChangeText={(text) => setBankId(text ? parseInt(text, 10) : 0)}
                placeholder="Nhập mã ngân hàng"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Số Tài Khoản</Text>
              <TextInput
                style={styles.input}
                value={accountNo}
                onChangeText={setAccountNo}
                placeholder="Nhập số tài khoản"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên Tài Khoản</Text>
              <TextInput
                style={styles.input}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Nhập tên tài khoản"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
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
                <Text style={styles.saveButtonText}>Lưu Thay Đổi</Text>
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
  genderContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activeGenderOption: {
    backgroundColor: 'rgba(139,0,0,0.8)',
  },
  genderText: {
    fontSize: 16,
    marginLeft: 8,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  activeGenderText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  genderDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
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
  sectionTitle: {
    marginTop: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.3)',
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(139,0,0,0.9)',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
