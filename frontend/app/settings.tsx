import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
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

const { width } = Dimensions.get('window');

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
  const { user, logout, updateUserSettings, setSelectedZodiac } = useAppStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [showZodiacModal, setShowZodiacModal] = useState(false);
  const [selectedZodiacLocal, setSelectedZodiacLocal] = useState<string | null>(user?.zodiac_sign || null);

  useEffect(() => {
    loadNotificationSettings();
    if (user?.zodiac_sign) {
      setSelectedZodiacLocal(user.zodiac_sign);
    }
  }, [user]);

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

  const handleZodiacSelect = async (zodiacId: string | null) => {
    setSelectedZodiacLocal(zodiacId);
    setShowZodiacModal(false);
    
    // Update in store and backend
    setSelectedZodiac(zodiacId);
    await updateUserSettings({ zodiac_sign: zodiacId });
    
    Alert.alert(
      'Burç Güncellendi',
      zodiacId ? `Varsayılan burcun ${ZODIAC_LABELS[zodiacId]} olarak ayarlandı.` : 'Varsayılan burç kaldırıldı.',
      [{ text: 'Tamam' }]
    );
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

      <ScrollView showsVerticalScrollIndicator={false}>
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
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowZodiacModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="star" size={22} color="#f0d060" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Varsayılan Burç</Text>
                <Text style={styles.settingDescription}>
                  {selectedZodiacLocal ? ZODIAC_LABELS[selectedZodiacLocal] : 'Seçilmedi'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6060a0" />
          </TouchableOpacity>
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
      </ScrollView>

      {/* Zodiac Selection Modal */}
      <Modal
        visible={showZodiacModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowZodiacModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Varsayılan Burç Seç</Text>
              <TouchableOpacity onPress={() => setShowZodiacModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.zodiacList} showsVerticalScrollIndicator={false}>
              {/* None option */}
              <TouchableOpacity
                style={[
                  styles.zodiacItem,
                  !selectedZodiacLocal && styles.zodiacItemSelected
                ]}
                onPress={() => handleZodiacSelect(null)}
                activeOpacity={0.7}
              >
                <View style={styles.zodiacItemLeft}>
                  <View style={[styles.zodiacSymbolContainer, { backgroundColor: 'rgba(128, 128, 160, 0.2)' }]}>
                    <Ionicons name="remove-circle-outline" size={24} color="#8080a0" />
                  </View>
                  <View>
                    <Text style={styles.zodiacName}>Seçim Yok</Text>
                    <Text style={styles.zodiacDates}>Her seferinde sor</Text>
                  </View>
                </View>
                {!selectedZodiacLocal && (
                  <Ionicons name="checkmark-circle" size={24} color="#a855f7" />
                )}
              </TouchableOpacity>

              {/* Zodiac signs */}
              {ZODIAC_SIGNS.map((sign) => (
                <TouchableOpacity
                  key={sign.id}
                  style={[
                    styles.zodiacItem,
                    selectedZodiacLocal === sign.id && styles.zodiacItemSelected
                  ]}
                  onPress={() => handleZodiacSelect(sign.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.zodiacItemLeft}>
                    <View style={styles.zodiacSymbolContainer}>
                      <Text style={styles.zodiacSymbol}>{sign.symbol}</Text>
                    </View>
                    <View>
                      <Text style={styles.zodiacName}>{sign.name}</Text>
                      <Text style={styles.zodiacDates}>{sign.dates}</Text>
                    </View>
                  </View>
                  {selectedZodiacLocal === sign.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#a855f7" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingVertical: 30,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a3a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  zodiacList: {
    padding: 16,
  },
  zodiacItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  zodiacItemSelected: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  zodiacItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zodiacSymbolContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 208, 96, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zodiacSymbol: {
    fontSize: 22,
  },
  zodiacName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  zodiacDates: {
    fontSize: 12,
    color: '#8080a0',
    marginTop: 2,
  },
});
