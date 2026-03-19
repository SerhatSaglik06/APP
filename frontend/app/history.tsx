import React, { useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
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

const ZODIAC_SYMBOLS: Record<string, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

interface Reading {
  id: string;
  focus: string;
  tone: string;
  zodiac_sign?: string;
  daily_energy: string;
  focus_comment: string;
  fortune_message: string;
  daily_advice: string;
  detailed_content?: string;
  is_expanded: boolean;
  created_at: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { readingHistory, fetchHistory, isLoading } = useAppStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: Reading }) => (
    <TouchableOpacity
      style={styles.historyCard}
      activeOpacity={0.7}
      onPress={() => {
        useAppStore.setState({ currentReading: item });
        router.push('/result');
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={14} color="#8080a0" />
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>
        {item.zodiac_sign && (
          <Text style={styles.zodiacSymbol}>{ZODIAC_SYMBOLS[item.zodiac_sign]}</Text>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.focusTag}>
          <Text style={styles.focusTagText}>{FOCUS_LABELS[item.focus] || item.focus}</Text>
        </View>
        <Text style={styles.previewText} numberOfLines={2}>
          {item.fortune_message}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        {item.is_expanded && (
          <View style={styles.expandedBadge}>
            <Ionicons name="star" size={12} color="#f0d060" />
            <Text style={styles.expandedText}>Detaylı</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#6060a0" />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={60} color="#4040a0" />
      <Text style={styles.emptyTitle}>Henüz yorum yok</Text>
      <Text style={styles.emptySubtitle}>İlk yorumunu almak için ana sayfaya dön</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.replace('/home')}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyButtonText}>Başla</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top + 10 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geçmiş Yorumlar</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={readingHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            readingHistory.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8080a0',
  },
  listContent: {
    padding: 20,
  },
  emptyList: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#8080a0',
  },
  timeText: {
    fontSize: 13,
    color: '#6060a0',
  },
  zodiacSymbol: {
    fontSize: 20,
  },
  cardContent: {
    marginBottom: 12,
  },
  focusTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  focusTagText: {
    fontSize: 12,
    color: '#c0a0f0',
  },
  previewText: {
    fontSize: 14,
    color: '#c0c0e0',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandedText: {
    fontSize: 12,
    color: '#f0d060',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8080a0',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a855f7',
  },
});
