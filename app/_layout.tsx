import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View, Text, Button } from 'react-native';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


export default function RootLayout() {
  const { session, role, isLoading, setSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function initApp() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (e: any) {
        console.error('Initialization Error:', e);
        setError(e.message);
      }
    }

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    registerForPushNotifications().catch(err => {
      console.warn('Push Notification Setup Failed:', err);
    });

    return () => {
      subscription.unsubscribe();
    };
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

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4444', marginBottom: 10 }}>Startup Error</Text>
          <Text style={{ textAlign: 'center', color: '#666' }}>{error}</Text>
          <Button title="Try Again" onPress={() => setError(null)} />
        </View>
      </SafeAreaProvider>
    );
  }

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


