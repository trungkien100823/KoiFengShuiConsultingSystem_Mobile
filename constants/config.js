import { Platform } from 'react-native';

const DEV_API_URL = 'http://192.168.1.194:5261';
//const DEV_API_URL = 'https://koifengshui-001-site1.ltempurl.com';

export const API_CONFIG = {
  baseURL: DEV_API_URL,
  endpoints: {
    // Koi endpoints
    allKoi: '/api/KoiVariety/get-all',
    userKoi: '/api/KoiVariety/get-koi-current-login',
    detailKoi: '/api/KoiVariety/{id}',
    withColorBy: '/api/KoiVariety/with-color-by/{id}',
    getAllElements: '/api/KoiVariety/get-all-elements',
    getAllColors: '/api/KoiVariety/get-all-colors',
    getKoiByName: '/api/KoiVariety/get-by-name',
    filterKoi: '/api/KoiVariety/filter',
    compatibleElements: '/api/KoiVariety/compatible-elements',
    colorsByElement: '/api/KoiVariety/api/colors-by-element/{element}',
    getByColor: '/api/KoiVariety/get-by-color',

    // Booking endpoints
    createBooking: '/api/Booking/create',
    getBooking: '/api/Booking/{id}',
    offlineTransactionComplete: '/api/Booking/offline-transaction-complete',
    currentLoginBookingOffline: '/api/Booking/current-login-bookingOffline',
    getAllBookingTypeEnums: '/api/Booking/get-all-bookingTypeEnums',
    getAllBookingOnlineEnums: '/api/Booking/get-all-bookingOnlineEnums',
    getAllBookingOfflineEnums: '/api/Booking/get-all-bookingOfflineEnums',
    getBookingsByTypeAndStatus: '/api/Booking/get-bookings-by-type-and-status',

    // Pond endpoints
    allPonds: '/api/KoiPond/get-all',
    detailPond: '/api/KoiPond/{id}',
    allPondShapes: '/api/KoiPond/get-all-shape',
    pondByShape: '/api/KoiPond/get-by-shape/{id}',
    pondRecommendations: '/api/KoiPond/recommend',
    pondByName: '/api/KoiPond/get-by-name',
    
    // Auth endpoints
    register: '/api/Account/register',
    login: '/api/Account/login',
    currentUser: '/api/Account/current-user',
    logout: '/api/Account/logout',
    changePassword: '/api/Account/change-password',
    forgotPassword: '/api/Account/forgot-password',
    verifyOTP: '/api/Account/verify-otp',

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
    getRegisterByStatus: '/api/RegisterAttend/get-by-status-for-current-user',
    getAllRegisterAttendEnums: '/api/RegisterAttend/get-all-registerAttendEnums',

    // master endpoints
    masterDetails: '/api/Master/{id}',
    getAllConsultants: '/api/Master/get-all',

    //masterSchedule endpoints
    getSchedulesByMaster: '/api/MasterSchedule/get-schedules-by-master/{id}',
    getSchedulesForMobile: '/api/MasterSchedule/get-schedules-for-mobile',
    
    // payment endpoints
    payment: '/api/Payment/payos/customer/payment-url',

    // order endpoints
    pendingOrders: "/api/Order/get-pending-order",
    paidOrders: "/api/Order/get-paid-orders",
    cancelOrder: "/api/Order/cancel/{id}",
    updatePendingConfirm: '/api/Order/update-to-PENDINGCONFIRM/{id}',

    // New endpoints
    koiVariety: '/api/KoiVariety',
    pond: '/api/Pond',

    //Course endpoints
    bestSellerCourse: '/api/Course/best-seller',
    sortByRating: '/api/Course/sort-by-rating',
    getCourseById: '/api/Course/get-details-for-mobile/{id}',
    getCourseByCategory: '/api/Course/get-by-category/{id}',
    getPaidCourses: '/api/Course/get-paid-courses',
    rateCourse: '/api/Course/rate',

    //Category endpoints
    getAllCategory: '/api/Category/get-all',

    // consulting package endpoints
    getAllConsultationPackages: '/api/ConsultationPackage/get-all',
    getConsultingPackageDetails: '/api/ConsultationPackage/get-by/{id}',

    // contract endpoints
    getContractByBookingOffline: '/api/Contract/by-bookingOffline/{id}',
    cancelContractByCustomer: '/api/Contract/customer/cancel/{contractId}',
    confirmContractByCustomer: '/api/Contract/customer/confirm/{contractId}',
    sendOTPContract: '/api/Contract/send-otp/{contractId}',
    verifyOTPContract: '/api/Contract/verify-otp/{contractId}',

    // document endpoints
    getDocumentByBookingOffline: '/api/FengShuiDocument/document/{bookingOfflineId}',
    confirmDocumentByCustomer: '/api/FengShuiDocument/{documentId}/confirm-by-customer',
    cancelDocumentByCustomer: '/api/FengShuiDocument/{documentId}/cancel-by-customer',

    // attachment endpoints
    getAttachmentByBookingOffline: '/api/Attachment/booking/{bookingOfflineId}',
    cancelAttachmentByCustomer: '/api/Attachment/cancel/{attachmentId}',
    confirmAttachmentByCustomer: '/api/Attachment/confirm/{attachmentId}',
    sendOTPAttachment: '/api/Attachment/send-otp/{attachmentId}',
    verifyOTPAttachment: '/api/Attachment/verify-otp/{attachmentId}',

    // chapter endpoints
    getAllChaptersByCourseId: '/api/Chapter/get-all-chapters-by-courseId',
    getChapterById: '/api/Chapter/get-chapter/{id}',

    // registerCourse endpoints
    updateProccessCourse: '/api/RegisterCourse/{chapterId}',
    getEnrollChaptersByEnrollCourseId: '/api/RegisterCourse/get-enroll-chapters-by/{enrollCourseId}',
    getRegisterCourseById: '/api/RegisterCourse/{id}',

    // enrollCertificate endpoints
    getEnrollCertificatesCurrentCustomer: '/api/RegisterCourse/get-enrollcertificates-current-customer',
    getEnrollCertificateByEnrollCourseId: '/api/RegisterCourse/get-enrollcertificate-by/{id}',
  },
  timeoutDuration: 30000 // 30 seconds
};

console.log("API URL BEING USED:", API_CONFIG.baseURL);
