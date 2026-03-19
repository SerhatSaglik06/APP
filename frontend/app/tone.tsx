import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const TONE_OPTIONS = [
  {
    id: 'realistic',
    title: 'Daha Gerçekçi',
    icon: 'eye',
    color: '#3b82f6',
    description: 'Net, objektif ve dengeli bir bakış açısı',
    gradient: ['#1e40af', '#3b82f6'],
  },
  {
    id: 'motivational',
    title: 'Daha Motive Edici',
    icon: 'sunny',
    color: '#f59e0b',
    description: 'Destekleyici, umut verici ve cesaret veren',
    gradient: ['#b45309', '#f59e0b'],
  },
];

export default function ToneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedTone, selectedTone } = useAppStore();

  const handleSelect = (toneId: string) => {
    setSelectedTone(toneId);
    router.push('/zodiac');
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.stepText}>2 / 3</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Ionicons name="chatbubbles" size={40} color="#a855f7" />
        <Text style={styles.title}>Yorumunun tonu nasıl olsun?</Text>
        <Text style={styles.subtitle}>Sana nasıl bir yaklaşım uygun?</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {TONE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedTone === option.id && styles.optionCardSelected,
            ]}
            onPress={() => handleSelect(option.id)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={option.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={option.icon as any} size={36} color="#fff" />
            </LinearGradient>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#8080a0" />
        <Text style={styles.infoText}>
          Her iki ton da pozitif ve yönlendirici olacak, sadece ifade tarzı farklı olacak.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  stepText: {
    fontSize: 14,
    color: '#8080a0',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8080a0',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTextContainer: {
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8080a0',
    marginLeft: 12,
    lineHeight: 18,
  },
});
