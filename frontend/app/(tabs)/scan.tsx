import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AnalysisResult {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  image_base64: string;
}

export default function ScanScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera ve galeri erişimi için izin vermeniz gerekiyor.');
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].base64);
      setResult(null);
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].base64);
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/meals/analyze`,
        {
          image_base64: selectedImage,
          meal_type: 'snack',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(response.data);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Analiz başarısız oldu');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
  };

  const saveAndGoHome = () => {
    Alert.alert('Başarılı', 'Öğün kaydedildi!', [
      {
        text: 'Tamam',
        onPress: () => {
          reset();
          router.push('/(tabs)/home');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Yemek Tara</Text>
          <Text style={styles.subtitle}>Fotoğraf çek veya galeri den seç</Text>
        </View>

        {!selectedImage ? (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={pickImageFromCamera}>
              <Ionicons name="camera" size={48} color="#4CAF50" />
              <Text style={styles.optionText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
              <Ionicons name="images" size={48} color="#4CAF50" />
              <Text style={styles.optionText}>Galeri</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
              style={styles.image}
              resizeMode="cover"
            />

            {!result && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.retakeButton} onPress={reset}>
                  <Ionicons name="close" size={24} color="#fff" />
                  <Text style={styles.retakeButtonText}>Tekrar Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
                  onPress={analyzeImage}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={24} color="#fff" />
                      <Text style={styles.analyzeButtonText}>Analiz Et</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {result && (
              <View style={styles.resultContainer}>
                <Text style={styles.foodName}>{result.food_name}</Text>

                <View style={styles.nutrientsContainer}>
                  <View style={styles.nutrientCard}>
                    <Ionicons name="flame" size={32} color="#FF6B6B" />
                    <Text style={styles.nutrientValue}>{result.calories.toFixed(0)}</Text>
                    <Text style={styles.nutrientLabel}>Kalori</Text>
                  </View>

                  <View style={styles.nutrientCard}>
                    <Ionicons name="fitness" size={32} color="#4CAF50" />
                    <Text style={styles.nutrientValue}>{result.protein.toFixed(1)}g</Text>
                    <Text style={styles.nutrientLabel}>Protein</Text>
                  </View>

                  <View style={styles.nutrientCard}>
                    <Ionicons name="pizza" size={32} color="#FFA726" />
                    <Text style={styles.nutrientValue}>{result.carbs.toFixed(1)}g</Text>
                    <Text style={styles.nutrientLabel}>Karbonhidrat</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveAndGoHome}>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.saveButtonText}>Kaydet & Ana Sayfa</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.newScanButton} onPress={reset}>
                  <Text style={styles.newScanButtonText}>Yeni Tarama</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  imageContainer: {
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#757575',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  nutrientsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  nutrientCard: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  newScanButton: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  newScanButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});
