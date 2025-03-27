import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SortPopup({ visible, onClose, onSort, currentSort, options = [], isLoading = false, title = 'Sắp xếp theo', errorMessage = null, onRetry = null, multiSelect = false, selectedItems = [], onApply, recommendedItems = [] }) {
  // Kiểm tra một mục đã được chọn chưa (cho chức năng chọn nhiều)
  const isItemSelected = (item) => {
    return selectedItems.includes(item);
  };

  // Kiểm tra xem một mục có được đề xuất không
  const isItemRecommended = (item) => {
    return recommendedItems.includes(item);
  };
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {/* Hiển thị các tùy chọn được đề xuất nếu có */}
              {recommendedItems && recommendedItems.length > 0 && (
                <View style={styles.recommendedSection}>
                  <Text style={styles.recommendedTitle}>Đề xuất:</Text>
                  <View style={styles.recommendedItemsContainer}>
                    {recommendedItems.map((item, index) => (
                      <TouchableOpacity
                        key={`recommended-${index}`}
                        style={[
                          styles.recommendedItem,
                          isItemSelected(item) && styles.selectedRecommendedItem
                        ]}
                        onPress={() => onSort(item)}
                      >
                        <Text style={[
                          styles.recommendedItemText,
                          isItemSelected(item) && styles.selectedRecommendedItemText
                        ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            
              <FlatList
                data={options}
                keyExtractor={(item, index) => `option-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      (multiSelect ? isItemSelected(item) : currentSort === item) && styles.selectedOption,
                      // Thêm style cho các mục được đề xuất
                      isItemRecommended(item) && styles.recommendedOption
                    ]}
                    onPress={() => onSort(item)}
                  >
                    <Text style={[
                      styles.optionText,
                      (multiSelect ? isItemSelected(item) : currentSort === item) && styles.selectedOptionText,
                      // Thêm style cho text của các mục được đề xuất
                      isItemRecommended(item) && styles.recommendedOptionText
                    ]}>
                      {item}
                      {isItemRecommended(item) && " ✓"}
                    </Text>
                    {(multiSelect ? isItemSelected(item) : currentSort === item) && (
                      <Ionicons name="checkmark" size={20} color="#8B0000" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </>
          )}
          
          {multiSelect && onApply && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={onApply}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f8f8f8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#8B0000',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#8B0000',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recommendedSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recommendedTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recommendedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recommendedItem: {
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d0e0f0',
  },
  selectedRecommendedItem: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  recommendedItemText: {
    fontSize: 14,
    color: '#0066cc',
  },
  selectedRecommendedItemText: {
    color: 'white',
  },
  recommendedOption: {
    backgroundColor: '#f0f8ff',
  },
  recommendedOptionText: {
    color: '#0066cc',
  },
});