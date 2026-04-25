import * as Notifications from "expo-notifications";
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import LoadingScreen from "../components/screens/loading-screen";
import { Colors } from '../constants/theme';
import AuthProvider, { useAuth } from "../contexts/AuthProvider";
import { getAllReminders } from "../services/reminder.service";
import { cancelAllScheduledNotifications, startNotificationListener, stopNotificationListener } from "../utils/notificationListener";
import { syncReminderNotifications } from "../utils/reminderScheduler";

const theme = Colors.dark;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootNavigator() {
  const { user, authLoading } = useAuth();
  const segments = useSegments();
  const inAuthGroup = segments[0] === "(auth)";

  const [reminders, setReminders] = useState([]);
  const remindersRef = useRef(reminders);
  const notificationsSetupRef = useRef(false);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    const setupNotifications = async () => {
      if (authLoading) return;

      if (!user) {
        setReminders([]);
        stopNotificationListener();
        return;
      }

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.warn("Notification permission denied");
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.HIGH,
            enableSound: true,
            enableVibrate: true,
          });
        }

        await cancelAllScheduledNotifications();
        const data = await getAllReminders();
        setReminders(data);

        startNotificationListener(() => remindersRef.current);

        if (!notificationsSetupRef.current) {
          notificationsSetupRef.current = true;
          await syncReminderNotifications(data);
        }
      } catch (error) {
        console.error("Failed to setup notifications:", error.message);
      }
    };

    setupNotifications();
  }, [authLoading, user]);

  useEffect(() => {
    return () => stopNotificationListener();
  }, []);

  if (authLoading) return <LoadingScreen />;

  if (!user && !inAuthGroup) return <Redirect href="/(auth)/login" />;
  if (user && inAuthGroup) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="light" />
    </AuthProvider>
  );
}
