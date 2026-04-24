import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => { /* ignore */ });

// ─── Push Notification Helper ─────────────────────────────────────────────────
// Defined at module level BEFORE it is used in the effect below
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

    // projectId is required for getExpoPushTokenAsync — read it safely
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
    async function initApp() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Always call setSession — even if session is null — so isLoading
        // is set to false inside the store and navigation can proceed.
        await setSession(session);
      } catch (e: any) {
        console.error('Initialization Error:', e);
        setError(e?.message ?? 'Unknown startup error');
        // Even on error we must release isLoading so the UI doesn't freeze
        await setSession(null);
      }
    }

    // Use finally so appIsReady is ALWAYS set regardless of success / error
    initApp().finally(() => setAppIsReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Register for push notifications AFTER the helper is fully defined
    registerForPushNotifications();

    return () => { subscription.unsubscribe(); };
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
      }
    }
  }, [session, role, isLoading, segments, appIsReady]);

  // ── Splash screen coordination ───────────────────────────────────────────
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady]);

  // Hold render until ready
  if (!appIsReady) return null;

  // Error screen — shows what went wrong instead of a silent crash
  if (error) {
    return (
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A0A00', padding: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#E8500A', marginBottom: 8 }}>
            Startup Error
          </Text>
          <Text style={{ textAlign: 'center', color: '#ccc', marginBottom: 24, lineHeight: 22 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => { setError(null); }}
            style={{ backgroundColor: '#E8500A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"       options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"       options={{ headerShown: false }} />
        <Stack.Screen name="kitchen"      options={{ headerShown: false }} />
        <Stack.Screen name="desk"         options={{ headerShown: false }} />
        <Stack.Screen name="display"      options={{ headerShown: false }} />
        <Stack.Screen name="ai-chat/index" options={{ title: 'AI Assistant', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
