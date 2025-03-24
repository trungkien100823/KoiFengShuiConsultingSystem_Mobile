// Dữ liệu mẫu cho các khóa học, danh mục, bài học, bài kiểm tra, v.v.

// Dữ liệu khóa học nổi bật
export const featuredCourses = [
  {
    id: '1',
    title: 'Làm Chủ Nghệ Thuật Nuôi Cá Koi: Hướng Dẫn Toàn Diện về Nishikigoi',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Nguyên Lý Phong Thủy Truyền Thống Trong Không Gian Hiện Đại',
    image: require('../assets/images/koi_image.jpg'),
  },
];

// Dữ liệu danh mục
export const categories = [
  {
    id: '1',
    title: 'Các Loại Cá Koi',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Thiết Kế Hồ Koi',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '3',
    title: 'Nhân Giống Cá Koi',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '4',
    title: 'Bệnh Cá Koi',
    image: require('../assets/images/koi_image.jpg'),
  },
];

// Dữ liệu khóa học hàng đầu
export const topCourses = [
  {
    id: '1',
    title: 'Làm Chủ Nghệ Thuật Nuôi Cá Koi: Hướng Dẫn Toàn Diện về Nishikigoi',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '2',
    title: 'Thiết Kế Vườn Nhật Bản Với Hồ Cá Koi',
    image: require('../assets/images/koi_image.jpg'),
  },
  {
    id: '3',
    title: 'Kỹ Thuật Nhân Giống Cá Koi Nâng Cao',
    image: require('../assets/images/koi_image.jpg'),
  },
];

// Khóa học theo danh mục
export const categoryCourses = {
  '1': [
    {
      id: '1',
      title: 'Kohaku, Sanke và Showa: Ba Giống Cá Koi Danh Giá',
      image: require('../assets/images/koi_image.jpg'),
      price: '799.000',
      rating: 4.9,
    },
    {
      id: '2',
      title: 'Các Giống Cá Koi Hiện Đại và Lai Tạo',
      image: require('../assets/images/koi_image.jpg'),
      price: '699.000',
      rating: 4.7,
    },
  ],
  '2': [
    {
      id: '3',
      title: 'Xây Dựng Hồ Cá Koi Hoàn Hảo',
      image: require('../assets/images/koi_image.jpg'),
      price: '899.000',
      rating: 4.8,
    },
    {
      id: '4',
      title: 'Hệ Thống Lọc Nước Cao Cấp Cho Hồ Cá Koi',
      image: require('../assets/images/koi_image.jpg'),
      price: '799.000',
      rating: 4.7,
    },
  ],
  '3': [
    {
      id: '5',
      title: 'Nhân Giống Cá Koi Cho Người Mới Bắt Đầu',
      image: require('../assets/images/koi_image.jpg'),
      price: '699.000',
      rating: 4.6,
    },
  ],
  '4': [
    {
      id: '6',
      title: 'Chẩn Đoán và Điều Trị Các Bệnh Phổ Biến Ở Cá Koi',
      image: require('../assets/images/koi_image.jpg'),
      price: '599.000',
      rating: 4.8,
    },
  ],
};

// Tiêu đề các phần
export const sectionTitles = {
  section1: "Phân Loại & Giống Cá Koi",
  section2: "Xây Dựng & Bảo Dưỡng Hồ Cá",
  section3: "Sức Khỏe & Dinh Dưỡng Cá Koi",
  final: "Kỳ Thi Chứng Chỉ Cuối Khóa",
};

// Tiêu đề bài học
export const lessonTitles = {
  // Section 1: Phân Loại & Giống Cá Koi
  'section1-lesson1': "Lịch Sử Cá Koi và Văn Hóa Nishikigoi Nhật Bản",
  'section1-lesson2': "Ba Giống Cá Chính: Kohaku, Sanke và Showa",
  'section1-lesson3': "Các Giống Hiện Đại: Ogon, Goshiki và Shusui",
  
  // Section 2: Xây Dựng & Bảo Dưỡng Hồ Cá
  'section2-lesson1': "Thiết Kế Hồ Cá Koi: Kích Thước, Độ Sâu và Vị Trí",
  'section2-lesson2': "Hệ Thống Lọc và Quản Lý Chất Lượng Nước",
  'section2-lesson3': "Bảo Dưỡng Theo Mùa và Các Vấn Đề Thời Tiết",
  
  // Section 3: Sức Khỏe & Dinh Dưỡng Cá Koi
  'section3-lesson1': "Dinh Dưỡng Tối Ưu và Phương Pháp Cho Ăn",
  'section3-lesson2': "Phòng Ngừa Bệnh và Quy Trình Cách Ly",
  'section3-lesson3': "Theo Dõi Sự Phát Triển và Đánh Giá Sức Khỏe",
};

// Tiêu đề bài kiểm tra
export const quizTitles = {
  'section1-quiz': "Kiểm Tra Về Các Giống Cá Koi",
  'section2-quiz': "Đánh Giá Quản Lý Hồ Cá",
  'section3-quiz': "Bài Kiểm Tra Sức Khỏe & Dinh Dưỡng",
  'final-exam': "Kỳ Thi Chứng Chỉ Chuyên Gia Cá Koi",
};

// Thứ tự bài học (để điều hướng)
export const lessonOrder = [
  'section1-lesson1',
  'section1-lesson2',
  'section1-lesson3',
  'section1-quiz',
  'section2-lesson1',
  'section2-lesson2',
  'section2-lesson3',
  'section2-quiz',
  'section3-lesson1',
  'section3-lesson2',
  'section3-lesson3',
  'section3-quiz',
  'final-exam'
];

// Course details for the course details page
export const courseDetails = {
  id: '1',
  title: 'Làm Chủ Nghệ Thuật Nuôi Cá Koi: Hướng Dẫn Toàn Diện về Nishikigoi',
  image: require('../assets/images/koi_image.jpg'),
  price: '2.400.000',
  originalPrice: '4.800.000',
  rating: 4.9,
  students: 3852,
  duration: '12 giờ',
  level: 'Từ cơ bản đến nâng cao',
  lastUpdated: 'Cập nhật tháng 8/2023',
  description: 'Khóa học toàn diện về nuôi và chăm sóc cá Koi, từ lịch sử đến kỹ thuật hiện đại. Phù hợp cho người mới bắt đầu và những người yêu thích cá Koi muốn nâng cao kiến thức.',
  longDescription: 'Khóa học này sẽ đưa bạn đi từ những kiến thức cơ bản nhất về cá Koi (Nishikigoi) đến những kỹ thuật chăm sóc chuyên sâu của những chuyên gia hàng đầu. Bạn sẽ được tìm hiểu về lịch sử và ý nghĩa văn hóa của cá Koi trong văn hóa Nhật Bản, các giống cá Koi danh giá nhất và đặc điểm phân biệt của chúng. Khóa học cũng đi sâu vào các phương pháp xây dựng và duy trì hồ cá Koi hoàn hảo, hệ thống lọc nước tiên tiến, và các chiến lược dinh dưỡng tối ưu để nuôi dưỡng những chú cá khỏe mạnh và đẹp mắt. Đặc biệt, bạn sẽ được hướng dẫn cách nhận diện, phòng ngừa và điều trị các bệnh thường gặp ở cá Koi. Dù bạn là người mới bắt đầu hay đã có kinh nghiệm, khóa học này sẽ cung cấp cho bạn những kiến thức không thể thiếu để trở thành một người nuôi cá Koi thành công.',
  topics: [
    'Lịch sử và văn hóa cá Koi Nhật Bản',
    'Phân biệt và đánh giá các giống cá Koi phổ biến',
    'Kỹ thuật thiết kế và xây dựng hồ cá Koi chuyên nghiệp',
    'Hệ thống lọc và duy trì chất lượng nước tối ưu',
    'Chế độ dinh dưỡng theo từng giai đoạn phát triển của cá',
    'Phòng ngừa và điều trị các bệnh thường gặp',
    'Kỹ thuật nhân giống và chọn lọc cá Koi chất lượng cao',
    'Chuẩn bị cá Koi cho các cuộc thi và triển lãm'
  ],
  requirements: [
    'Không cần kiến thức trước về cá Koi',
    'Máy tính hoặc điện thoại thông minh có kết nối internet',
    'Sổ ghi chép hoặc ứng dụng ghi chú'
  ],
  instructor: {
    name: 'Trần Minh Quân',
    title: 'Chuyên gia cá Koi với 15 năm kinh nghiệm',
    image: require('../assets/images/consultant1.jpg'),
    bio: 'Thạc sĩ Thủy sản, có hơn 15 năm kinh nghiệm trong việc nuôi và nhân giống cá Koi. Đã tham gia đánh giá tại nhiều cuộc thi cá Koi quốc tế và là tác giả của nhiều bài báo khoa học về sức khỏe và di truyền cá Koi.',
  },
  includes: [
    '12 giờ video học tập',
    'Tài liệu PDF tham khảo',
    'Diễn đàn hỏi đáp với giảng viên',
    'Bài kiểm tra sau mỗi chương',
    'Chứng chỉ hoàn thành',
    'Truy cập vĩnh viễn'
  ],
  learning: [
    'Hiểu về lịch sử và văn hóa cá Koi trong truyền thống Nhật Bản',
    'Phân biệt và đánh giá các giống cá Koi khác nhau',
    'Thiết kế và xây dựng hồ cá Koi tối ưu',
    'Lựa chọn và cài đặt hệ thống lọc phù hợp',
    'Quản lý chất lượng nước theo từng mùa',
    'Nhận biết dấu hiệu bệnh lý và biện pháp điều trị'
  ],
  reviews: 3852
};

// Chi tiết bài kiểm tra/quiz
export const quizDetails = {
  'section1-quiz': {
    title: "Kiểm Tra Về Các Giống Cá Koi",
    description: "Đánh giá kiến thức của bạn về các loại cá Koi khác nhau và đặc điểm nhận dạng của chúng",
    timeLimit: "15 phút",
    questions: [
      {
        id: 1,
        question: "Đâu là đặc điểm chính của cá Kohaku?",
        options: [
          "Thân trắng với hoa văn đỏ",
          "Thân trắng với hoa văn đỏ và đen",
          "Thân đen với hoa văn đỏ",
          "Thân màu bạc metallic"
        ],
        correctAnswer: 0
      },
      {
        id: 2,
        question: "Ba giống cá Koi thuộc nhóm 'Gosanke' là gì?",
        options: [
          "Kohaku, Taisho Sanke, và Showa Sanshoku",
          "Kohaku, Shiro Utsuri, và Goshiki",
          "Ogon, Showa, và Asagi",
          "Tancho, Bekko, và Koromo"
        ],
        correctAnswer: 0
      },
      {
        id: 3,
        question: "Thuật ngữ 'Maruten' trong phân loại cá Koi đề cập đến gì?",
        options: [
          "Cá có màu đỏ phủ toàn thân",
          "Cá có hoa văn đỏ trên đầu dạng vương miện",
          "Cá có vảy kim loại",
          "Cá có hoa văn liên tục (Nidan)"
        ],
        correctAnswer: 1
      },
      {
        id: 4,
        question: "Điểm khác biệt chính của cá Showa so với Sanke là gì?",
        options: [
          "Showa có hoa văn đỏ",
          "Showa có hoa văn đen trên đầu",
          "Showa luôn lớn hơn",
          "Showa không bao giờ có màu vàng"
        ],
        correctAnswer: 1
      },
      {
        id: 5,
        question: "Quốc gia nào đã phát triển cá Koi thông qua chọn lọc giống?",
        options: [
          "Trung Quốc",
          "Nhật Bản",
          "Thái Lan",
          "Việt Nam"
        ],
        correctAnswer: 1
      }
    ]
  },
  'section2-quiz': {
    title: "Đánh Giá Quản Lý Hồ Cá",
    description: "Kiểm tra hiểu biết của bạn về xây dựng hồ, hệ thống lọc và bảo dưỡng",
    timeLimit: "15 phút",
    questions: [
      {
        id: 1,
        question: "Độ sâu tối thiểu khuyến nghị cho hồ cá Koi ở vùng có mùa đông lạnh là bao nhiêu?",
        options: [
          "1 foot (30 cm)",
          "2 feet (60 cm)",
          "3 feet (90 cm)",
          "4 feet (120 cm)"
        ],
        correctAnswer: 3
      },
      {
        id: 2,
        question: "Bộ phận lọc nào chủ yếu loại bỏ các hạt lơ lửng trong nước hồ?",
        options: [
          "Bộ lọc sinh học",
          "Đèn UV",
          "Bộ lọc cơ học",
          "Protein skimmer"
        ],
        correctAnswer: 2
      },
      {
        id: 3,
        question: "Dải pH lý tưởng cho hồ cá Koi là gì?",
        options: [
          "5.5 - 6.5",
          "6.5 - 7.5",
          "7.0 - 8.5",
          "8.5 - 9.5"
        ],
        correctAnswer: 2
      },
      {
        id: 4,
        question: "Bao lâu nên loại bỏ chất thải từ ống xả đáy của hồ cá Koi?",
        options: [
          "Hàng ngày",
          "Hàng tuần",
          "Hàng tháng",
          "Hàng năm"
        ],
        correctAnswer: 1
      },
      {
        id: 5,
        question: "Đâu KHÔNG phải là phương pháp phổ biến để cung cấp oxy cho hồ cá Koi?",
        options: [
          "Thác nước",
          "Máy bơm khí với đầu khuếch tán",
          "Hệ thống Venturi",
          "Bơm khí carbon dioxide"
        ],
        correctAnswer: 3
      }
    ]
  },
  'section3-quiz': {
    title: "Bài Kiểm Tra Sức Khỏe & Dinh Dưỡng",
    description: "Đánh giá kiến thức của bạn về sức khỏe cá Koi, phòng bệnh và nhu cầu dinh dưỡng",
    timeLimit: "15 phút",
    questions: [
      {
        id: 1,
        question: "Dấu hiệu nào cho thấy cá Koi khỏe mạnh?",
        options: [
          "Bơi gần mặt nước",
          "Chuyển động mang nhanh",
          "Ăn tích cực và mắt trong",
          "Nghỉ ở đáy hồ vào ban ngày"
        ],
        correctAnswer: 2
      },
      {
        id: 2,
        question: "Bao nhiêu phần trăm trọng lượng cơ thể cá Koi nên được cung cấp thức ăn hàng ngày vào mùa hè?",
        options: [
          "1-2%",
          "2-4%",
          "5-7%",
          "8-10%"
        ],
        correctAnswer: 1
      },
      {
        id: 3,
        question: "Đâu KHÔNG phải là bệnh phổ biến ở cá Koi?",
        options: [
          "Bệnh chấm trắng (Ich)",
          "Bệnh columnaris",
          "Virus herpes cá Koi (KHV)",
          "Bệnh nhung (Oodinium)"
        ],
        correctAnswer: 3
      },
      {
        id: 4,
        question: "Cá Koi mới nên được cách ly bao lâu trước khi thả vào hồ đã có sẵn cá?",
        options: [
          "3-5 ngày",
          "1-2 tuần",
          "3-4 tuần",
          "6-8 tuần"
        ],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "Nguồn protein chính trong hầu hết thức ăn cá Koi chất lượng cao là gì?",
        options: [
          "Bột ngô",
          "Bột cá",
          "Mầm lúa mì",
          "Bột đậu nành"
        ],
        correctAnswer: 1
      }
    ]
  },
  'final-exam': {
    title: "Kỳ Thi Chứng Chỉ Chuyên Gia Cá Koi",
    description: "Đánh giá toàn diện về tất cả khía cạnh của việc nuôi và chăm sóc cá Koi",
    timeLimit: "30 phút",
    questions: [
      {
        id: 1,
        question: "Yếu tố nào QUAN TRỌNG NHẤT khi đánh giá chất lượng cá Koi trong các cuộc thi?",
        options: [
          "Kích thước và tuổi",
          "Chất lượng hoa văn và màu sắc",
          "Hành vi bơi lội",
          "Hồ xuất xứ"
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "Thuật ngữ 'tosai' trong ngôn ngữ nhân giống cá Koi có nghĩa là gì?",
        options: [
          "Chọn cặp sinh sản",
          "Cá Koi năm đầu tiên",
          "Màu sắc không kim loại",
          "Đánh giá chất lượng triển lãm"
        ],
        correctAnswer: 1
      },
      {
        id: 3,
        question: "Thông số nước nào quan trọng nhất cần kiểm tra hàng ngày trong hồ cá Koi?",
        options: [
          "Mức amoniac",
          "Mức pH",
          "Mức phosphate",
          "Độ cứng (GH)"
        ],
        correctAnswer: 0
      },
      {
        id: 4,
        question: "Hàm lượng protein tối ưu cho thức ăn tăng trưởng dành cho cá Koi non là bao nhiêu?",
        options: [
          "15-20%",
          "25-30%",
          "35-45%",
          "50-60%"
        ],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "'Sashi' trong đánh giá chất lượng cá Koi đề cập đến điều gì?",
        options: [
          "Hình dáng cơ thể",
          "Tính đồng nhất của hoa văn",
          "Chất lượng của da trắng",
          "Cường độ màu đỏ"
        ],
        correctAnswer: 2
      },
      {
        id: 6,
        question: "Hệ thống nào chịu trách nhiệm phân hủy amoniac trong bộ lọc sinh học?",
        options: [
          "Khử trùng UV",
          "Vi khuẩn nitrate hóa",
          "Carbon hoạt tính",
          "Zeolite"
        ],
        correctAnswer: 1
      },
      {
        id: 7,
        question: "Mục đích chính của việc thêm muối vào hồ cá Koi trong quá trình điều trị bệnh là gì?",
        options: [
          "Cải thiện độ trong của nước",
          "Giảm stress và hỗ trợ điều hòa áp suất thẩm thấu",
          "Tăng mức oxy",
          "Trung hòa clo"
        ],
        correctAnswer: 1
      },
      {
        id: 8,
        question: "Giống cá Koi nào có đặc điểm là toàn thân màu trắng bạch kim?",
        options: [
          "Kohaku",
          "Ogon",
          "Shiro Utsuri",
          "Platinum"
        ],
        correctAnswer: 1
      },
      {
        id: 9,
        question: "Tần suất lý tưởng để thay nước hoàn toàn trong hồ cá Koi đã ổn định là gì?",
        options: [
          "Hàng tuần",
          "Hàng tháng",
          "Không bao giờ (chỉ thay một phần)",
          "Hàng năm"
        ],
        correctAnswer: 2
      },
      {
        id: 10,
        question: "Giống cá Koi nào KHÔNG thuộc nhóm 'Gosanke'?",
        options: [
          "Kohaku",
          "Showa",
          "Asagi",
          "Sanke"
        ],
        correctAnswer: 2
      }
    ]
  }
};

// Dữ liệu video - thông tin cho mỗi bài học
export const videoData = {
  'section1-lesson1': {
    url: 'test.mp4',
    duration: '28 phút',
    description: 'Tìm hiểu về lịch sử phong phú của cá Koi và ý nghĩa văn hóa của chúng tại Nhật Bản.'
  },
  'section1-lesson2': {
    url: 'test.mp4',
    duration: '32 phút',
    description: 'Khám phá chi tiết ba giống cá Koi danh giá nhất và đặc điểm của chúng.'
  },
  'section1-lesson3': {
    url: 'test.mp4',
    duration: '25 phút',
    description: 'Tổng quan về các giống cá Koi hiện đại và sự phát triển thông qua các chương trình lai tạo.'
  },
  'section2-lesson1': {
    url: 'test.mp4',
    duration: '35 phút',
    description: 'Hướng dẫn thiết yếu cho việc lập kế hoạch và xây dựng môi trường hồ cá Koi lý tưởng.'
  },
  'section2-lesson2': {
    url: 'test.mp4',
    duration: '40 phút',
    description: 'Hiểu về hóa học nước và phương pháp lọc nước tiên tiến cho nước trong như pha lê.'
  },
  'section2-lesson3': {
    url: 'test.mp4',
    duration: '30 phút',
    description: 'Cách điều chỉnh thói quen chăm sóc hồ cá của bạn qua các mùa và điều kiện thời tiết khác nhau.'
  },
  'section3-lesson1': {
    url: 'test.mp4',
    duration: '27 phút',
    description: 'Phương pháp khoa học về dinh dưỡng cá Koi và chiến lược cho ăn trong suốt vòng đời.'
  },
  'section3-lesson2': {
    url: 'test.mp4',
    duration: '38 phút',
    description: 'Hướng dẫn toàn diện để nhận biết, phòng ngừa và điều trị các bệnh phổ biến ở cá Koi.'
  },
  'section3-lesson3': {
    url: 'test.mp4',
    duration: '26 phút',
    description: 'Phương pháp theo dõi sự phát triển của cá Koi và đảm bảo điều kiện sức khỏe tối ưu.'
  },
};

// Dữ liệu người dùng mặc định
export const defaultUserData = {
  name: 'Nguyễn Văn An',
  email: 'nguyenvanan@example.com',
  enrolled: ['1'],
  completedLessons: {
    'section1-lesson1': true
  }
};
