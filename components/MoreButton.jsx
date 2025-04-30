import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { koiAPI } from '../constants/koiData.js';
import { pondAPI } from '../constants/koiPond.js';

export default function MoreButton({ item, type }) {
  const router = useRouter();

  const handlePress = async () => {
    try {
      if (type === 'Koi' || type === 'Recommendation') {
        const itemId = item.koiVarietyId || item.id;
        console.log('Item data:', item);

        if (!itemId) {
          console.error('Invalid item data:', item);
          Alert.alert(
            "Lỗi",
            "Không thể xác định ID của cá Koi",
            [{ text: "OK" }]
          );
          return;
        }

        const response = await koiAPI.getKoiWithColor(itemId);
        
        if (!response || !response.data) {
          throw new Error('Invalid response from API');
        }

        router.push({
          pathname: '/(tabs)/fish_details',
          params: {
            id: itemId,
            koiVarietyId: itemId,
            name: response.data?.varietyName || item.name || 'Unknown',
            description: response.data?.description || item.description || 'Chưa có mô tả.',
            introduction: response.data?.introduction || '',
            imageName: response.data?.imageUrl || item.imageName,
            liked: (item.liked || false).toString(),
            size: response.data?.size || item.size || '2'
          }
        });
      } else if (type === 'Pond') {
        try {
          const itemId = item.koiPondId || item.id;
          console.log('Item data:', item);
      
          if (!itemId) {
            console.error('Invalid item data:', item);
            Alert.alert(
              "Lỗi",
              "Không thể xác định ID của hồ cá",
              [{ text: "OK" }]
            );
            return;
          }
          
          const pondDetails = await pondAPI.getPondDetails(itemId);
          
          // Đảm bảo pondDetails có dữ liệu
          if (!pondDetails) {
            throw new Error('Invalid response from API');
          }
          
          router.push({
            pathname: '/(tabs)/pond_details',
            params: {
              id: itemId,
              koiPondId: itemId,
              name: pondDetails?.pondName || item.name || 'Chưa có tên',
              shape: pondDetails?.shapeName || item.shape || 'Chưa có hình dạng',
              description: pondDetails?.description || item.description || 'Chưa có mô tả',
              imageName: pondDetails?.imageUrl || item.imageName,
              shapeId: pondDetails?.shapeId || item.shapeId,
              direction: pondDetails?.direction || 'Chưa xác định'
            }
          });
        } catch (error) {
          console.error('Error fetching pond details:', error);
          Alert.alert(
            "Lỗi",
            "Không thể tải chi tiết hồ cá. Vui lòng thử lại sau.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error('Error in MoreButton:', error);
      Alert.alert(
        "Lỗi",
        "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <TouchableOpacity 
      style={styles.moreButton}
      onPress={handlePress}
    >
      <Text style={styles.moreButtonText}>Tìm hiểu thêm</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  moreButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  moreButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});