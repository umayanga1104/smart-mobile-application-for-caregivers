import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function LoginScreen() {
    const handleLogin = () => {
        router.replace("/(tabs)");
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Login Screen</Text>

            <Pressable onPress={() => handleLogin()} style={{ marginTop: 20, padding: 10, backgroundColor: 'blue' }}>
                <Text>
                    Login
                </Text>
            </Pressable>
        </View>
    );
}