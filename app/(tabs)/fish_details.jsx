import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { SelectList } from 'react-native-dropdown-select-list';
import BackButton from '../../components/BackButton';
import LikeButton from '../../components/LikeButton';
import { images } from '../../constants/images';
import { ScrollView as HorizontalScrollView } from 'react-native';

export default function FishDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [blackPercentage, setBlackPercentage] = useState(10);
  const [redPercentage, setRedPercentage] = useState(50);
  const [whitePercentage, setWhitePercentage] = useState(40);
  const [selected, setSelected] = useState("");
  const [selectedPond, setSelectedPond] = useState("");

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

  const calculateCompatibility = () => {
    const colorBalance = Math.abs(blackPercentage + redPercentage + whitePercentage - 100);
    const hasSelectedPond = selectedPond ? 1 : 0;
    const hasSelectedDirection = selected ? 1 : 0;
    
    const result = Math.max(0, Math.min(100, 
      100 - colorBalance + 
      (hasSelectedPond * 20) + 
      (hasSelectedDirection * 20)
    ));

    router.push({
      pathname: '/(tabs)/calculation_result',
      params: { 
        result: Math.round(result),
        from: 'fish_details',
        // Fish details
        name: params.name,
        variant: params.variant,
        imageName: params.imageName,
        liked: params.liked,
        description: params.description,
        characteristics: params.characteristics,
        habitat: params.habitat,
        diet: params.diet,
        lifespan: params.lifespan,
        size: params.size,
        price: params.price,
        // Calculation state
        blackPercentage: blackPercentage.toString(),
        redPercentage: redPercentage.toString(),
        whitePercentage: whitePercentage.toString(),
        selectedPond: selectedPond,
        selected: selected
      }
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={images[params.imageName]} 
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
                <Text style={styles.fishName}>{params.name}</Text>
                <Text style={styles.fishVariant}>{params.variant}</Text>
              </View>

              <View style={styles.sizeSection}>
                <View style={styles.sizeBox}>
                  <Text style={styles.sizeLabel}>Size</Text>
                  <Text style={styles.sizeValue}>{params.size}</Text>
                </View>
                <Text style={styles.shortDescription}>
                  {params.description}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.fullDescription}>{params.description}</Text>

              {/* Calculation Section */}
              <View style={styles.calculationSection}>
                <Text style={styles.calculationTitle}>Check Compatibility</Text>

                {/* Color Percentages */}
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Black</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={blackPercentage}
                      onSlidingComplete={setBlackPercentage}
                      minimumTrackTintColor="#000"
                      maximumTrackTintColor="#D3D3D3"
                      step={1}
                      thumbTouchSize={{ width: 40, height: 40 }}
                    />
                    <Text style={styles.percentageText}>{Math.round(blackPercentage)}%</Text>
                  </View>

                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Red</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={redPercentage}
                      onSlidingComplete={setRedPercentage}
                      minimumTrackTintColor="#8B0000"
                      maximumTrackTintColor="#D3D3D3"
                      step={1}
                      thumbTouchSize={{ width: 40, height: 40 }}
                    />
                    <Text style={styles.percentageText}>{Math.round(redPercentage)}%</Text>
                  </View>

                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>White</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      value={whitePercentage}
                      onSlidingComplete={setWhitePercentage}
                      minimumTrackTintColor="#F3F3F3"
                      maximumTrackTintColor="#D3D3D3"
                      step={1}
                      thumbTouchSize={{ width: 40, height: 40 }}
                    />
                    <Text style={styles.percentageText}>{Math.round(whitePercentage)}%</Text>
                  </View>
                </View>

                {/* Overall Compatibility */}
                <View style={styles.compatibilityContainer}>
                  <Text style={styles.compatibilityLabel}>Compatibility:</Text>
                  <Text style={styles.compatibilityValue}>60%</Text>
                </View>

                {/* Pond Style Section */}
                <View style={styles.pondStyleSection}>
                  <Text style={styles.sectionTitle}>Hình dạng hồ:</Text>
                  <View style={styles.pondStyleRow}>
                    <Text>Rectangle : <Text style={styles.redText}>25%</Text></Text>
                  </View>
                  <HorizontalScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.pondImagesScroll}
                  >
                    <TouchableOpacity 
                      style={[
                        styles.pondImageContainer,
                        selectedPond === 'formal' && styles.selectedPond
                      ]}
                      onPress={() => setSelectedPond('formal')}
                    >
                      <Image 
                        source={require('../../assets/images/formal_pond.jpg')} 
                        style={styles.pondImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.pondImageContainer,
                        selectedPond === 'natural' && styles.selectedPond
                      ]}
                      onPress={() => setSelectedPond('natural')}
                    >
                      <Image 
                        source={require('../../assets/images/natural_pond.jpg')} 
                        style={styles.pondImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.pondImageContainer,
                        selectedPond === 'raised' && styles.selectedPond
                      ]}
                      onPress={() => setSelectedPond('raised')}
                    >
                      <Image 
                        source={require('../../assets/images/raised_pond.jpg')} 
                        style={styles.pondImage}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.pondImageContainer,
                        selectedPond === 'waterfall' && styles.selectedPond
                      ]}
                      onPress={() => setSelectedPond('waterfall')}
                    >
                      <Image 
                        source={require('../../assets/images/waterfall_pond.jpg')} 
                        style={styles.pondImage}
                      />
                    </TouchableOpacity>
                  </HorizontalScrollView>
                </View>

                {/* Direction Dropdown */}
                <View style={styles.directionSection}>
                  <Text style={styles.sectionTitle}>Hướng đặt hồ:</Text>
                  <SelectList 
                    setSelected={setSelected} 
                    data={directions} 
                    boxStyles={styles.dropdown}
                    dropdownStyles={styles.dropdownList}
                    placeholder="Hướng đặt hồ"
                    search={false}
                  />
                </View>

                {/* Calculate Button */}
                <TouchableOpacity 
                  style={styles.calculateButton}
                  onPress={calculateCompatibility}
                >
                  <Text style={styles.calculateButtonText}>Tính toán</Text>
                </TouchableOpacity>
              </View>
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
  sizeBox: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    width: 80,
    alignItems: 'center',
  },
  sizeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  sizeValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
    width: 50,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  percentageText: {
    width: 50,
    textAlign: 'right',
    color: '#8B0000',
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
}); 