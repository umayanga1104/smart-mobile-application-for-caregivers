import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth group */}
      <Stack.Screen name="(auth)" />

      {/* Main tab group */}
      <Stack.Screen name="(tabs)" />

      {/* Settings pages without bottom tab */}
      <Stack.Screen name="settings" />
    </Stack>
  );
}
