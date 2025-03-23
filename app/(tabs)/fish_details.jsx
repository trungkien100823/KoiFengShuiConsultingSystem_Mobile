import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { SelectList } from 'react-native-dropdown-select-list';
import BackButton from '../../components/BackButton';
import LikeButton from '../../components/LikeButton';
import { images } from '../../constants/images';
import { ScrollView as HorizontalScrollView } from 'react-native';
import { koiAPI } from '../../constants/koiData';
import { pondAPI } from '../../constants/koiPond';
import axios from 'axios';
import { API_CONFIG } from '../../constants/config';
import { getAuthHeaders } from '../../services/authService';

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
      // Nếu val rỗng hoặc là giá trị mặc định
      if (!val || val === "Chọn hình dạng hồ") {
        // Reset các state liên quan đến shape
        setSelectedShape("");
        setSelectedShapeId("");
        
        // Gọi API lấy tất cả hồ
        const allPonds = await pondAPI.getAllPonds();
        console.log('Tất cả các hồ:', allPonds);
        setPondsByShape(allPonds);
        return;
      }

      // Xử lý khi chọn hình dạng cụ thể
      const selectedShape = pondShapes.find(shape => shape.value === val);
      if (selectedShape) {
        setSelectedShape(val);
        setSelectedShapeId(selectedShape.key);

        // Gọi API để lấy danh sách hồ theo hình dạng
        const ponds = await pondAPI.getPondByShape(selectedShape.key);
        console.log('Chi tiết hồ theo hình dạng:', ponds);
        setPondsByShape(ponds);

        if (!ponds || ponds.length === 0) {
          Alert.alert(
            "Thông báo", 
            "Không tìm thấy hồ nào có hình dạng này",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error('Error handling shape selection:', error);
      Alert.alert(
        "Lỗi",
        "Không thể lấy thông tin hồ. Vui lòng thử lại sau.",
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
        // Chuyển đổi dữ liệu từ API để hiển thị trong SelectList
        const formattedShapes = shapes.map(shape => ({
          key: shape.shapeId,
          value: `${shape.shapeName} (${shape.element})`
        }));
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

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/buddha.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />
          <View style={styles.detailsCard}>
            <View style={styles.likeButtonContainer}>
              <View style={styles.likeButtonBackground}>
                <LikeButton initialLiked={params.liked === 'true'} />
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.titleSection}>
                <Text style={styles.fishName}>{koiDetails?.varietyName || 'Unknown'}</Text>
              </View>

              <View style={styles.sizeSection}>
                <View style={styles.sizeBox}>
                </View>
                <Text style={styles.shortDescription}>
                  {koiDetails?.description || 'Không có mô tả.'}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.fullDescription}>
                {koiDetails?.introduction || 
                  "Cá Koi là một trong những loài cá cảnh được yêu thích nhất trong phong thủy. " +
                  "Với màu sắc đặc trưng và ý nghĩa tâm linh sâu sắc, chúng không chỉ mang lại vẻ đẹp thẩm mỹ " +
                  "mà còn được tin là mang đến may mắn và thịnh vượng cho gia chủ. " +
                  "Việc lựa chọn cá Koi phù hợp với phong thủy nhà ở có thể tăng cường năng lượng tích cực " +
                  "và tạo nên sự hài hòa trong không gian sống."
                }
              </Text>

              {/* Color Percentages Section */}
              <View style={styles.calculationSection}>
                <Text style={styles.calculationTitle}>Tỷ lệ màu sắc</Text>
                <View style={styles.sliderContainer}>
                  {koiDetails?.colors.map((color, index) => (
                    <View key={index} style={styles.sliderRow}>
                      <Text style={styles.sliderLabel}>{color.colorName}</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        value={color.percentage}
                        enabled={true}
                        minimumTrackTintColor={color.colorCode}
                        maximumTrackTintColor="#D3D3D3"
                        thumbTintColor={color.colorCode}
                        onValueChange={(value) => {
                          const newColors = [...koiDetails.colors];
                          newColors[index] = {
                            ...newColors[index],
                            percentage: Math.round(value)
                          };
                          setKoiDetails({
                            ...koiDetails,
                            colors: newColors
                          });
                        }}
                      />
                      <Text style={styles.percentageText}>{Math.round(color.percentage)}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Pond Shape Dropdown */}
              <View style={styles.shapeSection}>
                <Text style={styles.sectionTitle}>Hình dạng hồ:</Text>
                <SelectList 
                  setSelected={handleShapeSelect}
                  data={[
                    { key: 'default', value: 'Chọn hình dạng hồ' },
                    ...pondShapes
                  ]} 
                  save="value"
                  boxStyles={styles.dropdown}
                  dropdownStyles={styles.dropdownList}
                  placeholder="Chọn hình dạng hồ"
                  search={false}
                  defaultOption={{ key: 'default', value: 'Chọn hình dạng hồ' }}
                />
              </View>

              {/* Pond Style Section */}
              <View style={styles.pondStyleSection}>
                <Text style={styles.sectionTitle}>Danh sách hồ theo hình dạng:</Text>
                <HorizontalScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.pondImagesScroll}
                >
                  {pondsByShape.length > 0 ? (
                    pondsByShape.map((pond, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[
                          styles.pondImageContainer,
                          selectedPond === pond.koiPondId && styles.selectedPond
                        ]}
                        onPress={() => handlePondSelect(pond)}
                      >
                        <Image 
                          source={
                            pond.imageUrl 
                              ? { uri: pond.imageUrl } 
                              : require('../../assets/images/buddha.png')
                          } 
                          style={styles.pondImage}
                        />
                        <Text style={styles.pondLabel}>{pond.pondName || 'Chưa đặt tên'}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noPondsContainer}>
                      <Text style={styles.noPondsText}>
                        Chưa có hồ nào cho hình dạng này
                      </Text>
                    </View>
                  )}
                </HorizontalScrollView>

                {selectedPondDetails && (
                  <View style={styles.selectedPondDetails}>
                    <View style={styles.pondInfoRow}>
                      <Text style={styles.pondInfoLabel}>Tên hồ:</Text>
                      <Text style={styles.pondInfoValue}>
                        {selectedPondDetails.pondName || 'Chưa đặt tên'}
                      </Text>
                    </View>
                    <View style={styles.pondInfoRow}>
                      <Text style={styles.pondInfoLabel}>Mệnh:</Text>
                      <Text style={styles.pondInfoValue}>
                        {selectedPondDetails.element || 'Chưa xác định'}
                      </Text>
                    </View>
                    <View style={styles.pondInfoRow}>
                      <Text style={styles.pondInfoLabel}>Hình dạng:</Text>
                      <Text style={styles.pondInfoValue}>
                        {selectedPondDetails.shapeName || 'Chưa xác định'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Direction Dropdown */}
              <View style={styles.directionSection}>
                <Text style={styles.sectionTitle}>Hướng đặt hồ:</Text>
                <SelectList 
                  setSelected={setSelected} 
                  data={directions} 
                  boxStyles={styles.dropdown}
                  dropdownStyles={styles.dropdownList}
                  placeholder="Chọn hướng đặt hồ"
                  search={false}
                />
              </View>

              {/* Fish Count Section */}
              <View style={styles.fishCountSection}>
                <Text style={styles.sectionTitle}>Số lượng cá:</Text>
                <View style={styles.fishCountContainer}>
                  <TouchableOpacity 
                    style={styles.countButton}
                    onPress={() => adjustFishCount(false)}
                  >
                    <Text style={styles.countButtonText}>-</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.countDisplay}>
                    <Text style={styles.countText}>{fishCount}</Text>
                    <Text style={styles.countLabel}>con</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.countButton}
                    onPress={() => adjustFishCount(true)}
                  >
                    <Text style={styles.countButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calculate Button */}
              <TouchableOpacity 
                style={styles.calculateButton}
                onPress={calculateCompatibility}
              >
                <Text style={styles.calculateButtonText}>Tính toán phong thủy</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  menuButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  spacer: {
    height: 450, // Adjust this value to control when the white card appears
  },
  detailsCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
    minHeight: '100%', // This ensures the white background extends to the bottom
  },
  likeButtonContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  likeButtonBackground: {
    borderRadius: 30,
    padding: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  fishName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  fishVariant: {
    fontSize: 32,
    color: '#FFA500',
  },
  sizeSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  shortDescription: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  fullDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  calculationSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  calculationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sliderLabel: {
    width: 80, // Tăng width để hiển thị tên màu dài hơn
    fontSize: 16,
    color: '#333',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  percentageText: {
    width: 50,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  compatibilityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compatibilityValue: {
    fontSize: 16,
    color: '#8B0000',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  directionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dropdown: {
    borderColor: '#8B0000',
    borderRadius: 8,
  },
  dropdownList: {
    borderColor: '#8B0000',
  },
  calculateButton: {
    backgroundColor: '#8B0000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pondStyleSection: {
    marginBottom: 20,
  },
  pondStyleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  redText: {
    color: '#8B0000',
    fontWeight: 'bold',
  },
  pondImagesScroll: {
    marginTop: 10,
  },
  pondImageContainer: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 10,
  },
  selectedPond: {
    borderColor: '#8B0000',
  },
  pondImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  fishCountSection: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  fishCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 10,
  },
  countButton: {
    backgroundColor: '#8B0000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  countDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 30,
  },
  countText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B0000',
    marginRight: 8,
  },
  countLabel: {
    fontSize: 16,
    color: '#666',
  },
  pondLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  shapeSection: {
    marginBottom: 20,
  },
  noPondsContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPondsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  selectedPondDetails: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  pondInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pondInfoLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pondInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500',
  },
}); 