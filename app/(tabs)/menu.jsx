import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  KeyboardAvoidingView,
  StatusBar,
  TouchableWithoutFeedback,
  RefreshControl,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SortPopup from '../../components/SortPopup';
import MoreButton from '../../components/MoreButton';
import { koiAPI } from '../../constants/koiData';
import { pondAPI, pondData, pondImages } from '../../constants/koiPond';
import { images } from '../../constants/images';
import CustomTabBar from '../../components/ui/CustomTabBar';
import { API_CONFIG } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/ScreenWrapper';

const { width, height } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const shapesCache = useRef({});
  const [selectedTab, setSelectedTab] = useState('Recommendation');
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [tabDropdownVisible, setTabDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      (selectedTab === 'Recommendation' && filterType === 'color') ||
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
        if (selectedTab === 'Koi' && filterOptions.destiny !== 'Tất cả') {
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
      if (tab === 'Recommendation') {
        // Nếu trước đó đang ở tab Pond, reset filter màu sắc về mặc định
        if (selectedTab === 'Pond') {
          setFilterOptions(prev => ({
            ...prev,
            color: 'Tất cả'
          }));
          setMultipleColors([]);
        }
        
        // Lấy dữ liệu từ userKoi API cho tab Đề xuất
        const userKoiData = await koiAPI.getUserKoi();
        setDisplayData(userKoiData);
      } else if (tab === 'Koi') {
        // Nếu trước đó đang ở tab Pond, reset filter màu sắc và mệnh về mặc định
        if (selectedTab === 'Pond') {
          setFilterOptions(prev => ({
            ...prev,
            color: 'Tất cả',
            destiny: 'Tất cả'
          }));
          setMultipleColors([]);
        }
        
        await fetchUserKoi();
      } else if (tab === 'Pond') {
        // Nếu trước đó đang ở tab khác, reset filter hình dạng về mặc định
        if (selectedTab !== 'Pond') {
          setFilterOptions(prev => ({
            ...prev,
            shape: 'Tất cả'
          }));
        }
        
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
    
    if (selectedTab === 'Koi' || selectedTab === 'Recommendation') {
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
      
      const apiUrl = selectedTab === 'Pond' 
        ? `${API_CONFIG.baseURL}/api/KoiPond/get-by-name?name=${encodeURIComponent(searchText.trim())}`
        : `${API_CONFIG.baseURL}${API_CONFIG.endpoints.getKoiByName}?name=${encodeURIComponent(searchText.trim())}`;
      
      console.log('Search API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const responseText = await response.text();      
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
            `Không tìm thấy ${selectedTab === 'Pond' ? 'hồ cá' : 'cá Koi'} phù hợp`
          );
        }
      } else {
        setDisplayData([]);
        Alert.alert(
          "Thông báo",
          responseData.message || `Không tìm thấy ${selectedTab === 'Pond' ? 'hồ cá' : 'cá Koi'} phù hợp`
        );
      }
    } catch (error) {
      console.error('Search Error:', error);
      setDisplayData([]);
      Alert.alert(
        "Thông báo",
        `Không thể tìm kiếm ${selectedTab === 'Pond' ? 'hồ cá' : 'cá Koi'}. Vui lòng thử lại sau.`
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
            
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();      
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
      
      // Nếu là tab Đề xuất, xử lý khác biệt
      if (selectedTab === 'Recommendation') {

        
        // Nếu chọn "Tất cả" hoặc không chọn màu nào
        if (filterOptions.color === 'Tất cả' || multipleColors.length === 0) {
          // Sử dụng API userKoi để lấy dữ liệu đề xuất mặc định
          const userKoiData = await koiAPI.getUserKoi();
          setDisplayData(userKoiData);
          return; // Thoát khỏi hàm ngay sau khi setDisplayData
        } 
        // Nếu đã chọn màu (một màu hoặc nhiều màu)
        else {
          try {
            // Lấy các màu đã chọn và chuyển đổi sang enum
            let selectedColors = [];
            
            // Nếu có nhiều màu được chọn, sử dụng tất cả
            if (multipleColors.length > 0) {
              selectedColors = multipleColors.map(color => getOriginalColorEnum(color));
            } 
            // Nếu chỉ chọn một màu từ dropdown
            else if (filterOptions.color !== 'Tất cả') {
              selectedColors = [getOriginalColorEnum(filterOptions.color)];
            }
            
            // Lọc bỏ các màu không hợp lệ
            selectedColors = selectedColors.filter(color => color);
            
            if (selectedColors.length === 0) {
              const userKoiData = await koiAPI.getUserKoi();
              setDisplayData(userKoiData);
              return;
            }
            
            
            // Sử dụng hàm fetchKoiByColor mới với mảng màu
            const result = await fetchKoiByColor(selectedColors);
            
            if (result.isSuccess && result.data && result.data.length > 0) {
              setDisplayData(result.data);
            } else {
              // Không gọi lại API userKoi nữa, chỉ hiển thị mảng rỗng
              setDisplayData([]);
              
              Alert.alert(
                "Thông báo",
                "Không tìm thấy cá theo màu",
                [{ text: "OK" }]
              );
            }
          } catch (colorError) {
            
            // Không gọi API userKoi, chỉ hiển thị mảng rỗng
            setDisplayData([]);
            
            Alert.alert(
              "Thông báo",
              "Không tìm thấy cá theo màu",
              [{ text: "OK" }]
            );
          }
        }
      } 
      // Nếu là tab Cá Koi, giữ nguyên logic hiện tại
      else {
        let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.filterKoi}`;
        const params = new URLSearchParams();
        
        // Thêm bản mệnh nếu có và đang ở tab Koi
        if (selectedTab === 'Koi' && filterOptions.destiny !== 'Tất cả') {
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
            data.message || `Không tìm thấy cá Koi phù hợp với bộ lọc`,
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error('Error filtering Koi:', error);
      
      // Nếu có lỗi chung và đang ở tab Đề xuất, hiển thị thông báo tù chỉnh
      if (selectedTab === 'Recommendation') {
        setDisplayData([]);
        Alert.alert(
          "Thông báo",
          "Không tìm thấy cá theo màu",
          [{ text: "OK" }]
        );
      } else {
        // Nếu ở tab khác, giữ nguyên thông báo lỗi
        setDisplayData([]);
        Alert.alert(
          "Lỗi",
          error.message || "Không thể lọc cá Koi. Vui lòng thử lại sau.",
          [{ text: "OK" }]
        );
      }
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
    
    // Kiểm tra nếu đã chọn bản mệnh và đang ở tab Cá Koi
    if (selectedTab === 'Koi' && filterOptions.destiny !== 'Tất cả') {
      // Nếu danh sách màu chưa được tải cho bản mệnh này
      // (Chỉ có 'Tất cả' hoặc số lượng rất ít)
      if (colorOptions.length <= 2) {
        fetchColorsByElement(filterOptions.destiny);
      }
    } else {
      // Nếu chưa chọn bản mệnh hoặc đang ở tab Đề xuất, tải tất cả các màu
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
    // Chỉ thực hiện cho tab Cá Koi, không cho tab Đề xuất
    if (selectedTab === 'Koi') {
      fetchCompatibleElements(multipleColors);
    }
    
    // Đóng popup
    setSortVisible(false);
    
    // Nếu đang ở tab Đề xuất, tự động áp dụng bộ lọc và tìm kiếm ngay
    if (selectedTab === 'Recommendation') {
      // Kiểm tra lại nếu đã chọn "Tất cả" (không có màu nào được chọn)
      if (multipleColors.length === 0) {
        // Gọi trực tiếp hàm để lấy dữ liệu từ userKoi
        const fetchRecommendation = async () => {
          try {
            setIsLoading(true);
            const data = await koiAPI.getUserKoi();
            setDisplayData(data);
          } catch (error) {
            console.error('Error fetching recommendation:', error);
            setDisplayData([]);
          } finally {
            setIsLoading(false);
          }
        };
        fetchRecommendation();
      } else {
        // Nếu có chọn màu thì mới gọi fetchFilteredKoi
        fetchFilteredKoi();
      }
    }
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentCardIndex(currentIndex);
  };

  useEffect(() => {
    // Đặt lại multipleColors khi tải trang
    setMultipleColors([]);
    
    // Fetch dữ liệu dựa trên tab hiện tại
    if (selectedTab === 'Recommendation') {
      // Sử dụng hàm getUserKoi có sẵn từ koiAPI
      const fetchRecommendation = async () => {
        try {
          setIsLoading(true);
          // Lấy dữ liệu từ userKoi API
          const data = await koiAPI.getUserKoi();
          setDisplayData(data);
        } catch (error) {
          console.error('Error fetching recommendation:', error);
          setDisplayData([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchRecommendation();
    } else if (selectedTab === 'Koi') {
      fetchUserKoi();
    } else if (selectedTab === 'Pond') {
      fetchUserPonds();
    }
    
    fetchAllFilterOptions(); // Tải tất cả các tùy chọn bộ lọc khi component được mount
    
    return () => {
      setDisplayData([]);
      setHasShownAlert(false);
    };
  }, []);

  // Thêm useEffect cho navigation focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      
      // Re-fetch dữ liệu dựa trên tab hiện tại
      if (selectedTab === 'Recommendation') {
        // Sử dụng hàm getUserKoi có sẵn từ koiAPI
        const fetchRecommendation = async () => {
          try {
            setIsLoading(true);
            // Lấy dữ liệu từ userKoi API
            const data = await koiAPI.getUserKoi();
            setDisplayData(data);
          } catch (error) {
            console.error('Error fetching recommendation:', error);
            setDisplayData([]);
          } finally {
            setIsLoading(false);
          }
        };
        
        fetchRecommendation();
      } else if (selectedTab === 'Koi') {
        fetchUserKoi();
      } else if (selectedTab === 'Pond') {
        fetchUserPonds();
      }
      
      // Re-fetch các tùy chọn bộ lọc
      fetchAllFilterOptions();
    });

    return unsubscribe;
  }, [navigation, selectedTab]);

  // Thêm hàm trực tiếp gọi API get-by-color để tránh vấn đề với tham số
  const fetchKoiByColor = async (colorEnums) => {
    try {
      // Kiểm tra tham số đầu vào
      if (!colorEnums || (Array.isArray(colorEnums) && colorEnums.length === 0)) {
        return { isSuccess: false, data: [], message: 'Không tìm thấy cá theo màu' };
      }
      
      // Chuyển đổi thành mảng nếu chỉ là một màu
      const colorArray = Array.isArray(colorEnums) ? colorEnums : [colorEnums];
      
      // Sửa lỗi URL - truyền trực tiếp URL của API thay vì sử dụng API_CONFIG.endpoints.getByColor
      // đang bị undefined trong lúc runtime
      let url = `${API_CONFIG.baseURL}/api/KoiVariety/get-by-color`;
      
      // Thêm màu dưới dạng nhiều tham số colors
      // Format: ?colors=Color1&colors=Color2...
      url += '?';
      colorArray.forEach((color, index) => {
        if (index > 0) url += '&';
        url += `colors=${encodeURIComponent(color.trim())}`;
      });
      
      const headers = await getAuthHeaders();
      
      // Lưu ý: Đặt timeout để không đợi API quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...headers
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return { isSuccess: false, data: [], message: 'Không tìm thấy cá theo màu' };
        }
        
        const responseText = await response.text();
        
        const data = JSON.parse(responseText);
        
        if (data && data.isSuccess && Array.isArray(data.data)) {
          const mappedData = data.data.map(item => ({
            id: item.koiVarietyId,
            koiVarietyId: item.koiVarietyId,
            varietyName: item.name || 'Unknown',
            name: item.name || 'Unknown',
            description: item.description || '',
            imageUrl: item.imageUrl || null,
            imageName: item.imageUrl,
          }));
          
          return { isSuccess: true, data: mappedData };
        }
        
        return { 
          isSuccess: false, 
          data: [], 
          message: data?.message || 'Không tìm thấy cá theo màu' 
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        return { isSuccess: false, data: [], message: 'Không tìm thấy cá theo màu' };
      }
    } catch (error) {
      return { isSuccess: false, data: [], message: 'Không tìm thấy cá theo màu' };
    }
  };
  
  // Hàm lấy headers xác thực
  const getAuthHeaders = async () => {
    try {
      // Lấy token từ local storage hoặc secure store
      const token = await AsyncStorage.getItem('userToken');
      
      // Nếu có token, trả về header với Authorization
      if (token) {
        return {
          'Authorization': `Bearer ${token}`
        };
      }
      
      // Nếu không có token, trả về header mặc định
      return {};
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {};
    }
  };

  // Add a refresh function that reloads your data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Call all your data fetching functions here
    Promise.all([
      fetchDestinyOptions(),
      fetchColorOptions(),
      fetchShapeOptions(),
      // Add any other data fetching functions
    ])
    .then(() => {
      console.log('All data refreshed successfully');
      setRefreshing(false);
    })
    .catch(error => {
      console.error('Error refreshing data:', error);
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // When on the menu screen, prevent going back further
        return true; // Return true to prevent default behavior
      }
    );

    // Clean up event listener when component unmounts
    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ImageBackground 
          source={require('../../assets/images/feng shui.png')} 
          style={styles.backgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(139,0,0,0.6)', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          >
            <View style={[styles.container, {paddingTop: insets.top}]}>
              {/* Updated header */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Bạn Thích Gì?</Text>
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

              {/* Responsive tab section with full width utilization */}
              <View style={styles.navigationContainer}>
                <View style={styles.navigationRow}>
                  {/* Category dropdown with flexible width */}
                  <TouchableOpacity 
                    style={styles.categoryButton}
                    onPress={() => setTabDropdownVisible(!tabDropdownVisible)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={
                        selectedTab === 'Recommendation' ? 'star' : 
                        selectedTab === 'Koi' ? 'fish' : 'water'
                      } 
                      size={18} 
                      color="#FFF" 
                    />
                    <Text style={styles.categoryButtonText} numberOfLines={1}>
                      {selectedTab === 'Recommendation' ? 'Đề xuất' : 
                       selectedTab === 'Koi' ? 'Cá Koi' : 'Hồ cá'}
                    </Text>
                    <Ionicons name={tabDropdownVisible ? "chevron-up" : "chevron-down"} size={14} color="#FFF" />
                  </TouchableOpacity>

                  {/* Responsive filters container */}
                  {selectedTab === 'Koi' && (
                    <View style={styles.inlineFilters}>
                      <TouchableOpacity 
                        style={styles.filterTag}
                        onPress={() => handleOpenFilter('destiny')}
                      >
                        <Text style={styles.filterTagText} numberOfLines={1}>
                          {filterOptions.destiny !== 'Tất cả' ? filterOptions.destiny : 'Mệnh'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.filterTag}
                        onPress={handleOpenMultipleColorFilter}
                      >
                        <Text style={styles.filterTagText} numberOfLines={1}>
                          {filterOptions.color !== 'Tất cả' ? filterOptions.color : 'Màu'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.applyFilterButton}
                        onPress={fetchFilteredKoi}
                      >
                        <Ionicons name="filter" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {selectedTab === 'Recommendation' && (
                    <View style={styles.inlineFilters}>
                      <TouchableOpacity 
                        style={styles.filterTag}
                        onPress={handleOpenMultipleColorFilter}
                      >
                        <Text style={styles.filterTagText} numberOfLines={1}>
                          {filterOptions.color !== 'Tất cả' ? filterOptions.color : 'Màu sắc'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {selectedTab === 'Pond' && (
                    <View style={styles.inlineFilters}>
                      <TouchableOpacity 
                        style={styles.filterTag}
                        onPress={() => handleOpenFilter('shape')}
                      >
                        <Text style={styles.filterTagText} numberOfLines={1}>
                          {filterOptions.shape !== 'Tất cả' ? filterOptions.shape : 'Hình'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.applyFilterButton}
                        onPress={() => fetchUserPonds('shape', filterOptions.shape)}
                      >
                        <Ionicons name="filter" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {/* Tab dropdown menu overlay */}
                {tabDropdownVisible && (
                  <>
                    <TouchableWithoutFeedback onPress={() => setTabDropdownVisible(false)}>
                      <View style={styles.modalOverlay} />
                    </TouchableWithoutFeedback>
                    <View style={styles.tabDropdownMenu}>
                      <TouchableOpacity 
                        style={[styles.tabMenuItem, selectedTab === 'Recommendation' && styles.activeTabMenuItem]}
                        onPress={() => {
                          handleTabChange('Recommendation');
                          setTabDropdownVisible(false);
                        }}
                      >
                        <Ionicons name="star" size={18} color={selectedTab === 'Recommendation' ? '#FFFFFF' : '#E0E0E0'} />
                        <Text style={styles.tabMenuItemText}>Đề xuất</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.tabMenuItem, selectedTab === 'Koi' && styles.activeTabMenuItem]}
                        onPress={() => {
                          handleTabChange('Koi');
                          setTabDropdownVisible(false);
                        }}
                      >
                        <Ionicons name="fish" size={18} color={selectedTab === 'Koi' ? '#FFFFFF' : '#E0E0E0'} />
                        <Text style={styles.tabMenuItemText}>Cá Koi</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.tabMenuItem, selectedTab === 'Pond' && styles.activeTabMenuItem]}
                        onPress={() => {
                          handleTabChange('Pond');
                          setTabDropdownVisible(false);
                        }}
                      >
                        <Ionicons name="water" size={18} color={selectedTab === 'Pond' ? '#FFFFFF' : '#E0E0E0'} />
                        <Text style={styles.tabMenuItemText}>Hồ cá</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <ScrollView 
                style={styles.mainContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#8B0000']} // Android
                    tintColor="#8B0000" // iOS
                    title="Refreshing..." // iOS
                    titleColor="#8B0000" // iOS
                  />
                }
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
                                  ? (item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/natural_pond.jpg'))
                                  : (item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/koi_image.jpg'))
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
                  </View>
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Không có dữ liệu</Text>
                  </View>
                )}
              </ScrollView>

              {/* Dot pagination indicator */}
              {displayData && displayData.length > 1 && (
                <View style={styles.paginationContainer}>
                  {displayData.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        currentCardIndex === index && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
              )}

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
            </View>
          </LinearGradient>
        </ImageBackground>
        <CustomTabBar />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: width < 375 ? 22 : 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
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
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 8,
    height: '100%',
  },
  searchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 60, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 5,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flex: 0.38, // Take 38% of the row width
    minWidth: 100,
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginHorizontal: 4,
  },
  inlineFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.62, // Take 62% of the row width
    justifyContent: 'flex-end',
  },
  filterTag: {
    backgroundColor: 'rgba(80, 30, 30, 0.8)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1, // Make filter tags grow and shrink equally
    maxWidth: 75,
  },
  filterTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  applyFilterButton: {
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 5,
    width: 32,
    height: 32,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabDropdownMenu: {
    position: 'absolute',
    top: 45,
    left: 16,
    width: 160,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderRadius: 8,
    padding: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  tabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeTabMenuItem: {
    backgroundColor: 'rgba(139, 0, 0, 0.8)',
  },
  tabMenuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.4,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.4,
  },
  noDataText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
  },
  koiCardContainer: {
    width: width,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  koiCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.2)',
    height: Math.min(height * 0.6, 450), 
  },
  image: {
    width: '100%',
    height: '75%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: '25%',
    justifyContent: 'space-between',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 0, 0, 0.1)',
    paddingBottom: 8,
  },
  name: {
    fontSize: width < 375 ? 18 : 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});


