import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const WorkshopFilter = () => {
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();
  
  // Dữ liệu mẫu cho các workshop
  // Hàm chia mảng workshop thành các cặp (cho layout 2 cột)
  const chunkArray = (array, size) => {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
      array.slice(i * size, i * size + size)
    );
  };

  // Chia dữ liệu thành các hàng, mỗi hàng có 2 workshop
  const workshopRows = chunkArray(workshopData, 2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('workshop')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What Suit You?</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuDots}>• • •</Text>
        </TouchableOpacity>
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search content..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#aaa"
          />
        </View>
      </View>
      
      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="calendar-outline" size={18} color="#333" />
          <Text style={styles.filterButtonText}>All Date</Text>
          <Ionicons name="chevron-down" size={16} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color="#333" />
          <Text style={styles.filterButtonText}>Filter</Text>
          <Ionicons name="chevron-down" size={16} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Danh sách Workshop có thể cuộn */}
      <ScrollView style={styles.scrollView}>
        {workshopRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((workshop) => (
              <TouchableOpacity key={workshop.id} style={styles.workshopCard}>
                <Image source={workshop.image} style={styles.workshopImage} resizeMode="cover" />
                <View style={styles.workshopContent}>
                  <Text style={styles.workshopTitle} numberOfLines={2}>{workshop.title}</Text>
                  <View style={styles.workshopInfoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#555" />
                    <Text style={styles.workshopInfoText}>{workshop.date}</Text>
                  </View>
                  <View style={styles.workshopInfoRow}>
                    <Ionicons name="location-outline" size={14} color="#555" />
                    <Text style={styles.workshopInfoText}>{workshop.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {/* Nếu hàng cuối chỉ có 1 mục, thêm phần tử trống để giữ layout */}
            {row.length === 1 && <View style={styles.emptyCard} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

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
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 5,
  },
  menuDots: {
    fontSize: 18,
    color: '#777',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 50,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 5,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workshopCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyCard: {
    width: '48%',
  },
  workshopImage: {
    width: '100%',
    height: 120,
  },
  workshopContent: {
    padding: 10,
  },
  workshopTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  workshopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },
  workshopInfoText: {
    fontSize: 12,
    color: '#555',
  },
});

export default WorkshopFilter;
