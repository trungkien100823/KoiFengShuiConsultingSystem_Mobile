import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function TicketDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Lấy dữ liệu từ params giống như workshopDetails
  const { ticket, ticketId } = route.params || {};
  
  // Đảm bảo có dữ liệu mặc định
  const ticketData = ticket || {
    title: 'Không có thông tin',
    date: 'N/A',
    location: 'N/A',
    customerName: 'N/A',
    phoneNumber: 'N/A',
    email: 'N/A',
    ticketCount: 0,
    totalFee: '0$',
    confirmedDate: 'N/A'
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#AE1D1D', '#212121']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ticket detail</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.eventTitle}>{ticketData.title}</Text>
        
        <View style={styles.ticketInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{ticketData.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{ticketData.location}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ticket ID:</Text>
            <Text style={styles.value}>{ticketData.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{ticketData.customerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone number:</Text>
            <Text style={styles.value}>{ticketData.phoneNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{ticketData.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>No. Of Tickets:</Text>
            <Text style={styles.value}>{ticketData.ticketCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Confirmed Date:</Text>
            <Text style={styles.value}>{ticketData.confirmedDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Fee:</Text>
            <Text style={styles.totalValue}>{ticketData.totalFee}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.buttonWrapper} 
            onPress={() => navigation.navigate('workshop')}
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
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  ticketInfo: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AE1D1D',
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 45,
    width: 200,
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
});
