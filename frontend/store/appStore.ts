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
  zodiac_sign?: string;
  preferred_tone?: string;
  notification_time?: string;
  free_readings_today: number;
}

interface AppState {
  // User state
  deviceId: string | null;
  user: User | null;
  
  // Selection state
  selectedFocus: string | null;
  selectedTone: string | null;
  selectedZodiac: string | null;
  
  // Reading state
  currentReading: Reading | null;
  readingHistory: Reading[];
  isLoading: boolean;
  error: string | null;
  
  // Daily limit state
  hasFreeReading: boolean;
  readingsUsed: number;
  
  // Actions
  setDeviceId: (id: string) => void;
  setSelectedFocus: (focus: string) => void;
  setSelectedTone: (tone: string) => void;
  setSelectedZodiac: (zodiac: string | null) => void;
  
  // API Actions
  initializeUser: (deviceId: string) => Promise<void>;
  checkDailyReading: () => Promise<void>;
  generateReading: () => Promise<Reading | null>;
  expandReading: (readingId: string) => Promise<Reading | null>;
  fetchHistory: () => Promise<void>;
  resetSelections: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  deviceId: null,
  user: null,
  selectedFocus: null,
  selectedTone: null,
  selectedZodiac: null,
  currentReading: null,
  readingHistory: [],
  isLoading: false,
  error: null,
  hasFreeReading: true,
  readingsUsed: 0,
  
  // Setters
  setDeviceId: (id) => set({ deviceId: id }),
  setSelectedFocus: (focus) => set({ selectedFocus: focus }),
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  setSelectedZodiac: (zodiac) => set({ selectedZodiac: zodiac }),
  
  // Initialize user
  initializeUser: async (deviceId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      });
      
      if (response.ok) {
        const user = await response.json();
        set({ 
          user, 
          selectedZodiac: user.zodiac_sign,
          selectedTone: user.preferred_tone || 'motivational'
        });
        
        // Check daily reading status
        get().checkDailyReading();
      }
    } catch (error) {
      console.log('Initialize user error:', error);
    }
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
