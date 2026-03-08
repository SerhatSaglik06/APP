import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DailySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  goal: number;
  meals_count: number;
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDailySummary();
  }, []);

  const loadDailySummary = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/meals/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDailySummary();
  };

  const caloriePercentage = summary ? (summary.total_calories / summary.goal) * 100 : 0;
  const remainingCalories = summary ? Math.max(0, summary.goal - summary.total_calories) : 0;

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
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.username}>{user?.username}!</Text>
          </View>
          <Ionicons name="nutrition" size={40} color="#4CAF50" />
        </View>

        <View style={styles.calorieCard}>
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieNumber}>{summary?.total_calories.toFixed(0) || 0}</Text>
            <Text style={styles.calorieLabel}>/ {summary?.goal || 2000} kcal</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(caloriePercentage, 100)}%`,
                  backgroundColor: caloriePercentage > 100 ? '#FF5252' : '#4CAF50',
                },
              ]}
            />
          </View>
          <Text style={styles.remainingText}>
            {remainingCalories > 0
              ? `${remainingCalories.toFixed(0)} kalori kaldı`
              : 'Günlük hedefe ulaştınız!'}
          </Text>
        </View>

        <View style={styles.macrosContainer}>
          <View style={styles.macroCard}>
            <Ionicons name="flame" size={32} color="#FF6B6B" />
            <Text style={styles.macroValue}>{summary?.total_protein.toFixed(1) || 0}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroCard}>
            <Ionicons name="pizza" size={32} color="#FFA726" />
            <Text style={styles.macroValue}>{summary?.total_carbs.toFixed(1) || 0}g</Text>
            <Text style={styles.macroLabel}>Karbonhidrat</Text>
          </View>
          <View style={styles.macroCard}>
            <Ionicons name="restaurant" size={32} color="#66BB6A" />
            <Text style={styles.macroValue}>{summary?.meals_count || 0}</Text>
            <Text style={styles.macroLabel}>Öğün</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(tabs)/scan')}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>Yemek Tara</Text>
        </TouchableOpacity>

        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={24} color="#FFA726" />
          <Text style={styles.tipsText}>
            Düzenli beslenme ve yeterli su tüketimi sağlıklı yaşamın anahtarıdır!
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  calorieCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calorieCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  calorieLabel: {
    fontSize: 18,
    color: '#666',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  remainingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 12,
    lineHeight: 20,
  },
});
