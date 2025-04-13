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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SelectList } from 'react-native-dropdown-select-list';
import { consultingAPI } from '../../constants/consulting';
import { API_CONFIG } from '../../constants/config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function OnlineBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedMasterId = params.selectedMasterId;
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
          key: consultant.id,
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
      setSelectedConsultant(selectedMasterId);
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
      masterId = selectedMasterId;
      masterName = selectedMasterName;
    } else if (selectedConsultant && selectedConsultant !== 'null') {
      const selectedMaster = consultants.find(c => c.key === selectedConsultant);
      if (selectedMaster) {
        masterId = selectedMaster.key;
        masterName = selectedMaster.value;
      }
    }
    
    console.log('Thông tin đặt lịch:', {
      name,
      phone,
      email,
      masterId,
      masterName,
      description: description.trim()
    });

    // Chuyển đến trang chọn lịch với thông tin đã nhập
    router.push({
      pathname: '/(tabs)/online_schedule',
      params: {
        customerInfo: JSON.stringify({
          name,
          phone,
          email,
          description: description.trim(),
          masterId,
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
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.push('/(tabs)/OfflineOnline')}
              >
                <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
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
    flex: 1,
    resizeMode: 'cover',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  backButton: {
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 0.8,
    lineHeight: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    color: '#FFFFFF',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 5,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'left',
    marginLeft: 0,
  },
  asterisk: {
    color: '#FF0000',
    position: 'absolute',
    top: 15,
    right: 15,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  }
});
