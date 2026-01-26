import { Send } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";

export default function ChatInputBar() {
  return (
    <View className="flex-row items-center p-3 border-t border-gray-200 bg-white">
        <TextInput
            placeholder="Type your question..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3"
        />

        <Pressable className="bg-blue-500 p-3 rounded-full">
            <Send size={18} color="white" />
        </Pressable>
    </View>
  );
}
