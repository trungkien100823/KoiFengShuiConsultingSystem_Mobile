import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from './config';
import { Alert } from 'react-native';

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
          if (!response.data.data || response.data.data.length === 0) {
            Alert.alert('Thông báo', 'Không tìm thấy trending workshops');
          }
          return response.data;
        }
        throw new Error('Không có dữ liệu trả về từ API');

      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert('Lỗi kết nối', 'Timeout - Vui lòng kiểm tra kết nối mạng');
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              Alert.alert('Lỗi', 'Không tìm thấy API endpoint');
              break;
            case 401:
              Alert.alert('Lỗi xác thực', 'Token không hợp lệ hoặc đã hết hạn');
              break;
            case 403:
              Alert.alert('Lỗi quyền truy cập', 'Không có quyền truy cập');
              break;
            default:
              Alert.alert('Lỗi server', `Lỗi server: ${error.response.status}`);
          }
        } else {
          Alert.alert('Lỗi kết nối', 'Lỗi kết nối đến server');
        }
        
        throw error;
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

          if (workshops.length === 0) {
            Alert.alert('Thông báo', 'Không tìm thấy newest workshops');
          }

          // Sort workshops chỉ theo createdDate giảm dần
          workshops = workshops.sort((a, b) => {
            const dateA = new Date(a.createdDate);
            const dateB = new Date(b.createdDate);
            return dateB - dateA; // Sort giảm dần (mới nhất lên đầu)
          });

          return {
            ...response.data,
            data: workshops
          };
        }
        throw new Error('Không có dữ liệu trả về từ API');

      } catch (error) {
        if (error.response?.status === 500) {
          Alert.alert('Lỗi server', 'Lỗi xử lý dữ liệu từ server');
          return { data: [] };
        }

        if (error.code === 'ECONNABORTED') {
          Alert.alert('Lỗi kết nối', 'Timeout - Vui lòng kiểm tra kết nối mạng');
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              Alert.alert('Lỗi', 'Không tìm thấy API endpoint');
              break;
            case 401:
              Alert.alert('Lỗi xác thực', 'Token không hợp lệ hoặc đã hết hạn');
              break;
            case 403:
              Alert.alert('Lỗi quyền truy cập', 'Không có quyền truy cập');
              break;
            default:
              Alert.alert('Lỗi server', `Lỗi server: ${error.response.status}`);
          }
        } else {
          Alert.alert('Lỗi kết nối', 'Lỗi kết nối đến server');
        }

        throw error;
      }
    }
};