import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SortPopup({ visible, onClose, onSort, currentSort }) {
  const sortOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'destiny', label: 'Vận mệnh' },
    { id: 'size', label: 'Kích thước' },
    { id: 'comp', label: 'So sánh' },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.popup}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionContainer,
                currentSort === option.id && styles.activeOption
              ]}
              onPress={() => {
                onSort(option.id);
                onClose();
              }}
            >
              <Text style={[
                styles.optionText,
                currentSort === option.id && styles.activeText
              ]}>
                {option.label}
              </Text>
              {currentSort === option.id && (
                <Ionicons name="checkmark" size={20} color="#8B0000" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginTop: 60,
    marginRight: 20,
    width: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  activeOption: {
    backgroundColor: '#FFF5F5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  activeText: {
    color: '#8B0000',
    fontWeight: '500',
  },
});