import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuthToken } from '../../services/authService';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Ngũ hành colors
const elementColors = {
  Hỏa: '#FF4500',
  Kim: '#C0C0C0', 
  Thủy: '#006994',
  Mộc: '#228B22',
  Thổ: '#DEB887',
};

const { width, height } = Dimensions.get('window');

// Add modalStyles
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  modalBackground: {
    width: '100%',
    height: '100%',
  },
  modalBackgroundImage: {
    opacity: 0.7,
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 25,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalTitle: {
    fontSize: 26,
    color: 'white',
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  elementSection: {
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 15,
  },
  elementLabel: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  elementText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  value: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 12,
    marginTop: 35,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModalContent: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  passwordModalTitle: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  passwordInputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    marginTop: 8,
  },
  passwordInputField: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  passwordEyeIcon: {
    paddingHorizontal: 15,
  },
  passwordErrorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  passwordButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  passwordButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  passwordCancelButton: {
    backgroundColor: 'rgba(80, 80, 80, 0.8)',
    marginRight: 10,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  passwordSubmitButton: {
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    marginLeft: 10,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  passwordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  passwordRequirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  passwordRequirementText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginLeft: 6,
  },
  passwordRequirementValid: {
    color: '#4cd964',
  },
  passwordRequirementInvalid: {
    color: '#ff6b6b',
  },
  passwordModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  passwordModalIcon: {
    marginRight: 10,
  },
  passwordValidIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4cd964',
    marginRight: 6,
  },
  passwordInvalidIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff6b6b',
    marginRight: 6,
  },
});

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Ref để theo dõi trạng thái fetching
  const isFetchingRef = useRef(false);
  
  // Thêm ref để kiểm soát tình trạng modal
  const prevModalStateRef = useRef({
    passwordModal: false,
    userInfoModal: false
  });
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(new Date('2000-01-01'));
  const [initialDob, setInitialDob] = useState(new Date('2000-01-01')); // Để tracking thay đổi
  const [gender, setGender] = useState(true);
  const [initialGender, setInitialGender] = useState(true); // Để tracking thay đổi
  
  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Bank details
  const [bankId, setBankId] = useState(0);
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // Image URL
  const [imageUrl, setImageUrl] = useState(null);
  
  // Modal UserInfo
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userElement, setUserElement] = useState('Hỏa');
  const [userLifePalace, setUserLifePalace] = useState('Unknown');
  
  // Thêm state cho modal đổi mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Helper function to determine element based on year of birth
  // NOTE: KHÔNG CÒN SỬ DỤNG - Giữ lại cho mục đích tham khảo
  // Hiện tại đang lấy giá trị element trực tiếp từ API
  const determineElementFromDob = (birthDate) => {
    if (!birthDate) return 'Hỏa';
    
    const year = new Date(birthDate).getFullYear();
    const elements = ['Kim', 'Thủy', 'Hỏa', 'Thổ', 'Mộc'];
    
    // Simplified element determination
    return elements[year % 5];
  };

  // Helper function to determine life palace
  // NOTE: KHÔNG CÒN SỬ DỤNG - Giữ lại cho mục đích tham khảo
  // Hiện tại đang lấy giá trị lifePalace trực tiếp từ API
  const determineLifePalaceFromDob = (birthDate, gender) => {
    if (!birthDate) return 'Unknown';
    
    // Chuyển đổi gender về định dạng boolean chuẩn
    const isMale = typeof gender === 'string' 
      ? gender.toLowerCase() === 'true' || gender === '1'
      : Boolean(gender);
    
    const year = new Date(birthDate).getFullYear();
    const palaces = ['Khảm', 'Ly', 'Cấn', 'Đoài', 'Càn', 'Khôn', 'Chấn', 'Tốn'];
    
    // Simplified life palace determination
    const index = (year + (isMale ? 1 : 0)) % 8;
    return palaces[index];
  };
  
  // Function to fetch user data with delay to avoid concurrency issues
  const fetchUserData = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Thêm delay nhỏ để tránh gọi API quá nhanh dẫn đến lỗi concurrency ở backend
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const token = await getAuthToken();
      
      if (!token) {
        console.log('No token found, user not logged in');
        setLoading(false);
        router.replace('/(tabs)/profile');
        return;
      }
      
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      const response = await axios.get(`${API_CONFIG.baseURL}/api/Account/current-user?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Thêm log để kiểm tra dữ liệu trả về
      console.log('API response data:', JSON.stringify(response.data));
      
      if (response.data) {
        const userData = response.data;
        // Thêm kiểm tra trước khi gán giá trị
        setName(userData.userName || userData.fullName || '');
        setEmail(userData.email || '');
        setPhone(userData.phoneNumber || '');
        
        // Thêm kiểm tra trước khi gán giá trị cho bankId
        setBankId(userData.bankId !== undefined && userData.bankId !== null ? userData.bankId : 0);
        setAccountNo(userData.accountNo || '');
        setAccountName(userData.accountName || '');
        
        // Lấy ngũ hành và cung mệnh từ API
        setUserElement(userData.element);
        setUserLifePalace(userData.lifePalace);
        
        // Chỉ set imageUrl nếu nó tồn tại
        if (userData.imageUrl) {
          setImageUrl(userData.imageUrl);
        }
        
        // Kiểm tra kỹ lưỡng trước khi parse date
        if (userData.dob && typeof userData.dob === 'string') {
          try {
            setDob(new Date(userData.dob));
            setInitialDob(new Date(userData.dob));
          } catch (error) {
            console.error('Error parsing date:', error);
            // Sử dụng giá trị mặc định nếu có lỗi
            setDob(new Date('2000-01-01'));
            setInitialDob(new Date('2000-01-01'));
          }
        }
        
        // Log giá trị gender từ API để debug
        console.log('Gender from API:', userData.gender);
        
        // Xử lý đúng giá trị gender
        if (userData.gender !== undefined && userData.gender !== null) {
          // Chuyển đổi về boolean nếu cần
          const genderValue = typeof userData.gender === 'string'
            ? userData.gender.toLowerCase() === 'true' || userData.gender === '1'
            : Boolean(userData.gender);
            
          console.log('Parsed gender value:', genderValue);
          setGender(genderValue);
          setInitialGender(genderValue);
        } else {
          console.log('Setting default gender: true (Nam)');
          setGender(true);
          setInitialGender(true);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile for editing:', error);
      
      // Log thêm chi tiết về lỗi
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Xử lý các lỗi cụ thể từ máy chủ
      let errorMessage = 'Không thể tải dữ liệu người dùng. Vui lòng thử lại.';
      
      if (error.response && error.response.status === 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau vài phút.';
        // Thử lại sau 3 giây nếu là lỗi 500 (có thể do concurrency)
        setTimeout(() => {
          fetchUserData();
        }, 3000);
      }
      
      // Chỉ hiển thị thông báo lỗi nếu không có dữ liệu
      if (!name && !email) {
        Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [router]);

  // Sử dụng useFocusEffect để gọi API mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      console.log('Edit profile screen focused - refreshing data');
      
      // Lưu trạng thái modal hiện tại
      const currentModalState = {
        passwordModal: showPasswordModal,
        userInfoModal: showUserInfoModal
      };
      
      // Kiểm tra xem có modal nào đã được mở khi màn hình mất focus và vẫn mở khi focus lại không
      const modalWasOpenAndStillOpen = (
        (prevModalStateRef.current.passwordModal && showPasswordModal) ||
        (prevModalStateRef.current.userInfoModal && showUserInfoModal)
      );
      
      // Kiểm tra có modal nào đang mở không
      const isAnyModalOpen = showPasswordModal || showUserInfoModal;
      
      // Chỉ tải lại dữ liệu nếu không có modal đang mở và không có modal nào được giữ mở từ trước
      if (!isAnyModalOpen && !modalWasOpenAndStillOpen) {
        console.log('Không có modal nào đang mở - tải lại dữ liệu');
        fetchUserData();
      } else {
        console.log('Có modal đang mở hoặc vừa được mở lại - không tải lại dữ liệu');
      }
      
      // Cập nhật trạng thái modal cho lần focus tiếp theo
      prevModalStateRef.current = currentModalState;
      
      return () => {
        // Lưu trạng thái modal khi mất focus
        prevModalStateRef.current = {
          passwordModal: showPasswordModal,
          userInfoModal: showUserInfoModal
        };
      };
    }, [fetchUserData, showPasswordModal, showUserInfoModal])
  );
  
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
      
      // Thêm delay nhỏ để tránh gọi API quá nhanh dẫn đến lỗi concurrency ở backend
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if dob or gender has changed
      const dobChanged = dob.toISOString() !== initialDob.toISOString();
      const genderChanged = gender !== initialGender;
      
      console.log('Gender changed:', genderChanged, 'Current:', gender, 'Initial:', initialGender);
      
      // Format date as YYYY-MM-DD string
      const formattedDob = dob.toISOString().split('T')[0];
      
      const token = await getAuthToken();
      if (!token) {
        showAlert('Lỗi', 'Bạn chưa đăng nhập');
        setSubmitting(false);
        return;
      }
      
      // Sử dụng FormData thay vì JSON để có thể gửi file ảnh
      const formData = new FormData();
      
      // Trước hết, chỉ thêm các trường có giá trị vào form data
      if (name) formData.append('userName', name);
      if (email) formData.append('email', email);
      if (phone) formData.append('phoneNumber', phone);
      if (name) formData.append('fullName', name);
      
      // Đảm bảo dob được gửi đúng định dạng
      formData.append('dob', formattedDob);
      
      // Đảm bảo gender được gửi đúng định dạng
      // Gửi giá trị boolean thành chuỗi 'true' hoặc 'false'
      const genderValue = gender === true ? 'true' : 'false';
      formData.append('gender', genderValue);
      console.log('Giới tính hiện tại:', gender, 'Kiểu dữ liệu:', typeof gender);
      console.log('Đang gửi giới tính dưới dạng:', genderValue);
      
      // Chỉ gửi các trường này nếu có giá trị
      if (bankId !== null && (bankId || bankId === 0)) formData.append('bankId', bankId.toString());
      if (accountNo) formData.append('accountNo', accountNo);
      if (accountName) formData.append('accountName', accountName);
      
      // Kiểm tra xem có ảnh mới được chọn hay không
      if (imageUrl && imageUrl.startsWith('file:')) {
        // Chỉ xử lý khi ảnh là file local (được chọn mới từ thư viện)
        const imageUriParts = imageUrl.split('/');
        const imageName = imageUriParts[imageUriParts.length - 1];
        const imageType = imageName.includes('.') 
          ? `image/${imageName.split('.').pop()}` 
          : 'image/jpeg';
          
        const imageFile = {
          uri: imageUrl,
          name: imageName,
          type: imageType,
        };
        
        formData.append('imageUrl', imageFile);
        console.log('Đang tải ảnh lên với thông tin: ', JSON.stringify(imageFile));
      }
      
      // Hiển thị nội dung form data để debug
      console.log('FormData được tạo với các keys:');
      for (const [key, value] of Object.entries(formData._parts)) {
        console.log(`- ${key}: ${value}`);
      }
      
      // Gọi API với FormData
      console.log('Đang gửi request đến endpoint: ' + `${API_CONFIG.baseURL}/api/Account/edit-profile`);
      const timestamp = new Date().getTime();
      const response = await axios.put(
        `${API_CONFIG.baseURL}/api/Account/edit-profile?_t=${timestamp}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          transformRequest: (data, headers) => {
            return data; // No transform needed for FormData
          },
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data));
      
      if (response.data && response.data.isSuccess) {
        // Set a flag in AsyncStorage to indicate profile was updated
        await AsyncStorage.setItem('profileUpdated', 'true');
        
        // Force refresh the profile page by setting a timestamp
        await AsyncStorage.setItem('profileRefreshTimestamp', Date.now().toString());
        
        // If dob or gender changed, show the user info modal
        if (dobChanged || genderChanged) {
          try {
            // Đợi một chút cho server cập nhật dữ liệu
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Gọi API current-user để lấy thông tin mới nhất
            const timeStamp = new Date().getTime();
            const userInfoResponse = await axios.get(
              `${API_CONFIG.baseURL}/api/Account/current-user?_t=${timeStamp}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              }
            );
            
            console.log('Thông tin người dùng mới nhất:', JSON.stringify(userInfoResponse.data));
            
            // Lấy element và lifePalace từ API current-user
            if (userInfoResponse.data) {
              setUserElement(userInfoResponse.data.element);
              setUserLifePalace(userInfoResponse.data.lifePalace);
            } else {
              // Fallback nếu không lấy được dữ liệu
              setUserElement('Hỏa');
              setUserLifePalace('Unknown');
            }
            
            // Hiển thị modal
            setShowUserInfoModal(true);
          } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng mới nhất:', error);
            // Vẫn hiển thị modal nhưng với dữ liệu mặc định
            setUserElement('Hỏa');
            setUserLifePalace('Unknown');
            setShowUserInfoModal(true);
          }
        } else {
          // Show success message and navigate with refresh params
          showAlert('Thành Công', 'Cập nhật hồ sơ thành công', () => {
            // Navigate and pass refresh parameter
            router.replace({
              pathname: '/(tabs)/profile',
              params: { refresh: Date.now() }
            });
          });
        }
      } else {
        showAlert('Lỗi', response.data?.message || 'Đã xảy ra lỗi không xác định');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response details:', error.response?.data || error.message);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Không thể cập nhật hồ sơ. Vui lòng thử lại.';
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Lỗi ${error.response.status}: ${error.message}`;
        }
      }
      
      showAlert('Lỗi', errorMessage);
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
            router.push({
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
      
      console.log('Đang mở thư viện ảnh...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });
      
      console.log('Kết quả chọn ảnh:', result.canceled ? 'Đã hủy' : 'Đã chọn');
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log('Đã chọn ảnh: ', selectedAsset.uri);
        
        // Kiểm tra kích thước tệp
        const fileInfo = await getFileInfo(selectedAsset.uri);
        console.log('Thông tin file:', fileInfo);
        
        // Kiểm tra kích thước file
        try {
          if (Platform.OS === 'ios') {
            // Đối với iOS, fetch thông tin file từ URI
            const fileSize = await getFileSizeIOS(selectedAsset.uri);
            console.log('Kích thước file (iOS):', fileSize, 'bytes');
            
            if (fileSize > 5 * 1024 * 1024) { // Kiểm tra nếu lớn hơn 5MB
              showAlert('Cảnh báo', 'Ảnh quá lớn (>5MB). Việc tải lên có thể bị lỗi hoặc mất thời gian.');
            }
          } else if (Platform.OS === 'android') {
            // Android: Sử dụng fileInfo.fileSize nếu có
            if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
              showAlert('Cảnh báo', 'Ảnh quá lớn (>5MB). Việc tải lên có thể bị lỗi hoặc mất thời gian.');
            }
          }
        } catch (sizeError) {
          console.error('Lỗi khi kiểm tra kích thước file:', sizeError);
        }
        
        // Cập nhật state
        setImageUrl(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };
  
  // Hàm lấy kích thước file cho iOS
  const getFileSizeIOS = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (e) {
      console.error('Error getting file size:', e);
      return 0;
    }
  };
  
  // Hàm lấy thông tin file để debug
  const getFileInfo = async (fileUri) => {
    try {
      const fileNameMatch = fileUri.match(/[^\\/]+$/);
      const fileName = fileNameMatch ? fileNameMatch[0] : 'unknown_filename';
      
      return {
        name: fileName,
        uri: fileUri,
        type: `image/${fileName.split('.').pop() || 'jpeg'}`
      };
    } catch (e) {
      console.error('Lỗi khi lấy thông tin file:', e);
      return {
        name: 'unknown',
        uri: fileUri,
        type: 'image/jpeg'
      };
    }
  };
  
  // Add UserInfoModal component
  const UserInfoModal = () => {
    const elementColor = elementColors[userElement] || '#FF4500';
    
    return (
      <Modal
        visible={showUserInfoModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowUserInfoModal(false);
          router.replace({
            pathname: '/(tabs)/profile',
            params: { refresh: Date.now() }
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ImageBackground
              source={require('../../assets/images/feng shui.png')}
              style={styles.modalBackground}
              imageStyle={styles.modalBackgroundImage}
            >
              <View style={styles.modalContent}>
                {/* Header with title */}
                <Text style={styles.modalTitle}>Thông tin của bạn</Text>
                
                {/* Element section with highlight */}
                <View style={styles.elementSection}>
                  <Text style={styles.elementLabel}>Ngũ hành của bạn là</Text>
                  <Text style={[styles.elementText, { color: elementColor }]}>
                    {userElement}
                  </Text>
                </View>

                {/* User info container */}
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Họ và tên:</Text>
                    <Text style={styles.value}>{name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Ngày sinh:</Text>
                    <Text style={styles.value}>
                      {dob.toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Giới tính:</Text>
                    <Text style={styles.value}>
                      {gender ? 'Nam' : 'Nữ'}
                    </Text>
                  </View>
                  <View style={[styles.infoRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
                    <Text style={styles.label}>Cung mệnh:</Text>
                    <Text style={styles.value}>{userLifePalace}</Text>
                  </View>
                </View>

                {/* Close button with element color */}
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: elementColor }]}
                  onPress={() => {
                    setShowUserInfoModal(false);
                    router.replace({
                      pathname: '/(tabs)/profile',
                      params: { refresh: Date.now() }
                    });
                  }}
                >
                  <Text style={styles.buttonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Thêm hàm xử lý đổi mật khẩu
  const togglePasswordModal = () => {
    Keyboard.dismiss();
    setShowPasswordModal(!showPasswordModal);
    // Reset form khi đóng modal
    if (showPasswordModal) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    }
  };
  
  // Hàm validate mật khẩu mới
  const validateNewPassword = (password) => {
    const errors = {};
    const validations = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@#$%^&+=!]/.test(password)
    };
    
    if (!validations.length) {
      errors.length = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    
    if (!validations.uppercase) {
      errors.uppercase = 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa';
    }
    
    if (!validations.number) {
      errors.number = 'Mật khẩu phải chứa ít nhất một số';
    }
    
    if (!validations.special) {
      errors.special = 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt (@#$%^&+=!)';
    }
    
    return { errors, validations };
  };
  
  // Hàm xử lý việc đổi mật khẩu
  const handleChangePassword = async () => {
    setPasswordErrors({});
    
    // Kiểm tra các trường rỗng
    const errors = {};
    
    if (!oldPassword.trim()) {
      errors.old = 'Mật khẩu cũ không được để trống';
    }
    
    if (!newPassword.trim()) {
      errors.new = 'Mật khẩu mới không được để trống';
    } else {
      // Kiểm tra định dạng mật khẩu mới
      const { errors: passwordValidationErrors } = validateNewPassword(newPassword);
      if (Object.keys(passwordValidationErrors).length > 0) {
        errors.new = Object.values(passwordValidationErrors)[0];
        errors.validationDetails = passwordValidationErrors;
      }
    }
    
    if (!confirmPassword.trim()) {
      errors.confirm = 'Mật khẩu xác nhận không được để trống';
    } else if (confirmPassword !== newPassword) {
      errors.confirm = 'Mật khẩu xác nhận không khớp';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    // Hiển thị alert xác nhận trước khi đổi mật khẩu
    Alert.alert(
      "Xác nhận đổi mật khẩu",
      "Bạn có chắc chắn muốn đổi mật khẩu không?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              setSubmittingPassword(true);
              
              const token = await getAuthToken();
              if (!token) {
                showAlert('Lỗi', 'Bạn chưa đăng nhập');
                setSubmittingPassword(false);
                return;
              }
              
              const changePasswordRequest = {
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
              };
              
              // Sử dụng endpoint từ file config thay vì hardcode URL
              const response = await axios.put(
                `${API_CONFIG.baseURL}${API_CONFIG.endpoints.changePassword}`,
                changePasswordRequest,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (response.data && response.data.isSuccess) {
                togglePasswordModal();
                showAlert('Thành Công', 'Đổi mật khẩu thành công');
                // Reset form
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              } else {
                setPasswordErrors({
                  general: response.data?.message || 'Đã xảy ra lỗi khi đổi mật khẩu'
                });
              }
            } catch (error) {
              let errorMessage = 'Không thể đổi mật khẩu. Vui lòng thử lại.';
              
              if (error.response) {
                if (error.response.data && error.response.data.message) {
                  errorMessage = error.response.data.message;
                } else {
                  errorMessage = `Lỗi ${error.response.status}: ${error.message}`;
                }
              }
              
              setPasswordErrors({ general: errorMessage });
            } finally {
              setSubmittingPassword(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };
  
  // Component cho Modal đổi mật khẩu
  const renderPasswordChangeModal = () => {
    const { validations = {} } = newPassword ? validateNewPassword(newPassword) : { validations: {} };
    
    return (
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordErrors({});
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={modalStyles.passwordModalOverlay}>
              <View style={modalStyles.passwordModalContent}>
                <View style={modalStyles.passwordModalHeader}>
                  <Text style={modalStyles.passwordModalTitle}>Đổi Mật Khẩu</Text>
                </View>
                
                {passwordErrors.general && (
                  <Text style={modalStyles.passwordErrorText}>
                    {passwordErrors.general}
                  </Text>
                )}
                
                <View style={modalStyles.passwordInputContainer}>
                  <Text style={modalStyles.passwordInputLabel}>Mật khẩu hiện tại</Text>
                  <View style={modalStyles.passwordInputWrapper}>
                    <TextInput
                      style={modalStyles.passwordInputField}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="Nhập mật khẩu hiện tại"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry={!showOldPassword}
                    />
                    <TouchableOpacity
                      style={modalStyles.passwordEyeIcon}
                      onPress={() => setShowOldPassword(!showOldPassword)}
                    >
                      <Ionicons
                        name={showOldPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordErrors.old && (
                    <Text style={modalStyles.passwordErrorText}>{passwordErrors.old}</Text>
                  )}
                </View>
                
                <View style={modalStyles.passwordInputContainer}>
                  <Text style={modalStyles.passwordInputLabel}>Mật khẩu mới</Text>
                  <View style={modalStyles.passwordInputWrapper}>
                    <TextInput
                      style={modalStyles.passwordInputField}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Nhập mật khẩu mới"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      style={modalStyles.passwordEyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordErrors.new && (
                    <Text style={modalStyles.passwordErrorText}>{passwordErrors.new}</Text>
                  )}
                  
                  {newPassword.length > 0 && (
                    <View style={modalStyles.passwordRequirements}>
                      <View style={modalStyles.passwordRequirementRow}>
                        {validations.length ? (
                          <View style={modalStyles.passwordValidIndicator} />
                        ) : (
                          <View style={modalStyles.passwordInvalidIndicator} />
                        )}
                        <Text style={[
                          modalStyles.passwordRequirementText,
                          validations.length 
                            ? modalStyles.passwordRequirementValid 
                            : modalStyles.passwordRequirementInvalid
                        ]}>
                          Ít nhất 6 ký tự
                        </Text>
                      </View>
                      
                      <View style={modalStyles.passwordRequirementRow}>
                        {validations.uppercase ? (
                          <View style={modalStyles.passwordValidIndicator} />
                        ) : (
                          <View style={modalStyles.passwordInvalidIndicator} />
                        )}
                        <Text style={[
                          modalStyles.passwordRequirementText,
                          validations.uppercase 
                            ? modalStyles.passwordRequirementValid 
                            : modalStyles.passwordRequirementInvalid
                        ]}>
                          Ít nhất một chữ cái viết hoa
                        </Text>
                      </View>
                      
                      <View style={modalStyles.passwordRequirementRow}>
                        {validations.number ? (
                          <View style={modalStyles.passwordValidIndicator} />
                        ) : (
                          <View style={modalStyles.passwordInvalidIndicator} />
                        )}
                        <Text style={[
                          modalStyles.passwordRequirementText,
                          validations.number 
                            ? modalStyles.passwordRequirementValid 
                            : modalStyles.passwordRequirementInvalid
                        ]}>
                          Ít nhất một chữ số
                        </Text>
                      </View>
                      
                      <View style={[modalStyles.passwordRequirementRow, { marginBottom: 0 }]}>
                        {validations.special ? (
                          <View style={modalStyles.passwordValidIndicator} />
                        ) : (
                          <View style={modalStyles.passwordInvalidIndicator} />
                        )}
                        <Text style={[
                          modalStyles.passwordRequirementText,
                          validations.special 
                            ? modalStyles.passwordRequirementValid 
                            : modalStyles.passwordRequirementInvalid
                        ]}>
                          Ít nhất một ký tự đặc biệt (@#$%^&+=!)
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={modalStyles.passwordInputContainer}>
                  <Text style={modalStyles.passwordInputLabel}>Xác nhận mật khẩu mới</Text>
                  <View style={modalStyles.passwordInputWrapper}>
                    <TextInput
                      style={modalStyles.passwordInputField}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={modalStyles.passwordEyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(255, 255, 255, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordErrors.confirm && (
                    <Text style={modalStyles.passwordErrorText}>{passwordErrors.confirm}</Text>
                  )}
                  
                  {newPassword && confirmPassword && newPassword === confirmPassword ? (
                    <View style={[modalStyles.passwordRequirementRow, { marginTop: 8 }]}>
                      <View style={modalStyles.passwordValidIndicator} />
                      <Text style={[modalStyles.passwordRequirementText, modalStyles.passwordRequirementValid]}>
                        Mật khẩu khớp
                      </Text>
                    </View>
                  ) : confirmPassword ? (
                    <View style={[modalStyles.passwordRequirementRow, { marginTop: 8 }]}>
                      <View style={modalStyles.passwordInvalidIndicator} />
                      <Text style={[modalStyles.passwordRequirementText, modalStyles.passwordRequirementInvalid]}>
                        Mật khẩu không khớp
                      </Text>
                    </View>
                  ) : null}
                </View>
                
                <View style={modalStyles.passwordButtonRow}>
                  <TouchableOpacity
                    style={[modalStyles.passwordButton, modalStyles.passwordCancelButton]}
                    onPress={() => {
                      setShowPasswordModal(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordErrors({});
                    }}
                  >
                    <Text style={modalStyles.passwordButtonText}>Hủy bỏ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      modalStyles.passwordButton,
                      modalStyles.passwordSubmitButton,
                      submittingPassword && { opacity: 0.7 }
                    ]}
                    onPress={handleChangePassword}
                    disabled={submittingPassword}
                  >
                    {submittingPassword ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={modalStyles.passwordButtonText}>Đổi mật khẩu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    );
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
                value={bankId !== null ? bankId.toString() : '0'}
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
            
            {/* Thêm nút đổi mật khẩu */}
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Bảo Mật</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.changePasswordButton}
              onPress={togglePasswordModal}
            >
              <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.changePasswordIcon} />
              <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
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
      <UserInfoModal />
      {renderPasswordChangeModal()}
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
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(50, 50, 50, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changePasswordIcon: {
    marginRight: 12,
  },
  changePasswordText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
