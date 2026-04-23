import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const { session, role, isLoading, setSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && role) {
      // Redirect based on role
      if (inAuthGroup || !segments.length) {
        if (role === 'waiter') {
          router.replace('/(tabs)/waiter');
        } else if (role === 'kitchen') {
          router.replace('/kitchen');
        } else if (role === 'desk') {
          router.replace('/desk');
        } else if (role === 'display') {
          router.replace('/display');
        } else if (role === 'admin') {
          router.replace('/(tabs)/admin');
        }
      }
    }
  }, [session, role, isLoading, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="kitchen" options={{ headerShown: false }} />
        <Stack.Screen name="desk" options={{ headerShown: false }} />
        <Stack.Screen name="display" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
