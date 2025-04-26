import axios from 'axios';
import { API_CONFIG } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  register: async (formData) => {
    try {
      console.log('Register formData:', formData);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 60000,
      };
      
      console.log('Register request to:', `${API_CONFIG.baseURL}/api/Account/register`);
      console.log('Register config:', config);
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Account/register`, 
        formData,
        config
      );
      
      console.log('Register response status:', response.status);
      return response;
    } catch (error) {
      console.error('Register error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 150),
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null,
        request: error.request ? 'Request made but no response received' : null
      });
      
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      console.log('Login attempt with:', { email });
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.login}`,
        { email, password }
      );

      console.log('Login response:', response.data);
      
      if (response.data) {
        const { accessToken, refreshToken } = response.data;
        // Lưu token
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('userEmail', email);
        
        return {
          success: true,
          data: response.data
        };
      }
      throw new Error('Đăng nhập thất bại');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        throw new Error('Tài khoản không tồn tại');
      } else if (error.response?.status === 401) {
        throw new Error('Mật khẩu không chính xác');
      }
      throw new Error('Đã có lỗi xảy ra khi đăng nhập');
    }
  },
  currentCustomerElement: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.currentCustomerElement}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.isSuccess) {
        return {
          success: true,
          data: response.data.data
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      console.error('Get user info error:', error);
      throw error.response?.data?.message || error.message;
    }
  }
};

export const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (error) {
      return false;
    }
  };  
  export const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userEmail']);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };
