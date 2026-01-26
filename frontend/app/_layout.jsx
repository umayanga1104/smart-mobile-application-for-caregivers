import { Stack } from "expo-router";

// export const unstable_settings = {
//     anchor: "(auth)/login",
// };

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
        </Stack>
    );
}
