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
  getWorkshopDetails: async (id) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Workshop/${id}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching workshop details:', error);
      throw error;
    }
  },
  
  getMasterDetails: async (masterId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/Master/${masterId}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching master details:', error);
      throw error;
    }
  }
};