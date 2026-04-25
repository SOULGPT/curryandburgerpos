import { Stack } from 'expo-router';

/**
 * Layout for the display standalone screen.
 * Display screen is shown on the customer-facing tablet — no tab bar needed.
 */
export default function DisplayLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
