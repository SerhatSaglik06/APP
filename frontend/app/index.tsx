import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { useAppStore } from '../store/appStore';
import { registerForPushNotificationsAsync, scheduleDailyNotification } from '../services/notifications';

export default function SplashScreen() {
  const router = useRouter();
  const { setDeviceId, checkExistingUser, isLoading } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Get or create device ID
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = Device.modelId || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      setDeviceId(deviceId);

      // Request notification permissions and schedule if first time
      const notifEnabled = await AsyncStorage.getItem('notifications_enabled');
      if (notifEnabled === null) {
        await registerForPushNotificationsAsync();
        await scheduleDailyNotification(9, 0); // 09:00
      }

      // Check if user exists
      const existingUser = await checkExistingUser(deviceId);
      
      setChecking(false);
      
      // Navigate based on auth status
      setTimeout(() => {
        if (existingUser) {
          router.replace('/home');
        } else {
          router.replace('/auth');
        }
      }, 500);
    } catch (error) {
      console.log('Init error:', error);
      setChecking(false);
      router.replace('/auth');
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={styles.container}
    >
      <Ionicons name="moon" size={80} color="#f0d060" />
      <Text style={styles.title}>Falyn</Text>
      <Text style={styles.subtitle}>AI Günlük Burç & Fal</Text>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>
          {checking ? 'Yükleniyor...' : 'Hazırlanıyor...'}
        </Text>
      </View>
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
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0c0',
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8080a0',
    marginTop: 12,
    fontSize: 14,
  },
});
