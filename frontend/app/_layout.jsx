import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    // <AuthProvider>
      <Stack 
            screenOptions={{ 
                headerShown: false,
                contentStyle: {
                    paddingHorizontal: 10, // Add horizontal padding
                }
            }}
            initialRouteName="(auth)"
        >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
        </Stack>
    // </AuthProvider>
  );
}