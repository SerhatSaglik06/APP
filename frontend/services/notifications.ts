import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Daily notification messages
const NOTIFICATION_MESSAGES = [
  {
    title: '🌟 Falyn - Günlük Yorumun Hazır!',
    body: 'Bugün evrenin sana neler fısıldadığını öğrenmek ister misin?',
  },
  {
    title: '✨ Günaydın! Bugünün Enerjisi',
    body: 'Yeni bir gün, yeni fırsatlar! Günlük falın seni bekliyor.',
  },
  {
    title: '🔮 Falyn Hatırlatması',
    body: 'Bugünkü burç yorumun hazır. Günün rehberliğini al!',
  },
  {
    title: '💫 Yıldızlar Seninle Konuşmak İstiyor',
    body: 'Günlük kişisel yorumun seni bekliyor. Hemen bak!',
  },
  {
    title: '🌙 Falyn - Günün Mesajı',
    body: 'Bugün için özel bir mesajın var. Keşfetmeye hazır mısın?',
  },
];

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-horoscope', {
      name: 'Günlük Burç Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#a855f7',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const response = await Notifications.getExpoPushTokenAsync();
      token = response.data;
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleDailyNotification(hour: number = 9, minute: number = 0): Promise<void> {
  try {
    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get a random message
    const randomMessage = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
    
    // Schedule daily notification at specified time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomMessage.title,
        body: randomMessage.body,
        data: { screen: 'home' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: minute,
      },
    });
    
    // Save notification settings
    await AsyncStorage.setItem('notification_time', `${hour}:${minute}`);
    await AsyncStorage.setItem('notifications_enabled', 'true');
    
    console.log(`Daily notification scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
  } catch (error) {
    console.log('Error scheduling notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('notifications_enabled', 'false');
    console.log('All notifications cancelled');
  } catch (error) {
    console.log('Error cancelling notifications:', error);
  }
}

export async function checkNotificationStatus(): Promise<{
  enabled: boolean;
  time: string;
}> {
  const enabled = await AsyncStorage.getItem('notifications_enabled');
  const time = await AsyncStorage.getItem('notification_time') || '09:00';
  
  return {
    enabled: enabled === 'true',
    time,
  };
}

export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔮 Falyn Test Bildirimi',
        body: 'Bildirimler başarıyla ayarlandı! Her sabah 09:00\'da günlük yorumun için hatırlatma alacaksın.',
        data: { screen: 'home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  } catch (error) {
    console.log('Error sending test notification:', error);
  }
}
