import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';
import { authAPI } from '../../constants/auth';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  
  // Thêm ref để theo dõi trạng thái modal
  const prevModalStateRef = useRef({
    forgotPasswordModal: false
  });
  
  // Thêm state cho modal quên mật khẩu
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordErrors, setForgotPasswordErrors] = useState({});
  const [submittingForgotPassword, setSubmittingForgotPassword] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!showForgotPasswordModal) {
        setEmail('');
        setPassword('');
        setShowPassword(false);
      }
    });

    return unsubscribe;
  }, [navigation, showForgotPasswordModal]);
  
  // Sử dụng useFocusEffect để kiểm soát khi nào cần reset form
  useFocusEffect(
    useCallback(() => {
      // Lưu trạng thái modal hiện tại
      const currentModalState = {
        forgotPasswordModal: showForgotPasswordModal
      };
      
      // Kiểm tra xem modal đã được mở khi màn hình mất focus và vẫn mở khi focus lại không
      const modalWasOpenAndStillOpen = (
        prevModalStateRef.current.forgotPasswordModal && showForgotPasswordModal
      );
      
      // Kiểm tra có modal nào đang mở không
      const isAnyModalOpen = showForgotPasswordModal;
      
      // Chỉ reset form nếu không có modal nào đang mở và không có modal nào được giữ mở từ trước
      if (!isAnyModalOpen && !modalWasOpenAndStillOpen) {
        // Reset form logic đã được xử lý ở useEffect
      }
      
      // Cập nhật trạng thái modal cho lần focus tiếp theo
      prevModalStateRef.current = currentModalState;
      
      return () => {
        // Lưu trạng thái modal khi mất focus
        prevModalStateRef.current = {
          forgotPasswordModal: showForgotPasswordModal
        };
      };
    }, [showForgotPasswordModal])
  );

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
        return;
      }

      setIsLoading(true);

      const result = await authAPI.login(email, password);

      if (result.success) {
        setEmail('');
        setPassword('');
        setShowPassword(false);
        
        router.replace('/UserInfo');
      }
    } catch (error) {
      Alert.alert(
        'Lỗi',
        error.message
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Thêm hàm xử lý quên mật khẩu
  const toggleForgotPasswordModal = () => {
    Keyboard.dismiss();
    setShowForgotPasswordModal(!showForgotPasswordModal);
    // Reset form khi đóng modal
    if (showForgotPasswordModal) {
      setForgotPasswordEmail('');
      setForgotPasswordErrors({});
      setForgotPasswordSuccess(false);
    } else {
      // Nếu mở modal, điền email đã nhập sẵn
      setForgotPasswordEmail(email || '');
    }
  };
  
  // Hàm xử lý yêu cầu quên mật khẩu
  const handleForgotPassword = async () => {
    setForgotPasswordErrors({});
    setForgotPasswordSuccess(false);
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordErrors({ email: 'Email không được để trống' });
      return;
    }
    
    // Kiểm tra định dạng email đơn giản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordErrors({ email: 'Email không hợp lệ' });
      return;
    }
    
    try {
      setSubmittingForgotPassword(true);
      
      // Thêm delay nhỏ để tránh gọi API quá nhanh
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Gọi API quên mật khẩu sử dụng endpoint từ file config
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.forgotPassword}`,
        { email: forgotPasswordEmail },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.isSuccess) {
        setForgotPasswordSuccess(true);
      } else {
        setForgotPasswordErrors({
          general: response.data?.message || 'Đã xảy ra lỗi khi yêu cầu đặt lại mật khẩu'
        });
      }
    } catch (error) {
      let errorMessage = 'Không thể yêu cầu đặt lại mật khẩu. Vui lòng thử lại.';
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Lỗi ${error.response.status}: ${error.message}`;
        }
      }
      
      setForgotPasswordErrors({ general: errorMessage });
    } finally {
      setSubmittingForgotPassword(false);
    }
  };

  // Render phần main
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng nhập</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/UserInfo')}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#8B0000" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Thêm nút quên mật khẩu */}
        <TouchableOpacity onPress={toggleForgotPasswordModal} style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
        <View style={styles.registerPromptContainer}>
          <Text style={styles.registerPromptText}>
            Chưa có tài khoản? 
          </Text>
          <TouchableOpacity onPress={() => router.push('/Register')}>
            <Text style={styles.registerLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Modal quên mật khẩu */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={toggleForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContainer}>
            <Text style={styles.passwordModalTitle}>Quên Mật Khẩu</Text>
            
            {!forgotPasswordSuccess ? (
              <>
                {forgotPasswordErrors.general && (
                  <Text style={[styles.passwordErrorText, { textAlign: 'center', marginBottom: 15 }]}>
                    {forgotPasswordErrors.general}
                  </Text>
                )}
                
                <Text style={[styles.passwordInputLabel, { textAlign: 'center', marginBottom: 20 }]}>
                  Nhập email của bạn để nhận mật khẩu mới
                </Text>
                
                <View style={styles.passwordInputContainer}>
                  <Text style={styles.passwordInputLabel}>Email</Text>
                  <TextInput
                    style={styles.passwordInput}
                    value={forgotPasswordEmail}
                    onChangeText={setForgotPasswordEmail}
                    placeholder="Nhập email của bạn"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {forgotPasswordErrors.email && (
                    <Text style={styles.passwordErrorText}>{forgotPasswordErrors.email}</Text>
                  )}
                </View>
                
                <View style={styles.passwordModalActions}>
                  <TouchableOpacity
                    style={[styles.passwordModalButton, styles.passwordCancelButton]}
                    onPress={toggleForgotPasswordModal}
                  >
                    <Text style={styles.passwordButtonText}>Hủy bỏ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.passwordModalButton,
                      styles.passwordSubmitButton,
                      submittingForgotPassword && { opacity: 0.7 }
                    ]}
                    onPress={handleForgotPassword}
                    disabled={submittingForgotPassword}
                  >
                    {submittingForgotPassword ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.passwordButtonText}>Gửi yêu cầu</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={60} color="#4BB543" style={{ marginBottom: 20 }} />
                
                <Text style={[styles.passwordInputLabel, { textAlign: 'center', marginBottom: 20 }]}>
                  Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư và đổi mật khẩu sau khi đăng nhập.
                </Text>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.closeButtonContainer}
                  onPress={toggleForgotPasswordModal}
                >
                  <LinearGradient
                    colors={['#8B0000', '#AC1F1F', '#D42626']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.closeButtonGradient}
                  >
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B0000'
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white'
  },
  menuButton: {
    padding: 8
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: 20
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    color: '#8B0000',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8
  },
  loginButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  registerPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  registerPromptText: {
    color: '#333',
    fontSize: 16
  },
  registerLink: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 15
  },
  forgotPasswordText: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '500'
  },
  // Modal styles for forgot password
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordModalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#8B0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  passwordModalTitle: {
    fontSize: 22,
    color: '#8B0000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  passwordInputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  passwordErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  passwordModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  passwordModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordCancelButton: {
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  passwordSubmitButton: {
    backgroundColor: '#8B0000',
    marginLeft: 10,
  },
  passwordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    borderRadius: 25,
    marginTop: 15,
  },
  closeButtonGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});