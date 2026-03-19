import React, { useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setDeviceId, initializeUser } = useAppStore();

  useEffect(() => {
    initDevice();
  }, []);

  const initDevice = async () => {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = Device.modelId || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      setDeviceId(deviceId);
      await initializeUser(deviceId);
    } catch (error) {
      console.log('Device init error:', error);
    }
  };

  const handleStart = () => {
    router.push('/focus');
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Stars Background */}
      <View style={styles.starsContainer}>
        {[...Array(30)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: Math.random() * width,
                top: Math.random() * height * 0.7,
                opacity: Math.random() * 0.8 + 0.2,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
              },
            ]}
          />
        ))}
      </View>

      {/* Moon Icon */}
      <View style={styles.moonContainer}>
        <Ionicons name="moon" size={80} color="#f0d060" />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Günlük Burç & Fal</Text>
        <Text style={styles.subtitle}>Yapay Zeka Destekli</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Bugün senin için neye odaklanalım?</Text>
        <Text style={styles.descriptionText}>
          Her gün sana özel, pozitif ve yol gösterici yorumlar
        </Text>
      </View>

      {/* Start Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Başla</Text>
          <Ionicons name="arrow-forward" size={24} color="#fff" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>

      {/* History Button */}
      <TouchableOpacity 
        style={styles.historyButton} 
        onPress={() => router.push('/history')}
        activeOpacity={0.7}
      >
        <Ionicons name="time-outline" size={20} color="#a0a0c0" />
        <Text style={styles.historyText}>Geçmiş Yorumlar</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  moonContainer: {
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0c0',
    textAlign: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 22,
    color: '#e0e0ff',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: '#8080a0',
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  historyText: {
    fontSize: 14,
    color: '#a0a0c0',
    marginLeft: 8,
  },
});
