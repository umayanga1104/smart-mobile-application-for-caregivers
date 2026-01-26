import { Text, View } from "react-native";

export default function ChatBubble({ message, isAI, time }) {
  return (
    <View className={`mb-4 ${isAI ? "items-start" : "items-end"}`}>
        <View
            className={`max-w-[80%] p-4 rounded-2xl ${
            isAI ? "bg-white border border-gray-200" : "bg-blue-600"
            }`}
        >
            <Text className={`${isAI ? "text-black" : "text-white"}`}>
                {message}
            </Text>
        </View>
        <Text className="text-gray-400 text-xs mt-1">{time}</Text>
    </View>
  );
}
