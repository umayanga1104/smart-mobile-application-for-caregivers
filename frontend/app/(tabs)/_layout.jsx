import useAuth from '@/src/hooks/useAuth';
import { Redirect, Tabs } from 'expo-router';
import { BellRing, BotMessageSquare, CircleUserRound, House } from 'lucide-react-native';


export default function TabLayout() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',

        tabBarStyle: {
          height: 100,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={28} name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <BellRing size={28} name="bell" color={color} />
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color }) => <BotMessageSquare size={28} name="comment" color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <CircleUserRound size={28} name="user" color={color}/>
        }}
      />
    </Tabs>
  );
}
