import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from './config';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 15000, // tăng timeout lên 15 giây
  headers: {
    'Content-Type': 'application/json'
  }
});

export const workshopDetailsService = {
    getWorkshopById: async (id) => {
      try {
        console.log(`Đang gọi API lấy workshop ID: ${id}`);
        console.log(`URL: ${API_CONFIG.baseURL}/api/Workshop/${id}`);
        
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Không tìm thấy token đăng nhập');
        }

        // Sử dụng đúng URL từ config
        const response = await axios.get(`${API_CONFIG.baseURL}/api/Workshop/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: status => status >= 200 && status < 300
        });

        if (response.data && response.data.isSuccess) {
          console.log('Workshop details data:', JSON.stringify(response.data));
          return response.data;
        }
        throw new Error('Không có dữ liệu workshop trả về từ API');

      } catch (error) {
        console.error('Chi tiết lỗi khi lấy workshop details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: `${API_CONFIG.baseURL}/api/Workshop/${id}`
        });

        if (error.message === 'Network Error') {
          throw new Error('Lỗi kết nối mạng - Vui lòng kiểm tra kết nối internet');
        }

        if (error.code === 'ECONNABORTED') {
          throw new Error('Kết nối tới server quá lâu - Vui lòng thử lại sau');
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              throw new Error('Không tìm thấy workshop');
            case 401:
              throw new Error('Token không hợp lệ hoặc đã hết hạn');
            default:
              throw new Error(`Lỗi server: ${error.response.status}`);
          }
        }
        
        throw new Error(`Lỗi kết nối đến server: ${error.message}`);
      }
    },

    getMasterById: async (id) => {
      try {
        console.log(`Đang gọi API lấy master ID: ${id}`);
        console.log(`URL: ${API_CONFIG.baseURL}/api/Master/${id}`);
        
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Không tìm thấy token đăng nhập');
        }

        // Sử dụng đúng URL từ config
        const response = await axios.get(`${API_CONFIG.baseURL}/api/Master/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: status => status >= 200 && status < 300
        });

        if (response.data && response.data.isSuccess) {
          console.log('Master details data:', JSON.stringify(response.data));
          return response.data;
        }
        throw new Error('Không có dữ liệu master trả về từ API');

      } catch (error) {
        console.error('Chi tiết lỗi khi lấy master details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: `${API_CONFIG.baseURL}/api/Master/${id}`
        });

        if (error.message === 'Network Error') {
          throw new Error('Lỗi kết nối mạng - Vui lòng kiểm tra kết nối internet');
        }

        if (error.code === 'ECONNABORTED') {
          throw new Error('Kết nối tới server quá lâu - Vui lòng thử lại sau');
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              throw new Error('Không tìm thấy master');
            case 401:
              throw new Error('Token không hợp lệ hoặc đã hết hạn');
            default:
              throw new Error(`Lỗi server: ${error.response.status}`);
          }
        }
        
        throw new Error(`Lỗi kết nối đến server: ${error.message}`);
      }
    }
};