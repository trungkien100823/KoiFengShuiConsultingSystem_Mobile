import axios from 'axios';
import { API_CONFIG } from '../constants/config';

const bookingAPI = {
  createOnlineBooking: async (bookingData) => {
    try {
      console.log('Original booking data:', bookingData);
      
      // For direct API calls, we'll assume the data is already formatted correctly
      // Just ensure all fields are present in the right format
      
      const requestData = {
        masterId: bookingData.masterId || "3BFE51B2-D79C-46D1-9",
        description: bookingData.description || "Feng Shui Consultation",
        bookingDate: bookingData.bookingDate, // Should be YYYY-MM-DD
        startTime: bookingData.startTime, // Should be HH:MM:SS
        endTime: bookingData.endTime // Should be HH:MM:SS
      };
      
      console.log('Final API request:', JSON.stringify(requestData));
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Booking/create`, 
        requestData
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getBookingById: async (bookingId) => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/api/Booking/get?id=${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // More API methods as needed
};

export default bookingAPI; 