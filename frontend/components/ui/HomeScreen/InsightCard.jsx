import { Lightbulb } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export default function InsightsCard() {
  return (
    <View className="bg-blue-600 rounded-3xl p-5 mt-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white text-lg font-bold">
          Your Wellbeing Insights
        </Text>
        <Lightbulb color="yellow" size={20} />
      </View>

      <Text className="text-blue-100 mb-4">
        Tips to reduce your burden
      </Text>

      <View className="bg-blue-500 rounded-xl p-4 mb-3">
        <Text className="text-white font-semibold">
          Take a 10-minute break
        </Text>
        <Text className="text-blue-100 text-sm mt-1">
          Your stress levels are elevated. Try deep breathing exercises.
        </Text>
      </View>

      <Pressable className="mt-2 bg-white/20 rounded-xl py-3">
        <Text className="text-center text-white font-semibold">
          View Detailed Report
        </Text>
      </Pressable>
    </View>
  );
}
