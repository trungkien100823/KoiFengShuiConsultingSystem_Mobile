import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SelectList } from 'react-native-dropdown-select-list';

export default function OnlineScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Get today's actual date
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthActual = today.getMonth();
  const currentYearActual = today.getFullYear();

  // Example data for booked dates (you would get this from your backend)
  const fullyBookedDates = [2, 6, 13];

  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar dates
  const generateCalendarDates = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const dates = [];
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      dates.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(i);
    }
    
    return dates;
  };

  const timeSlots = [
    { key: '1', value: '8:00 - 10:00' },
    { key: '2', value: '10:00 - 12:00' },
    { key: '3', value: '13:00 - 15:00' },
    { key: '4', value: '15:00 - 17:00' },
    { key: '5', value: '17:00 - 19:00' },
  ];

  const getDateStyle = (date) => {
    // Check if the date is the current date (only in current month and year)
    const isCurrentDate = date === currentDay && 
                         currentMonth === currentMonthActual && 
                         currentYear === currentYearActual;
                         
    if (fullyBookedDates.includes(date)) {
      return [styles.dateCircle, styles.fullyBooked];
    }
    if (date === selectedDate) {
      return [styles.dateCircle, styles.selected];
    }
    if (isCurrentDate) {
      return [styles.dateCircle, styles.current];
    }
    return [styles.dateCircle, styles.available];
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fixedHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/online_package')}
          >
            <Ionicons name="chevron-back-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt lịch tư vấn{'\n'}trực tuyến</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.sectionTitle}>Đặt lịch tư vấn</Text>

          <View style={styles.calendar}>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {months[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              <View style={styles.weekDays}>
                <Text style={styles.weekDay}>CN</Text>
                <Text style={styles.weekDay}>T2</Text>
                <Text style={styles.weekDay}>T3</Text>
                <Text style={styles.weekDay}>T4</Text>
                <Text style={styles.weekDay}>T5</Text>
                <Text style={styles.weekDay}>T6</Text>
                <Text style={styles.weekDay}>T7</Text>
              </View>

              <View style={styles.dates}>
                {generateCalendarDates().map((date, index) => (
                  <View key={index} style={styles.dateCell}>
                    {date && (
                      <TouchableOpacity
                        style={getDateStyle(date)}
                        onPress={() => !fullyBookedDates.includes(date) && setSelectedDate(date)}
                        disabled={fullyBookedDates.includes(date)}
                      >
                        <Text style={styles.dateText}>{date}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.timeSlotContainer}>
            <SelectList 
              setSelected={setSelectedTimeSlot}
              data={timeSlots}
              boxStyles={styles.dropdown}
              dropdownStyles={styles.dropdownList}
              inputStyles={styles.dropdownText}
              dropdownTextStyles={styles.dropdownText}
              placeholder="Select time slot"
              search={false}
            />
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.fullyBooked]} />
              <Text style={styles.legendText}>Hết khách</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.selected]} />
              <Text style={styles.legendText}>Đã chọn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.available]} />
              <Text style={styles.legendText}>Còn trống</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => {
              if (selectedDate && selectedTimeSlot) {
                router.push('/(tabs)/online_transaction');
              } else {
                // You might want to add an alert here for validation
                alert('Please select both date and time slot');
              }
            }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
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
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 30,
    backgroundColor: 'rgba(26, 0, 0, 0)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
    lineHeight: 32,
  },
  scrollView: {
    flex: 1,
    marginTop: 120,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  calendar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarGrid: {
    width: '100%',
    marginTop: 10,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginLeft: -10,
    marginBottom: 15,
  },
  weekDay: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    width: 43,
    textAlign: 'center',
    marginLeft: -1,
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dateCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    marginBottom: 5,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircle: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    width: 40,
  },
  fullyBooked: {
    backgroundColor: '#FF0000',
  },
  selected: {
    backgroundColor: '#666666',
  },
  available: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  current: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  timeSlotContainer: {
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
  },
  dropdownList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#FF0008',  // Red color matching your theme
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
