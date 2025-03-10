import axios from 'axios';
import { API_CONFIG } from './config';

// Koi fish images mapping
export const koiImages = {
  'asagi.jpg': require('../assets/images/asagi.jpg'),
  'kohaku.jpg': require('../assets/images/kohaku.jpg'),
  'sanke.jpg': require('../assets/images/sanke.jpg'),
  'showa.jpg': require('../assets/images/showa.jpg'),
  'default_koi.jpg': require('../assets/images/asagi.jpg'),
  // ... add all your koi images here
};

export const koiData = [
  {
    id: 1,
    name: 'Asagi',
    variant: 'Jin',
    description: 'Cá Koi Asagi là một trong những giống cá Koi cổ xưa và mang tính biểu tượng nhất, được đánh giá cao về màu sắc hài hòa và thanh lịch.',
    imageName: 'asagi.jpg',
    likes: 21,
    liked: false,
    size: 2,
  },
  {
    id: 2,
    name: 'Kohaku',
    variant: 'Tancho',
    description: 'Kohaku được coi là vua của các loài Koi, với thân hình trắng và các hoa văn đỏ. Biến thể Tancho có một đốm đỏ duy nhất trên đầu.',
    imageName: 'kohaku.jpg',
    likes: 18,
    liked: false,
    size: 2,
  },
  {
    id: 3,
    name: 'Showa',
    variant: 'Sanshoku',
    description: 'Showa Sanshoku là cá Koi ba màu với nền đen, điểm xuyết các hoa văn đỏ và trắng, tạo nên vẻ ngoài đậm nét và ấn tượng.',
    imageName: 'showa.jpg',
    likes: 15,
    liked: false,
    size: 2,
  },
  {
    id: 4,
    name: 'Shiro Utsuri',
    variant: 'Platinum',
    description: 'Shiro Utsuri là cá Koi hai màu với nền trắng và các đốm đen. Nổi tiếng với sự tương phản ấn tượng và kiểu bơi thanh lịch.',
    imageName: 'shiro.jpg',
    likes: 25,
    liked: false,
    size: 2,
  },
  {
    id: 5,
    name: 'Kujaku',
    variant: 'Metallic',
    description: 'Kujaku là giống Koi ánh kim với nền trắng cùng các hoa văn cam, đỏ và đen chảy dọc thân, giống như bộ lông của chim công.',
    imageName: 'kujaku.jpg',
    likes: 19,
    liked: false,
    size: 2,
  },
];

export const koiAPI = {
  getAllKoi: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allKoi}`);
      
      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          id: item.id || String(Math.random()),
          name: item.varietyName || 'Unknown',
          variant: item.varietyName || 'Unknown',
          description: item.description || 'No description available',
          imageName: `${(item.varietyName || 'unknown').toLowerCase()}.jpg`,
          likes: 0,
          liked: false,
          size: item.size || '2',
          colors: item.colors || []
        }));
      }
      return koiData;
    } catch (error) {
      console.error('Error fetching Koi varieties:', error);
      return koiData;
    }
  },

  getKoiDetails: async (koiId) => {
    try {
      console.log('Fetching Koi details for ID:', koiId);
      const response = await axios.get(`${API_CONFIG.baseURL}/api/KoiVariety/DetailKoi/${koiId}`);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.isSuccess && response.data.data) {
        const item = response.data.data;
        return {
          id: item.id,
          name: item.name || 'Unknown Koi',
          variant: item.varietyName || 'Unknown Variety',
          description: item.description || 'A beautiful and unique Koi fish.',
          characteristics: item.characteristics || 'Distinctive patterns and coloring.',
          habitat: item.habitat || 'Freshwater ponds with proper filtration.',
          diet: item.diet || 'High-quality Koi food, vegetables, and insects.',
          lifespan: item.lifespan || '25-35 years',
          size: item.size || `${Math.floor(Math.random() * 30 + 20)} cm`,
          price: item.price || `${Math.floor(Math.random() * 500 + 100)}$`,
          likes: Math.floor(Math.random() * 50),
          liked: false,
          colors: item.colors || ['Red', 'White', 'Black']
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching Koi details:', error);
      throw error;
    }
  },

  getUserKoi: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.userKoi}`);
      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          id: item.id || String(Math.random()),
          name: item.varietyName || 'Unknown',
          variant: item.varietyName || 'Unknown',
          description: item.description || 'No description available',
          imageName: `${(item.varietyName || 'unknown').toLowerCase()}.jpg`,
          likes: 0,
          liked: false,
          size: item.size || '2',
          colors: item.colors || []
        }));
      }
      return koiData.filter(koi => koi.variant === 'Jin');
    } catch (error) {
      console.error('Error fetching user Koi:', error);
      return koiData.filter(koi => koi.variant === 'Jin');
    }
  }
};