import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { scheduleDailyNotification, sendTestNotification } from '../services/notifications';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, login, error } = useAppStore();
  
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    setLocalError('');
    setIsSubmitting(true);
    
    if (!email.trim()) {
      setLocalError('Email adresi gerekli');
      setIsSubmitting(false);
      return;
    }
    
    if (!validateEmail(email)) {
      setLocalError('Geçerli bir email adresi girin');
      setIsSubmitting(false);
      return;
    }
    
    if (!password.trim()) {
      setLocalError('Şifre gerekli');
      setIsSubmitting(false);
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Şifre en az 6 karakter olmalı');
      setIsSubmitting(false);
      return;
    }
    
    if (isRegister) {
      if (!username.trim()) {
        setLocalError('Kullanıcı adı gerekli');
        setIsSubmitting(false);
        return;
      }
      if (username.trim().length < 2) {
        setLocalError('Kullanıcı adı en az 2 karakter olmalı');
        setIsSubmitting(false);
        return;
      }
      
      const success = await register(email.trim(), username.trim(), password);
      setIsSubmitting(false);
      if (success) {
        // Schedule daily notification and send test
        await scheduleDailyNotification(9, 0);
        await sendTestNotification();
        router.replace('/home');
      }
    } else {
      const success = await login(email.trim(), password);
      setIsSubmitting(false);
      if (success) {
        router.replace('/home');
      }
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#1a1a3a', '#2a1a4a']}
      style={[styles.container, { paddingTop: insets.top + 40 }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Ionicons name="moon" size={70} color="#f0d060" />
            <Text style={styles.title}>Falyn</Text>
            <Text style={styles.subtitle}>AI Günlük Burç & Fal</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isRegister ? 'Hesap Oluştur' : 'Giriş Yap'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isRegister
                ? 'Kişiselleştirilmiş yorumlar için kayıt ol'
                : 'Hesabına giriş yap'}
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8080a0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email adresin"
                placeholderTextColor="#6060a0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Username Input (only for register) */}
            {isRegister && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8080a0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı adın"
                  placeholderTextColor="#6060a0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8080a0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifren (en az 6 karakter)"
                placeholderTextColor="#6060a0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#8080a0" 
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {(localError || error) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{localError || error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isSubmitting ? (
                  <Text style={styles.buttonText}>Lütfen bekleyin...</Text>
                ) : (
                  <Text style={styles.buttonText}>
                    {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle Auth Mode */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsRegister(!isRegister);
                setLocalError('');
                setPassword('');
              }}
            >
              <Text style={styles.toggleText}>
                {isRegister
                  ? 'Zaten hesabın var mı? '
                  : 'Hesabın yok mu? '}
                <Text style={styles.toggleTextHighlight}>
                  {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features Info */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="sparkles" size={20} color="#a855f7" />
              <Text style={styles.featureText}>AI destekli kişisel yorumlar</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={20} color="#f59e0b" />
              <Text style={styles.featureText}>Her sabah 09:00'da bildirim</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={20} color="#ec4899" />
              <Text style={styles.featureText}>Pozitif ve yönlendirici içerik</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#a0a0c0',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#8080a0',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  toggleButton: {
    alignItems: 'center',
  },
  toggleText: {
    color: '#8080a0',
    fontSize: 14,
  },
  toggleTextHighlight: {
    color: '#a855f7',
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: '#a0a0c0',
    fontSize: 14,
  },
});
