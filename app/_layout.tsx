import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => { /* ignore */ });

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Push Notification Helper ─────────────────────────────────────────────────
async function registerForPushNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('No EAS projectId found — skipping push token registration.');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
    }
  } catch (err) {
    console.warn('Push notification setup failed (non-fatal):', err);
  }
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const { session, role, isLoading, setSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // ── Initialise app on mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function initApp() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) await setSession(session);
      } catch (e: any) {
        console.error('Initialization Error:', e);
        if (mounted) {
          setError(e?.message ?? 'Unknown startup error');
          await setSession(null);
        }
      }
    }

    initApp().finally(() => {
      if (mounted) setAppIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    registerForPushNotifications();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Role-based navigation ────────────────────────────────────────────────
  useEffect(() => {
    if (!appIsReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && role && inAuthGroup) {
      switch (role) {
        case 'waiter':  router.replace('/(tabs)/waiter'); break;
        case 'kitchen': router.replace('/kitchen');       break;
        case 'desk':    router.replace('/desk');          break;
        case 'display': router.replace('/display');       break;
        case 'admin':   router.replace('/(tabs)/admin');  break;
        default:        router.replace('/(auth)/login');  break;
      }
    }
  }, [session, role, isLoading, segments, appIsReady]);

  // ── Splash screen hide ───────────────────────────────────────────────────
  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady]);

  // Hold render until ready
  if (!appIsReady) return null;

  // ── Error fallback ───────────────────────────────────────────────────────
  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            onLayout={onLayoutRootView}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A0A00', padding: 24 }}
          >
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#E8500A', marginBottom: 8 }}>
              Startup Error
            </Text>
            <Text style={{ textAlign: 'center', color: '#ccc', marginBottom: 24, lineHeight: 22 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => { setError(null); setAppIsReady(false); }}
              style={{ backgroundColor: '#E8500A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"        options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
          <Stack.Screen name="kitchen"       options={{ headerShown: false }} />
          <Stack.Screen name="desk"          options={{ headerShown: false }} />
          <Stack.Screen name="display"       options={{ headerShown: false }} />
          <Stack.Screen name="ai-chat/index" options={{ title: 'AI Assistant', presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
