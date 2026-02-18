import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppScrollView from "../../components/utility/AppScrollView";
import useApp from "../../src/hooks/useApp";
import useAuth from "../../src/hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const {register} = useAuth();
  const {showErrorToast} = useApp();

  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const fields = [
    { name: "username", label: "Full Name", icon: "person-outline", placeholder: "John Doe" },
    { name: "email", label: "Email Address", icon: "mail-outline", placeholder: "you@example.com" },
    { name: "password", label: "Password", icon: "lock-closed-outline", placeholder: "Create a strong password", secure: true },
    { name: "confirmPassword", label: "Confirm Password", icon: "lock-closed-outline", placeholder: "Confirm your password", secure: true },
  ]

  const handleRegister = () => {
    if(credentials.username === "" || credentials.email === "" || credentials.password === "" || credentials.confirmPassword === "") {
      showErrorToast("Fill all shit bro", "Warning");
      return;
    }else if(credentials.password !== credentials.confirmPassword) {
      showErrorToast("Passwords do not match!!", "Error")
      return;
    }else {
      register(credentials.username, credentials.email, credentials.password);
    }
  } 

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-[#EEF5FF]"
      >
        <AppScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }} 
        className="flex-1 bg-[#EEF5FF] px-6"
        >

          {/* Logo */}
          <View className="items-center mb-8">
            <View className="bg-blue-600 p-5 rounded-full shadow-lg">
              <Ionicons name="heart-outline" size={30} color="white" />
            </View>
            <Text className="text-3xl font-bold mt-4">CareConnect</Text>
            <Text className="text-gray-600 mt-1">Join our community of caregivers</Text>
          </View>

          {/* Card */}
          <View className="bg-white p-6 rounded-3xl shadow-md">
            <Text className="text-2xl font-bold mb-1">Create Account</Text>
            <Text className="text-gray-500 mb-6">Sign up to start your journey</Text>

            {fields.map((field, index) => (
              <View key={index} className="mb-4">
                <Text className="text-gray-700 mb-2">{field.label}</Text>
                <View className="flex-row items-center border rounded-xl px-3 py-3">
                  <Ionicons name={field.icon} size={20} color="gray" />
                  <TextInput
                    placeholder={field.placeholder}
                    secureTextEntry={field.secure}
                    className="ml-2 flex-1 text-gray-700"

                    value={credentials[field.name]}

                    onChangeText={(value) => {
                      setCredentials(prev => ({
                        ...prev,
                        [field.name]: value,
                      }))
                    }}
                  />
                  {field.secure && <Ionicons name="eye-outline" size={20} color="gray" />}
                </View>
              </View>
            ))}

            {/* Terms */}
            <View className="flex-row items-center mb-5">
              <View className="w-4 h-4 border rounded mr-2" />
              <Text className="text-gray-600">
                I agree to the <Text className="text-blue-600">Terms of Service</Text> and <Text className="text-blue-600">Privacy Policy</Text>
              </Text>
            </View>

            <Pressable 
              className="bg-blue-600 py-4 rounded-xl"
              onPress={() => handleRegister()}
            >
              <Text className="text-white text-center font-semibold text-lg">Create Account</Text>
            </Pressable>

            <Text className="text-center text-gray-500 my-5">or sign up with</Text>

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

            <Text className="text-center mt-6 text-gray-600">
              Already have an account? 
              <Text 
              onPress={() => router.push("/login")}
              className="text-blue-600 font-semibold">
                Sign in
              </Text>
            </Text>
          </View>

          <Text className="text-center text-xs text-gray-500 mt-6">
            By creating an account, you agree to our Terms & Privacy Policy
          </Text>
        </AppScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
