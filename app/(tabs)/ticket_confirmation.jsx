import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, Alert } from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TicketConfirmation() {
  const navigation = useNavigation();
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const decreaseTickets = () => {
    if (ticketCount > 1) {
      setTicketCount(ticketCount - 1);
    }
  };

  const increaseTickets = () => {
    setTicketCount(ticketCount + 1);
  };

  const handleContinue = () => {
    if (!customerName || !phoneNumber || !email) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const ticketToSend = {
      id: 'T01',
      title: 'Đại Đạo Chỉ Giản - Phong Thủy Cổ Học',
      date: '15/10/2025',
      location: 'Đại học FPT',
      customerName: customerName,
      phoneNumber: phoneNumber,
      email: email,
      ticketCount: ticketCount,
      totalFee: `${100 * ticketCount}$`,
      confirmedDate: 'Sat, 1st December 2025'
    };

    try {
      console.log('Navigating with data:', ticketToSend); // Debug log
      navigation.navigate('ticketDetails', { 
        ticket: ticketToSend,
        ticketId: 'T01'  // Thêm ID riêng giống như imageId
      });
    } catch (error) {
      console.log('Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể chuyển trang');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ticket confirmation</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.content}>
          <Text style={styles.eventTitle}>Đại Đạo Chỉ Giản - Phong Thủy Cổ Học</Text>
          
          <View style={styles.eventInfoContainer}>
            <View style={styles.eventInfoItem}>
              <MaterialIcons name="date-range" size={14} color="#AE1D1D" />
              <Text style={styles.eventInfoText}>Date: 15/10/2025</Text>
            </View>
            
            <View style={styles.eventInfoItem}>
              <Ionicons name="location" size={14} color="#AE1D1D" />
              <Text style={styles.eventInfoText}>Đại học FPT</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer<Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="John Smith"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone number<Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="0123456789"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {phoneNumber.length === 10 && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email<Text style={styles.required}>*</Text></Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="johnsmith@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>No. Of Tickets</Text>
              <View style={styles.ticketCounterContainer}>
                <View style={styles.ticketInputContainer}>
                  <TextInput
                    style={styles.ticketInput}
                    value={ticketCount.toString()}
                    editable={false}
                  />
                </View>
                <View style={styles.ticketButtons}>
                  <TouchableOpacity onPress={decreaseTickets} style={styles.ticketButton}>
                    <AntDesign name="minus" size={16} color="black" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={increaseTickets} style={styles.ticketButton}>
                    <AntDesign name="plus" size={16} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonWrapper} onPress={handleContinue}>
          <LinearGradient
            colors={['#AE1D1D', '#212121']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonWrapper} 
          onPress={() => navigation.navigate('workshopDetails')}
        >
          <LinearGradient
            colors={['#AE1D1D', '#212121']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  eventInfoContainer: {
    marginBottom: 16,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventInfoText: {
    marginLeft: 8,
    fontSize: 13,
  },
  formContainer: {
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    width: '30%',
  },
  required: {
    color: '#AE1D1D',
  },
  inputContainer: {
    width: '65%',
  },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#AE1D1D',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  
  ticketCounterContainer: {
    width: '65%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketInputContainer: {
    marginRight: 10,
    width: 50,
    height: 40,
  },
  ticketButtons: {
    flexDirection: 'row',
  },
  ticketButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    height: 45,
    marginHorizontal: 4,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ticketInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#AE1D1D',
    borderRadius: 8,
  },
});