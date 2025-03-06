export const pondImages = {
  'natural_pond.jpg': require('../assets/images/natural_pond.jpg'),
  'formal_pond.jpg': require('../assets/images/formal_pond.jpg'),
  'zen_pond.jpg': require('../assets/images/zen_pond.jpg'),
  'waterfall_pond.jpg': require('../assets/images/waterfall_pond.jpg'),
  'raised_pond.jpg': require('../assets/images/raised_pond.jpg'),
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
