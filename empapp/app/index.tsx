import { Redirect, useRouter } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return null;
  }

  // Fallback redirects
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
