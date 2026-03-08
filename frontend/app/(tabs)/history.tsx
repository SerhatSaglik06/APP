import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Meal {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  image_base64: string;
  timestamp: string;
}

export default function HistoryScreen() {
  const { token } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/meals/history?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeals(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Dün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderMealItem = ({ item }: { item: Meal }) => (
    <View style={styles.mealCard}>
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }}
        style={styles.mealImage}
      />
      <View style={styles.mealInfo}>
        <Text style={styles.foodName}>{item.food_name}</Text>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
        <View style={styles.nutrients}>
          <View style={styles.nutrientItem}>
            <Ionicons name="flame" size={16} color="#FF6B6B" />
            <Text style={styles.nutrientText}>{item.calories.toFixed(0)} kcal</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Ionicons name="fitness" size={16} color="#4CAF50" />
            <Text style={styles.nutrientText}>{item.protein.toFixed(1)}g P</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Ionicons name="pizza" size={16} color="#FFA726" />
            <Text style={styles.nutrientText}>{item.carbs.toFixed(1)}g K</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Öğün Geçmişi</Text>
        <Text style={styles.subtitle}>{meals.length} öğün kaydedildi</Text>
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Henüz kayıtlı öğün yok</Text>
          <Text style={styles.emptySubtext}>İlk yemeğini taramaya başla!</Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
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
  header: {
    padding: 20,
    paddingBottom: 16,
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
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealImage: {
    width: '100%',
    height: 200,
  },
  mealInfo: {
    padding: 16,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  nutrients: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  nutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  nutrientText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
});
