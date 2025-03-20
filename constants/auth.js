import axios from 'axios';
import { API_CONFIG } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  register: async (registerData) => {
    try {
      console.log('Register data:', registerData);
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.register}`,
        registerData
      );

      console.log('Register response:', response.data);
      
      if (response.data) {
        return {
          success: true,
          accessToken: response.data,
          message: 'Đăng ký thành công!'
        };
      }
      throw new Error('Đăng ký thất bại');
    } catch (error) {
      console.error('Register error:', error);
      throw error.response?.data || error.message;
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
