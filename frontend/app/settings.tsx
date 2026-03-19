import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { 
  scheduleDailyNotification, 
  cancelAllNotifications, 
  checkNotificationStatus,
  sendTestNotification 
} from '../services/notifications';

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

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserSettings } = useAppStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const status = await checkNotificationStatus();
    setNotificationsEnabled(status.enabled);
    setNotificationTime(status.time);
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (value) {
      await scheduleDailyNotification(9, 0);
      await updateUserSettings({ notification_enabled: true });
      Alert.alert(
        'Bildirimler Açıldı',
        'Her sabah 09:00\'da günlük yorum hatırlatması alacaksın.',
        [{ text: 'Tamam' }]
      );
    } else {
      await cancelAllNotifications();
      await updateUserSettings({ notification_enabled: false });
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('Test Bildirimi', 'Birkaç saniye içinde test bildirimi alacaksın.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabından çıkış yapmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.backButton} />
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={32} color="#a855f7" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.username}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={22} color="#f59e0b" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Günlük Hatırlatma</Text>
              <Text style={styles.settingDescription}>Her sabah 09:00</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#3e3e5e', true: '#a855f7' }}
            thumbColor={notificationsEnabled ? '#fff' : '#8080a0'}
          />
        </View>

        {notificationsEnabled && (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestNotification}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane" size={18} color="#a855f7" />
            <Text style={styles.testButtonText}>Test Bildirimi Gönder</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tercihler</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="star" size={22} color="#f0d060" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Varsayılan Burç</Text>
              <Text style={styles.settingDescription}>
                {user?.zodiac_sign ? ZODIAC_LABELS[user.zodiac_sign] : 'Seçilmedi'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6060a0" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap</Text>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>Falyn</Text>
        <Text style={styles.appVersion}>Versiyon 1.0.0</Text>
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
    marginBottom: 24,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: '#8080a0',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8080a0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8080a0',
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  appInfo: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    color: '#6060a0',
    fontWeight: '600',
  },
  appVersion: {
    fontSize: 12,
    color: '#4040a0',
    marginTop: 4,
  },
});
