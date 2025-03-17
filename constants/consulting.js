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
      
      // Check if the response has the expected structure
      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        // Map the data array to match our application's format
        return response.data.data.map(consultant => {
          // Map consultant names to specific images
          let consultantImage;
          if (consultant.masterName.includes('Tanaka')) {
            consultantImage = require('../assets/images/consultant2.jpg');
          } else if (consultant.masterName.includes('Wong')) {
            consultantImage = require('../assets/images/consultant3.jpg');
          } else {
            consultantImage = require('../assets/images/consultant1.jpg');
          }
          
          return {
            id: consultant.masterId,
            name: consultant.masterName,
            title: 'Master',
            rating: consultant.rating || 4.0,
            image: consultantImage
          };
        });
      } else {
        console.error('Unexpected API response format:', response.data);
        throw new Error('API response format was incorrect');
      }
    } catch (error) {
      console.error('Error fetching consultants:', error);
      // Return fallback consultants on error
      return [...consultants];
    }
  },
  
  // Get consultant by ID - returns directly the fallback on error
  getConsultantById: async (id) => {
    try {
      console.log(`Attempting to fetch consultant with ID: ${id}`);
      const response = await axios.get(`${API_CONFIG.baseURL}/api/Master/${id}`);
      
      if (response.data && response.data.isSuccess && response.data.data) {
        const consultantData = response.data.data;
        
        // Map consultant names to specific images
        let consultantImage;
        if (consultantData.masterName?.includes('Tanaka')) {
          consultantImage = require('../assets/images/consultant2.jpg');
        } else if (consultantData.masterName?.includes('Wong')) {
          consultantImage = require('../assets/images/consultant3.jpg');
        } else {
          consultantImage = require('../assets/images/consultant1.jpg');
        }
        
        return {
          id: consultantData.masterId,
          name: consultantData.masterName,
          title: 'Master',
          rating: consultantData.rating || 4.0,
          image: consultantImage,
          specialty: 'Thầy truyền thừa phong thủy',
          experience: '5+ Năm',
          completedProjects: '200+ Hồ sơ',
          bio: consultantData.description || 'Thầy có kinh nghiệm hơn 5 năm trong lĩnh vực phong thủy, chuyên tư vấn về thiết kế nhà ở, văn phòng và mộ phần.',
          specialties: [
            'Tư vấn Phong thủy nhà ở',
            'Tư vấn Phong thủy nhà hàng, doanh nghiệp',
            'Tư vấn Phong thủy mua bán bất động sản',
            'Tư vấn Phong thủy quy hoạch khu đô thị'
          ]
        };
      } else {
        throw new Error('API response format was incorrect');
      }
    } catch (error) {
      console.error(`Error fetching consultant ${id}:`, error);
      // Find matching consultant or use first one
      const fallbackData = consultants.find(c => c.id === id) || consultants[0];
      console.log("Using fallback consultant:", fallbackData.name);
      return fallbackData;
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

// Consulting packages
export const consultingPackages = [
  {
    id: '1',
    title: 'CƠ BẢN',
    label: 'Gói tư vấn',
    price: '1.000.000',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'NÂNG CAO',
    label: 'Gói tư vấn',
    price: '2.000.000',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '3',
    title: 'CHUYÊN SÂU',
    label: 'Gói tư vấn',
    price: '3.000.000',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '4',
    title: 'DOANH NGHIỆP',
    label: 'Gói tư vấn',
    price: '5.000.000',
    image: require('../assets/images/koi_image.jpg'),
  },
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
