import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';
import axios from 'axios';

export const authService = {
  // Logout function that clears all user data
  logout: async (navigation) => {
    try {
      // First, try to invalidate the token on the server (if your API supports this)
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        try {
          await axios.post(
            `${API_CONFIG.baseURL}/api/Account/logout`, 
            {}, 
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          console.log('Server-side logout successful');
        } catch (serverError) {
          // If server logout fails, just continue with client-side logout
          console.log('Server-side logout failed, continuing with client-side logout:', serverError);
        }
      }

      // Clear all tokens and user data from AsyncStorage
      const keysToRemove = [
        'accessToken',
        'refreshToken',
        'userInfo',
        'userId',
        'userRole',
        'userName',
        'userEmail',
        'userPhone',
        // Add any other user-related keys you store
      ];
      
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      
      // Clear any persisted state or caches
      // If you're using Redux persist, you might need to clear that state too

      console.log('All user data cleared successfully');
      
      // Navigate to login screen
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error.message || 'An error occurred during logout' 
      };
    }
  }
}; 