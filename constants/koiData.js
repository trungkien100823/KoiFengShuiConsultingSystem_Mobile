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
          koiVarietyId: item.koiVarietyId,
          varietyName: item.name || item.varietyName || 'Unknown',
          name: item.name || 'Unknown',
          variant: item.name || 'Unknown',
          description: item.description || '',
          imageUrl: item.imageUrl || null,
          imageName: item.imageUrl || 'buddha.png',
        }));

        // Thêm message vào item đầu tiên nếu có
        if (mappedData.length > 0 && response.data.message) {
          mappedData[0].message = response.data.message;
        }
        
        return mappedData;
      }
      return [];
    } catch (error) {
      // Chỉ hiển thị log nếu không phải lỗi 500 từ server
      if (!error.isAxiosError || error.response?.status !== 500) {
        console.log('Không thể tải dữ liệu cá Koi người dùng, sử dụng dữ liệu mặc định');
      }
      return [];
    }
  },

  getKoiByName: async (name) => {
    try {
      if (!name) {
        throw new Error('No name provided for search');
      }
      
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getKoiByName}?name=${encodeURIComponent(name.trim())}`,
        { headers }
      );
      
      if (response.data && response.data.isSuccess) {
        return {
          isSuccess: true,
          data: response.data.data.map(item => ({
            id: item.koiVarietyId,
            koiVarietyId: item.koiVarietyId,
            varietyName: item.name || 'Unknown',
            name: item.name || 'Unknown',
            variant: item.name || 'Unknown',
            description: item.description || '',
            imageUrl: item.imageUrl || null,
            imageName: item.imageUrl || 'buddha.png',
          })),
          message: response.data.message
        };
      }
      
      return { 
        isSuccess: false, 
        data: [], 
        message: response.data?.message || 'Không tìm thấy cá Koi phù hợp' 
      };
    } catch (error) {
      console.error('Error searching Koi by name:', error);
      return { isSuccess: false, data: [], message: 'Lỗi khi tìm kiếm cá Koi' };
    }
  },

  getKoiByColor: async (color) => {
    try {
      if (!color) {
        throw new Error('No color provided for search');
      }
      
      const headers = await getAuthHeaders();
      
      // Thay đổi URL để phù hợp với cách truyền List<ColorEnum> cho backend
      // Cách backend nhận List<ColorEnum> là qua nhiều tham số cùng tên
      // Ví dụ: colors=Red&colors=Blue thay vì colors=Red,Blue
      const apiUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getByColor}?colors=${encodeURIComponent(color.trim())}`;
      
      console.log('Calling getKoiByColor API:', apiUrl);
      
      // Sử dụng fetch với timeout thay vì axios
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...headers
          },
          signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('API error status:', response.status);
          throw new Error(`API returned status ${response.status}`);
        }
        
        // Kiểm tra response trả về
        const responseText = await response.text();
        console.log('Color API response text:', responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Invalid JSON response');
        }
        
        if (responseData && responseData.isSuccess) {
          return {
            isSuccess: true,
            data: responseData.data.map(item => ({
              id: item.koiVarietyId,
              koiVarietyId: item.koiVarietyId,
              varietyName: item.name || 'Unknown',
              name: item.name || 'Unknown',
              variant: item.name || 'Unknown',
              description: item.description || '',
              imageUrl: item.imageUrl || null,
              imageName: item.imageUrl || 'buddha.png',
            })),
            message: responseData.message
          };
        }
        
        return { 
          isSuccess: false, 
          data: [], 
          message: responseData?.message || 'Không tìm thấy cá Koi phù hợp với màu này' 
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('Fetch aborted due to timeout');
          throw new Error('Request timeout');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Error searching Koi by color:', error);
      console.error('Error message:', error.message);
      
      return { 
        isSuccess: false, 
        data: [], 
        message: `Lỗi khi tìm kiếm cá Koi theo màu: ${error.message}` 
      };
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