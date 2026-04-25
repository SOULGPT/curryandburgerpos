import { Stack } from 'expo-router';

/**
 * Layout for the kitchen standalone screen.
 * Kitchen users land here directly after login — no tab bar needed.
 */
export default function KitchenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
