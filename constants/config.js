import { Platform } from 'react-native';

// Using your specific local network IP for all platforms
const DEV_API_URL = 'http://192.168.1.8:5261';

export const API_CONFIG = {
  baseURL: DEV_API_URL,
  endpoints: {
    // Koi endpoints
    allKoi: '/api/KoiVariety',
    userKoi: '/api/KoiVariety/get-koi-current-login',
    detailKoi: '/api/KoiVariety/{id}',
    
    // Pond endpoints
    allPonds: '/api/KoiPond/get-all',
    detailPond: '/api/KoiPond/get',
    pondRecommendations: '/api/KoiPond/recommend',
    
    // Auth endpoints
    register: '/api/Account/register',
    login: '/api/Account/login',
    currentUser: '/api/Account/current-user',

    // Customer endpoints
    currentCustomerElement: '/api/Customer/current-customer-element-palace',

    // workshop endpoints
    newestWorkshop: '/api/Workshop/sort-createdDate',
    trendingWorkshop: '/api/Workshop/trending',
    workshopDetails: '/api/Workshop/{id}',

    // ticket endpoints
    createRegisterAttend: '/api/RegisterAttend/create',
    ticketDetails: '/api/RegisterAttend/{registerAttendId}',
    getRegistersByGroup: '/api/RegisterAttend/register-by-group/{id}',

    // master endpoints
    masterDetails: '/api/Master/{id}',

    // payment endpoints
    payment: '/api/Payment/payos/customer/payment-url',

    // order endpoints
    pendingOrders: "/api/Order/get-pending-order",
    cancelOrder: "/api/Order/cancel/{id}",
    updatePendingConfirm: '/api/Order/update-to-PENDINGCONFIRM/{id}',
  }
};
