import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import {
  AlarmClockCheck,
  BotMessageSquare,
  House,
  UserCircle,
} from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const theme = Colors.dark;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10) + 6;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabBarInactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'rgba(28, 28, 30, 0.85)',
          borderTopColor: 'rgba(56, 56, 58, 0.5)',
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + bottomPadding,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <House size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, size }) => (
            <AlarmClockCheck size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, size }) => (
            <BotMessageSquare size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}