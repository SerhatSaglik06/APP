import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Koç', symbol: '♈', dates: '21 Mar - 19 Nis' },
  { id: 'taurus', name: 'Boğa', symbol: '♉', dates: '20 Nis - 20 May' },
  { id: 'gemini', name: 'İkizler', symbol: '♊', dates: '21 May - 20 Haz' },
  { id: 'cancer', name: 'Yengeç', symbol: '♋', dates: '21 Haz - 22 Tem' },
  { id: 'leo', name: 'Aslan', symbol: '♌', dates: '23 Tem - 22 Ağu' },
  { id: 'virgo', name: 'Başak', symbol: '♍', dates: '23 Ağu - 22 Eyl' },
  { id: 'libra', name: 'Terazi', symbol: '♎', dates: '23 Eyl - 22 Eki' },
  { id: 'scorpio', name: 'Akrep', symbol: '♏', dates: '23 Eki - 21 Kas' },
  { id: 'sagittarius', name: 'Yay', symbol: '♐', dates: '22 Kas - 21 Ara' },
  { id: 'capricorn', name: 'Oğlak', symbol: '♑', dates: '22 Ara - 19 Oca' },
  { id: 'aquarius', name: 'Kova', symbol: '♒', dates: '20 Oca - 18 Şub' },
  { id: 'pisces', name: 'Balık', symbol: '♓', dates: '19 Şub - 20 Mar' },
];

export default function ZodiacScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setSelectedZodiac, selectedZodiac, generateReading } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelect = (zodiacId: string) => {
    setSelectedZodiac(zodiacId);
  };

  const handleContinue = async () => {
    setIsGenerating(true);
    const reading = await generateReading();
    setIsGenerating(false);
    if (reading) {
      router.push('/result');
    }
  };

  const handleSkip = async () => {
    setSelectedZodiac(null);
    setIsGenerating(true);
    const reading = await generateReading();
    setIsGenerating(false);
    if (reading) {
      router.push('/result');
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.stepText}>3 / 3</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Ionicons name="star" size={40} color="#f0d060" />
        <Text style={styles.title}>Burcunu seçmek ister misin?</Text>
        <Text style={styles.subtitle}>Seçilmezse yorum genel enerji üzerinden yapılır</Text>
      </View>

      {/* Zodiac Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.zodiacGrid}>
          {ZODIAC_SIGNS.map((sign) => (
            <TouchableOpacity
              key={sign.id}
              style={[
                styles.zodiacCard,
                selectedZodiac === sign.id && styles.zodiacCardSelected,
              ]}
              onPress={() => handleSelect(sign.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.zodiacSymbol}>{sign.symbol}</Text>
              <Text style={styles.zodiacName}>{sign.name}</Text>
              <Text style={styles.zodiacDates}>{sign.dates}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        {selectedZodiac ? (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isGenerating ? (
                <Text style={styles.buttonText}>Yorum hazırlanıyor...</Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>Yorumumu Gör</Text>
                  <Ionicons name="sparkles" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            {isGenerating ? (
              <Text style={styles.skipButtonText}>Yorum hazırlanıyor...</Text>
            ) : (
              <Text style={styles.skipButtonText}>Burç seçmeden devam et</Text>
            )}
          </TouchableOpacity>
        )}
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8080a0',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  zodiacGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  zodiacCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  zodiacCardSelected: {
    borderColor: '#f0d060',
    backgroundColor: 'rgba(240, 208, 96, 0.1)',
  },
  zodiacSymbol: {
    fontSize: 28,
    marginBottom: 4,
  },
  zodiacName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  zodiacDates: {
    fontSize: 10,
    color: '#8080a0',
  },
  bottomContainer: {
    paddingTop: 16,
  },
  continueButton: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#a0a0c0',
  },
});
