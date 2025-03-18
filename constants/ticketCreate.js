import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from './config';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 15000, // tăng timeout lên 15 giây
  headers: {
    'Content-Type': 'application/json'
  }
});

export const ticketService = {
  createTicket: async (ticketData) => {
    try {
      console.log('Đang chuẩn bị dữ liệu để tạo vé:', JSON.stringify(ticketData));
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }

      // Chỉnh sửa: Đảm bảo workshopId được gửi đúng định dạng
      // Loại bỏ bất kỳ khoảng trắng nào nếu có
      const workshopId = ticketData.workshopId.trim();
      
      // Chuẩn bị dữ liệu đúng định dạng theo API backend
      const apiData = {
        WorkshopId: workshopId,
        NumberOfTicket: parseInt(ticketData.quantity, 10),
      };
      
      console.log('Dữ liệu đã được chuẩn bị cho API:', JSON.stringify(apiData));
      
      // Gọi API tạo vé
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.createRegisterAttend}`,
        apiData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Kết quả tạo vé từ API:', JSON.stringify(response.data));
      
      if (response.data && response.data.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: 'Đăng ký tham gia workshop thành công!'
        };
      }
      
      throw new Error(response.data?.message || 'Không thể tạo vé');
    } catch (error) {
      console.error('Lỗi từ service tạo vé:', error);
      
      // Xử lý lỗi chi tiết hơn
      if (error.response && error.response.data) {
        console.log('Chi tiết lỗi từ API:', JSON.stringify(error.response.data));
        
        // Trả về lỗi cụ thể từ server
        throw new Error(error.response.data.message || 'Lỗi từ máy chủ');
      }
      
      throw error;
    }
  },
  
  // Cập nhật phương pháp thứ hai: thay vì FormData, sử dụng JSON nhưng với cách định dạng khác
  createTicketFormData: async (ticketData) => {
    try {
      console.log('Đang chuẩn bị dữ liệu thay thế để tạo vé:', JSON.stringify(ticketData));
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }

      // Kiểm tra số lượng vé
      const numberOfTicket = parseInt(ticketData.quantity, 10);
      if (isNaN(numberOfTicket) || numberOfTicket <= 0) {
        throw new Error('Số lượng vé phải lớn hơn 0');
      }

      // Chuẩn bị dữ liệu chỉ với các trường backend cần
      const apiData = {
        WorkshopId: ticketData.workshopId,
        NumberOfTicket: numberOfTicket
      };
      
      console.log('Dữ liệu thay thế đã được chuẩn bị:', JSON.stringify(apiData));
      
      // Gọi API tạo vé với JSON thay vì FormData
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.createRegisterAttend}`,
        apiData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log('Kết quả tạo vé từ API (phương pháp thay thế):', JSON.stringify(response.data));
      
      if (response.data && response.data.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: 'Đăng ký tham gia workshop thành công!'
        };
      }
      
      throw new Error(response.data?.message || 'Không thể tạo vé');
    } catch (error) {
      console.error('Lỗi từ phương pháp thay thế:', error);
      
      // Chi tiết xử lý lỗi tương tự phương pháp đầu tiên
      if (error.response && error.response.data) {
        console.log('Chi tiết lỗi từ API (phương pháp thay thế):', JSON.stringify({
          status: error.response.status,
          data: error.response.data
        }));
        
        // Xử lý các lỗi HTTP cụ thể
        if (error.response.status === 400) {
          const errorMessage = error.response.data.message || '';
          
          // Nếu là lỗi về vé chưa thanh toán, thêm thông tin về thao tác tiếp theo
          if (errorMessage.includes('hoàn tất thanh toán')) {
            // Trả về một đối tượng lỗi đặc biệt để UI có thể hiển thị nút chuyển đến trang thanh toán
            const customError = new Error(errorMessage);
            customError.code = 'UNPAID_PREVIOUS_TICKET';
            throw customError;
          }
        }
        
        throw new Error(error.response.data.message || 'Không thể tạo vé. Vui lòng thử lại sau.');
      }
      
      throw error;
    }
  }
};
