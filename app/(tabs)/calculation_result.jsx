import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CalculationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const percentage = parseInt(params.result) || 60;
  const previousScreen = params.from;

  const handleBack = () => {
    if (previousScreen === 'fish_details') {
      router.push({
        pathname: '/(tabs)/fish_details',
        params: {
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
          blackPercentage: params.blackPercentage,
          redPercentage: params.redPercentage,
          whitePercentage: params.whitePercentage,
          selectedPond: params.selectedPond,
          selected: params.selected
        }
      });
    } else {
      router.back();
    }
  };

  const getPercentageColor = (value) => {
    if (value < 40) return '#FF0000';
    if (value <= 60) return '#FFD700';
    return '#00FF00';
  };

  const getAdviceText = (value) => {
    if (value < 40) {
      return "Bạn không hợp với loài cá này, tuy nhiên hướng hồ chưa phù hợp";
    } else if (value <= 60) {
      return "Bạn rất hợp với loài cá này, tuy nhiên hướng hồ chưa phù hợp";
    } else {
      return "Bạn rất hợp với loài cá này và hướng hồ phù hợp";
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B0000', '#4B0000']}
        style={styles.header}
      >
        <Text style={styles.title}>Kết quả tính toán</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.resultCard}>
          <Text style={[
            styles.percentage, 
            { color: getPercentageColor(percentage) }
          ]}>
            {percentage}%
          </Text>

          <View style={styles.adviceContainer}>
            <Text style={styles.adviceLabel}>Nhận xét</Text>
            <Text style={styles.adviceText}>
              {getAdviceText(percentage)}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleBack}
          >
            <Text style={styles.buttonText}>Trở lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: '30%',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: -50,
  },
  resultCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
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
  percentage: {
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 30,
  },
  adviceContainer: {
    width: '100%',
    marginBottom: 30,
  },
  adviceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  adviceText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});