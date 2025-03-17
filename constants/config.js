import { Platform } from 'react-native';

// Using your specific local network IP for all platforms
const DEV_API_URL = 'http://192.168.1.34:5261';

export const API_CONFIG = {
  baseURL: DEV_API_URL,
  endpoints: {

    allKoi: '/api/KoiVariety/get-with-color',

    userKoi: '/api/KoiVariety/get-koi-current-login',
    detailKoi: '/api/KoiVariety/{id}',
    
    // Pond endpoints
    allPonds: '/api/KoiPond/get-all',
    detailPond: '/api/KoiPond/get',
    pondRecommendations: '/api/KoiPond/recommend',

    allConsultants: '/api/Master/get-all',
    detailConsultant: '/api/Master/{id}',
    
    // Auth endpoints
    register: '/api/Account/register',
    login: '/api/Account/login',

    // Customer endpoints
    currentCustomerElement: '/api/Customer/current-customer-element-palace',


    // workshop endpoints
    newestWorkshop: '/api/Workshop/sort-createdDate',
    trendingWorkshop: '/api/Workshop/trending',
    workshopDetails: '/api/Workshop/{id}',

    // ticket endpoints
    createRegisterAttend: '/api/RegisterAttend/create',
    ticketDetails: '/api/RegisterAttend/{registerAttendId}',
  }
};
