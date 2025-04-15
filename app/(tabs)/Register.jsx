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
  Image,
  Platform,
  Modal
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
  showCalendar: false,
});

// Add this custom date picker component
const CustomDatePicker = ({ isVisible, onClose, onSelectDate, initialDate, maxDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const years = Array.from({ length: 100 }, (_, i) => maxDate.getFullYear() - i);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Generate days based on selected month and year
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const days = Array.from(
    { length: getDaysInMonth(selectedDate.getMonth(), selectedDate.getFullYear()) }, 
    (_, i) => i + 1
  );

  const handleConfirm = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.datePickerModal}>
        <View style={styles.datePickerContent}>
          <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
          
          <View style={styles.dateSelectors}>
            {/* Day selector */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Ngày</Text>
              <ScrollView style={styles.pickerScroll}>
                {days.map(day => (
                  <TouchableOpacity 
                    key={`day-${day}`}
                    style={[
                      styles.pickerItem,
                      selectedDate.getDate() === day && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(day);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedDate.getDate() === day && styles.pickerItemTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Month selector */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Tháng</Text>
              <ScrollView style={styles.pickerScroll}>
                {months.map((month, index) => (
                  <TouchableOpacity 
                    key={`month-${index}`}
                    style={[
                      styles.pickerItem,
                      selectedDate.getMonth() === index && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(index);
                      // Adjust if day is beyond the new month's max
                      const maxDays = getDaysInMonth(index, newDate.getFullYear());
                      if (newDate.getDate() > maxDays) {
                        newDate.setDate(maxDays);
                      }
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedDate.getMonth() === index && styles.pickerItemTextSelected
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Year selector */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Năm</Text>
              <ScrollView style={styles.pickerScroll}>
                {years.map(year => (
                  <TouchableOpacity 
                    key={`year-${year}`}
                    style={[
                      styles.pickerItem,
                      selectedDate.getFullYear() === year && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(year);
                      // Adjust if day is beyond the new month's max (e.g., Feb 29 in non-leap year)
                      const maxDays = getDaysInMonth(newDate.getMonth(), year);
                      if (newDate.getDate() > maxDays) {
                        newDate.setDate(maxDays);
                      }
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedDate.getFullYear() === year && styles.pickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <View style={styles.datePickerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function RegisterScreen() {
  // Initialize state with the function
  const [formState, setFormState] = useState(getInitialState());
  const {
    showPassword, showConfirmPassword, gender, isValidInput,
    email, phoneNumber, isEmail, showDatePicker, dob,
    fullName, password, confirmPassword, isLoading, image,
    isValidName, isValidEmail, showCalendar
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
      // Request permissions first (especially important for iOS)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Reduced quality for better performance
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

    // Kiểm tra tuổi (phải từ 18 tuổi trở lên)
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      Alert.alert('Lỗi', 'Bạn phải đủ 18 tuổi để đăng ký');
      return false;
    }
  
    // Validate giới tính
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
        const imageUri = Platform.OS === 'ios' 
          ? image.uri.replace('file://', '') 
          : image.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('ImageUrl', {
          uri: imageUri,
          type: type,
          name: filename || 'profile-image.jpg',
        });
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
    const currentDate = selectedDate || dob;
    // Hide the picker on Android immediately after selection
    if (Platform.OS === 'android') {
      updateFormState('showDatePicker', false);
    }
    if (selectedDate) {
      updateFormState('dob', currentDate);
    }
    if (Platform.OS === 'ios' && event.type === 'set') {
      updateFormState('showDatePicker', false);
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
                  onPress={() => updateFormState('showCalendar', true)}
                >
                  <Text style={styles.dateText}>
                    {dob.toISOString().split('T')[0]}
                  </Text>
                  <Ionicons name="calendar-outline" size={22} color="#8B0000" />
                </TouchableOpacity>
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

      <CustomDatePicker
        isVisible={showCalendar}
        onClose={() => updateFormState('showCalendar', false)}
        onSelectDate={(date) => updateFormState('dob', date)}
        initialDate={dob}
        maxDate={new Date()}
      />
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
    paddingHorizontal: Platform.OS === 'ios' ? 0 : 2,
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
    elevation: Platform.OS === 'android' ? 2 : 0, // Android shadow
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 2 : undefined,
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
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateSelectors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  pickerScroll: {
    height: 200,
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(139,0,0,0.1)',
    borderRadius: 5,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#8B0000',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 