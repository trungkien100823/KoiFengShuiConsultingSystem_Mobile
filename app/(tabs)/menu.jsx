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
    try {
      setFetchingFilterOptions(true);
      setApiErrors(prev => ({ ...prev, shape: false }));
      
      // Thử sử dụng pondAPI.getAllPondShapes nếu có
      if (pondAPI && pondAPI.getAllPondShapes) {
        try {
          const shapes = await pondAPI.getAllPondShapes();
          if (Array.isArray(shapes) && shapes.length > 0) {
            // Lọc các hình dạng duy nhất từ API
            const uniqueShapes = new Set();
            uniqueShapes.add('Tất cả');
            
            shapes.forEach(shape => {
              if (shape.shapeName) {
                uniqueShapes.add(shape.shapeName);
              }
            });
            
            setShapeOptions(Array.from(uniqueShapes));
            return;
          } else {
            throw new Error('Không tìm thấy dữ liệu hình dạng hồ');
          }
        } catch (innerError) {
          console.error('Lỗi khi gọi pondAPI.getAllPondShapes:', innerError);
          throw innerError;
        }
      }
      
      // Nếu không sử dụng được pondAPI, tiếp tục với fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API trả về mã lỗi ${response.status}`);
        }
        
        const responseText = await response.text();
        const responseJson = JSON.parse(responseText);
        
        if (responseJson && responseJson.isSuccess && Array.isArray(responseJson.data)) {
          // Lọc các hình dạng duy nhất từ API
          const uniqueShapes = new Set();
          uniqueShapes.add('Tất cả');
          
          responseJson.data.forEach(shape => {
            if (shape.shapeName) {
              uniqueShapes.add(shape.shapeName);
            }
          });
          
          if (uniqueShapes.size > 1) {
            setShapeOptions(Array.from(uniqueShapes));
          } else {
            throw new Error('Không có đủ dữ liệu hình dạng hồ');
          }
        } else {
          throw new Error('API trả về dữ liệu không hợp lệ');
        }
      } catch (fetchError) {
        console.error('Lỗi fetch shapes:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching shape options:', error);
      setApiErrors(prev => ({ ...prev, shape: true }));
      setShapeOptions(['Tất cả']); // Chỉ giữ lại "Tất cả", không dùng data mẫu
    } finally {
      setFetchingFilterOptions(false);
    }
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
      
      // Kiểm tra xem đã tải dữ liệu bộ lọc chưa
      if (
        (filterType === 'destiny' && destinyOptions.length <= 1) ||
        (filterType === 'color' && colorOptions.length <= 1) ||
        (filterType === 'shape' && shapeOptions.length <= 1)
      ) {
        // Tải dữ liệu bộ lọc nếu chưa có
        if (filterType === 'destiny') {
          fetchDestinyOptions();
        } else if (filterType === 'color') {
          fetchColorOptions();
        } else if (filterType === 'shape') {
          fetchShapeOptions();
        }
      }
      
      setSortVisible(true);
    } else {
      Alert.alert("Thông báo", "Bộ lọc không khả dụng cho tab hiện tại");
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
      
      // Thử sử dụng phương thức từ koiAPI thay vì gọi fetch trực tiếp
      try {
        if (koiAPI.getUserKoi) {
          let element = null;
          let color = null;
          
          if ((filterType === 'destiny' && filterValue !== 'Tất cả') || 
              (filterOptions.destiny !== 'Tất cả')) {
            element = filterType === 'destiny' ? filterValue : filterOptions.destiny;
          }
          
          if ((filterType === 'color' && filterValue !== 'Tất cả') || 
              (filterOptions.color !== 'Tất cả')) {
            const colorVal = filterType === 'color' ? filterValue : filterOptions.color;
            color = getOriginalColorEnum(colorVal);
          }
          
          const data = await koiAPI.getUserKoi(element, color);
          if (Array.isArray(data)) {
            setDisplayData(data);
            return;
          }
        }
      } catch (innerError) {
        console.log('Fallback to direct API call for user koi');
      }
      
      // Nếu không sử dụng được koiAPI, tiếp tục với fetch
      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.userKoi}`;
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
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }
      
      // Thử đọc text trước để kiểm tra valid JSON
      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        
      if (Array.isArray(data)) {
        setDisplayData(data);
        if (data[0]?.message && !hasShownAlert) {
          Alert.alert(
            "Thông báo",
            data[0].message,
            [{ text: "OK" }]
          );
          setHasShownAlert(true);
        }
      } else {
        setDisplayData([]);
        }
      } catch (jsonError) {
        console.error('JSON parse error:', responseText.substring(0, 100) + '...');
        throw jsonError;
      }
    } catch (error) {
      console.error('Error fetching Koi:', error);
      setDisplayData([]);
      
      // Hiển thị thông báo lỗi
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách cá Koi. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPonds = async (filterType, filterValue) => {
    try {
      setIsLoading(true);
      
      let url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPonds}`;
      
      // Nếu đang lọc theo hình dạng và không phải "Tất cả"
      if ((filterType === 'shape' && filterValue !== 'Tất cả') || 
          (filterOptions.shape !== 'Tất cả' && !filterType)) {
        const shapeValue = filterType === 'shape' ? filterValue : filterOptions.shape;
        
        // Tìm shapeId từ API
        const shapeId = await getShapeIdByName(shapeValue);
        
        if (shapeId) {
          url = `${API_CONFIG.baseURL}/api/KoiPond/get-by-shape/${shapeId}`;
          console.log('Gọi API lọc hồ cá theo hình dạng:', url);
        }
      }
      
      const response = await fetch(url);
      const responseText = await response.text();
      console.log('Response từ API:', responseText);
      
      const responseData = JSON.parse(responseText);

      if (responseData.isSuccess && Array.isArray(responseData.data)) {
        if (responseData.data.length === 0) {
          setDisplayData([]);
          Alert.alert(
            "Thông báo",
            "Không tìm thấy hồ cá phù hợp với hình dạng đã chọn",
            [{ text: "OK" }]
          );
        } else {
          const mappedData = responseData.data.map(pond => ({
            koiPondId: pond.koiPondId,
            pondName: pond.pondName,
            shapeName: pond.shapeName,
            element: pond.element,
            introduction: pond.introduction,
            description: pond.description,
            imageName: 'buddha.png'
          }));
          setDisplayData(mappedData);
        }
      } else {
        setDisplayData([]);
        Alert.alert(
          "Thông báo",
          responseData.message || "Không thể tải danh sách hồ cá",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error fetching ponds:', error);
      setDisplayData([]);
      Alert.alert(
        "Thông báo",
        "Đã xảy ra lỗi khi tải danh sách hồ cá",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm hỗ trợ để lấy shapeId từ shapeName
  const getShapeIdByName = async (shapeName) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.allPondShapes}`);
      const responseData = await response.json();

      if (responseData.isSuccess && Array.isArray(responseData.data)) {
        const shape = responseData.data.find(s => s.shapeName === shapeName);
        return shape ? shape.shapeId : null;
      }
      return null;
    } catch (error) {
      console.error('Error getting shape ID:', error);
      return null;
    }
  };

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Màn hình Menu được focus - Tải lại dữ liệu');
      handleRetryFilterOptions();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bạn Thích Gì?</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBarFull}>
          <TextInput
            placeholder="Tìm kiếm ở đây"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search-circle" size={30} color="#8B0000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
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

      {selectedTab === 'Koi' && (
        <View style={styles.filterSummaryContainer}>
          <View style={styles.filterTagsRow}>
            <TouchableOpacity 
              style={styles.filterTag}
              onPress={() => handleOpenFilter('destiny')}
            >
              <Text style={styles.filterTagLabel}>Bản mệnh:</Text>
              <Text style={styles.filterTagValue}>{filterOptions.destiny}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterTag}
              onPress={handleOpenMultipleColorFilter}
            >
              <Text style={styles.filterTagLabel}>Màu sắc:</Text>
              <Text style={styles.filterTagValue}>{filterOptions.color}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={fetchFilteredKoi}
            >
              <Text style={styles.filterButtonText}>Lọc</Text>
            </TouchableOpacity>
          </View>
          
          {/* Hiển thị các phần tử tương thích */}
          {compatibleElementsMessage ? (
            <View style={styles.compatibleElementsContainer}>
              <Text style={styles.compatibleElementsMessage}>{compatibleElementsMessage}</Text>
              {selectedCompatibleElements.length > 0 && (
                <View style={styles.compatibleElementsTagsRow}>
                  {selectedCompatibleElements.map((element, index) => (
                    <View key={index} style={styles.compatibleElementTag}>
                      <Text style={styles.compatibleElementTagText}>{element}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </View>
      )}

      {selectedTab === 'Pond' && (
        <View style={styles.filterSummaryContainer}>
          <View style={styles.filterTagsRow}>
            <TouchableOpacity 
              style={styles.filterTag}
              onPress={() => handleOpenFilter('shape')}
            >
              <Text style={styles.filterTagLabel}>Hình dạng:</Text>
              <Text style={styles.filterTagValue}>{filterOptions.shape}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
          </View>
        ) : displayData && displayData.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {displayData.map((item, index) => (
              <View key={`${selectedTab}-${item.koiPondId || index}`} style={styles.card}>
                <Image 
                  source={
                    selectedTab === 'Pond' 
                      ? (item.imageName && images[item.imageName] 
                          ? images[item.imageName] 
                          : images['buddha.png'])
                      : (item.imageName && images[item.imageName] 
                          ? images[item.imageName] 
                          : images['buddha.png'])
                  } 
                  style={styles.image}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Image loading error:', error.nativeEvent.error);
                  }}
                />
                <View style={styles.infoContainer}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.name}>
                      {selectedTab === 'Pond' ? (item.pondName || 'Không có tên') : item.name}
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
            ))}
          </ScrollView>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 70 : 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  searchBarFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 5,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B0000',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  selectedTabText: {
    color: '#8B0000',
    fontWeight: '500',
  },
  card: {
    width: width,
    padding: 20,
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    marginBottom: 15,
  },
  infoContainer: {
    padding: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  variant: {
    fontSize: 24,
    color: '#8B0000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  filterSummaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterTagLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  filterTagValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginRight: 6,
  },
  filterButton: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  filterButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  compatibleElementsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  compatibleElementsMessage: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
  },
  compatibleElementsTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  compatibleElementTag: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 4,
  },
  compatibleElementTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

