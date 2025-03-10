import axios from 'axios';
import { API_CONFIG } from './config';

// Pond images mapping
export const pondImages = {
  'natural_pond.jpg': require('../assets/images/natural_pond.jpg'),
  'formal_pond.jpg': require('../assets/images/formal_pond.jpg'),
  'zen_pond.jpg': require('../assets/images/zen_pond.jpg'),
  'waterfall_pond.jpg': require('../assets/images/waterfall_pond.jpg'),
  'raised_pond.jpg': require('../assets/images/raised_pond.jpg'),
  'default_pond.jpg': require('../assets/images/natural_pond.jpg'),
};

export const pondData = [
  {
    id: 1,
    name: 'Hồ Tự Nhiên',
    shape: 'Hữu cơ',
    description: 'Hồ Koi tự nhiên với đường viền không đều và cảnh quan tự nhiên. Tích hợp hoàn hảo với khu vườn, tạo cảm giác yên bình và hài hòa với thiên nhiên.',
    features: [
      'Đường viền tự nhiên',
      'Thác nước',
      'Cây thủy sinh',
      'Đá trang trí'
    ],
    imageName: 'natural_pond.jpg',
    likes: 32,
    liked: false,
    size: 'Lớn',
    depth: '1.5-2m',
    idealFishCount: '10-15',
  },
  {
    id: 2,
    name: 'Hồ Hình Thức',
    shape: 'Hình học',
    description: 'Thiết kế hồ Koi hiện đại với các đường nét hình học rõ ràng. Phù hợp với kiến trúc đương đại và tạo điểm nhấn cho không gian sân vườn.',
    features: [
      'Đường viền hình học',
      'Đèn LED',
      'Ghế ngồi tích hợp',
      'Lọc nước hiện đại'
    ],
    imageName: 'formal_pond.jpg',
    likes: 28,
    liked: false,
    size: 'Trung bình',
    depth: '1.2-1.8m',
    idealFishCount: '8-12',
  },
  {
    id: 3,
    name: 'Hồ Thiền',
    shape: 'Tối giản',
    description: 'Hồ Koi phong cách Thiền với thiết kế tối giản, tạo không gian yên tĩnh và thanh bình. Kết hợp hoàn hảo giữa nước, đá và cây cảnh.',
    features: [
      'Thiết kế tối giản',
      'Cầu gỗ',
      'Đèn đá',
      'Cây bonsai'
    ],
    imageName: 'zen_pond.jpg',
    likes: 45,
    liked: false,
    size: 'Nhỏ-Trung bình',
    depth: '1.2-1.5m',
    idealFishCount: '5-8',
  },
  {
    id: 4,
    name: 'Hồ Thác Nước',
    shape: 'Đa tầng',
    description: 'Hồ Koi với thác nước đa tầng, tạo âm thanh dễ chịu và cảnh quan động. Lý tưởng cho không gian sân vườn rộng và tạo điểm nhấn ấn tượng.',
    features: [
      'Thác nước đa tầng',
      'Đá tự nhiên',
      'Hệ thống lọc tích hợp',
      'Ánh sáng dưới nước'
    ],
    imageName: 'waterfall_pond.jpg',
    likes: 38,
    liked: false,
    size: 'Lớn',
    depth: '1.5-2.2m',
    idealFishCount: '12-18',
  },
  {
    id: 5,
    name: 'Hồ Nâng Cao',
    shape: 'Nâng cao',
    description: 'Hồ Koi được nâng cao so với mặt đất, cho phép quan sát cá dễ dàng hơn. Thiết kế hiện đại với tường đá và ghế ngồi tích hợp.',
    features: [
      'Tường đá nâng cao',
      'Cửa sổ quan sát',
      'Ghế tích hợp',
      'Hệ thống lọc tiên tiến'
    ],
    imageName: 'raised_pond.jpg',
    likes: 35,
    liked: false,
    size: 'Trung bình-Lớn',
    depth: '1.3-1.8m',
    idealFishCount: '8-15',
  },
];

// Helper functions defined outside of pondAPI
const getPondFeatures = (shape, direction) => {
  const baseFeatures = [
    'Professional filtration system',
    'UV sterilizer',
    'Bottom drain',
    'Skimmer system'
  ];

  const shapeFeatures = {
    'Natural': ['Natural rock edges', 'Plant zones'],
    'Formal': ['Clean geometric lines', 'Raised edges'],
    'Zen': ['Minimalist design', 'Stone arrangements'],
    'Modern': ['Contemporary styling', 'LED lighting']
  };

  const directionFeatures = {
    'North': ['South-facing viewing area', 'Protected from cold winds'],
    'South': ['Partial shade elements', 'Cool water features'],
    'East': ['Morning sun exposure', 'Afternoon shade'],
    'West': ['Evening sun features', 'Heat management system']
  };

  return [
    ...(shapeFeatures[shape] || []),
    ...(directionFeatures[direction] || []),
    ...baseFeatures
  ];
};

const calculateIdealFishCount = (size) => {
  if (!size) return 'Not specified';
  // Rough estimate: 1 koi per 50 m²
  const count = Math.floor(size / 50);
  return `${count}-${count + 5} koi`;
};

export const pondAPI = {
  getAllPonds: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/api/KoiPond/get-all`);
      console.log('All ponds response:', response.data);
      
      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          id: item.koiPondId,
          name: item.pondName || 'Unknown Pond',
          shape: item.shapeName || 'Unknown Shape',
          description: item.description || 'A beautiful Koi pond.',
          features: getPondFeatures(item.shapeName, item.direction),
          size: item.size ? `${item.size} m²` : 'Size not specified',
          direction: item.direction || 'Not specified'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching ponds:', error);
      return [];
    }
  },

  getUserPonds: async () => {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.userPonds}`);
      
      if (response.data && response.data.isSuccess && Array.isArray(response.data.data)) {
        return response.data.data.map(item => ({
          id: item.id,
          name: item.name,
          shape: item.shape || 'Unknown',
          description: item.description,
          features: item.features || [],
          imageName: getPondImageName(item.shape || item.name),
          likes: 0,
          liked: true,
          size: item.size || 'Medium',
          depth: item.depth || '1.5m',
          idealFishCount: item.idealFishCount || '5-10'
        }));
      }
      return pondData.filter(pond => pond.liked);
    } catch (error) {
      console.error('Error fetching user ponds:', error);
      return pondData.filter(pond => pond.liked);
    }
  },

  // Get details for a specific pond
  getPondDetails: async (pondId) => {
    try {
      console.log('Fetching Pond details for ID:', pondId);
      const response = await axios.get(`${API_CONFIG.baseURL}/api/KoiPond/get`, {
        params: { id: pondId }
      });
      console.log('Pond details response:', response.data);
      
      if (response.data && response.data.isSuccess && response.data.data) {
        const item = response.data.data;
        return {
          id: item.koiPondId,
          name: item.pondName || 'Unknown Pond',
          shape: item.shapeName || 'Unknown Shape',
          description: item.description || 'A beautiful Koi pond.',
          features: getPondFeatures(item.shapeName, item.direction) || [],
          size: item.size ? `${item.size} m²` : 'Size not specified',
          depth: item.depth || '1.5-2m',
          idealFishCount: calculateIdealFishCount(item.size),
          direction: item.direction || 'Not specified',
          likes: Math.floor(Math.random() * 50),
          liked: false,
          price: item.price || `${Math.floor(Math.random() * 5000 + 1000)}$`,
          materials: item.materials || ['Natural stone', 'Concrete', 'Filtration system'],
          maintenance: item.maintenance || 'Regular cleaning and water quality monitoring required'
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching Pond details:', error);
      throw error;
    }
  },

  // Helper functions
  getPondFeatures: (shape, direction) => {
    const baseFeatures = [
      'Professional filtration system',
      'UV sterilizer',
      'Bottom drain',
      'Skimmer system'
    ];

    const shapeFeatures = {
      'Natural': ['Natural rock edges', 'Plant zones'],
      'Formal': ['Clean geometric lines', 'Raised edges'],
      'Zen': ['Minimalist design', 'Stone arrangements'],
      'Modern': ['Contemporary styling', 'LED lighting']
    };

    const directionFeatures = {
      'North': ['South-facing viewing area', 'Protected from cold winds'],
      'South': ['Partial shade elements', 'Cool water features'],
      'East': ['Morning sun exposure', 'Afternoon shade'],
      'West': ['Evening sun features', 'Heat management system']
    };

    return [
      ...(shapeFeatures[shape] || []),
      ...(directionFeatures[direction] || []),
      ...baseFeatures
    ];
  },

  calculateIdealFishCount: (size) => {
    if (!size) return 'Not specified';
    // Rough estimate: 1 koi per 50 m²
    const count = Math.floor(size / 50);
    return `${count}-${count + 5} koi`;
  }
};

// Helper functions to map API data to display format
function getPondTypeFromShape(shapeName) {
  const shapeMapping = {
    'Oval': 'zen',
    'Rectangle': 'formal',
    'Irregular': 'natural',
    'Circular': 'raised'
  };
  return shapeMapping[shapeName] || 'natural';
}

function getPondImageName(pondType) {
  const imageMapping = {
    'zen': 'zen_pond.jpg',
    'formal': 'formal_pond.jpg',
    'natural': 'natural_pond.jpg',
    'raised': 'raised_pond.jpg'
  };
  return imageMapping[pondType] || 'natural_pond.jpg';
}

function getPondDescription(name, shape) {
  if (name.includes('Zen')) {
    return 'Hồ Koi phong cách Thiền với thiết kế tối giản, tạo không gian yên tĩnh và thanh bình. Kết hợp hoàn hảo giữa nước, đá và cây cảnh.';
  } else if (name.includes('Modern')) {
    return 'Thiết kế hồ Koi hiện đại với các đường nét hình học rõ ràng. Phù hợp với kiến trúc đương đại và tạo điểm nhấn cho không gian sân vườn.';
  }
  return 'Hồ Koi tự nhiên với thiết kế hài hòa, tạo không gian thư giãn hoàn hảo cho khu vườn của bạn.';
}

function translateDirection(direction) {
  const directions = {
    'North': 'Bắc',
    'South': 'Nam',
    'East': 'Đông',
    'West': 'Tây'
  };
  return directions[direction] || direction;
}
