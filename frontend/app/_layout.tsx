import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0a0a1a' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="home" />
        <Stack.Screen name="focus" />
        <Stack.Screen name="tone" />
        <Stack.Screen name="zodiac" />
        <Stack.Screen name="result" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
