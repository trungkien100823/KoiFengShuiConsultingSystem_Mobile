import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SelectList } from 'react-native-dropdown-select-list';
import { consultingAPI } from '../../constants/consulting';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function OnlineBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedMasterId = params.selectedMasterId ? params.selectedMasterId.trim() : null;
  const selectedMasterName = params.selectedMasterName;
  const fromMasterDetails = params.fromMasterDetails === 'true';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [consultants, setConsultants] = useState([
    { key: 'null', value: 'Chúng tôi sẽ chọn giúp' }
  ]);

  // Thêm hàm refresh để gọi lại các API
  const refreshScreen = async () => {
    setIsLoading(true);
    try {
      // Fetch thông tin user
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục');
        router.push('login');
        return;
      }

      const userResponse = await axios.get(
        `${API_CONFIG.baseURL}/api/Account/current-user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (userResponse.data) {
        setName(userResponse.data.fullName || userResponse.data.userName || '');
        setPhone(userResponse.data.phoneNumber || '');
        setEmail(userResponse.data.email || '');
      }

      // Fetch danh sách consultants
      const consultantData = await consultingAPI.getAllConsultants();
      const formattedConsultants = [
        { key: null, value: 'Chúng tôi sẽ chọn giúp' },
        ...consultantData.map(consultant => ({
          key: consultant.id ? consultant.id.trim() : null,
          value: consultant.name
        }))
      ];
      
      setConsultants(formattedConsultants);

      // Reset các state khác
      setDescription('');
      if (!selectedMasterId) {
        setSelectedConsultant('');
      }

    } catch (error) {
      console.error('Lỗi khi refresh màn hình:', error);
      Alert.alert(
        "Thông báo",
        "Không thể tải lại thông tin. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm useFocusEffect để refresh khi quay lại màn hình
  useFocusEffect(
    React.useCallback(() => {
      refreshScreen();
      return () => {
        // Cleanup nếu cần
      };
    }, [])
  );

  // Xóa các useEffect cũ vì đã được gộp vào refreshScreen
  // Chỉ giữ lại useEffect cho selectedMasterId
  useEffect(() => {
    if (selectedMasterId && selectedMasterName) {
      // Đảm bảo ID đã được trim
      setSelectedConsultant(selectedMasterId);
      
      // Log để debug
      console.log('Setting selected consultant:', {
        selectedMasterId,
        selectedMasterName
      });
    }
  }, [selectedMasterId, selectedMasterName]);

  // Cập nhật hàm để tạo booking online
  const handleSubmit = async () => {
    if (!name || !phone || !email || !description) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Lấy thông tin master đã chọn
    let masterId = null;
    let masterName = 'Chúng tôi sẽ chọn giúp';

    if (fromMasterDetails) {
      masterId = selectedMasterId?.trim();
      masterName = selectedMasterName;
    } else if (selectedConsultant && selectedConsultant !== 'null') {
      const selectedMaster = consultants.find(c => c.key === selectedConsultant);
      if (selectedMaster) {
        masterId = selectedMaster.key?.trim();
        masterName = selectedMaster.value;
      }
    }
    
    // Chuyển đến trang chọn lịch với thông tin đã nhập
    router.push({
      pathname: '/(tabs)/online_schedule',
      params: {
        customerInfo: JSON.stringify({
          name,
          phone,
          email,
          description: description.trim(),
          masterId: masterId,
          masterName
        })
      }
    });
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.push('/(tabs)/OfflineOnline')}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đặt lịch tư vấn{'\n'} trực tuyến</Text>
              </View>
              
              <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>

              <View style={styles.formContainer}>
                {/* Consultant Picker */}
                <View style={styles.formGroup}>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  ) : fromMasterDetails ? (
                    <View style={[styles.dropdown, {justifyContent: 'center'}]}>
                      <Text style={styles.dropdownText}>{selectedMasterName}</Text>
                    </View>
                  ) : (
                    <SelectList 
                      setSelected={setSelectedConsultant} 
                      data={consultants} 
                      boxStyles={styles.dropdown}
                      dropdownStyles={styles.dropdownList}
                      inputStyles={styles.dropdownText}
                      dropdownTextStyles={styles.dropdownText}
                      placeholder="Chúng tôi sẽ chọn giúp"
                      search={false}
                      defaultOption={
                        selectedMasterId 
                          ? { key: selectedMasterId, value: selectedMasterName }
                          : { key: null, value: 'Chúng tôi sẽ chọn giúp' }
                      }
                      arrowicon={<Ionicons name="chevron-down" size={24} color="#FFFFFF" />}
                      save="key"
                    />
                  )}
                </View>

                {/* Name Input */}
                <View style={styles.formGroup}>
                  <TextInput
                    style={[styles.input, {opacity: 0.7}]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Họ và tên"
                    placeholderTextColor="#FFFFFF"
                    editable={false}
                  />
                  <Text style={styles.asterisk}>*</Text>
                </View>
                
                {/* Phone Number */}
                <View style={styles.formGroup}>
                  <TextInput
                    style={[styles.input, {opacity: 0.7}]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Số điện thoại"
                    keyboardType="phone-pad"
                    placeholderTextColor="#FFFFFF"
                    editable={false}
                  />
                  <Text style={styles.asterisk}>*</Text>
                </View>
                
                {/* Email */}
                <View style={styles.formGroup}>
                  <TextInput
                    style={[styles.input, {opacity: 0.7}]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                    placeholderTextColor="#FFFFFF"
                    editable={false}
                  />
                  <Text style={styles.asterisk}>*</Text>
                </View>
                
                {/* Description */}
                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.textArea}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Mô tả nhu cầu tư vấn"
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#FFFFFF"
                  />
                  <Text style={styles.asterisk}>*</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>Chọn lịch tư vấn</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0000',
  },
  backgroundImage: {
    opacity: 0.8,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? height * 0.02 : height * 0.03,
    flexGrow: 1,
    paddingBottom: height * 0.05,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: height * 0.04,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 0.8,
    lineHeight: Platform.OS === 'ios' ? width * 0.08 : width * 0.09,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    width: '100%',
  },
  formGroup: {
    marginBottom: height * 0.025,
    position: 'relative',
  },
  inputLabel: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 16 : 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  dropdownList: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 5,
    borderRadius: 12,
    padding: 5,
    maxHeight: height * 0.4,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    textAlign: 'left',
    marginLeft: 0,
  },
  asterisk: {
    color: '#FF0000',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 14,
    right: 15,
    fontSize: width * 0.045,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 16 : 14,
    fontSize: width * 0.04,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 56,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: width * 0.04,
    color: '#FFFFFF',
    minHeight: height * 0.15,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    backgroundColor: '#8B0000',
    borderRadius: 25,
    padding: Platform.OS === 'ios' ? 16 : 14,
    alignItems: 'center',
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  }
});
