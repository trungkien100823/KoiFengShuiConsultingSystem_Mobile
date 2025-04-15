import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ImageBackground,
  BackHandler,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  FlatList,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { SelectList } from 'react-native-dropdown-select-list';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../components/BackButton';
import { images } from '../../constants/images';
import { koiAPI } from '../../constants/koiData';
import { pondAPI } from '../../constants/koiPond';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthHeaders } from '../../services/authService';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

const colorCodeMap = {
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

const shadeColor = (color, percent) => {
  if (!color) return '#8B0000';
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;  
  G = (G<255)?G:255;  
  B = (B<255)?B:255;  

  R = Math.max(0, R).toString(16).padStart(2, '0');
  G = Math.max(0, G).toString(16).padStart(2, '0');
  B = Math.max(0, B).toString(16).padStart(2, '0');

  return `#${R}${G}${B}`;
}

const ColorSlider = ({ color, index, colorCodeMap, updateColor }) => {
  const [localValue, setLocalValue] = useState(color.percentage);
  
  useEffect(() => {
    setLocalValue(color.percentage);
  }, [color.percentage]);
  
  return (
    <View style={styles.colorControlRow}>
      <View style={styles.colorLabelContainer}>
        <View 
          style={[styles.colorDot, { 
            backgroundColor: colorCodeMap[color.colorName] || '#ccc',
            borderColor: color.colorName === 'Trắng' ? '#ddd' : 'transparent'
          }]} 
        />
        <Text style={styles.colorLabel}>{color.colorName}</Text>
        <Text style={styles.percentageLabel}>{Math.round(localValue)}%</Text>
      </View>
      
      <Slider
        style={styles.colorSlider}
        minimumValue={0}
        maximumValue={100}
        value={localValue}
        onValueChange={setLocalValue}
        onSlidingComplete={(value) => {
          updateColor(index, Math.round(value));
        }}
        minimumTrackTintColor={colorCodeMap[color.colorName] || "#8B0000"}
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor="#8B0000"
        step={1}
      />
    </View>
  );
};

export default function FishDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [koiDetails, setKoiDetails] = useState(null);
  const [colorPercentages, setColorPercentages] = useState({});
  const [blackPercentage, setBlackPercentage] = useState(10);
  const [redPercentage, setRedPercentage] = useState(50);
  const [whitePercentage, setWhitePercentage] = useState(40);
  const [selected, setSelected] = useState("");
  const [selectedPond, setSelectedPond] = useState("");
  const [fishCount, setFishCount] = useState(1);
  const [compatibilityScore, setCompatibilityScore] = useState(0);
  const [compatibilityMessage, setCompatibilityMessage] = useState("");
  const [pondShapes, setPondShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState("");
  const [selectedShapeId, setSelectedShapeId] = useState("");
  const [pondsByShape, setPondsByShape] = useState([]);
  const [selectedPondDetails, setSelectedPondDetails] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshKey, setRefreshKey] = useState(0);
  const [isNavigatingFromMenu, setIsNavigatingFromMenu] = useState(true);
  const scrollViewRef = useRef();
  const [isInputModalVisible, setIsInputModalVisible] = useState(false);
  const [inputModalData, setInputModalData] = useState({ colorName: '', currentValue: 0, colorIndex: 0 });
  const [inputValue, setInputValue] = useState('');

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.1, 1, 1],
    extrapolate: 'clamp'
  });

  const directions = [
    {key: '1', value: 'Đông'},
    {key: '2', value: 'Tây'},
    {key: '3', value: 'Nam'},
    {key: '4', value: 'Bắc'},
    {key: '5', value: 'Đông Bắc'},
    {key: '6', value: 'Tây Bắc'},
    {key: '7', value: 'Đông Nam'},
    {key: '8', value: 'Tây Nam'},
  ];

  const adjustFishCount = (increment) => {
    setFishCount(prevCount => {
      const newCount = increment ? prevCount + 1 : prevCount - 1;
      return Math.max(1, newCount); // Ensure count doesn't go below 1
    });
  };

  const handleShapeSelect = async (val) => {
    try {
      console.log('Giá trị được chọn:', val);
      console.log('Danh sách hình dạng hiện có:', pondShapes);
      
      // Nếu val rỗng hoặc là giá trị mặc định hoặc là "all"
      if (!val || val === "Chọn hình dạng hồ" || val === "all") {
        // Reset các state liên quan đến shape
        setSelectedShape("");
        setSelectedShapeId("");
        
        // Gọi API lấy tất cả hồ
        const allPonds = await pondAPI.getAllPonds();
        console.log('Tất cả các hồ:', allPonds);
        setPondsByShape(allPonds);
        return;
      }

      // Xử lý khi chọn hình dạng cụ thể - tìm theo key thay vì value
      const selectedShape = pondShapes.find(shape => shape.key === val);
      console.log('Hình dạng được chọn:', selectedShape);

      if (selectedShape) {
        setSelectedShape(selectedShape.value);
        setSelectedShapeId(selectedShape.key);

        try {
          // Gọi API để lấy danh sách hồ theo hình dạng
          console.log('Gọi API với shapeId:', selectedShape.key);
          const ponds = await pondAPI.getPondByShape(selectedShape.key);
          console.log('API Response - Danh sách hồ theo hình dạng:', ponds);
          
          if (Array.isArray(ponds) && ponds.length > 0) {
            setPondsByShape(ponds);
          } else {
            console.log('Không có hồ nào được tìm thấy cho hình dạng này');
            setPondsByShape([]);
            Alert.alert(
              "Thông báo", 
              "Không tìm thấy hồ nào có hình dạng này",
              [{ text: "OK" }]
            );
          }
        } catch (apiError) {
          console.error('Lỗi khi gọi API getPondByShape:', apiError);
          Alert.alert(
            "Lỗi",
            "Không thể lấy danh sách hồ. Vui lòng thử lại sau.",
            [{ text: "OK" }]
          );
        }
      } else {
        console.error('Không tìm thấy hình dạng phù hợp với giá trị đã chọn:', val);
        Alert.alert(
          "Lỗi",
          "Không thể xác định hình dạng hồ đã chọn",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Lỗi xử lý chọn hình dạng:', error);
      Alert.alert(
        "Lỗi",
        "Không thể xử lý yêu cầu. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    }
  };

  const handlePondSelect = (pond) => {
    console.log('Chi tiết hồ được chọn:', {
      id: pond.koiPondId,
      name: pond.pondName,
      element: pond.element,
      shape: pond.shapeName
    });
    setSelectedPond(pond.koiPondId);
    setSelectedPondDetails(pond);
  };

  const calculateCompatibility = async () => {
    try {
      // Kiểm tra có dữ liệu màu sắc không
      if (!koiDetails?.colors || koiDetails.colors.length === 0) {
        Alert.alert('Lỗi', 'Không có thông tin màu sắc của cá');
        return;
      }

      // Tính tổng phần trăm các màu
      const totalPercentage = koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0);
      
      // Kiểm tra tổng phần trăm
      if (Math.round(totalPercentage) !== 100) {
        Alert.alert(
          'Lỗi',
          `Tổng phần trăm các màu hiện tại là ${Math.round(totalPercentage)}%. Vui lòng điều chỉnh để tổng bằng 100%`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate các trường bắt buộc
      if (!selectedPondDetails?.shapeName) {
        Alert.alert('Lỗi', 'Vui lòng chọn hình dạng hồ');
        return;
      }

      if (!selected) {
        Alert.alert('Lỗi', 'Vui lòng chọn hướng đặt hồ');
        return;
      }

      if (!fishCount || fishCount <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số lượng cá hợp lệ');
        return;
      }

      // Lấy giá trị direction từ key đã chọn
      const selectedDirection = directions.find(d => d.key === selected)?.value || selected;

      // Tạo colorRatios từ dữ liệu màu (dạng dictionary)
      const colorRatios = {};
      koiDetails.colors.forEach(color => {
        colorRatios[color.colorName] = color.percentage; // Gửi trực tiếp giá trị phần trăm, không chia cho 100
      });

      // Chuẩn bị dữ liệu gửi đi theo đúng model backend
      const calculationData = {
        colorRatios: colorRatios,
        pondShape: selectedPondDetails.shapeName || "Chữ nhật",
        pondDirection: selectedDirection,
        fishCount: parseInt(fishCount)
      };

      console.log('Dữ liệu gửi đi:', calculationData);

      // Gọi API tính toán
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.calculateCompatibility}`,
        calculationData,
        { headers }
      );

      console.log('Kết quả từ API:', response.data);

      if (response.data && response.data.isSuccess) {
        console.log('Response data:', response.data); // Debug log
        console.log('Compatibility score:', response.data.data.compatibilityScore); // Debug log

        router.push({
          pathname: '/(tabs)/calculation_result',
          params: {
            result: response.data.data.compatibilityScore, // Lấy trực tiếp giá trị số
            message: response.data.data.message || response.data.message,
            name: selectedPondDetails?.pondName || 'Chưa đặt tên',
            shapeName: selectedPondDetails?.shapeName,
            direction: selectedDirection,
            fishCount: fishCount,
            // Thêm các params cho việc quay lại
            koiVarietyId: params.koiVarietyId,
            koiName: params.name,
            description: params.description,
            introduction: params.introduction,
            imageName: params.imageName,
            liked: params.liked,
            size: params.size,
            ...koiDetails.colors.reduce((acc, color) => ({
              ...acc,
              [`${color.colorName.toLowerCase()}Percentage`]: color.percentage
            }), {})
          }
        });
      } else {
        throw new Error(response.data.message || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('Lỗi khi tính toán:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tính toán độ tương hợp. Vui lòng thử lại sau.',
        [{ text: "OK" }]
      );
    }
  };

  const resetForm = () => {
    console.log('Đang reset form...');
    setSelected("");
    setSelectedPond("");
    setFishCount(1);
    setSelectedShape("");
    setSelectedShapeId("");
    setSelectedPondDetails(null);
    setHasCalculated(false);
    // Force refresh component bằng cách thay đổi key
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Sửa useEffect để chỉ reset khi đến từ menu
  useEffect(() => {
    // Kiểm tra xem params có chứa timestamp không
    // Nếu không có timestamp thì đang chuyển từ menu
    // Nếu có timestamp thì đang chuyển từ calculation_result
    const isFromMenu = !params.timestamp;
    console.log('Params changed, source:', isFromMenu ? 'menu' : 'calculation_result');
    
    if (isFromMenu) {
      console.log('Đang reset form vì chuyển từ menu...');
      resetForm();
      setIsNavigatingFromMenu(true);
    } else {
      console.log('Không reset form vì quay lại từ calculation_result');
      setIsNavigatingFromMenu(false);
    }
  }, [params.id, params.koiVarietyId, params.timestamp]);

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    const fetchKoiDetails = async () => {
      try {
        const koiId = params.id || params.koiVarietyId;
        console.log('Params received:', params);

        if (!koiId) {
          console.error('No Koi ID in params:', params);
          Alert.alert("Lỗi", "Không thể xác định ID của cá Koi");
          return;
        }

        const response = await koiAPI.getKoiWithColor(koiId);
        console.log('API Response:', response);
        
        if (response && response.isSuccess && response.data) {
          setKoiDetails(response.data);
          
          // Cập nhật các state cho thanh màu từ API
          if (response.data.colors && response.data.colors.length > 0) {
            const colorData = response.data.colors;
            const percentages = {};
            colorData.forEach(color => {
              percentages[color.colorName] = color.percentage;
            });
            setColorPercentages(percentages);

            // Reset về giá trị mặc định trước khi cập nhật
            setBlackPercentage(0);
            setRedPercentage(0);
            setWhitePercentage(0);

            // Cập nhật các state tương ứng với màu
            colorData.forEach(color => {
              const percentage = Number(color.percentage) || 0;
              switch(color.colorName.toLowerCase()) {
                case 'đỏ':
                  setRedPercentage(percentage);
                  break;
                case 'trắng':
                  setWhitePercentage(percentage);
                  break;
                case 'đen':
                  setBlackPercentage(percentage);
                  break;
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching koi details:', error);
        Alert.alert(
          "Lỗi",
          "Không thể lấy thông tin chi tiết. Vui lòng thử lại sau.",
          [{ text: "OK" }]
        );
      }
    };

    fetchKoiDetails();
  }, [params.id, params.koiVarietyId]);

  useEffect(() => {
    const fetchPondShapes = async () => {
      try {
        const shapes = await pondAPI.getAllPondShapes();
        // Thêm option "Tất cả" vào đầu danh sách
        const formattedShapes = [
          { key: 'all', value: 'Tất cả hình dạng' },
          ...shapes.map(shape => ({
            key: shape.shapeId,
            value: `${shape.shapeName} (${shape.element})`
          }))
        ];
        setPondShapes(formattedShapes);
        console.log('Đã lấy được danh sách hình dạng:', formattedShapes);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách hình dạng:', error);
        Alert.alert(
          "Lỗi",
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
          [{ text: "OK" }]
        );
      }
    };

    fetchPondShapes();
  }, []);

  // Thêm useEffect mới để load tất cả hồ khi vào màn hình
  useEffect(() => {
    const fetchAllPonds = async () => {
      try {
        // Gọi API lấy tất cả hồ
        const allPonds = await pondAPI.getAllPonds();
        console.log('Tất cả các hồ khi load màn hình:', allPonds);
        
        if (allPonds.length > 0) {
          setPondsByShape(allPonds);
        } else {
          Alert.alert(
            "Thông báo",
            "Không có hồ nào trong hệ thống",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách hồ:', error);
        Alert.alert(
          "Lỗi",
          "Không thể tải danh sách hồ. Vui lòng thử lại sau.",
          [{ text: "OK" }]
        );
      }
    };

    fetchAllPonds();
  }, []); // Empty dependency array means this runs once when component mounts

  // Add this useEffect to handle hardware back button (optional)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.push('/menu');
      return true; // Prevents default back behavior
    });

    return () => backHandler.remove();
  }, [router]);

  // Calculate this outside of the render to improve performance
  const totalPercentage = useMemo(() => {
    if (!koiDetails?.colors || koiDetails.colors.length === 0) return 0;
    return Math.round(koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0));
  }, [koiDetails?.colors]);

  const updateColorPercentage = (index, newValue) => {
    const updatedColors = [...koiDetails.colors];
    updatedColors[index].percentage = newValue;
    setKoiDetails({...koiDetails, colors: updatedColors});
  };

  const promptColorPercentage = (colorName, currentValue, index) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        `Tỷ lệ màu ${colorName}`,
        "Nhập giá trị phần trăm (0-100)",
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            onPress: (value) => {
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                updateColorPercentage(index, numValue);
              } else {
                Alert.alert('Lỗi', 'Vui lòng nhập số từ 0 đến 100');
              }
            }
          },
        ],
        'plain-text',
        Math.round(currentValue).toString(),
        'number-pad'
      );
    } else {
      setInputValue(Math.round(currentValue).toString());
      setIsInputModalVisible(true);
      setInputModalData({
        colorName,
        currentValue: Math.round(currentValue),
        colorIndex: index
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Hero Image with Parallax Effect */}
        <Animated.View style={[styles.heroContainer, {transform: [{scale: heroScale}]}]}>
      <ImageBackground 
        source={
          koiDetails?.imageUrl
            ? { uri: koiDetails.imageUrl }
            : require('../../assets/images/koi_image.jpg')
        }
            style={styles.heroImage}
      >
        <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
        >
            <TouchableOpacity 
                style={styles.backButtonHero}
              onPress={() => router.push({
                pathname: '/menu',
                  params: { timestamp: Date.now() }
                })}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
                  style={styles.backButtonGradient}
                >
                  <Ionicons name="chevron-back-circle" size={36} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
              
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{params.name || 'Koi Fish'}</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <FontAwesome5 name="ruler" size={14} color="#FFD700" />
                    <Text style={styles.tagText}>{params.size || 'Medium'}</Text>
                  </View>
                  {koiDetails?.element && (
                    <View style={styles.tag}>
                      <MaterialCommunityIcons name="zodiac-chinese" size={14} color="#FFD700" />
                      <Text style={styles.tagText}>{koiDetails.element}</Text>
                </View>
                  )}
              </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>
        
        {/* Main Content - Simplified ScrollView */}
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.contentScroll}
          contentContainerStyle={[styles.contentContainer, { paddingTop: 0 }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: true,
            }
          )}
          scrollEventThrottle={8}
          decelerationRate={0.92}
          bounces={true}
          overScrollMode="always"
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          directionalLockEnabled={true}
          alwaysBounceVertical={true}
        >
          {/* Keep all content sections but remove the id attribute since we no longer need it for navigation */}
              <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="fish" size={20} color="#8B0000" />
              <Text style={styles.sectionTitle}>Giới Thiệu</Text>
            </View>
            
                <Text style={styles.sectionContent}>
                  {koiDetails?.introduction || 'Thông tin đang được cập nhật...'}
                </Text>
            
            {koiDetails?.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Mô Tả Chi Tiết</Text>
                <Text style={styles.descriptionContent}>
                  {koiDetails.description}
                </Text>
              </View>
            )}
              </View>
              
          {/* Elegantly Redesigned Color Configuration Section */}
              <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="palette" size={22} color="#8B0000" />
              <Text style={styles.sectionTitle}>Cấu Hình Màu Sắc</Text>
              
              <View style={[
                styles.headerTotalBadge,
                totalPercentage === 100 ? styles.totalCorrectBadge : styles.totalErrorBadge
              ]}>
                <Text style={styles.totalPercentageText}>{totalPercentage}%</Text>
                {totalPercentage === 100 ? (
                  <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.totalIcon} />
                ) : (
                  <Ionicons name="alert-circle" size={16} color="#fff" style={styles.totalIcon} />
                )}
              </View>
            </View>
            
            {/* Color Preview Bar with Percentage Labels */}
            {koiDetails?.colors && koiDetails.colors.length > 0 && (
              <View style={styles.colorDistributionContainer}>
                <View style={styles.paletteContainer}>
                  {koiDetails.colors.map((color, index) => (
                      <View 
                      key={index} 
                      style={[
                        styles.paletteSegment,
                        { 
                          backgroundColor: colorCodeMap[color.colorName] || '#ccc',
                          width: `${color.percentage}%`,
                        }
                      ]}
                    >
                      {color.percentage >= 10 && (
                        <Text style={[
                          styles.segmentLabel,
                          {color: ['Trắng', 'Vàng'].includes(color.colorName) ? '#333' : '#fff'}
                        ]}>
                          {Math.round(color.percentage)}%
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Enhanced Color Control Cards with Type Input Option */}
            <View style={styles.colorControlGrid}>
              {koiDetails?.colors && koiDetails.colors.map((color, index) => {
                const colorHex = colorCodeMap[color.colorName] || '#8B0000';
                const isDarkColor = ['Đen', 'XanhDương', 'XanhLá', 'Nâu', 'Tím', 'Đỏ'].includes(color.colorName);
                
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.colorControlCard,
                      { 
                        borderLeftWidth: 5,
                        borderLeftColor: colorHex
                      }
                    ]}
                  >
                    {/* Color Header */}
                    <View style={styles.colorHeaderRow}>
                      <View style={[styles.colorSwatch, { backgroundColor: colorHex }]} />
                      <Text style={styles.colorCardTitle}>{color.colorName}</Text>
                      
                      {/* Direct Input Button */}
                      <TouchableOpacity 
                        style={styles.inputModeButton}
                        onPress={() => promptColorPercentage(color.colorName, color.percentage, index)}
                      >
                        <MaterialIcons name="edit" size={16} color="#555" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Adjustment Controls */}
                    <View style={styles.colorValueRow}>
                      <TouchableOpacity 
                        style={[
                          styles.decrementButton, 
                          color.percentage <= 0 && styles.disabledControlButton
                        ]}
                        onPress={() => {
                          if (color.percentage >= 5) {
                            updateColorPercentage(index, color.percentage - 5);
                          } else if (color.percentage > 0) {
                            updateColorPercentage(index, 0);
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={color.percentage <= 0}
                      >
                        <AntDesign 
                          name="minus" 
                          size={18} 
                          color={color.percentage <= 0 ? "#bbb" : "#fff"} 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.valueDisplay}
                        onPress={() => promptColorPercentage(color.colorName, color.percentage, index)}
                      >
                        <Text style={styles.valueText}>{Math.round(color.percentage)}%</Text>
                        <LinearGradient
                          colors={[colorHex, shadeColor(colorHex, -20)]}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 0}}
                          style={[
                            styles.progressBar,
                            { width: `${Math.min(color.percentage, 100)}%` },
                          ]}
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.incrementButton,
                          color.percentage >= 100 && styles.disabledControlButton
                        ]}
                        onPress={() => {
                          if (color.percentage <= 95) {
                            updateColorPercentage(index, color.percentage + 5);
                          } else if (color.percentage < 100) {
                            updateColorPercentage(index, 100);
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={color.percentage >= 100}
                      >
                        <AntDesign 
                          name="plus" 
                          size={18} 
                          color={color.percentage >= 100 ? "#bbb" : "#fff"} 
                        />
                      </TouchableOpacity>
                      </View>
                    
                    {/* Fine Adjustment Buttons */}
                    <View style={styles.fineAdjustRow}>
                      <TouchableOpacity 
                        style={[styles.fineAdjustButton, color.percentage <= 0 && styles.disabledFineButton]}
                        onPress={() => {
                          if (color.percentage >= 1) {
                            updateColorPercentage(index, color.percentage - 1);
                          }
                        }}
                        disabled={color.percentage <= 0}
                      >
                        <Text style={[styles.fineAdjustText, color.percentage <= 0 && styles.disabledFineText]}>-1</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.fineAdjustButton, color.percentage <= 0 && styles.disabledFineButton]}
                        onPress={() => {
                          if (color.percentage >= 10) {
                            updateColorPercentage(index, color.percentage - 10);
                          } else if (color.percentage > 0) {
                            updateColorPercentage(index, 0);
                          }
                        }}
                        disabled={color.percentage <= 0}
                      >
                        <Text style={[styles.fineAdjustText, color.percentage <= 0 && styles.disabledFineText]}>-10</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.fineAdjustSpacer} />
                      
                      <TouchableOpacity 
                        style={[styles.fineAdjustButton, color.percentage >= 100 && styles.disabledFineButton]}
                        onPress={() => {
                          if (color.percentage <= 90) {
                            updateColorPercentage(index, color.percentage + 10);
                          } else if (color.percentage < 100) {
                            updateColorPercentage(index, 100);
                          }
                        }}
                        disabled={color.percentage >= 100}
                      >
                        <Text style={[styles.fineAdjustText, color.percentage >= 100 && styles.disabledFineText]}>+10</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.fineAdjustButton, color.percentage >= 100 && styles.disabledFineButton]}
                        onPress={() => {
                          if (color.percentage <= 99) {
                            updateColorPercentage(index, color.percentage + 1);
                          }
                        }}
                        disabled={color.percentage >= 100}
                      >
                        <Text style={[styles.fineAdjustText, color.percentage >= 100 && styles.disabledFineText]}>+1</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
                </View>
                
            {/* Validation Message */}
            {totalPercentage !== 100 && (
              <View style={styles.validationMessage}>
                <Ionicons name="information-circle" size={22} color="#f57c00" />
                <Text style={styles.validationText}>
                  Tổng phần trăm cần bằng 100% để có thể tính toán chính xác
                  </Text>
              </View>
                )}
              </View>
              
          {/* Pond Configuration Section */}
              <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="water" size={20} color="#8B0000" />
              <Text style={styles.sectionTitle}>Chọn Hồ Cá</Text>
            </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Hình Dạng Hồ</Text>
              <View style={styles.shapeSelectionContainer}>
                  <SelectList
                    setSelected={handleShapeSelect}
                    data={pondShapes}
                    placeholder="Chọn hình dạng hồ"
                    boxStyles={styles.selectBox}
                    dropdownStyles={styles.dropdown}
                    inputStyles={styles.selectInput}
                    dropdownTextStyles={styles.dropdownText}
                    search={false}
                  />
              </View>
                </View>
                
            {/* Pond Carousel */}
            <View style={styles.pondCarouselContainer}>
              <Text style={styles.carouselTitle}>Các Hồ Khả Dụng</Text>
                  
                  {pondsByShape.length > 0 ? (
                <FlatList
                  data={pondsByShape}
                  keyExtractor={(item, index) => `pond-${item.koiPondId || index}`}
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContent}
                  renderItem={({item}) => (
                        <TouchableOpacity 
                          style={[
                            styles.pondCard,
                        selectedPond === item.koiPondId && styles.selectedPondCard
                          ]}
                      onPress={() => handlePondSelect(item)}
                      activeOpacity={0.8}
                        >
                          <Image 
                            source={
                          item.shapeName === 'Hình chữ nhật' ? require('../../assets/images/natural_pond.jpg') :
                          item.shapeName === 'Hình tròn' ? require('../../assets/images/raised_pond.jpg') :
                          item.shapeName === 'Hình bầu dục' ? require('../../assets/images/zen_pond.jpg') :
                              require('../../assets/images/formal_pond.jpg')
                            }
                        style={styles.pondCardImage}
                          />
                      
                      {selectedPond === item.koiPondId && (
                        <View style={styles.selectedPondOverlay}>
                              <AntDesign name="checkcircle" size={24} color="#FFF" />
                            </View>
                          )}
                      
                      <View style={styles.pondCardInfo}>
                        <Text style={styles.pondCardName}>{item.pondName}</Text>
                        <Text style={styles.pondCardShape}>{item.shapeName}</Text>
                          </View>
                        </TouchableOpacity>
                  )}
                />
                  ) : (
                    <View style={styles.emptyPondsContainer}>
                  <Ionicons name="water-outline" size={40} color="#ccc" />
                      <Text style={styles.emptyPondsText}>
                    Không tìm thấy hồ phù hợp
                      </Text>
                    </View>
                  )}
                </View>
                
                {selectedPondDetails && (
              <View style={styles.selectedPondDetails}>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Hình dạng</Text>
                    <Text style={styles.detailValue}>{selectedPondDetails.shapeName}</Text>
                    </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Nguyên tố</Text>
                    <Text style={styles.detailValue}>{selectedPondDetails.element}</Text>
                      </View>
                      </View>
                      
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Diện tích</Text>
                    <Text style={styles.detailValue}>{selectedPondDetails.area} m²</Text>
                      </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Hướng</Text>
                  <SelectList
                    setSelected={setSelected}
                    data={directions}
                      placeholder="Chọn hướng"
                      boxStyles={styles.miniSelectBox}
                      dropdownStyles={styles.miniDropdown}
                      inputStyles={styles.miniSelectInput}
                      dropdownTextStyles={styles.miniDropdownText}
                    search={false}
                  />
                </View>
                </View>
              </View>
            )}
                
            <View style={styles.fishCountContainer}>
              <Text style={styles.fishCountLabel}>Số Lượng Cá</Text>
                  <View style={styles.fishCountControl}>
                    <TouchableOpacity 
                      style={[
                        styles.countButton,
                        fishCount <= 1 && styles.disabledButton
                      ]}
                      onPress={() => adjustFishCount(false)}
                      disabled={fishCount <= 1}
                    >
                  <AntDesign name="minus" size={20} color={fishCount <= 1 ? "#999" : "#FFF"} />
                    </TouchableOpacity>
                    
                <Text style={styles.fishCountValue}>{fishCount}</Text>
                    
                    <TouchableOpacity 
                      style={styles.countButton}
                      onPress={() => adjustFishCount(true)}
                    >
                      <AntDesign name="plus" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
          {/* Calculation Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calculator-variant" size={20} color="#8B0000" />
              <Text style={styles.sectionTitle}>Tính Phong Thủy</Text>
            </View>
            
            <View style={styles.calculationSummary}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="color-lens" size={18} color="#8B0000" />
                  <Text style={styles.summaryLabel}>Màu sắc:</Text>
                  <Text style={styles.summaryValue}>
                    {koiDetails?.colors && koiDetails.colors.length > 0 
                      ? koiDetails.colors.map(c => c.colorName).join(', ')
                      : 'Chưa cấu hình'
                    }
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="water" size={18} color="#8B0000" />
                  <Text style={styles.summaryLabel}>Hồ:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedPondDetails ? selectedPondDetails.pondName : 'Chưa chọn'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="compass" size={18} color="#8B0000" />
                  <Text style={styles.summaryLabel}>Hướng:</Text>
                  <Text style={styles.summaryValue}>
                    {selected ? directions.find(d => d.key === selected)?.value : 'Chưa chọn'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <FontAwesome5 name="fish" size={18} color="#8B0000" />
                  <Text style={styles.summaryLabel}>Số lượng:</Text>
                  <Text style={styles.summaryValue}>{fishCount} con</Text>
                </View>
              </View>
            </View>
            
              <TouchableOpacity 
              style={styles.calculateButton}
                onPress={calculateCompatibility}
              >
                <LinearGradient
                colors={['#8B0000', '#5a0000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                style={styles.calculateGradient}
                >
                <Text style={styles.calculateText}>Tính Tương Hợp</Text>
                <MaterialIcons name="calculate" size={22} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
          </View>
          
          <View style={styles.bottomPadding} />
        </Animated.ScrollView>
                  </View>
                  
      {Platform.OS === 'android' && (
        <Modal
          visible={isInputModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsInputModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Tỷ lệ màu {inputModalData.colorName}</Text>
              <Text style={styles.modalSubtitle}>Nhập giá trị phần trăm (0-100)</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Giá trị phần trăm:</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    (inputValue && (isNaN(parseInt(inputValue, 10)) || 
                      parseInt(inputValue, 10) < 0 || 
                      parseInt(inputValue, 10) > 100)) && styles.inputError
                  ]}
                  keyboardType="number-pad"
                  value={inputValue}
                  onChangeText={(text) => {
                    // Allow only numbers
                    if (text === '' || /^\d+$/.test(text)) {
                      setInputValue(text);
                    }
                  }}
                  maxLength={3}
                  autoFocus
                  selectTextOnFocus
                  placeholder="0-100"
                  placeholderTextColor="#aaa"
                />
                <View style={styles.valueRange}>
                  <Text style={styles.rangeLabel}>0</Text>
                  <View style={styles.rangeLine} />
                  <Text style={styles.rangeLabel}>100</Text>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsInputModalVisible(false);
                    setInputValue('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    const numValue = parseInt(inputValue || inputModalData.currentValue, 10);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      updateColorPercentage(inputModalData.colorIndex, numValue);
                      setIsInputModalVisible(false);
                      setInputValue('');
                    } else {
                      Alert.alert('Lỗi', 'Vui lòng nhập số từ 0 đến 100');
                    }
                  }}
                >
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                </TouchableOpacity>
            </View>
    </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 280,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight + 10),
  },
  backButtonHero: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 6,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  descriptionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  colorControlsWrapper: {
    marginBottom: 15,
  },
  colorCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  colorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  colorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  colorAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabledAdjustButton: {
    backgroundColor: '#e0e0e0',
  },
  percentageBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  percentageBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  percentageBar: {
    height: '100%',
    borderRadius: 3,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
    padding: 16,
    borderRadius: 12,
  },
  totalCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  totalError: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  totalValueCorrect: {
    color: '#4CAF50',
  },
  totalValueError: {
    color: '#F44336',
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  colorPreview: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  colorPreviewSegment: {
    height: '100%',
  },
  shapeSelectionContainer: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 10,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectInput: {
    color: '#333',
    fontSize: 15,
  },
  dropdownText: {
    color: '#333',
    fontSize: 15,
  },
  pondCarouselContainer: {
    marginBottom: 20,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 12,
  },
  carouselContent: {
    paddingVertical: 8,
  },
  pondCard: {
    width: 180,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedPondCard: {
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  pondCardImage: {
    width: '100%',
    height: 160,
  },
  selectedPondOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pondCardInfo: {
    padding: 10,
    backgroundColor: '#fff',
    height: 60,
  },
  pondCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  pondCardShape: {
    fontSize: 12,
    color: '#777',
  },
  emptyPondsContainer: {
    height: 180,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  emptyPondsText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  selectedPondDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  miniSelectBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    height: 40,
    backgroundColor: '#fff',
  },
  miniDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  miniSelectInput: {
    color: '#333',
    fontSize: 14,
  },
  miniDropdownText: {
    color: '#333',
    fontSize: 14,
  },
  fishCountContainer: {
    alignItems: 'center',
  },
  fishCountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 10,
  },
  fishCountControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    padding: 5,
    width: 180,
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
    elevation: 2,
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  fishCountValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
  },
  calculationSummary: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryRow: {
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  calculateButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calculateGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  calculateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  bottomPadding: {
    height: 40,
  },
  colorDistributionContainer: {
    marginBottom: 20,
  },
  paletteContainer: {
    height: 40,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  paletteSegment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  totalPercentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 'auto',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  totalCorrectBadge: {
    backgroundColor: '#4CAF50',
  },
  totalErrorBadge: {
    backgroundColor: '#f44336',
  },
  totalPercentageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalIcon: {
    marginLeft: 4,
  },
  colorControlGrid: {
    marginBottom: 15,
  },
  colorControlCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  colorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  colorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  decrementButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  incrementButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabledControlButton: {
    backgroundColor: '#e0e0e0',
  },
  valueDisplay: {
    flex: 1,
    height: 38,
    marginHorizontal: 10,
    borderRadius: 19,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  valueText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
    zIndex: 2,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.7,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
  },
  validationText: {
    flex: 1,
    marginLeft: 8,
    color: '#e65100',
    fontSize: 14,
  },
  inputModeButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  fineAdjustRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  fineAdjustButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledFineButton: {
    backgroundColor: '#f8f8f8',
    borderColor: '#eee',
  },
  fineAdjustText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  disabledFineText: {
    color: '#bbb',
  },
  fineAdjustSpacer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: '100%',
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  valueRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  rangeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#8B0000',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 'auto',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
}); 