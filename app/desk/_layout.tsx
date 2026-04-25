import { Stack } from 'expo-router';

/**
 * Layout for the desk standalone screen.
 * Desk users land here directly after login — no tab bar needed.
 */
export default function DeskLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
