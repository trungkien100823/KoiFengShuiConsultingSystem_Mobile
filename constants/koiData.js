import axios from 'axios';
import { API_CONFIG } from './config';
import { getAuthHeaders } from '../services/authService';
import { Alert } from 'react-native';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const koiAPI = {
  getAllKoi: async () => {
    try {
      const headers = await getAuthHeaders();
      
      console.log('Fetching all Koi data from:', `${API_CONFIG.baseURL}${API_CONFIG.endpoints.allKoi}`);
      
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.allKoi}`, 
        { headers }
      );
      
      console.log('Raw API response:', response.data);
      
      if (response.data) {
        // Kiểm tra message từ backend
        if (response.data.message) {
          Alert.alert(
            "Thông báo",
            response.data.message,
            [{ text: "OK" }]
          );
        }

        // Kiểm tra và xử lý dữ liệu
        if (response.data.isSuccess && Array.isArray(response.data.data)) {
          return response.data.data.map(item => {
            console.log('Processing item:', item);
            return {
              id: item.koiVarietyId,
              name: item.name,
              variant: item.name,
              description: item.description,
              imageName: item.imageUrl || 'buddha.png',
              likes: Math.floor(Math.random() * 20) + 5,
              liked: false,
            };
          }).filter(item => item.id);
        }
      }
      
      console.warn('Invalid response format or empty data, using fallback data');
      return koiData;
    } catch (error) {
      console.error('Error fetching Koi list:', error);
      console.error('Error details:', error.response?.data);
      
      // Hiển thị message lỗi từ backend nếu có
      if (error.response?.data?.message) {
        Alert.alert(
          "Thông báo",
          error.response.data.message,
          [{ text: "OK" }]
        );
      }
      
      return koiData;
    }
  },

  getKoiDetails: async (koiId) => {
    try {
      if (!koiId) {
        throw new Error('No Koi ID provided');
      }

      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/KoiVariety/${koiId}`,
        { headers }
      );

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }

      const item = response.data.data;
      return {
        id: item.koiVarietyId,
        name: item.name,
        variant: item.name,
        description: item.description,
        imageName: item.imageUrl || 'buddha.png',
        size: item.size || 2,
        liked: false,
        characteristics: item.characteristics,
        habitat: item.habitat,
        diet: item.diet,
        lifespan: item.lifespan,
        price: item.price,
        colors: item.colors
      };
    } catch (error) {
      console.error('Error fetching Koi details:', error);
      throw error;
    }
  },

  getUserKoi: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.userKoi}`,
        { headers }
      );
      
      if (response.data && response.data.isSuccess) {
        const mappedData = response.data.data.map(item => ({
          id: item.koiVarietyId,
          name: item.name || 'Unknown',
          variant: item.name || 'Unknown',
          description: item.description || '',
          imageName: 'buddha.png', // Vì imageUrl luôn null nên dùng ảnh mặc định
        }));

        // Thêm message vào item đầu tiên nếu có
        if (mappedData.length > 0 && response.data.message) {
          mappedData[0].message = response.data.message;
        }
        
        return mappedData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user Koi:', error);
      return [];
    }
  },

  calculateCompatibility: async (calculationData) => {
    try {
      console.log('Sending calculation request with data:', calculationData);
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Customer/calculate-compatibility`,
        calculationData
      );

      console.log('Raw API response:', response.data);

      if (response.data && typeof response.data.data !== 'undefined') {
        return {
          data: {
            score: response.data.data
          }
        };
      }

      throw new Error(`Invalid API response format: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  },

  getKoiWithColor: async (koiId) => {
    try {
      if (!koiId) {
        throw new Error('No Koi ID provided');
      }

      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/KoiVariety/with-color-by/${koiId}`,
        { headers }
      );

      console.log('API Response:', response.data); // Debug log

      if (!response.data || !response.data.isSuccess || !response.data.data) {
        throw new Error('Invalid response format');
      }

      const item = response.data.data;
      return {
        isSuccess: response.data.isSuccess,
        data: {
          id: item.id,
          varietyName: item.varietyName || 'Unknown',
          introduction: item.introduction || '',
          description: item.description || 'Không có mô tả.',
          imageUrl: item.imageUrl || 'buddha.png',
          colors: item.colors?.map(color => ({
            colorName: color.colorName,
            colorCode: color.colorCode,
            percentage: Number(color.percentage) || 0
          })) || []
        }
      };
    } catch (error) {
      console.error('Error fetching Koi with color details:', error);
      throw error;
    }
  },
};