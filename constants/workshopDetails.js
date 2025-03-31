import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from './config';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const workshopDetailsService = {
  getWorkshopById: async (id) => {
    try {
      console.log(`Đang gọi API lấy workshop ID: ${id}`);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }

      const response = await axios.get(`${API_CONFIG.baseURL}/api/Workshop/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (error) {
      console.error('Lỗi khi lấy workshop details:', error);
      throw error;
    }
  },

  // Thêm hàm getMasterById với cấu hình giống getWorkshopById
  getMasterById: async (id) => {
    try {
      console.log(`Đang gọi API lấy master ID: ${id}`);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }

      const response = await axios.get(`${API_CONFIG.baseURL}/api/Master/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (error) {
      console.error('Lỗi khi lấy master details:', error);
      throw error;
    }
  }
};