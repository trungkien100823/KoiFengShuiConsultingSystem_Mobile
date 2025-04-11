import axios from 'axios';
import { API_CONFIG } from './config';

// Define consultant images that we can map to based on consultant IDs or names
const consultantImages = {
  default: require('../assets/images/consultant1.jpg'),
  tanaka: require('../assets/images/consultant2.jpg'),
  wong: require('../assets/images/consultant3.jpg'),
  // Add more images as needed
};

// Sample consultant data for fallback - export this first before the API functions
export const consultants = [
  {
    id: '1',
    name: 'Nguyen Trong Manh',
    title: 'Master',
    rating: 4.0,
    image: require('../assets/images/consultant1.jpg'),
    specialty: 'Thầy truyền thừa phong thủy',
    experience: '5+ Năm',
    completedProjects: '200+ Hồ sơ',
    bio: 'Thầy có kinh nghiệm hơn 5 năm trong lĩnh vực phong thủy, chuyên tư vấn về thiết kế nhà ở, văn phòng và mộ phần.',
    specialties: [
      'Tư vấn Phong thủy nhà ở',
      'Tư vấn Phong thủy nhà hàng, doanh nghiệp',
      'Tư vấn Phong thủy mua bán bất động sản',
      'Tư vấn Phong thủy quy hoạch khu đô thị'
    ]
  },
  {
    id: '2',
    name: 'Tran Thi Huong',
    title: 'Master',
    rating: 4.8,
    image: require('../assets/images/consultant2.jpg'),
    specialty: 'Thầy truyền thừa phong thủy',
    experience: '8+ Năm',
    completedProjects: '300+ Hồ sơ',
    bio: 'Thầy có kinh nghiệm hơn 8 năm trong lĩnh vực phong thủy, chuyên tư vấn về thiết kế nhà ở, văn phòng và mộ phần.',
    specialties: [
      'Tư vấn Phong thủy nhà ở',
      'Tư vấn Phong thủy nhà hàng, doanh nghiệp',
      'Tư vấn Phong thủy mua bán bất động sản'
    ]
  },
  {
    id: '3',
    name: 'Le Van Hung',
    title: 'Expert',
    rating: 4.5,
    image: require('../assets/images/consultant3.jpg'),
    specialty: 'Thầy truyền thừa phong thủy',
    experience: '6+ Năm',
    completedProjects: '150+ Hồ sơ',
    bio: 'Thầy có kinh nghiệm hơn 6 năm trong lĩnh vực phong thủy, chuyên tư vấn về thiết kế nhà ở và văn phòng.',
    specialties: [
      'Tư vấn Phong thủy nhà ở',
      'Tư vấn Phong thủy văn phòng',
      'Tư vấn Phong thủy kinh doanh'
    ]
  },
  {
    id: '4',
    name: 'Pham Thi Mai',
    title: 'Master',
    rating: 4.9,
    image: require('../assets/images/consultant4.jpg'),
    specialty: 'Thầy truyền thừa phong thủy',
    experience: '10+ Năm',
    completedProjects: '500+ Hồ sơ',
    bio: 'Thầy có kinh nghiệm hơn 10 năm trong lĩnh vực phong thủy, chuyên tư vấn về tất cả các lĩnh vực phong thủy.',
    specialties: [
      'Tư vấn Phong thủy nhà ở cao cấp',
      'Tư vấn Phong thủy doanh nghiệp lớn',
      'Tư vấn Phong thủy khu đô thị',
      'Tư vấn Phong thủy tổng thể'
    ]
  }
];

// API functions for consultant data
export const consultingAPI = {
  // Get all consultants
  getAllConsultants: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/api/Master/get-all`);
      
      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data.map(consultant => ({
          id: consultant.masterId,
          name: consultant.masterName,
          title: consultant.title || 'Master',
          rating: consultant.rating || 4.0,
          imageUrl: consultant.imageUrl,
          specialty: consultant.expertise || 'Chưa cập nhật'
        }));
      } else {
        console.error('Unexpected API response format:', response.data);
        throw new Error('API response format was incorrect');
      }
    } catch (error) {
      console.error('Error fetching consultants:', error);
      return [...consultants];
    }
  },
  
  // Get consultant by ID - returns directly the fallback on error
  getConsultantById: async (id) => {
    try {
      console.log(`Đang lấy thông tin master với ID: ${id}`);
      const response = await axios.get(`${API_CONFIG.baseURL}/api/Master/${id}`);
      
      if (response.data && response.data.isSuccess && response.data.data) {
        const masterData = response.data.data;
        
        return {
          id: masterData.masterId,
          name: masterData.masterName,
          rating: masterData.rating || 0,
          title: masterData.title || 'Master',
          expertise: masterData.expertise || 'Chưa cập nhật',
          experience: masterData.experience || 'Chưa cập nhật',
          biography: masterData.biography || 'Chưa cập nhật',
          imageUrl: masterData.imageUrl
        };
      }
      throw new Error('Không tìm thấy thông tin master');
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin master ${id}:`, error);
      throw error;
    }
  },
  
  // Book appointment with consultant
  bookAppointment: async (consultantId, appointmentData) => {
    try {
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/Appointment/create`, 
        {
          consultantId,
          ...appointmentData
        }
      );
      
      if (response.data && response.data.isSuccess) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }
};

// Sample consulting packages using the same koi image
export const consultingPackages = [
  {
    id: '1',
    title: 'Gói tư vấn CƠ BẢN',
    label: 'Phong thủy nhà ở',
    description: 'Tư vấn các vấn đề cơ bản về phong thủy cho nhà ở',
    price: 1500000,
    duration: '60 phút',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Gói tư vấn NÂNG CAO',
    label: 'Phong thủy đặc biệt',
    description: 'Tư vấn chuyên sâu cho phong thủy nhà ở và văn phòng',
    price: 2500000,
    duration: '90 phút',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '3',
    title: 'Gói tư vấn CHUYÊN SÂU',
    label: 'Phong thủy cao cấp',
    description: 'Phân tích chi tiết và tư vấn chuyên sâu về phong thủy',
    price: 3500000,
    duration: '120 phút',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '4',
    title: 'Gói tư vấn DOANH NGHIỆP',
    label: 'Phong thủy doanh nghiệp',
    description: 'Tư vấn phong thủy cho văn phòng, công ty và doanh nghiệp',
    price: 5000000,
    duration: '180 phút',
    image: require('../assets/images/koi_image.jpg'),
  }
];

// Expertises or categories
export const consultingCategories = [
  'Master',
  'Senior Expert',
  'Expert',
  'Junior Expert'
];

// Sample appointment times
export const availableTimeSlots = [
  {
    date: '15/3/2025',
    slots: ['09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00', '16:00 - 17:00']
  },
  {
    date: '16/3/2025',
    slots: ['09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00']
  },
  {
    date: '17/3/2025',
    slots: ['10:00 - 11:00', '15:00 - 16:00', '16:00 - 17:00']
  }
];

// Payment methods
export const paymentMethods = [
  {
    id: 'VietQR',
    image: require('../assets/images/VietQR.png'),
  },
  {
    id: 'PayOS',
    image: require('../assets/images/PayOS.svg'),
  }
];
