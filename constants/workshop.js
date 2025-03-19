import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from './config';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // timeout sau 10 giây
  headers: {
    'Content-Type': 'application/json'
  }
});

export const workshopService = {
    getTrendingWorkshops: async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Không tìm thấy token đăng nhập');
        }

        // Kiểm tra kết nối mạng trước khi gọi API
        const response = await axiosInstance.get('/api/Workshop/trending', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: status => status >= 200 && status < 300
        });

        // Kiểm tra và xử lý response
        if (response.data) {
          console.log('Trending workshops data:', response.data);
          return response.data;
        }
        throw new Error('Không có dữ liệu trả về từ API');

      } catch (error) {
        console.error('Chi tiết lỗi khi lấy trending workshops:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });

        if (error.code === 'ECONNABORTED') {
          throw new Error('Timeout - Vui lòng kiểm tra kết nối mạng');
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              throw new Error('Không tìm thấy API endpoint');
            case 401:
              throw new Error('Token không hợp lệ hoặc đã hết hạn');
            case 403:
              throw new Error('Không có quyền truy cập');
            default:
              throw new Error(`Lỗi server: ${error.response.status}`);
          }
        }
        
        throw new Error('Lỗi kết nối đến server');
      }
    },
  
    getNewestWorkshops: async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Không tìm thấy token đăng nhập');
        }

        const response = await axiosInstance.get('/api/Workshop/sort-createdDate', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: status => status >= 200 && status < 300
        });

        if (response.data) {
          // Lấy dữ liệu từ response
          let workshops = response.data.data || [];

          // Sort workshops chỉ theo createdDate giảm dần
          workshops = workshops.sort((a, b) => {
            const dateA = new Date(a.createdDate);
            const dateB = new Date(b.createdDate);
            return dateB - dateA; // Sort giảm dần (mới nhất lên đầu)
          });

          console.log('Newest workshops đã sort theo createdDate:', workshops);
          return {
            ...response.data,
            data: workshops
          };
        }
        throw new Error('Không có dữ liệu trả về từ API');

      } catch (error) {
        console.error('Chi tiết lỗi khi lấy newest workshops:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });

        if (error.response?.status === 500) {
          console.log('Server error response:', error.response.data);
          return { data: [] };
        }

        throw error;
      }
    }
};