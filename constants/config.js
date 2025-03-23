import { Platform } from 'react-native';

//const DEV_API_URL = 'http://192.168.1.25:5261';
const DEV_API_URL = 'http://192.168.31.148:5261';

export const API_CONFIG = {
  baseURL: DEV_API_URL,
  endpoints: {
    // Koi endpoints
    allKoi: '/api/KoiVariety',
    userKoi: '/api/KoiVariety/get-koi-current-login',
    detailKoi: '/api/KoiVariety/{id}',
    withColorBy: '/api/KoiVariety/with-color-by/{id}',

    // Booking endpoints
    createBooking: '/api/Booking/create',
    getBooking: '/api/Booking/{id}',

    // Pond endpoints
    allPonds: '/api/KoiPond/get-all',
    detailPond: '/api/KoiPond/{id}',
    allPondShapes: '/api/KoiPond/get-all-shape',
    pondByShape: '/api/KoiPond/get-by-shape/{id}',
    pondRecommendations: '/api/KoiPond/recommend',
    
    // Auth endpoints
    register: '/api/Account/register',
    login: '/api/Account/login',
    currentUser: '/api/Account/current-user',

    // Customer endpoints
    currentCustomerElement: '/api/Customer/current-customer-element-palace',
    calculateCompatibility: '/api/Customer/calculate-compatibility',

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
    getAllConsultants: '/api/Master/get-all',

    // payment endpoints
    payment: '/api/Payment/payos/customer/payment-url',

    // order endpoints
    pendingOrders: "/api/Order/get-pending-order",
    cancelOrder: "/api/Order/cancel/{id}",
    updatePendingConfirm: '/api/Order/update-to-PENDINGCONFIRM/{id}',

    // New endpoints
    koiVariety: '/api/KoiVariety',
    pond: '/api/Pond'
  },
  timeoutDuration: 15000 // Tăng timeout lên 15 giây
};
