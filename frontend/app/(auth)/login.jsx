import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Login() {
  const handleLogin = () => {
    // Dummy login (later we will connect backend)
    router.replace("/(tabs)/home");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 20 }}>
        Login
      </Text>

      <Pressable
        onPress={handleLogin}
        style={{
          backgroundColor: "black",
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          Login (Dummy)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/register")}
        style={{ marginTop: 16 }}
      >
        <Text style={{ textAlign: "center", color: "blue" }}>
          Create account
        </Text>
      </Pressable>
    </View>
  );
}
