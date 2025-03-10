import { Platform } from 'react-native';

// Using your specific local network IP for all platforms
const DEV_API_URL = 'http://192.168.31.148:5261';

export const API_CONFIG = {
  baseURL: DEV_API_URL,
  endpoints: {
    allKoi: '/api/KoiVariety',
    userKoi: '/api/KoiVariety/get-koi-current-login',
    detailKoi: '/api/KoiVariety/{id}',
    allPonds: '/api/KoiPond/get-all',
    detailPond: '/api/KoiPond/get',
    pondRecommendations: '/api/KoiPond/recommend'
  }
};

// For debugging
console.log('API Config:', {
  platform: Platform.OS,
  baseURL: DEV_API_URL
}); 