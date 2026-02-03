import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import AuthProvider from "../src/context/AuthProvider";
import useAuth from "../src/hooks/useAuth";

function Navigation() {
    const { user, loading } = useAuth();

    if(loading) return null;

    //reason to remove: this redirects to the login before the authlayout being mounted
    // if(!user) return (<Redirect href="/(auth)/login" />);

    return (
        <Stack 
            screenOptions={{ 
                headerShown: false,
                contentStyle: {
                    padding: 0, // Add horizontal padding
                }
            }}
        >
            {
                !user?<Stack.Screen name="(auth)" />:
                <>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="settings" />
                </>
            }
        </Stack>
    );
}

export default function RootLayout () {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <Navigation/>
            </SafeAreaProvider>
        </AuthProvider>
    );
}