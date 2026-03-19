import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';

const FOCUS_LABELS: Record<string, string> = {
  relationships: 'İlişkiler',
  work_money: 'İş & Para',
  decisions: 'Kararlar',
  general: 'Genel',
};

const ZODIAC_LABELS: Record<string, string> = {
  aries: 'Koç ♈',
  taurus: 'Boğa ♉',
  gemini: 'İkizler ♊',
  cancer: 'Yengeç ♋',
  leo: 'Aslan ♌',
  virgo: 'Başak ♍',
  libra: 'Terazi ♎',
  scorpio: 'Akrep ♏',
  sagittarius: 'Yay ♐',
  capricorn: 'Oğlak ♑',
  aquarius: 'Kova ♒',
  pisces: 'Balık ♓',
};

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentReading, expandReading, resetSelections, hasFreeReading, isLoading } = useAppStore();
  const [showAdModal, setShowAdModal] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [expandType, setExpandType] = useState<'detail' | 'extra'>('detail');

  if (!currentReading) {
    return (
      <LinearGradient colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#a855f7" />
          <Text style={styles.errorText}>Yorum bulunamadı</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/')}>
            <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const handleNewReading = () => {
    resetSelections();
    router.replace('/focus');
  };

  const handleHome = () => {
    resetSelections();
    router.replace('/');
  };

  const simulateAd = (type: 'detail' | 'extra') => {
    setExpandType(type);
    setShowAdModal(true);
    setAdProgress(0);
    
    // Simulate ad watching with progress
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 600);
  };

  const handleAdComplete = async () => {
    setShowAdModal(false);
    
    if (expandType === 'detail') {
      await expandReading(currentReading.id);
    }
    // For extra reading, we would generate a new one
    // For MVP, we just show the expanded content
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top + 10 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHome} style={styles.backButton}>
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Günlük Yorumun</Text>
        <TouchableOpacity onPress={() => router.push('/history')} style={styles.backButton}>
          <Ionicons name="time" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Meta Info */}
      <View style={styles.metaContainer}>
        <Text style={styles.dateText}>{formatDate(currentReading.created_at)}</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Ionicons name="compass" size={14} color="#a855f7" />
            <Text style={styles.tagText}>{FOCUS_LABELS[currentReading.focus] || currentReading.focus}</Text>
          </View>
          {currentReading.zodiac_sign && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{ZODIAC_LABELS[currentReading.zodiac_sign]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Reading Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Daily Energy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sunny" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Günün Enerjisi</Text>
          </View>
          <Text style={styles.sectionContent}>{currentReading.daily_energy}</Text>
        </View>

        {/* Focus Comment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={24} color="#ec4899" />
            <Text style={styles.sectionTitle}>{FOCUS_LABELS[currentReading.focus]} Yorumu</Text>
          </View>
          <Text style={styles.sectionContent}>{currentReading.focus_comment}</Text>
        </View>

        {/* Fortune Message */}
        <View style={[styles.section, styles.fortuneSection]}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.2)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.fortuneGradient}
          >
            <Ionicons name="sparkles" size={28} color="#a855f7" />
            <Text style={styles.fortuneText}>"{currentReading.fortune_message}"</Text>
          </LinearGradient>
        </View>

        {/* Daily Advice */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Günün Tavsiyesi</Text>
          </View>
          <Text style={styles.sectionContent}>{currentReading.daily_advice}</Text>
        </View>

        {/* Expanded Content */}
        {currentReading.is_expanded && currentReading.detailed_content && (
          <View style={[styles.section, styles.expandedSection]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color="#f0d060" />
              <Text style={styles.sectionTitle}>Detaylı Analiz</Text>
            </View>
            <Text style={styles.sectionContent}>{currentReading.detailed_content}</Text>
          </View>
        )}

        {/* Ad-based expansion buttons */}
        {!currentReading.is_expanded && (
          <View style={styles.adSection}>
            <TouchableOpacity
              style={styles.adButton}
              onPress={() => simulateAd('detail')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.3)', 'rgba(139, 92, 246, 0.2)']}
                style={styles.adButtonGradient}
              >
                <Ionicons name="play-circle" size={24} color="#a855f7" />
                <View style={styles.adButtonTextContainer}>
                  <Text style={styles.adButtonTitle}>Detaylı Yorum Al</Text>
                  <Text style={styles.adButtonSubtitle}>Reklam izleyerek aç</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a855f7" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Extra reading button */}
        {!hasFreeReading && (
          <View style={styles.adSection}>
            <TouchableOpacity
              style={styles.adButton}
              onPress={handleNewReading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.2)']}
                style={styles.adButtonGradient}
              >
                <Ionicons name="add-circle" size={24} color="#10b981" />
                <View style={styles.adButtonTextContainer}>
                  <Text style={styles.adButtonTitle}>Yeni Yorum Al</Text>
                  <Text style={styles.adButtonSubtitle}>Reklam izleyerek ek yorum</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#10b981" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Tomorrow teaser */}
        <View style={styles.teaserSection}>
          <Ionicons name="moon" size={20} color="#8080a0" />
          <Text style={styles.teaserText}>
            Yarın için ipucu: Evrenin enerjisi seninle birlikte hareket edecek...
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.newReadingButton}
          onPress={handleNewReading}
          activeOpacity={0.8}
        >
          <Text style={styles.newReadingText}>Yeni Yorum Al</Text>
        </TouchableOpacity>
      </View>

      {/* Ad Modal */}
      <Modal visible={showAdModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="tv" size={60} color="#a855f7" />
            <Text style={styles.modalTitle}>Reklam İzleniyor</Text>
            <Text style={styles.modalSubtitle}>Detaylı yorumun hazırlanıyor...</Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${adProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{adProgress}%</Text>

            {adProgress >= 100 && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleAdComplete}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Devam Et</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#a855f7',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  metaContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#8080a0',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#c0c0e0',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sectionContent: {
    fontSize: 16,
    color: '#c0c0e0',
    lineHeight: 26,
  },
  fortuneSection: {
    marginVertical: 8,
  },
  fortuneGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  fortuneText: {
    fontSize: 18,
    color: '#e0e0ff',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 28,
  },
  expandedSection: {
    backgroundColor: 'rgba(240, 208, 96, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(240, 208, 96, 0.2)',
  },
  adSection: {
    marginBottom: 16,
  },
  adButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  adButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  adButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  adButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  adButtonSubtitle: {
    fontSize: 12,
    color: '#8080a0',
    marginTop: 2,
  },
  teaserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  teaserText: {
    flex: 1,
    fontSize: 14,
    color: '#8080a0',
    fontStyle: 'italic',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
  },
  newReadingButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  newReadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a855f7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a3a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8080a0',
    marginTop: 8,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#a855f7',
    marginTop: 8,
  },
  continueButton: {
    marginTop: 24,
    backgroundColor: '#a855f7',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
