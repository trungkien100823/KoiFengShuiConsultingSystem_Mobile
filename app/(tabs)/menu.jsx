import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import SortPopup from '../../components/SortPopup';
import MoreButton from '../../components/MoreButton';
import { koiAPI } from '../../constants/koiData';
import { pondAPI, pondData, pondImages } from '../../constants/koiPond';
import { images } from '../../constants/images';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { API_CONFIG } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Thêm map để định dạng tên màu đẹp hơn cho người dùng
const colorDisplayMap = {
  'Trắng': 'Trắng',
  'Xám': 'Xám',
  'Ghi': 'Ghi',
  'Vàng': 'Vàng',
  'Nâu': 'Nâu',
  'XanhLá': 'Xanh lá',
  'XanhDương': 'Xanh dương',
  'Đen': 'Đen',
  'Đỏ': 'Đỏ',
  'Hồng': 'Hồng',
  'Cam': 'Cam',
  'Tím': 'Tím'
};

// Map ngược lại để từ tên hiển thị lấy giá trị enum
const getOriginalColorEnum = (displayName) => {
  for (const [enumName, display] of Object.entries(colorDisplayMap)) {
    if (display === displayName) {
      return enumName;
    }
  }
  return displayName;
};

// Thêm vào phần đầu file, sau phần import
const colorStyles = {
  'Trắng': '#FFFFFF',
  'Xám': '#808080',
  'Ghi': '#A9A9A9',
  'Vàng': '#FFD700',
  'Nâu': '#8B4513',
  'XanhLá': '#008000',
  'XanhDương': '#0000FF',
  'Đen': '#000000',
  'Đỏ': '#FF0000',
  'Hồng': '#FFC0CB',
  'Cam': '#FFA500',
  'Tím': '#800080'
};

export default function MenuScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Koi');
  const [sortVisible, setSortVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('all');
  const [displayData, setDisplayData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownAlert, setHasShownAlert] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    destiny: 'Tất cả',
    color: 'Tất cả',
    shape: 'Tất cả'
  });
  const [activeFilter, setActiveFilter] = useState(null);
  
  // State để lưu trữ các tùy chọn bộ lọc từ API
  const [destinyOptions, setDestinyOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [shapeOptions, setShapeOptions] = useState([]);
  const [fetchingFilterOptions, setFetchingFilterOptions] = useState(false);
  
  // Thêm state để theo dõi lỗi API
  const [apiErrors, setApiErrors] = useState({
    destiny: false,
    color: false,
    shape: false
  });

  const [searchText, setSearchText] = useState('');
  const [multipleColors, setMultipleColors] = useState([]);
  const [selectedCompatibleElements, setSelectedCompatibleElements] = useState([]);
  const [compatibleElementsMessage, setCompatibleElementsMessage] = useState('');

  const navigation = useNavigation();

  const [retryCount, setRetryCount] = useState({});

  const handleImageError = (itemId) => {
    // Tăng số lần thử lại cho item này
    setRetryCount(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  // Hàm thử lại load dữ liệu bộ lọc
  const handleRetryFilterOptions = () => {
    if (activeFilter === 'destiny') {
      fetchDestinyOptions();
    } else if (activeFilter === 'color') {
      fetchColorOptions();
    } else if (activeFilter === 'shape') {
      fetchShapeOptions();
    }
  };

  // Hàm gọi API để lấy danh sách các bản mệnh (element)
  const fetchDestinyOptions = async () => {
    try {
      setFetchingFilterOptions(true);
      setApiErrors(prev => ({ ...prev, destiny: false }));
      
      // Sử dụng đúng URL API mà bạn đã cung cấp
      const apiUrl = `${API_CONFIG.baseURL}/api/KoiVariety/get-all-elements`;
      console.log(`Gọi API elements từ: ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API trả về mã lỗi ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Dữ liệu trả về từ API:', responseText);
        
        const elements = JSON.parse(responseText);
        
        if (elements && Array.isArray(elements) && elements.length > 0) {
          const options = ['Tất cả', ...elements];
          setDestinyOptions(options);
          
          // Nếu đã chọn một bản mệnh, gọi API để lấy các màu phù hợp
          if (filterOptions.destiny !== 'Tất cả') {
            fetchColorsByElement(filterOptions.destiny);
          }
        } else {
          // Nếu API không trả về dữ liệu, đặt lỗi để hiển thị thông báo
          throw new Error('API không trả về dữ liệu bản mệnh hợp lệ');
        }
      } catch (error) {
        console.error('Lỗi khi gọi API bản mệnh:', error);
        setApiErrors(prev => ({ ...prev, destiny: true }));
        setDestinyOptions(['Tất cả']); // Chỉ giữ lại "Tất cả", không dùng data mẫu
      }
    } catch (error) {
      console.error('Error fetching destiny options:', error);
      setApiErrors(prev => ({ ...prev, destiny: true }));
      setDestinyOptions(['Tất cả']);
    } finally {
      setFetchingFilterOptions(false);
    }
  };

  // Thêm hàm mới để lấy màu sắc phù hợp với bản mệnh được chọn
  const fetchColorsByElement = async (element) => {
    if (element === 'Tất cả') {
      // Nếu chọn "Tất cả", tải lại tất cả các màu
      fetchColorOptions();
      return;
    }
    
    try {
      setFetchingFilterOptions(true);
      const apiUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.colorsByElement.replace('{element}', element)}`;
      console.log(`Gọi API màu sắc theo mệnh từ: ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API trả về mã lỗi ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Dữ liệu màu sắc theo mệnh:', responseText);
      
      const colors = JSON.parse(responseText);
      
      if (colors && Array.isArray(colors) && colors.length > 0) {
        // Chuyển đổi các màu thành tên hiển thị
        const displayColors = colors.map(color => colorDisplayMap[color] || color);
        
        // Thêm "Tất cả" vào đầu danh sách
        const options = ['Tất cả', ...displayColors];
        
        // Cập nhật danh sách màu trong bộ lọc
        setColorOptions(options);
        
        // Hiển thị thông báo về màu sắc phù hợp
        setCompatibleElementsMessage(`Màu sắc phù hợp với mệnh ${element}`);
        
        // Không tự động đặt màu, chỉ hiển thị danh sách màu tương thích
        // setMultipleColors([]);
      } else {
        // Nếu không có màu nào phù hợp
        setColorOptions(['Tất cả']);
        setCompatibleElementsMessage(`Không tìm thấy màu sắc phù hợp với mệnh ${element}`);
      }
    } catch (error) {
      console.error('Lỗi khi lấy màu sắc theo mệnh:', error);
      setCompatibleElementsMessage(`Không thể lấy màu sắc cho mệnh ${element}`);
      // Nếu có lỗi, tải lại tất cả các màu
      fetchColorOptions();
    } finally {
      setFetchingFilterOptions(false);
    }
  };

  // Hàm gọi API để lấy danh sách các màu sắc
  const fetchColorOptions = async () => {
    try {
      setFetchingFilterOptions(true);
      setApiErrors(prev => ({ ...prev, color: false }));
      
      // Sử dụng đúng URL API mà bạn đã cung cấp
      const apiUrl = `${API_CONFIG.baseURL}/api/KoiVariety/get-all-colors`;
      console.log(`Gọi API màu sắc từ: ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API trả về mã lỗi ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Dữ liệu trả về từ API:', responseText);
        
        const data = JSON.parse(responseText);
        
        if (data && Array.isArray(data) && data.length > 0) {
          const options = ['Tất cả'];
          data.forEach(color => {
            const displayName = colorDisplayMap[color] || color;
            options.push(displayName);
          });
          
          setColorOptions(options);
        } else {
          // Nếu API không trả về dữ liệu, đặt lỗi để hiển thị thông báo
          throw new Error('API không trả về dữ liệu màu sắc hợp lệ');
        }
      } catch (error) {
        console.error('Lỗi khi gọi API màu sắc:', error);
        setApiErrors(prev => ({ ...prev, color: true }));
        setColorOptions(['Tất cả']); // Chỉ giữ lại "Tất cả", không dùng data mẫu
      }
    } catch (error) {
      console.error('Error fetching color options:', error);
      setApiErrors(prev => ({ ...prev, color: true }));
      setColorOptions(['Tất cả']);
    } finally {
      setFetchingFilterOptions(false);
    }
  };

  // Hàm gọi API để lấy danh sách các hình dạng hồ
  const fetchShapeOptions = async () => {
    const loadShapeData = async () => {
      try {
        setFetchingFilterOptions(true);
        setApiErrors(prev => ({ ...prev, shape: false }));
        
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`);
        
        if (response.ok) {
          const responseData = await response.json();
          
          if (responseData.isSuccess && Array.isArray(responseData.data)) {
            const uniqueShapes = new Set(['Tất cả']);
            responseData.data.forEach(shape => {
              if (shape.shapeName) {
                uniqueShapes.add(shape.shapeName);
              }
            });
            
            if (uniqueShapes.size > 1) {
              setShapeOptions(Array.from(uniqueShapes));
              return;
            }
          }
        }
        
        // Nếu có lỗi hoặc không có dữ liệu, thử lại sau 1 giây
        setTimeout(loadShapeData, 1000);
        
      } catch (error) {
        // Nếu có lỗi, thử lại sau 1 giây
        setTimeout(loadShapeData, 1000);
      } finally {
        setFetchingFilterOptions(false);
      }
    };

    // Bắt đầu quá trình tải dữ liệu
    loadShapeData();
  };

  // Hàm gọi API để lấy tất cả các tùy chọn bộ lọc
  const fetchAllFilterOptions = async () => {
    // Tải các tùy chọn bản mệnh trước
    await fetchDestinyOptions();
    
    // Nếu có mệnh đã chọn, tải màu theo mệnh đó
    if (filterOptions.destiny !== 'Tất cả') {
      await fetchColorsByElement(filterOptions.destiny);
    } else {
      // Nếu không, tải tất cả các màu
      await fetchColorOptions();
    }
    
    // Tải các tùy chọn hình dạng
    await fetchShapeOptions();
  };

  // Mở bộ lọc và chuẩn bị dữ liệu
  const handleOpenFilter = (filterType) => {
    // Đảm bảo chỉ mở bộ lọc phù hợp với tab
    if (
      (selectedTab === 'Koi' && (filterType === 'destiny' || filterType === 'color')) ||
      (selectedTab === 'Pond' && filterType === 'shape')
    ) {
      setActiveFilter(filterType);
      
      // Tự động load dữ liệu nếu chưa có
      if (filterType === 'shape') {
        // Tải dữ liệu hình dạng hồ
        const loadShapeData = async () => {
          try {
            const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`);
            if (response.ok) {
              const data = await response.json();
              if (data.isSuccess && Array.isArray(data.data)) {
                const shapes = ['Tất cả'];
                shapesCache.current = {};
                data.data.forEach(shape => {
                  if (shape.shapeName) {
                    shapes.push(shape.shapeName);
                    shapesCache.current[shape.shapeName] = shape.shapeId;
                  }
                });
                setShapeOptions(shapes);
              }
            }
          } catch (error) {
            // Nếu lỗi, thử lại sau 1 giây
            setTimeout(loadShapeData, 1000);
          }
        };
        loadShapeData();
      } else if (filterType === 'destiny') {
        fetchDestinyOptions();
      } else if (filterType === 'color') {
        if (filterOptions.destiny !== 'Tất cả') {
          fetchColorsByElement(filterOptions.destiny);
        } else {
          fetchColorOptions();
        }
      }
      
      setSortVisible(true);
    }
  };

  // Xử lý khi chọn một giá trị bộ lọc
  const handleFilterSelect = (filterValue) => {
    setFilterOptions(prev => ({
      ...prev,
      [activeFilter]: filterValue
    }));
    
    // Thêm xử lý cho tab Hồ cá
    if (selectedTab === 'Pond' && activeFilter === 'shape') {
      fetchUserPonds('shape', filterValue);
    }
    
    // Xử lý cho tab Koi giữ nguyên
    if (activeFilter === 'destiny') {
      if (filterValue !== 'Tất cả') {
        fetchColorsByElement(filterValue);
        setMultipleColors([]);
        setFilterOptions(prev => ({
          ...prev,
          color: 'Tất cả'
        }));
      } else {
        fetchColorOptions();
        setCompatibleElementsMessage('');
        setSelectedCompatibleElements([]);
      }
    }
    
    setSortVisible(false);
  };

  // Cập nhật các hàm fetchUserKoi và fetchUserPonds để hỗ trợ lọc
  const fetchUserKoi = async (filterType, filterValue) => {
    try {
      setIsLoading(true);
      
      let url = `${API_CONFIG.baseURL}/api/KoiVariety/get-all`;
      const params = new URLSearchParams();
      
      if (filterType === 'destiny' && filterValue !== 'Tất cả') {
        params.append('element', filterValue);
      } else if (filterOptions.destiny !== 'Tất cả') {
        params.append('element', filterOptions.destiny);
      }
      
      if (filterType === 'color' && filterValue !== 'Tất cả') {
        const colorEnum = getOriginalColorEnum(filterValue);
        params.append('color', colorEnum);
      } else if (filterOptions.color !== 'Tất cả') {
        const colorEnum = getOriginalColorEnum(filterOptions.color);
        params.append('color', colorEnum);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const responseText = await response.text();
      const responseData = JSON.parse(responseText);

      if (responseData.isSuccess && Array.isArray(responseData.data)) {
        setDisplayData(responseData.data);
      } else {
        setDisplayData([]);
      }
    } catch (error) {
      setDisplayData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPonds = async (filterType, filterValue) => {
    try {
      setIsLoading(true);
      
      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPonds}`;
      
      if ((filterType === 'shape' && filterValue !== 'Tất cả') || 
          (filterOptions.shape !== 'Tất cả' && !filterType)) {
        const shapeValue = filterType === 'shape' ? filterValue : filterOptions.shape;
        const shapeId = await getShapeIdByName(shapeValue);
        
        if (shapeId) {
          url = `${API_CONFIG.baseURL}/api/KoiPond/get-by-shape/${shapeId}`;
        }
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.isSuccess && Array.isArray(responseData.data)) {
        const processedData = responseData.data.map(pond => ({
          ...pond,
          imageUrl: pond.imageUrl || null,
          pondName: pond.pondName || 'Chưa đặt tên',
          shapeName: pond.shapeName || 'Không xác định',
          introduction: pond.introduction || 'Chưa có thông tin',
          description: pond.description || 'Chưa có mô tả'
        }));

        setDisplayData(processedData);

        // Cache shape data nếu có
        if (responseData.data.length > 0 && responseData.data[0].shapeName) {
          const uniqueShapes = new Set(['Tất cả']);
          responseData.data.forEach(pond => {
            if (pond.shapeName) {
              uniqueShapes.add(pond.shapeName);
            }
          });
          setShapeOptions(Array.from(uniqueShapes));
        }
      } else {
        setDisplayData([]);
      }
    } catch (error) {
      setDisplayData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật hàm getShapeIdByName để không hiện log lỗi
  const getShapeIdByName = async (shapeName) => {
    try {
      if (shapesCache.current && shapesCache.current[shapeName]) {
        return shapesCache.current[shapeName];
      }

      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`);
      
      if (!response.ok) {
        return null;
      }
      
      const responseData = await response.json();

      if (responseData.isSuccess && Array.isArray(responseData.data)) {
        shapesCache.current = {};
        responseData.data.forEach(shape => {
          if (shape.shapeName && shape.shapeId) {
            shapesCache.current[shape.shapeName] = shape.shapeId;
          }
        });

        return shapesCache.current[shapeName] || null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  // Thêm useRef để cache shapes
  const shapesCache = React.useRef({});

  // Thêm useEffect để load shapes khi component mount
  useEffect(() => {
    const preloadShapes = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`);
        if (response.ok) {
          const data = await response.json();
          if (data.isSuccess && Array.isArray(data.data)) {
            const shapes = ['Tất cả'];
            shapesCache.current = {};
            data.data.forEach(shape => {
              if (shape.shapeName) {
                shapes.push(shape.shapeName);
                shapesCache.current[shape.shapeName] = shape.shapeId;
              }
            });
            setShapeOptions(shapes);
          }
        }
      } catch (error) {
        console.error('Error preloading shapes:', error);
      }
    };

    preloadShapes();
  }, []);

  const handleSort = (sortType) => {
    setCurrentSort(sortType);
    if (sortType === 'all' || sortType === 'destiny') {
      fetchUserKoi();
    }
  };

  const handleTabChange = async (tab) => {
    if (tab === selectedTab) return;
    
    setSelectedTab(tab);
    setIsLoading(true);
    try {
      if (tab === 'Koi') {
        await fetchUserKoi();
      } else if (tab === 'Pond') {
        await fetchUserPonds();
      } else {
        setDisplayData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setDisplayData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    if (!filterType) return;
    
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    if (selectedTab === 'Koi') {
      fetchUserKoi(filterType, value);
    } else if (selectedTab === 'Pond') {
      fetchUserPonds(filterType, value);
    }
  };

  // Hàm tìm kiếm theo tên
  const handleSearch = async () => {
    try {
      if (selectedTab === 'Other') return;
      
      setIsLoading(true);
      
      const apiUrl = selectedTab === 'Koi' 
        ? `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getKoiByName}?name=${encodeURIComponent(searchText.trim())}`
        : `${API_CONFIG.baseURL}/api/KoiPond/get-by-name?name=${encodeURIComponent(searchText.trim())}`;
      
      console.log('Search API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const responseText = await response.text();
      console.log('API Response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        Alert.alert("Thông báo", "Lỗi định dạng dữ liệu từ server");
        return;
      }
      
      // Xử lý dữ liệu theo cấu trúc mới
      if (responseData.isSuccess) {
        if (Array.isArray(responseData.data) && responseData.data.length > 0) {
          setDisplayData(responseData.data);
          if (responseData.message && 
              responseData.message !== "KOIVARIETY_FOUND" && 
              responseData.message !== "KOIPOND_FOUND") {
            Alert.alert("Thông báo", responseData.message);
          }
        } else {
          setDisplayData([]);
          Alert.alert(
            "Thông báo",
            `Không tìm thấy ${selectedTab === 'Koi' ? 'cá Koi' : 'hồ cá'} phù hợp`
          );
        }
      } else {
        setDisplayData([]);
        Alert.alert(
          "Thông báo",
          responseData.message || `Không tìm thấy ${selectedTab === 'Koi' ? 'cá Koi' : 'hồ cá'} phù hợp`
        );
      }
    } catch (error) {
      console.error('Search Error:', error);
      setDisplayData([]);
      Alert.alert(
        "Thông báo",
        `Không thể tìm kiếm ${selectedTab === 'Koi' ? 'cá Koi' : 'hồ cá'}. Vui lòng thử lại sau.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm gọi API để lấy các phần tử tương thích từ màu sắc
  const fetchCompatibleElements = async (colors) => {
    try {
      if (!colors || colors.length === 0) {
        setSelectedCompatibleElements([]);
        setCompatibleElementsMessage('');
        return;
      }
      
      // Chuyển đổi mảng màu sắc thành chuỗi phân cách bằng dấu phẩy
      const colorEnums = colors.map(color => getOriginalColorEnum(color)).join(',');
      const apiUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.compatibleElements}?colors=${colorEnums}`;
      
      console.log(`Gọi API tương thích màu sắc-mệnh: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Kết quả tương thích màu sắc-mệnh:', data);
      
      if (data) {
        if (data.elements && Array.isArray(data.elements)) {
          setSelectedCompatibleElements(data.elements);
          
          // Nếu có một mệnh đã được chọn, kiểm tra xem nó có phù hợp với màu không
          if (filterOptions.destiny !== 'Tất cả' && !data.elements.includes(filterOptions.destiny)) {
            Alert.alert(
              "Cảnh báo",
              `Mệnh ${filterOptions.destiny} không phù hợp với các màu đã chọn. Mệnh phù hợp nhất là ${data.elements[0]}.`,
              [
                { 
                  text: "Đổi mệnh", 
                  onPress: () => setFilterOptions(prev => ({
                    ...prev,
                    destiny: data.elements[0]
                  }))
                },
                { text: "Giữ nguyên" }
              ]
            );
          }
        }
        
        if (data.message) {
          setCompatibleElementsMessage(data.message);
        }
      }
    } catch (error) {
      console.error('Error fetching compatible elements:', error);
      setSelectedCompatibleElements([]);
      setCompatibleElementsMessage('Không thể xác định bản mệnh phù hợp');
    }
  };

  // Cập nhật hàm fetchFilteredKoi để sử dụng đúng định dạng API
  const fetchFilteredKoi = async () => {
    try {
      setIsLoading(true);
      
      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.filterKoi}`;
      const params = new URLSearchParams();
      
      // Thêm bản mệnh nếu có
      if (filterOptions.destiny !== 'Tất cả') {
        params.append('nguHanh', filterOptions.destiny);
      }
      
      // Xử lý màu sắc
      if (multipleColors.length > 0) {
        // Chuyển đổi tên hiển thị thành enum và thêm vào params
        multipleColors.forEach(displayColor => {
          const colorEnum = getOriginalColorEnum(displayColor);
          if (colorEnum) {
            params.append('colors', colorEnum);
          }
        });
      } else if (filterOptions.color !== 'Tất cả' && !filterOptions.color.includes(' màu')) {
        // Xử lý trường hợp chọn một màu
        const colorEnum = getOriginalColorEnum(filterOptions.color);
        if (colorEnum) {
          params.append('colors', colorEnum);
        }
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      console.log('Gọi API lọc cá Koi:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.isSuccess && Array.isArray(data.data)) {
        setDisplayData(data.data);
        if (data.message && data.message !== "KOIVARIETY_FOUND") {
          Alert.alert("Thông báo", data.message, [{ text: "OK" }]);
        }
      } else if (Array.isArray(data)) {
        setDisplayData(data);
      } else {
        setDisplayData([]);
        Alert.alert(
          "Thông báo",
          data.message || "Không tìm thấy cá Koi phù hợp với bộ lọc",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error filtering Koi:', error);
      setDisplayData([]);
      Alert.alert(
        "Lỗi",
        "Không thể lọc cá Koi. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý chọn nhiều màu
  const handleMultipleColorSelect = (color) => {
    // Tạo biến tạm để lưu danh sách màu mới
    let newColors = [...multipleColors];
    
    if (color === 'Tất cả') {
      // Nếu chọn "Tất cả", xóa tất cả các màu đã chọn
      newColors = [];
    } else {
      // Kiểm tra xem màu đã được chọn chưa
      const colorIndex = newColors.indexOf(color);
      
      if (colorIndex === -1) {
        // Thêm màu mới nếu chưa được chọn
        newColors.push(color);
      } else {
        // Xóa màu nếu đã được chọn
        newColors.splice(colorIndex, 1);
      }
    }
    
    // Cập nhật state các màu đã chọn
    setMultipleColors(newColors);
  };

  // Khi mở bộ lọc màu sắc, đảm bảo hiển thị màu phù hợp với bản mệnh đã chọn
  const handleOpenMultipleColorFilter = () => {
    setActiveFilter('color');
    
    // Kiểm tra nếu đã chọn bản mệnh
    if (filterOptions.destiny !== 'Tất cả') {
      // Nếu danh sách màu chưa được tải cho bản mệnh này
      // (Chỉ có 'Tất cả' hoặc số lượng rất ít)
      if (colorOptions.length <= 2) {
        fetchColorsByElement(filterOptions.destiny);
      }
    } else {
      // Nếu chưa chọn bản mệnh, tải tất cả các màu
      if (colorOptions.length <= 1) {
        fetchColorOptions();
      }
    }
    
    // Đảm bảo trạng thái multipleColors phản ánh đúng filterOptions.color hiện tại
    if (filterOptions.color === 'Tất cả') {
      setMultipleColors([]); // Không có màu nào được chọn khi là "Tất cả"
    } else if (!multipleColors.includes(filterOptions.color) && filterOptions.color.indexOf(' màu') === -1) {
      // Nếu có một màu cụ thể và không phải là "X màu", và chưa có trong multipleColors
      setMultipleColors([filterOptions.color]);
    }
    
    setSortVisible(true);
  };

  // Thêm hàm xử lý khi nhấn nút "Áp dụng" cho màu sắc
  const handleApplyMultipleColors = () => {
    // Cập nhật filterOptions.color hiển thị
    if (multipleColors.length === 0) {
      setFilterOptions(prev => ({
        ...prev,
        color: 'Tất cả'
      }));
    } else if (multipleColors.length === 1) {
      setFilterOptions(prev => ({
        ...prev,
        color: multipleColors[0]
      }));
    } else {
      setFilterOptions(prev => ({
        ...prev,
        color: `${multipleColors.length} màu`
      }));
    }
    
    // Gọi API để lấy các phần tử tương thích từ màu sắc đã chọn
    fetchCompatibleElements(multipleColors);
    
    // Chỉ đóng popup, không áp dụng bộ lọc ngay
    setSortVisible(false);
  };

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentCardIndex(currentIndex);
  };

  useEffect(() => {
    // Đặt lại multipleColors khi tải trang
    setMultipleColors([]);
    
    fetchUserKoi();
    fetchAllFilterOptions(); // Tải tất cả các tùy chọn bộ lọc khi component được mount
    
    return () => {
      setDisplayData([]);
      setHasShownAlert(false);
    };
  }, []);

  // Thêm useEffect mới để re-fetch khi màn hình được focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Màn hình Menu được focus - Tải lại dữ liệu');
      
      // Re-fetch dữ liệu dựa trên tab hiện tại
      if (selectedTab === 'Koi') {
        fetchUserKoi();
      } else if (selectedTab === 'Pond') {
        fetchUserPonds();
      }
      
      // Re-fetch các tùy chọn bộ lọc
      fetchAllFilterOptions();
    });

    return unsubscribe;
  }, [navigation, selectedTab]);

  return (
    <ImageBackground 
      source={require('../../assets/images/feng shui.png')} 
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(139,0,0,0.6)', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
      >
        <View style={styles.container}>
          {/* Updated header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Updated search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ở đây"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Unified header with tabs and filters on same line - more compact */}
          <View style={styles.unifiedHeaderContainer}>
            {/* Tab section - left aligned and more compact */}
            <View style={styles.tabSection}>
              <TouchableOpacity 
                style={[styles.tab, selectedTab === 'Koi' && styles.selectedTab]}
                onPress={() => handleTabChange('Koi')}
              >
                <Text style={[styles.tabText, selectedTab === 'Koi' && styles.selectedTabText]}>Cá Koi</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, selectedTab === 'Pond' && styles.selectedTab]}
                onPress={() => handleTabChange('Pond')}
              >
                <Text style={[styles.tabText, selectedTab === 'Pond' && styles.selectedTabText]}>Hồ cá</Text>
              </TouchableOpacity>
            </View>

            {/* Filter section - right aligned and more compact */}
            <View style={styles.filterControls}>
              {selectedTab === 'Koi' ? (
                <>
                  <TouchableOpacity 
                    style={styles.miniFilterPill}
                    onPress={() => handleOpenFilter('destiny')}
                  >
                    <Text style={styles.miniFilterText} numberOfLines={1} ellipsizeMode="tail">
                      {filterOptions.destiny !== 'Tất cả' ? filterOptions.destiny : 'Mệnh'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.miniFilterPill}
                    onPress={handleOpenMultipleColorFilter}
                  >
                    <Text style={styles.miniFilterText} numberOfLines={1} ellipsizeMode="tail">
                      {filterOptions.color !== 'Tất cả' ? filterOptions.color : 'Màu'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.miniFilterPill}
                  onPress={() => handleOpenFilter('shape')}
                >
                  <Text style={styles.miniFilterText} numberOfLines={1} ellipsizeMode="tail">
                    {filterOptions.shape !== 'Tất cả' ? filterOptions.shape : 'Hình'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => {
                  if (selectedTab === 'Koi') {
                    fetchFilteredKoi();
                  } else {
                    // Use fetchKoiPonds or equivalent function for Pond tab
                    // If no specific function exists, we can use a temporary placeholder
                    console.log('Filtering ponds by:', filterOptions.shape);
                    // Implement pond filtering here based on your existing code
                    // For example, if you have a function for this, call it here
                  }
                }}
              >
                <Ionicons name="filter" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.mainContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B0000" />
              </View>
            ) : displayData && displayData.length > 0 ? (
              <View>
                <FlatList
                  horizontal
                  data={displayData}
                  keyExtractor={(item, index) => `${selectedTab}-${item.koiPondId || item.koiVarietyId || index}`}
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled={true}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  renderItem={({ item }) => (
                    <View style={styles.koiCardContainer}>
                      <View style={styles.koiCard}>
                        <Image 
                          key={`${item.koiPondId || item.koiVarietyId}-${retryCount[item.koiPondId || item.koiVarietyId] || 0}`}
                          source={
                            selectedTab === 'Pond' 
                              ? (item.imageUrl 
                                  ? { uri: item.imageUrl }
                                  : require('../../assets/images/buddha.png'))
                              : (item.imageUrl 
                                  ? { uri: item.imageUrl }
                                  : require('../../assets/images/buddha.png'))
                          } 
                          style={styles.image}
                          resizeMode="cover"
                          onError={() => {
                            // Chỉ thử lại tối đa 3 lần
                            if ((retryCount[item.koiPondId || item.koiVarietyId] || 0) < 3) {
                              handleImageError(item.koiPondId || item.koiVarietyId);
                            }
                          }}
                        />
                        <View style={styles.infoContainer}>
                          <View style={styles.nameContainer}>
                            <Text style={styles.name}>
                              {selectedTab === 'Pond' 
                                ? (item.pondName || 'Không có tên') 
                                : (item.varietyName || item.name || 'Không có tên')}
                            </Text>
                          </View>
                          <MoreButton 
                            item={{
                              ...item,
                              type: selectedTab
                            }} 
                            type={selectedTab}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                />
                <View style={styles.paginationContainer}>
                  {displayData.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.paginationDot,
                        index === currentCardIndex && styles.paginationDotActive
                      ]} 
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
              </View>
            )}
          </ScrollView>

          <SortPopup 
            visible={sortVisible}
            onClose={() => setSortVisible(false)}
            onSort={activeFilter === 'color' ? handleMultipleColorSelect : handleFilterSelect}
            currentSort={activeFilter ? filterOptions[activeFilter] || 'Tất cả' : 'Tất cả'}
            options={
              activeFilter === 'destiny' 
                ? destinyOptions 
                : activeFilter === 'color' 
                  ? colorOptions 
                  : shapeOptions
            }
            colorStyles={colorStyles}
            isLoading={fetchingFilterOptions}
            title={
              activeFilter === 'destiny' 
                ? 'Chọn bản mệnh' 
                : activeFilter === 'color' 
                  ? 'Chọn màu sắc (có thể chọn nhiều)' 
                  : 'Chọn hình dạng hồ'
            }
            errorMessage={
              fetchingFilterOptions ? null :
              (activeFilter === 'destiny' && apiErrors.destiny) || 
              (activeFilter === 'color' && apiErrors.color) || 
              (activeFilter === 'shape' && apiErrors.shape) || 
              ((activeFilter === 'destiny' && destinyOptions.length <= 1) || 
               (activeFilter === 'color' && colorOptions.length <= 1) || 
               (activeFilter === 'shape' && shapeOptions.length <= 1)) 
                ? 'Không thể tải dữ liệu từ máy chủ, vui lòng thử lại' 
                : null
            }
            onRetry={handleRetryFilterOptions}
            activeFilter={activeFilter}
            selectedItems={activeFilter === 'color' ? multipleColors : []}
            multiSelect={activeFilter === 'color'}
            onApply={activeFilter === 'color' ? handleApplyMultipleColors : undefined}
            recommendedItems={activeFilter === 'color' && multipleColors.length > 0 ? multipleColors : []}
          />
          <CustomTabBar />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 30, 30, 0.6)',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 10,
  },
  searchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unifiedHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  tabSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  selectedTab: {
    backgroundColor: '#8B0000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCC',
  },
  selectedTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  filterControls: {
    flexDirection: 'row',
  },
  miniFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  miniFilterText: {
    color: '#FFF',
    fontSize: 13,
    marginRight: 5,
    maxWidth: 80,
  },
  filterButton: {
    backgroundColor: '#8B0000',
    width: 36, // Larger button
    height: 36, // Larger button
    borderRadius: 18,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  koiCardContainer: {
    width: width,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  koiCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.2)',
  },
  image: {
    width: '100%',
    height: 350,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 0, 0, 0.1)',
    paddingBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  variant: {
    fontSize: 18,
    color: '#8B0000',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  elementBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(139, 0, 0, 0.85)',
    paddingHorizontal: 10, 
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 1,
  },
  elementText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailSection: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 0, 0, 0.1)',
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  }
});


