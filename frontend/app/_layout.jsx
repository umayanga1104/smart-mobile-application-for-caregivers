import { Stack } from "expo-router";
import "../global.css";

// export const unstable_settings = {
//     anchor: "(auth)/login",
// };

export default function RootLayout() {
    return (
        <Stack 
            screenOptions={{ 
                headerShown: false,
                contentStyle: {
                    paddingHorizontal: 10, // Add horizontal padding
                }
            }}
        >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
        </Stack>
    );
}
