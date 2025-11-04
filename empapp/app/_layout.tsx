import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './hooks/useLocation';

export default function RootLayout() {
  useEffect(() => {
    // Add favicon link for web platform
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const existingFavicon = document.querySelector("link[rel*='icon']");
      if (!existingFavicon) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = '/favicon.ico';
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <LocationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      </LocationProvider>
    </SafeAreaProvider>
  );
}
