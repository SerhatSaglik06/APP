import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(user?.daily_calorie_goal.toString() || '2000');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateGoal = async () => {
    const goalValue = parseInt(newGoal);
    if (isNaN(goalValue) || goalValue < 500 || goalValue > 5000) {
      Alert.alert('Hata', 'Lütfen 500-5000 arası geçerli bir kalori hedefi girin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/user/goal`,
        { daily_calorie_goal: goalValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser(response.data);
      setEditingGoal(false);
      Alert.alert('Başarılı', 'Günlük kalori hedefiniz güncellendi');
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Hedef güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz (yemek kayıtları, istatistikler) kalıcı olarak silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Hesabımı Sil',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/user/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      Alert.alert(
        'Hesap Silindi',
        'Hesabınız ve tüm verileriniz başarıyla silindi.',
        [
          {
            text: 'Tamam',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Hesap silinemedi. Lütfen tekrar deneyin.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Günlük Kalori Hedefi</Text>
          <View style={styles.goalCard}>
            {!editingGoal ? (
              <>
                <View style={styles.goalInfo}>
                  <Ionicons name="flag" size={32} color="#4CAF50" />
                  <View style={styles.goalTextContainer}>
                    <Text style={styles.goalValue}>{user?.daily_calorie_goal} kcal</Text>
                    <Text style={styles.goalLabel}>Günlük hedef</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingGoal(true)}
                >
                  <Ionicons name="pencil" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={newGoal}
                  onChangeText={setNewGoal}
                  keyboardType="numeric"
                  placeholder="Kalori hedefi"
                  placeholderTextColor="#999"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingGoal(false);
                      setNewGoal(user?.daily_calorie_goal.toString() || '2000');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleUpdateGoal}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Kaydet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.infoText}>{user?.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                Katılım: {new Date(user?.created_at || '').toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama Hakkında</Text>
          <View style={styles.aboutCard}>
            <Ionicons name="nutrition" size={40} color="#4CAF50" />
            <Text style={styles.appName}>Food AI Scanner</Text>
            <Text style={styles.appVersion}>Versiyon 1.0.0</Text>
            <Text style={styles.appDescription}>
              Yemeğini çek, kalorisini gör! Sağlıklı yaşam için akıllı beslenme takip uygulaması.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerSectionTitle}>Tehlikeli Bölge</Text>
          <TouchableOpacity 
            style={[styles.deleteButton, deleteLoading && styles.buttonDisabled]} 
            onPress={handleDeleteAccount}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="trash" size={24} color="#fff" />
                <Text style={styles.deleteButtonText}>Hesabı Sil</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
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
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  goalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  editContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  dangerSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  dangerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  deleteWarning: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
