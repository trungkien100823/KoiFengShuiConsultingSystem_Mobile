import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { authAPI } from '../../constants/auth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Add this function to reset all form fields to their initial state
const getInitialState = () => ({
  showPassword: false,
  showConfirmPassword: false,
  gender: '',
  isValidInput: false,
  email: '',
  phoneNumber: '',
  isEmail: true,
  showDatePicker: false,
  dob: new Date(),
  fullName: '',
  password: '',
  confirmPassword: '',
  isLoading: false,
  image: null,
  isValidName: true,
  isValidEmail: true,
});

export default function RegisterScreen() {
  // Initialize state with the function
  const [formState, setFormState] = useState(getInitialState());
  const {
    showPassword, showConfirmPassword, gender, isValidInput,
    email, phoneNumber, isEmail, showDatePicker, dob,
    fullName, password, confirmPassword, isLoading, image,
    isValidName, isValidEmail
  } = formState;
  
  const navigation = useNavigation();

  // Reset the form when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset form to initial state
      setFormState(getInitialState());
      return () => {
        // Clean up if needed
      };
    }, [])
  );

  const resetForm = () => {
    setFormState(getInitialState());
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const checkInputType = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setFormState(prev => ({
      ...prev,
      isEmail: emailRegex.test(text)
    }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setFormState(prev => ({
          ...prev,
          image: result.assets[0]
        }));
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const validateForm = () => {
    // Validate họ tên
    const nameRegex = /^[\p{L} ]+$/u;
    if (!nameRegex.test(fullName)) {
      Alert.alert('Lỗi', 'Tên không được chứa số và các ký tự đặc biệt');
      return false;
    }
  
    // Validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return false;
    }
  
    // Validate số điện thoại
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại phải có đúng 10 chữ số');
      return false;
    }
  
    // Validate mật khẩu
    if (!password || password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }
  
    // Validate ngày sinh và tuổi
    if (!dob) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày sinh');
      return false;
    }

    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (!gender) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính');
      return false;
    }
  
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }
  
      setFormState(prev => ({ ...prev, isLoading: true }));

      // Tạo FormData object
      const formData = new FormData();
      formData.append('FullName', fullName.trim());
      formData.append('Email', email.trim().toLowerCase());
      formData.append('PhoneNumber', phoneNumber);
      formData.append('Password', password);
      formData.append('ConfirmedPassword', confirmPassword);
      formData.append('Gender', gender === 'male');
      formData.append('Dob', dob.toISOString());

      // Thêm ảnh nếu có
      if (image) {
        const imageFile = {
          uri: image.uri,
          type: 'image/jpeg',
          name: 'profile-image.jpg'
        };
        formData.append('ImageUrl', imageFile);
      }
  
      console.log('Đang gửi dữ liệu đăng ký:', formData);
      
      const response = await authAPI.register(formData);
      
      // Kiểm tra response
      console.log('Response từ API:', response);

      // Nếu có token trong response
      if (response?.data?.token) {
        await AsyncStorage.setItem('accessToken', response.data.token);
      }

      // Reset form after successful registration
      resetForm();

      // Hiển thị thông báo thành công
      Alert.alert(
        'Thành công',
        'Đăng ký tài khoản thành công!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      
      let errorMessage = 'Đã có lỗi xảy ra khi đăng ký';
      
      // Kiểm tra nếu error.message chứa "thành công"
      if (error.message && error.message.toLowerCase().includes('thành công')) {
        // Đây thực sự là thành công, không phải lỗi
        resetForm(); // Reset form here too
        
        Alert.alert(
          'Thành công',
          'Đăng ký tài khoản thành công!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return;
      }
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        if (responseData.errors) {
          const errorMessages = [];
          Object.keys(responseData.errors).forEach(key => {
            errorMessages.push(...responseData.errors[key]);
          });
          errorMessage = errorMessages.join('\n');
        } else if (responseData.message) {
          switch (responseData.message) {
            case 'EXISTED_EMAIL':
              errorMessage = 'Email này đã được đăng ký';
              break;
            case 'GENDER_REQUIRED':
              errorMessage = 'Vui lòng chọn giới tính';
              break;
            default:
              errorMessage = responseData.message;
          }
        }
      }
      
      // Chỉ hiển thị Alert lỗi nếu thực sự là lỗi
      if (!error.message?.toLowerCase().includes('thành công')) {
        Alert.alert(
          'Lỗi',
          errorMessage
        );
      }
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      setFormState(prev => ({
        ...prev,
        dob: selectedDate,
        showDatePicker: false
      }));
    }
  };

  // Update all your state setters to use the new pattern
  const updateFormState = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
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
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.title}>của bạn</Text>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={(value) => {
                      updateFormState('fullName', value);
                      // Check if name contains only letters and spaces
                      const nameRegex = /^[\p{L} ]+$/u;
                      updateFormState('isValidName', nameRegex.test(value));
                    }}
                  />
                  {fullName.length > 0 && (
                    isValidName ? (
                      <Ionicons name="checkmark" size={24} color="#4CAF50" />
                    ) : (
                      <Ionicons name="close" size={24} color="#FF6B6B" />
                    )
                  )}
                </View>
                {fullName.length > 0 && !isValidName && (
                  <Text style={styles.errorText}>Tên không được chứa số hoặc ký tự đặc biệt</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(value) => {
                      updateFormState('email', value);
                      // Validate email format
                      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                      updateFormState('isValidEmail', emailRegex.test(value));
                    }}
                    autoCapitalize="none"
                  />
                  {email.length > 0 && (
                    isValidEmail ? (
                      <Ionicons name="checkmark" size={24} color="#4CAF50" />
                    ) : (
                      <Ionicons name="close" size={24} color="#FF6B6B" />
                    )
                  )}
                </View>
                {email.length > 0 && !isValidEmail && (
                  <Text style={styles.errorText}>Email phải có định dạng: name@domain.com</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Số điện thoại</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="0123456789"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={value => updateFormState('phoneNumber', value)}
                  />
                  {phoneNumber.length === 10 && (
                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ngày sinh</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => updateFormState('showDatePicker', true)}
                >
                  <Text style={styles.dateText}>
                    {dob.toISOString().split('T')[0]}
                  </Text>
                  <Ionicons name="calendar-outline" size={22} color="#8B0000" />
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="************"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={value => updateFormState('password', value)}
                  />
                  <TouchableOpacity onPress={() => updateFormState('showPassword', !showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="#8B0000"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="************"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={value => updateFormState('confirmPassword', value)}
                  />
                  <TouchableOpacity onPress={() => updateFormState('showConfirmPassword', !showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="#8B0000"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity 
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
                    onPress={() => updateFormState('gender', 'male')}
                  >
                    <View style={styles.radioButton}>
                      {gender === 'male' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.genderText}>Nam</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
                    onPress={() => updateFormState('gender', 'female')}
                  >
                    <View style={styles.radioButton}>
                      {gender === 'female' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.genderText}>Nữ</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ảnh đại diện (tùy chọn)</Text>
                <TouchableOpacity 
                  style={styles.imagePickerButton} 
                  onPress={pickImage}
                >
                  {image ? (
                    <Image 
                      source={{ uri: image.uri }} 
                      style={styles.previewImage} 
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={24} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Chọn ảnh</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.signUpButton, isLoading && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.signUpButtonText}>ĐĂNG KÝ</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <TouchableOpacity onPress={handleLogin}>
                  <Text style={styles.signInText}>
                    Đã có tài khoản?{' '}
                    <Text style={styles.signInLink}>
                      Đăng nhập
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
  switchInputType: {
    marginLeft: 10,
  },
  switchInputTypeText: {
    color: '#B22222',
    fontSize: 12,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  dateText: {
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
  },
  signInLink: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 5,
    color: '#666',
    fontSize: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 