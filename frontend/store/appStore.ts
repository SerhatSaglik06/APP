import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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

interface User {
  id: string;
  device_id: string;
  email: string;
  username: string;
  zodiac_sign?: string;
  preferred_tone?: string;
  notification_enabled: boolean;
  notification_time: string;
  free_readings_today: number;
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  deviceId: string | null;
  user: User | null;
  
  // Selection state
  selectedFocus: string | null;
  selectedTone: string | null;
  selectedZodiac: string | null;
  
  // Reading state
  currentReading: Reading | null;
  readingHistory: Reading[];
  error: string | null;
  
  // Daily limit state
  hasFreeReading: boolean;
  readingsUsed: number;
  
  // Actions
  setDeviceId: (id: string) => void;
  setSelectedFocus: (focus: string) => void;
  setSelectedTone: (tone: string) => void;
  setSelectedZodiac: (zodiac: string | null) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  
  // API Actions
  checkExistingUser: (deviceId: string) => Promise<User | null>;
  register: (email: string, username: string) => Promise<boolean>;
  login: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkDailyReading: () => Promise<void>;
  generateReading: () => Promise<Reading | null>;
  expandReading: (readingId: string) => Promise<Reading | null>;
  fetchHistory: () => Promise<void>;
  updateUserSettings: (settings: Partial<User>) => Promise<void>;
  resetSelections: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  deviceId: null,
  user: null,
  selectedFocus: null,
  selectedTone: null,
  selectedZodiac: null,
  currentReading: null,
  readingHistory: [],
  error: null,
  hasFreeReading: true,
  readingsUsed: 0,
  
  // Setters
  setDeviceId: (id) => set({ deviceId: id }),
  setSelectedFocus: (focus) => set({ selectedFocus: focus }),
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  setSelectedZodiac: (zodiac) => set({ selectedZodiac: zodiac }),
  setUser: (user) => set({ user }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  
  // Check existing user
  checkExistingUser: async (deviceId) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.user) {
          set({ 
            user: data.user, 
            isAuthenticated: true,
            selectedZodiac: data.user.zodiac_sign,
            selectedTone: data.user.preferred_tone || 'motivational',
            isLoading: false
          });
          get().checkDailyReading();
          return data.user;
        }
      }
      set({ isLoading: false });
      return null;
    } catch (error) {
      console.log('Check user error:', error);
      set({ isLoading: false });
      return null;
    }
  },
  
  // Register new user
  register: async (email, username) => {
    const { deviceId } = get();
    if (!deviceId) return false;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          username, 
          device_id: deviceId 
        }),
      });
      
      if (response.ok) {
        const user = await response.json();
        await AsyncStorage.setItem('user_email', email);
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          selectedTone: user.preferred_tone || 'motivational'
        });
        return true;
      } else {
        const errorData = await response.json();
        set({ error: errorData.detail || 'Kayıt başarısız', isLoading: false });
        return false;
      }
    } catch (error) {
      console.log('Register error:', error);
      set({ error: 'Bağlantı hatası', isLoading: false });
      return false;
    }
  },
  
  // Login user
  login: async (email) => {
    const { deviceId } = get();
    if (!deviceId) return false;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, device_id: deviceId }),
      });
      
      if (response.ok) {
        const user = await response.json();
        await AsyncStorage.setItem('user_email', email);
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          selectedZodiac: user.zodiac_sign,
          selectedTone: user.preferred_tone || 'motivational'
        });
        get().checkDailyReading();
        return true;
      } else {
        const errorData = await response.json();
        set({ error: errorData.detail || 'Giriş başarısız', isLoading: false });
        return false;
      }
    } catch (error) {
      console.log('Login error:', error);
      set({ error: 'Bağlantı hatası', isLoading: false });
      return false;
    }
  },
  
  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('user_email');
    set({ 
      user: null, 
      isAuthenticated: false,
      currentReading: null,
      readingHistory: [],
      hasFreeReading: true,
      readingsUsed: 0
    });
  },
  
  // Check if user has free reading today
  checkDailyReading: async () => {
    const { deviceId } = get();
    if (!deviceId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/readings/check-daily/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        set({ 
          hasFreeReading: data.has_free_reading,
          readingsUsed: data.readings_used
        });
      }
    } catch (error) {
      console.log('Check daily reading error:', error);
    }
  },
  
  // Generate new reading
  generateReading: async () => {
    const { deviceId, selectedFocus, selectedTone, selectedZodiac } = get();
    
    if (!deviceId || !selectedFocus || !selectedTone) {
      set({ error: 'Lütfen tüm seçimleri yapın' });
      return null;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/api/readings/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          focus: selectedFocus,
          tone: selectedTone,
          zodiac_sign: selectedZodiac,
        }),
      });
      
      if (response.ok) {
        const reading = await response.json();
        set({ 
          currentReading: reading, 
          isLoading: false,
          hasFreeReading: false,
          readingsUsed: get().readingsUsed + 1
        });
        return reading;
      } else {
        const errorData = await response.json();
        set({ error: errorData.detail || 'Yorum oluşturulamadı', isLoading: false });
        return null;
      }
    } catch (error) {
      console.log('Generate reading error:', error);
      set({ error: 'Bağlantı hatası', isLoading: false });
      return null;
    }
  },
  
  // Expand reading (after ad)
  expandReading: async (readingId) => {
    const { deviceId } = get();
    if (!deviceId) return null;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/api/readings/expand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading_id: readingId,
          device_id: deviceId,
        }),
      });
      
      if (response.ok) {
        const reading = await response.json();
        set({ currentReading: reading, isLoading: false });
        return reading;
      } else {
        set({ error: 'Detaylı yorum alınamadı', isLoading: false });
        return null;
      }
    } catch (error) {
      console.log('Expand reading error:', error);
      set({ error: 'Bağlantı hatası', isLoading: false });
      return null;
    }
  },
  
  // Fetch reading history
  fetchHistory: async () => {
    const { deviceId } = get();
    if (!deviceId) return;
    
    set({ isLoading: true });
    
    try {
      const response = await fetch(`${API_URL}/api/readings/history/${deviceId}`);
      if (response.ok) {
        const history = await response.json();
        set({ readingHistory: history, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.log('Fetch history error:', error);
      set({ isLoading: false });
    }
  },
  
  // Update user settings
  updateUserSettings: async (settings) => {
    const { deviceId } = get();
    if (!deviceId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        const user = await response.json();
        set({ user });
      }
    } catch (error) {
      console.log('Update settings error:', error);
    }
  },
  
  // Reset selections for new reading
  resetSelections: () => {
    set({
      selectedFocus: null,
      selectedTone: null,
      currentReading: null,
      error: null,
    });
  },
}));
