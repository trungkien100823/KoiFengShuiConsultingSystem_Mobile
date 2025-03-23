import axios from 'axios';
import { API_CONFIG } from './config';
import { Alert } from 'react-native';
import { getAuthHeaders } from '../services/authService';


export const pondAPI = {
  getAllPonds: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPonds}`, 
        { headers }
      );
      
      console.log('Response từ API get-all-ponds:', response.data);

      if (response.data && response.data.isSuccess) {
        if (Array.isArray(response.data.data)) {
          // Map dữ liệu giống như cấu trúc từ getPondByShape
          const mappedData = response.data.data.map(pond => ({
            koiPondId: pond.koiPondId,
            pondName: pond.pondName,
            imageUrl: pond.imageUrl,
            // Lấy element từ shape object nếu có, nếu không thì lấy trực tiếp
            element: pond.shape?.element || pond.element,
            shape: pond.shape,
            direction: pond.direction,
            shapeName: pond.shapeName
          }));

          console.log('Dữ liệu sau khi map:', mappedData);
          return mappedData;
        }
      }

      console.warn('Invalid response format or empty data');
      return [];

    } catch (error) {
      console.error('Chi tiết lỗi getAllPonds:', {
        error: error.message,
        response: error.response?.data
      });
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách hồ cá. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
      return [];
    }
  },

  getPondDetails: async (pondId) => {
    try {
      console.log('Fetching Pond details for ID:', pondId);
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.detailPond.replace('{id}', pondId)}`,
        await getAuthHeaders()
      );
      
      console.log('Pond details response:', response.data);
      
      if (response.data && response.data.isSuccess && response.data.data) {
        return response.data.data;
      }
      throw new Error('Không lấy được chi tiết hồ');
    } catch (error) {
      console.error('Error fetching Pond details:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tải chi tiết hồ cá. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
      return null;
    }
  },

  getAllPondShapes: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`,
        { headers }
      );
      console.log('Shapes response:', response.data);

      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching pond shapes:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách hình dạng hồ. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
      return [];
    }
  },

  getElementByShapeId: (shapes, shapeId) => {
    const shape = shapes.find(s => s.shapeId === shapeId);
    return shape ? shape.element : null;
  },

  getPondByShape: async (shapeId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_CONFIG.baseURL}/api/KoiPond/get-by-shape/${shapeId}`,
        { headers }
      );

      console.log('Response từ API get-by-shape:', response.data);

      if (response.data && response.data.isSuccess) {
        // Map dữ liệu và đảm bảo có element
        const ponds = response.data.data.map(pond => ({
          ...pond,
          element: pond.shape?.element || pond.element || 'Chưa xác định'
        }));
        return ponds;
      }
      return [];
    } catch (error) {
      console.error('Chi tiết lỗi khi lấy hồ theo hình dạng:', error.response?.data);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách hồ. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
      return [];
    }
  }
};
