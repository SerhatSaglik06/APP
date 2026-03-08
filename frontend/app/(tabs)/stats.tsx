import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Stats {
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  total_meals: number;
  days_tracked: number;
}

export default function StatsScreen() {
  const { token } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<Stats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [weeklyRes, monthlyRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/stats/weekly`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/api/stats/monthly`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setWeeklyStats(weeklyRes.data);
      setMonthlyStats(monthlyRes.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>İstatistikler</Text>
          <Text style={styles.subtitle}>İlerleme takibiniz</Text>
        </View>

        {/* Weekly Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Son 7 Gün</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={32} color="#FF6B6B" />
                <Text style={styles.statValue}>{weeklyStats?.avg_calories.toFixed(0) || 0}</Text>
                <Text style={styles.statLabel}>Ort. Kalori</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="fitness" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>{weeklyStats?.avg_protein.toFixed(1) || 0}g</Text>
                <Text style={styles.statLabel}>Ort. Protein</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="pizza" size={32} color="#FFA726" />
                <Text style={styles.statValue}>{weeklyStats?.avg_carbs.toFixed(1) || 0}g</Text>
                <Text style={styles.statLabel}>Ort. Karbonhidrat</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="restaurant" size={32} color="#9C27B0" />
                <Text style={styles.statValue}>{weeklyStats?.total_meals || 0}</Text>
                <Text style={styles.statLabel}>Toplam Öğün</Text>
              </View>
            </View>

            <View style={styles.daysTracked}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.daysTrackedText}>
                {weeklyStats?.days_tracked || 0} gün takip edildi
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Son 30 Gün</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={32} color="#FF6B6B" />
                <Text style={styles.statValue}>{monthlyStats?.avg_calories.toFixed(0) || 0}</Text>
                <Text style={styles.statLabel}>Ort. Kalori</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="fitness" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>{monthlyStats?.avg_protein.toFixed(1) || 0}g</Text>
                <Text style={styles.statLabel}>Ort. Protein</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="pizza" size={32} color="#FFA726" />
                <Text style={styles.statValue}>{monthlyStats?.avg_carbs.toFixed(1) || 0}g</Text>
                <Text style={styles.statLabel}>Ort. Karbonhidrat</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="restaurant" size={32} color="#9C27B0" />
                <Text style={styles.statValue}>{monthlyStats?.total_meals || 0}</Text>
                <Text style={styles.statLabel}>Toplam Öğün</Text>
              </View>
            </View>

            <View style={styles.daysTracked}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.daysTrackedText}>
                {monthlyStats?.days_tracked || 0} gün takip edildi
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            İstatistikleriniz günlük olarak güncellenir. Düzenli takip sağlıklı yaşamın anahtarıdır!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  daysTracked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
  },
  daysTrackedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    lineHeight: 20,
  },
});
