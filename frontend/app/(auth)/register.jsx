import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Register() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 20 }}>
        Register
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{
          backgroundColor: "black",
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          Back to Login
        </Text>
      </Pressable>
    </View>
  );
}
