import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const { width } = Dimensions.get('window');

const FOCUS_OPTIONS = [
  {
    id: 'relationships',
    title: 'İlişkilerim',
    icon: 'heart',
    color: '#ec4899',
    description: 'Aşk, arkadaşlık ve aile',
  },
  {
    id: 'work_money',
    title: 'İş & Para',
    icon: 'briefcase',
    color: '#10b981',
    description: 'Kariyer ve finansal konular',
  },
  {
    id: 'decisions',
    title: 'Kendi Kararlarım',
    icon: 'compass',
    color: '#f59e0b',
    description: 'Kişisel seçimler ve yol ayrımları',
  },
  {
    id: 'general',
    title: 'Genel Bakış',
    icon: 'sparkles',
    color: '#8b5cf6',
    description: 'Günün genel enerjisi',
  },
];

export default function FocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedFocus, selectedFocus } = useAppStore();

  const handleSelect = (focusId: string) => {
    setSelectedFocus(focusId);
    router.push('/tone');
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
        <Text style={styles.stepText}>1 / 3</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Ionicons name="planet" size={40} color="#a855f7" />
        <Text style={styles.title}>Şu an en çok düşündüğün konu</Text>
        <Text style={styles.subtitle}>Bugün hangi alana odaklanalım?</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {FOCUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedFocus === option.id && styles.optionCardSelected,
            ]}
            onPress={() => handleSelect(option.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon as any} size={28} color={option.color} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6060a0" />
          </TouchableOpacity>
        ))}
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
    marginBottom: 40,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardSelected: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#8080a0',
  },
});
