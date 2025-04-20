import axios from 'axios';
import { API_CONFIG } from '../constants/config';
import { getAuthToken } from './authService';
import { router } from 'expo-router';

export const certificateService = {
  getEnrollCertificatesCurrentCustomer: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập để tiếp tục');
      }

      const params = {
        _t: new Date().getTime(),
        _nc: Math.random()
      };

      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getEnrollCertificatesCurrentCustomer}`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Mobile-App': 'true'
          },
          timeout: API_CONFIG.timeoutDuration,
          cache: false,
          withCredentials: false
        }
      );
      
      if (!response.data) {
        throw new Error('Không có dữ liệu trả về');
      }
      
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || 'Có lỗi xảy ra khi tải danh sách chứng chỉ');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || `Lỗi server: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server');
      } else {
        throw new Error(error.message || 'Có lỗi xảy ra khi tải danh sách chứng chỉ');
      }
    }
  },

  getEnrollCertificateByEnrollCourseId: async (enrollCertId) => {
    try {
      if (!enrollCertId) {
        throw new Error('ID chứng chỉ không hợp lệ');
      }
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập để tiếp tục');
      }
      
      const params = {
        _t: new Date().getTime(),
        _nc: Math.random()
      };

      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getEnrollCertificateByEnrollCourseId.replace('{id}', enrollCertId)}`;
      
      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Mobile-App': 'true'
        },
        timeout: API_CONFIG.timeoutDuration,
        cache: false,
        withCredentials: false
      });
      
      if (!response.data) {
        throw new Error('Không có dữ liệu trả về');
      }
      
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || 'Có lỗi xảy ra khi tải chi tiết chứng chỉ');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        }
        throw new Error(error.response.data?.message || `Lỗi server: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server');
      } else {
        throw new Error(error.message || 'Có lỗi xảy ra khi tải chi tiết chứng chỉ');
      }
    }
  }
}; 