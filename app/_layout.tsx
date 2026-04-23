import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

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

    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
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
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Update profile with token
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
      }
    }
  }

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
        <Stack.Screen name="ai-chat/index" options={{ title: 'AI Assistant', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
