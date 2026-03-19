import React, { useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, checkDailyReading, hasFreeReading } = useAppStore();

  useEffect(() => {
    checkDailyReading();
  }, []);

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

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.username}>{user?.username || 'Kullanıcı'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#a0a0c0" />
        </TouchableOpacity>
      </View>

      {/* Moon Icon */}
      <View style={styles.moonContainer}>
        <Ionicons name="moon" size={80} color="#f0d060" />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Falyn</Text>
        <Text style={styles.subtitle}>Günlük Burç & Fal</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Bugün senin için neye odaklanalım?</Text>
        <Text style={styles.descriptionText}>
          Her gün sana özel, pozitif ve yol gösterici yorumlar
        </Text>
        
        {/* Daily Status */}
        <View style={styles.statusContainer}>
          <Ionicons 
            name={hasFreeReading ? "checkmark-circle" : "time"} 
            size={20} 
            color={hasFreeReading ? "#10b981" : "#f59e0b"} 
          />
          <Text style={styles.statusText}>
            {hasFreeReading 
              ? "Bugünkü ücretsiz yorumun hazır!" 
              : "Reklam izleyerek ek yorum alabilirsin"}
          </Text>
        </View>
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

      {/* Bottom Links */}
      <View style={styles.bottomLinks}>
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => router.push('/history')}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={20} color="#a0a0c0" />
          <Text style={styles.linkText}>Geçmiş Yorumlar</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#8080a0',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  moonContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0c0',
    textAlign: 'center',
    marginTop: 4,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 22,
    color: '#e0e0ff',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: '#8080a0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#c0c0e0',
  },
  startButton: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
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
  bottomLinks: {
    alignItems: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#a0a0c0',
    marginLeft: 8,
  },
});
