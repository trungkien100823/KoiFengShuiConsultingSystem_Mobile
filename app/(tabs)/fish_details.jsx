import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

// Update the color constants for better contrast and elegance
const COLORS = {
  primary: '#8B0000',        // Wine red
  primaryLight: '#D9B3B3',   // Soft red for backgrounds
  primaryDark: '#5A0000',    // Deep red for accents
  white: '#FFFFFF',
  offWhite: '#F9F9F9',       // For subtle background variations
  black: '#000000',
  gray: '#555555',
  lightGray: '#EAEAEA',
  background: '#F5F5F5',
  gold: '#D4AF37',           // For accent highlights
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
  const scrollY = new Animated.Value(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isNavigatingFromMenu, setIsNavigatingFromMenu] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [fadeAnim, setFadeAnim] = useState(new Animated.Value(1));
  const [slideAnim, setSlideAnim] = useState(new Animated.Value(0));

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
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
      
      // Nếu val rỗng hoặc là giá trị mặc định hoặc là "all"
      if (!val || val === "Chọn hình dạng hồ" || val === "all") {
        // Reset các state liên quan đến shape
        setSelectedShape("");
        setSelectedShapeId("");
        
        // Gọi API lấy tất cả hồ
        const allPonds = await pondAPI.getAllPonds();
        setPondsByShape(allPonds);
        return;
      }

      // Xử lý khi chọn hình dạng cụ thể - tìm theo key thay vì value
      const selectedShape = pondShapes.find(shape => shape.key === val);
      

      if (selectedShape) {
        setSelectedShape(selectedShape.value);
        setSelectedShapeId(selectedShape.key);

        try {
          // Gọi API để lấy danh sách hồ theo hình dạng
          
          const ponds = await pondAPI.getPondByShape(selectedShape.key);
          
          
          if (Array.isArray(ponds) && ponds.length > 0) {
            setPondsByShape(ponds);
          } else {
            
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


      // Gọi API tính toán
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_CONFIG.endpoints.calculateCompatibility}`,
        calculationData,
        { headers }
      );


      if (response.data && response.data.isSuccess) {
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
    
    if (isFromMenu) {
      resetForm();
      setIsNavigatingFromMenu(true);
    } else {
      setIsNavigatingFromMenu(false);
    }
  }, [params.id, params.koiVarietyId, params.timestamp]);

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    const fetchKoiDetails = async () => {
      try {
        const koiId = params.id || params.koiVarietyId;
        

        if (!koiId) {
          console.error('No Koi ID in params:', params);
          Alert.alert("Lỗi", "Không thể xác định ID của cá Koi");
          return;
        }

        const response = await koiAPI.getKoiWithColor(koiId);
        
        
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

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
      setFadeAnim(new Animated.Value(1));
      setSlideAnim(new Animated.Value(0));
    } else {
      setExpandedSection(section);
      setFadeAnim(new Animated.Value(0));
      setSlideAnim(new Animated.Value(-100));
    }
  };

  const handleColorChange = (index, value) => {
    const updatedColors = [...koiDetails.colors];
    updatedColors[index].percentage = Math.round(value);
    setKoiDetails({...koiDetails, colors: updatedColors});
  };

  const getDirectionIconName = (direction) => {
    switch (direction) {
      case 'Đông':
        return 'arrow-right';
      case 'Tây':
        return 'arrow-left';
      case 'Nam':
        return 'arrow-down';
      case 'Bắc':
        return 'arrow-up';
      case 'Đông Bắc':
        return 'arrow-top-right';
      case 'Tây Bắc':
        return 'arrow-top-left';
      case 'Đông Nam':
        return 'arrow-bottom-right';
      case 'Tây Nam':
        return 'arrow-bottom-left';
      default:
        return 'compass';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      {/* Header with cleaner gradient and better shadow */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/menu')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết cá Koi</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Enhanced Hero Section with better overlay gradient */}
        <View style={styles.heroSection}>
          <Image
            source={
              koiDetails?.imageUrl
                ? { uri: koiDetails.imageUrl }
                : require('../../assets/images/koi_image.jpg')
            }
            style={styles.fishImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.6, 1]}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <Text style={styles.fishName}>{params.name || 'Koi Fish'}</Text>
              <View style={styles.tagContainer}>
                <View style={styles.tag}>
                  <FontAwesome5 name="ruler" size={12} color={COLORS.gold} />
                  <Text style={styles.tagText}>{params.size || 'Medium'}</Text>
                </View>
                {koiDetails?.element && (
                  <View style={styles.tag}>
                    <MaterialCommunityIcons name="water" size={12} color={COLORS.gold} />
                    <Text style={styles.tagText}>{koiDetails.element}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Main Content with Improved Cards */}
        <View style={styles.mainContent}>
          {/* Description Card with better typography */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.cardTitle}>Thông tin</Text>
            </View>
            <Text style={styles.descriptionText}>
              {koiDetails?.description || 'Thông tin đang được cập nhật...'}
            </Text>
          </View>

          {/* Color Configuration Card with enhanced UI */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="palette-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.cardTitle}>Tỷ lệ màu sắc</Text>
            </View>
            
            {/* Color Preview Bar */}
            <View style={styles.colorPreviewContainer}>
              <View style={styles.colorPreview}>
                {koiDetails?.colors?.map((color, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.colorStrip,
                      {
                        backgroundColor: colorCodeMap[color.colorName] || '#ccc',
                        flex: color.percentage / 100,
                        borderWidth: color.colorName === 'Trắng' ? 1 : 0,
                        borderColor: COLORS.lightGray
                      }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Color Controls with numeric inputs */}
            <View style={styles.colorControls}>
              {koiDetails?.colors?.map((color, index) => (
                <View key={index} style={styles.colorControl}>
                  {/* Color name and dot */}
                  <View style={styles.colorInfo}>
                    <View 
                      style={[
                        styles.colorDot,
                        { 
                          backgroundColor: colorCodeMap[color.colorName] || '#ccc',
                          borderWidth: color.colorName === 'Trắng' ? 1 : 0,
                          borderColor: COLORS.lightGray
                        }
                      ]} 
                    />
                    <Text style={styles.colorLabel}>{color.colorName}</Text>
                  </View>
                  
                  {/* Percentage Controls */}
                  <View style={styles.percentageControl}>
                    {/* Minus button */}
                    <TouchableOpacity 
                      style={[
                        styles.percentageButton,
                        color.percentage <= 0 && styles.disabledButton
                      ]}
                      onPress={() => {
                        if (color.percentage > 0) {
                          const updatedColors = [...koiDetails.colors];
                          updatedColors[index].percentage = Math.max(0, Math.round(color.percentage) - 5);
                          setKoiDetails({...koiDetails, colors: updatedColors});
                        }
                      }}
                      disabled={color.percentage <= 0}
                      activeOpacity={0.7}
                    >
                      <AntDesign 
                        name="minus" 
                        size={16} 
                        color={color.percentage <= 0 ? COLORS.lightGray : COLORS.primary} 
                      />
                    </TouchableOpacity>
                    
                    {/* Typeable percentage input */}
                    <View style={[
                      styles.percentageValueContainer,
                      { borderColor: colorCodeMap[color.colorName] || COLORS.primary }
                    ]}>
                      <TextInput
                        style={styles.percentageInput}
                        value={Math.round(color.percentage).toString()}
                        keyboardType="number-pad"
                        maxLength={3}
                        selectTextOnFocus
                        onChangeText={(text) => {
                          const value = parseInt(text) || 0;
                          const updatedColors = [...koiDetails.colors];
                          updatedColors[index].percentage = Math.min(100, Math.max(0, value));
                          setKoiDetails({...koiDetails, colors: updatedColors});
                        }}
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                    </View>
                    
                    {/* Plus button */}
                    <TouchableOpacity 
                      style={[
                        styles.percentageButton,
                        color.percentage >= 100 && styles.disabledButton
                      ]}
                      onPress={() => {
                        if (color.percentage < 100) {
                          const updatedColors = [...koiDetails.colors];
                          updatedColors[index].percentage = Math.min(100, Math.round(color.percentage) + 5);
                          setKoiDetails({...koiDetails, colors: updatedColors});
                        }
                      }}
                      disabled={color.percentage >= 100}
                      activeOpacity={0.7}
                    >
                      <AntDesign 
                        name="plus" 
                        size={16} 
                        color={color.percentage >= 100 ? COLORS.lightGray : COLORS.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Fine-tune adjustment note */}
            <Text style={styles.adjustmentNote}>
              Sử dụng nút +/- hoặc nhập trực tiếp để điều chỉnh tỷ lệ màu sắc
            </Text>

            {/* Total percentage indicator */}
            {koiDetails?.colors && (
              <View style={styles.totalPercentageContainer}>
                <Text style={styles.totalPercentageLabel}>Tổng phần trăm:</Text>
                <Text style={[
                  styles.totalPercentageValue,
                  Math.round(koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0)) === 100
                    ? styles.totalCorrect
                    : styles.totalIncorrect
                ]}>
                  {Math.round(koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0))}%
                </Text>
              </View>
            )}
          </View>

          {/* Pond Configuration Card with better layout */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="waves" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.cardTitle}>Cấu hình hồ</Text>
            </View>

            {/* Shape Selection with better styled dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hình dạng hồ</Text>
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

            {/* Pond Selection with improved cards */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chọn hồ</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pondGrid}
              >
                {pondsByShape.length > 0 ? (
                  pondsByShape.map((pond, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pondCard,
                        selectedPond === pond.koiPondId && styles.selectedPondCard
                      ]}
                      onPress={() => handlePondSelect(pond)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pondCardGradient}
                        opacity={selectedPond === pond.koiPondId ? 1 : 0.8}
                      >
                        <Text style={styles.pondName} numberOfLines={1} ellipsizeMode="tail">
                          {pond.pondName}
                        </Text>
                        <View style={styles.pondDetails}>
                          <View style={styles.pondDetail}>
                            <MaterialCommunityIcons name="shape-outline" size={14} color={COLORS.white} />
                            <Text style={styles.pondDetailText}>{pond.shapeName}</Text>
                          </View>
                          {pond.element && (
                            <View style={styles.pondDetail}>
                              <MaterialCommunityIcons name="water" size={14} color={COLORS.white} />
                              <Text style={styles.pondDetailText}>{pond.element}</Text>
                            </View>
                          )}
                        </View>
                        
                        {selectedPond === pond.koiPondId && (
                          <View style={styles.selectedIndicator}>
                            <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.white} />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyPondContainer}>
                    <MaterialCommunityIcons name="pond" size={32} color={COLORS.lightGray} />
                    <Text style={styles.emptyPondText}>Không có hồ nào được tìm thấy</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Direction Selection with better touch targets */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hướng đặt hồ</Text>
              <View style={styles.directionGrid}>
                {directions.map((direction) => (
                  <TouchableOpacity
                    key={direction.key}
                    style={[
                      styles.directionButton,
                      selected === direction.key && styles.selectedDirectionButton
                    ]}
                    onPress={() => setSelected(direction.key)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                      name={getDirectionIconName(direction.value)}
                      size={22}
                      color={selected === direction.key ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[
                      styles.directionText,
                      selected === direction.key && styles.selectedDirectionText
                    ]}>
                      {direction.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fish Count with more elegant controls */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số lượng cá</Text>
              <View style={styles.countControl}>
                <TouchableOpacity 
                  style={[
                    styles.countButton,
                    fishCount <= 1 && styles.disabledButton
                  ]}
                  onPress={() => adjustFishCount(false)}
                  disabled={fishCount <= 1}
                  activeOpacity={0.7}
                >
                  <AntDesign 
                    name="minus" 
                    size={20} 
                    color={fishCount <= 1 ? COLORS.lightGray : COLORS.primary} 
                  />
                </TouchableOpacity>
                <View style={styles.countDisplayContainer}>
                  <Text style={styles.countText}>{fishCount}</Text>
                  <Text style={styles.countUnit}>con</Text>
                </View>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => adjustFishCount(true)}
                  activeOpacity={0.7}
                >
                  <AntDesign name="plus" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Calculate Button with more refined design */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={calculateCompatibility}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.calculateGradient}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.calculateText}>Tính tương hợp phong thủy</Text>
                <MaterialCommunityIcons name="calculator" size={22} color={COLORS.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24, // Matches backButton width for centering
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Ensure enough space for the button at bottom
  },
  heroSection: {
    height: 220,
    position: 'relative',
  },
  fishImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  fishName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '500',
  },
  mainContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray,
  },
  colorPreviewContainer: {
    paddingVertical: 8,
  },
  colorPreview: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  colorStrip: {
    height: '100%',
  },
  colorControls: {
    marginVertical: 10,
    gap: 12,
  },
  colorControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.offWhite,
    borderRadius: 10,
    padding: 10,
  },
  colorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  colorLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  percentageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  percentageValueContainer: {
    minWidth: 70,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
  },
  percentageInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    padding: 0,
    minWidth: 30,
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 2,
  },
  disabledButton: {
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.offWhite,
  },
  adjustmentNote: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  totalPercentageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  totalPercentageLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  totalPercentageValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalCorrect: {
    color: '#4CAF50', // Green
  },
  totalIncorrect: {
    color: '#F44336', // Red
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 10,
  },
  selectBox: {
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    height: 48,
    padding: 12,
    backgroundColor: COLORS.offWhite,
  },
  selectInput: {
    color: COLORS.gray,
    fontSize: 15,
  },
  dropdown: {
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    padding: 6,
    marginTop: 4,
  },
  dropdownText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  pondGrid: {
    paddingVertical: 8,
    gap: 12,
  },
  pondCard: {
    width: 170,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectedPondCard: {
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  pondCardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  pondName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  pondDetails: {
    gap: 4,
  },
  pondDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pondDetailText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyPondContainer: {
    width: width - 32,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
  },
  emptyPondText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  directionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  directionButton: {
    width: '23%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 8,
  },
  selectedDirectionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  directionText: {
    fontSize: 12,
    marginTop: 6,
    color: COLORS.primary,
    textAlign: 'center',
  },
  selectedDirectionText: {
    color: COLORS.white,
  },
  countControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  countButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  countDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 60,
    justifyContent: 'center',
  },
  countText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  countUnit: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  calculateButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calculateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  calculateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
}); 