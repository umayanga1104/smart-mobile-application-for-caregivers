import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#EEF5FF]"
    >
      <ScrollView
      className="flex-1 bg-[#EEF5FF] px-6"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      >
        
        {/* Logo Section */}
        <View className="items-center mb-8">
          <View className="bg-blue-600 p-5 rounded-full shadow-lg">
            <Ionicons name="heart-outline" size={30} color="white" />
          </View>
          <Text className="text-3xl font-bold mt-4 text-black">CareConnect</Text>
          <Text className="text-gray-600 mt-1">Supporting caregivers, empowering care</Text>
        </View>

        {/* Card */}
        <View className="bg-white p-6 rounded-3xl shadow-md">

          <Text className="text-2xl font-bold mb-1">Welcome Back</Text>
          <Text className="text-gray-500 mb-6">Sign in to continue caring</Text>

          {/* Email */}
          <Text className="text-gray-700 mb-2">Email Address</Text>
          <View className="flex-row items-center border rounded-xl px-3 py-3 mb-4">
            <Ionicons name="mail-outline" size={20} color="gray" />
            <TextInput
              placeholder="you@example.com"
              className="ml-2 flex-1 text-gray-700"
            />
          </View>

          {/* Password */}
          <Text className="text-gray-700 mb-2">Password</Text>
          <View className="flex-row items-center border rounded-xl px-3 py-3 mb-2">
            <Ionicons name="lock-closed-outline" size={20} color="gray" />
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              className="ml-2 flex-1 text-gray-700"
            />
            <Ionicons name="eye-outline" size={20} color="gray" />
          </View>

          {/* Remember / Forgot */}
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center">
              <View className="w-4 h-4 border rounded mr-2" />
              <Text className="text-gray-600">Remember me</Text>
            </View>
            <Text className="text-blue-600 font-medium">Forgot password?</Text>
          </View>

          {/* Sign In Button */}
          <Pressable 
          className="bg-blue-600 py-4 rounded-xl"
          onPress={() => router.replace("/(tabs)")}>
            <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
          </Pressable>

          {/* Divider */}
          <Text className="text-center text-gray-500 my-5">or continue with</Text>

          {/* Social Buttons */}
          <View className="flex-row justify-between">
            <Pressable className="flex-1 border p-3 rounded-xl items-center mr-2 flex-row justify-center">
              <FontAwesome name="google" size={18} color="red" />
              <Text className="ml-2">Google</Text>
            </Pressable>

            <Pressable className="flex-1 border p-3 rounded-xl items-center ml-2 flex-row justify-center">
              <FontAwesome name="facebook" size={18} color="#1877F2" />
              <Text className="ml-2">Facebook</Text>
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <Text className="text-center mt-6 text-gray-600">
            Don&apos;t have an account?
            <Text
            onPress={() => router.push("/register")}
            className="text-blue-600 font-semibold">
              Sign up
            </Text>
          </Text>

        </View>

        <Text className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
