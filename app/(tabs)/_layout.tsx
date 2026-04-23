import { Tabs } from 'expo-router';
import { Theme } from '../../constants/Theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Theme.colors.primaryOrange,
      tabBarInactiveTintColor: Theme.colors.mutedBrown,
      tabBarStyle: {
        backgroundColor: Theme.colors.white,
        borderTopColor: Theme.colors.border,
      }
    }}>
      <Tabs.Screen
        name="waiter"
        options={{
          title: 'Waiter',
          // Add icons when vector-icons are available
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
        }}
      />
    </Tabs>
  );
}
