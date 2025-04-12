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
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
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
      shape: pond.shape
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
        pondShape: selectedPondDetails.shapeName,
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

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={
          koiDetails?.imageUrl
            ? { uri: koiDetails.imageUrl }
            : require('../../assets/images/koi_image.jpg')
        }
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => {
          console.log('Image loading error:', error.nativeEvent.error);
          if (error.nativeEvent.error) {
            console.log('URL ảnh lỗi:', koiDetails?.imageUrl);
          }
        }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/menu')}
            >
              <Ionicons name="chevron-back-circle" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentCard}>
              <View style={styles.fishInfoSection}>
                <Text style={styles.fishName}>{params.name || 'Koi Fish'}</Text>
                <View style={styles.tagContainer}>
                  <View style={styles.tag}>
                    <FontAwesome5 name="ruler" size={14} color="#FFD700" />
                    <Text style={styles.tagText}>{params.size || 'Medium'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Introduction Card */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <FontAwesome5 name="fish" size={16} color="#8B0000" style={styles.sectionIcon} />
                  Giới Thiệu
                </Text>
                <Text style={styles.sectionContent}>
                  {koiDetails?.introduction || 'Thông tin đang được cập nhật...'}
                </Text>
              </View>

              {/* Description Card */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <MaterialIcons name="description" size={16} color="#8B0000" style={styles.sectionIcon} />
                  Mô Tả
                </Text>
                <Text style={styles.sectionContent}>
                  {koiDetails?.description || 'Thông tin đang được cập nhật...'}
                </Text>
              </View>
              
              {/* Color Configuration Card */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <MaterialIcons name="color-lens" size={18} color="#8B0000" style={styles.sectionIcon} />
                  Màu Sắc
                </Text>
                
                {koiDetails?.colors && koiDetails.colors.map((color, index) => (
                  <View key={index} style={styles.colorRow}>
                    <View style={styles.colorLabelContainer}>
                      <View 
                        style={[styles.colorDot, { 
                          backgroundColor: colorCodeMap[color.colorName] || '#ccc',
                          borderColor: color.colorName === 'Trắng' ? '#ddd' : 'transparent'
                        }]} 
                      />
                      <Text style={styles.colorLabel}>{color.colorName}</Text>
                    </View>
                    
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        value={color.percentage}
                        onValueChange={(value) => {
                          const updatedColors = [...koiDetails.colors];
                          updatedColors[index].percentage = Math.round(value);
                          setKoiDetails({...koiDetails, colors: updatedColors});
                        }}
                        minimumTrackTintColor="#8B0000"
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor="#8B0000"
                        step={1}
                      />
                      <View style={styles.percentageContainer}>
                        <Text style={styles.percentageText}>{Math.round(color.percentage)}%</Text>
                      </View>
                    </View>
                  </View>
                ))}
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng phần trăm:</Text>
                  <Text style={[
                    styles.totalValue,
                    koiDetails?.colors && 
                    Math.round(koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0)) !== 100 ? 
                    styles.totalValueError : {}
                  ]}>
                    {koiDetails?.colors ? 
                      Math.round(koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0)) : 0}%
                  </Text>
                </View>
                
                {koiDetails?.colors && 
                Math.round(koiDetails.colors.reduce((sum, color) => sum + color.percentage, 0)) !== 100 && (
                  <Text style={styles.errorMessage}>
                    Tổng phần trăm các màu phải bằng 100%
                  </Text>
                )}
              </View>
              
              {/* Pond Configuration Card */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="water-outline" size={18} color="#8B0000" style={styles.sectionIcon} />
                  Cấu Hình Hồ
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Hình Dạng Hồ</Text>
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
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Chọn Hồ</Text>
                  
                  {pondsByShape.length > 0 ? (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.pondCardsContainer}
                    >
                      {pondsByShape.map((pond, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={[
                            styles.pondCard,
                            selectedPond === pond.koiPondId && styles.selectedPondCard
                          ]}
                          onPress={() => handlePondSelect(pond)}
                        >
                          <Image 
                            source={
                              pond.shapeName === 'Hình chữ nhật' ? require('../../assets/images/natural_pond.jpg') :
                              pond.shapeName === 'Hình tròn' ? require('../../assets/images/raised_pond.jpg') :
                              pond.shapeName === 'Hình bầu dục' ? require('../../assets/images/zen_pond.jpg') :
                              require('../../assets/images/formal_pond.jpg')
                            }
                            style={styles.pondImage}
                          />
                          {selectedPond === pond.koiPondId && (
                            <View style={styles.selectedOverlay}>
                              <AntDesign name="checkcircle" size={24} color="#FFF" />
                            </View>
                          )}
                          <View style={styles.pondNameContainer}>
                            <Text style={styles.pondName}>{pond.pondName}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyPondsContainer}>
                      <Feather name="alert-circle" size={24} color="#999" />
                      <Text style={styles.emptyPondsText}>
                        Không tìm thấy hồ cho hình dạng này
                      </Text>
                    </View>
                  )}
                </View>
                
                {selectedPondDetails && (
                  <View style={styles.pondDetails}>
                    <View style={styles.pondDetailsHeader}>
                      <Ionicons name="information-circle-outline" size={18} color="#8B0000" />
                      <Text style={styles.pondDetailsTitle}>Thông Tin Hồ</Text>
                    </View>
                    
                    <View style={styles.pondInfoGrid}>
                      <View style={styles.pondInfoItem}>
                        <Text style={styles.pondInfoLabel}>Tên:</Text>
                        <Text style={styles.pondInfoValue}>{selectedPondDetails.pondName}</Text>
                      </View>
                      
                      <View style={styles.pondInfoItem}>
                        <Text style={styles.pondInfoLabel}>Hình dạng:</Text>
                        <Text style={styles.pondInfoValue}>{selectedPondDetails.shapeName}</Text>
                      </View>
                      
                      <View style={styles.pondInfoItem}>
                        <Text style={styles.pondInfoLabel}>Nguyên tố:</Text>
                        <Text style={styles.pondInfoValue}>{selectedPondDetails.element}</Text>
                      </View>
                      
                      <View style={styles.pondInfoItem}>
                        <Text style={styles.pondInfoLabel}>Diện tích:</Text>
                        <Text style={styles.pondInfoValue}>{selectedPondDetails.area} m²</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Hướng Đặt Hồ</Text>
                  <SelectList
                    setSelected={setSelected}
                    data={directions}
                    placeholder="Chọn hướng đặt hồ"
                    boxStyles={styles.selectBox}
                    dropdownStyles={styles.dropdown}
                    inputStyles={styles.selectInput}
                    dropdownTextStyles={styles.dropdownText}
                    search={false}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Số Lượng Cá</Text>
                  <View style={styles.fishCountControl}>
                    <TouchableOpacity 
                      style={[
                        styles.countButton,
                        fishCount <= 1 && styles.disabledButton
                      ]}
                      onPress={() => adjustFishCount(false)}
                      disabled={fishCount <= 1}
                    >
                      <AntDesign name="minus" size={20} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.countDisplay}>
                      <Text style={styles.countValue}>{fishCount}</Text>
                      <Text style={styles.countUnit}>con</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.countButton}
                      onPress={() => adjustFishCount(true)}
                    >
                      <AntDesign name="plus" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {/* Calculate Button */}
              <TouchableOpacity 
                style={styles.calculateButtonContainer}
                onPress={calculateCompatibility}
              >
                <LinearGradient
                  colors={['#8B0000', '#650000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.calculateButton}
                >
                  <Text style={styles.calculateButtonText}>Tính Tương Hợp</Text>
                  <MaterialIcons name="calculate" size={22} color="#FFF" style={styles.calculateIcon} />
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Results Card - Only show if we have calculated */}
              {hasCalculated && (
                <View style={styles.section}>
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreValue}>{compatibilityScore}%</Text>
                    </View>
                    <Text style={styles.scoreLabel}>Mức độ tương hợp</Text>
                  </View>
                  
                  <Text style={styles.compatibilityMessage}>
                    {compatibilityMessage || 'Không có thông tin tương hợp.'}
                  </Text>
                </View>
              )}
              
              <View style={styles.bottomPadding} />
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 180,
    paddingTop: 20,
    minHeight: '100%',
    paddingHorizontal: 20,
  },
  fishInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  fishName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagText: {
    color: '#8B0000',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  
  colorRow: {
    marginBottom: 16,
  },
  colorLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  colorLabel: {
    fontSize: 15,
    color: '#444',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  percentageContainer: {
    width: 50,
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B0000',
    marginLeft: 8,
  },
  totalValueError: {
    color: '#e53935',
  },
  errorMessage: {
    fontSize: 13,
    color: '#e53935',
    marginTop: 8,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#444',
  },
  selectBox: {
    borderColor: '#ddd',
    borderRadius: 10,
    height: 50,
  },
  dropdown: {
    borderColor: '#ddd',
    borderRadius: 10,
  },
  selectInput: {
    color: '#333',
  },
  dropdownText: {
    color: '#333',
  },
  pondCardsContainer: {
    paddingVertical: 10,
  },
  pondCard: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPondCard: {
    borderColor: '#8B0000',
  },
  pondImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pondNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
  },
  pondName: {
    color: '#FFF',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyPondsContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyPondsText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  pondDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  pondDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pondDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginLeft: 6,
  },
  pondInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pondInfoItem: {
    width: '50%',
    marginBottom: 10,
    paddingRight: 10,
  },
  pondInfoLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 2,
  },
  pondInfoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  fishCountControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    padding: 10,
  },
  countButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  countDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 80,
    justifyContent: 'center',
  },
  countValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  countUnit: {
    fontSize: 16,
    color: '#555',
    marginLeft: 5,
  },
  calculateButtonContainer: {
    marginVertical: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  calculateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  calculateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  calculateIcon: {
    marginLeft: 4,
  },
  bottomPadding: {
    height: 50,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#555',
  },
  compatibilityMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
  },
}); 