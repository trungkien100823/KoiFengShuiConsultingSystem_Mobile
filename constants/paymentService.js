import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

/**
 * Service để xử lý các thanh toán trong ứng dụng
 */
export const paymentService = {
  /**
   * Tạo URL thanh toán cho bất kỳ dịch vụ nào
   * @param {string} serviceId - ID của dịch vụ cần thanh toán
   * @param {number} paymentType - Loại dịch vụ
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {Promise<{success: boolean, paymentUrl: string}>} - Kết quả tạo URL thanh toán
   */
  createPaymentUrl: async (serviceId, paymentType, options = {}) => {
    try {
      console.log(`Đang tạo URL thanh toán cho dịch vụ: ${serviceId}, loại: ${paymentType}`);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }
      
      // Đảm bảo ID là một chuỗi hợp lệ và loại bỏ khoảng trắng
      const safeServiceId = typeof serviceId === 'string' ? serviceId.trim() : String(serviceId);
      
      // Đảm bảo serviceType là một số
      const safeServiceType = Number(paymentType);
      
      // Xây dựng URL với query parameters
      const paymentEndpoint = `${API_CONFIG.endpoints.payment}?paymentType=${safeServiceType}&serviceId=${encodeURIComponent(safeServiceId)}`;
      
      console.log('URL thanh toán đầy đủ:', `${API_CONFIG.baseURL}${paymentEndpoint}`);
      
      // Gọi API thanh toán với phương thức POST nhưng dữ liệu trong query parameters
      const response = await axios.post(
        `${API_CONFIG.baseURL}${paymentEndpoint}`,
        {}, // Body trống
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: options.timeout || 30000
        }
      );
      
      console.log('Response từ API thanh toán:', JSON.stringify(response.data));
      
      if (response.data && response.data.isSuccess) {
        return {
          success: true,
          paymentUrl: response.data.data.paymentUrl,
          message: response.data.message || 'Tạo URL thanh toán thành công'
        };
      }
      
      throw new Error(response.data?.message || 'Không thể tạo URL thanh toán');
    } catch (error) {
      console.error('Lỗi khi tạo URL thanh toán:', error);
      
      if (error.response) {
        console.error('Chi tiết lỗi response:', {
          status: error.response.status,
          data: error.response.data
        });
        
        // Xử lý lỗi validation từ API
        if (error.response.status === 400) {
          const validationErrors = error.response.data?.errors;
          if (validationErrors) {
            if (validationErrors.serviceId || validationErrors.ServiceId) {
              const serviceIdErrors = Array.isArray(validationErrors.serviceId || validationErrors.ServiceId) 
                ? (validationErrors.serviceId || validationErrors.ServiceId).join(', ') 
                : 'Invalid serviceId';
              return {
                success: false,
                message: `Lỗi serviceId: ${serviceIdErrors}`,
                error: error
              };
            }
            
            // Xử lý lỗi paymentType nếu có
            if (validationErrors.paymentType || validationErrors.PaymentType) {
              const paymentTypeErrors = Array.isArray(validationErrors.paymentType || validationErrors.PaymentType) 
                ? (validationErrors.paymentType || validationErrors.PaymentType).join(', ') 
                : 'Invalid paymentType';
              return {
                success: false,
                message: `Lỗi paymentType: ${paymentTypeErrors}`,
                error: error
              };
            }
          }
        }
      }
      
      return {
        success: false,
        message: error.message || 'Đã xảy ra lỗi khi tạo URL thanh toán',
        error: error
      };
    }
  },
  
  /**
   * Chuyển hướng người dùng đến màn hình thanh toán
   * @param {object} navigation - Đối tượng navigation
   * @param {string} paymentUrl - URL thanh toán
   * @param {string} serviceId - ID của dịch vụ
   * @param {object} serviceInfo - Thông tin dịch vụ
   * @param {number} serviceType - Loại dịch vụ
   */
  navigateToPayment: (navigation, paymentUrl, serviceId, serviceInfo, serviceType) => {
    navigation.navigate('payment_webview', {
      paymentUrl,
      serviceId,
      serviceInfo,
      serviceType,
      returnScreen: paymentService.getReturnScreenByType(serviceType)
    });
  },
  
  /**
   * Xác định màn hình trả về sau khi thanh toán dựa vào loại dịch vụ
   * @param {number} serviceType - Loại dịch vụ
   * @returns {string} - Tên màn hình trở về
   */
  getReturnScreenByType: (serviceType) => {
    switch (serviceType) {
      case paymentService.SERVICE_TYPES.BOOKING_ONLINE:
        return 'onlineBookingDetails';
      case paymentService.SERVICE_TYPES.BOOKING_OFFLINE:
        return 'offlineBookingDetails';
      case paymentService.SERVICE_TYPES.COURSE:
        return 'courseDetails';
      case paymentService.SERVICE_TYPES.REGISTER_ATTEND:
        return 'ticketDetails';
      default:
        return 'home'; // Màn hình mặc định nếu không xác định được
    }
  },
  
  /**
   * Xử lý thanh toán cho bất kỳ dịch vụ nào
   * @param {object} params - Tham số thanh toán
   * @returns {Promise<{success: boolean}>} - Kết quả xử lý thanh toán
   */
  processPayment: async (params) => {
    const { 
      navigation, 
      serviceId, 
      serviceType, 
      serviceInfo = {}, 
      onSuccess, 
      onError 
    } = params;
    
    try {
      // Tạo URL thanh toán
      const result = await paymentService.createPaymentUrl(serviceId, serviceType);
      
      if (result.success && result.paymentUrl) {
        // Chuyển sang màn hình WebView để hiển thị trang thanh toán
        paymentService.navigateToPayment(
          navigation,
          result.paymentUrl,
          serviceId,
          serviceInfo,
          serviceType
        );
        
        // Gọi callback thành công nếu có
        if (onSuccess) onSuccess(result);
        
        return { success: true };
      } else {
        // Gọi callback lỗi nếu có
        if (onError) onError(result);
        
        // Trả về lỗi
        return { 
          success: false, 
          message: result.message || 'Không thể tạo liên kết thanh toán' 
        };
      }
    } catch (error) {
      // Gọi callback lỗi nếu có
      if (onError) onError({ success: false, error });
      
      // Trả về lỗi
      return { 
        success: false, 
        message: error.message || 'Đã xảy ra lỗi khi xử lý thanh toán',
        error 
      };
    }
  },

  /**
   * Định nghĩa các loại dịch vụ thanh toán
   */
  SERVICE_TYPES: {
    BOOKING_ONLINE: 0,
    BOOKING_OFFLINE: 1,
    COURSE: 2,
    REGISTER_ATTEND: 3
  }
};
