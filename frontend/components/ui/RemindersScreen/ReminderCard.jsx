import { Check, Clock, Pencil } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export default function ReminderCard({id, title, subtitle, time, frequency, completed }) {
  return (
    <View
        id={id}
        className={`rounded-2xl p-4 mb-4 bg-white shadow-sm border ${
        completed ? "border-green-400" : "border-gray-200"
      }`}
    >
      <View className="flex-row items-start">
        {/* Status circle */}
        <View className={`mr-3 mt-1 w-6 h-6 rounded-full items-center justify-center border ${
            completed ? "bg-green-500 border-green-500" : "border-gray-300"
        }`}>
            {completed && <Check size={14} color="white" />}
        </View>

        <View className="flex-1">
          <Text
            className={`text-lg font-semibold ${
                completed ? "line-through text-gray-400" : "text-black"
            }`}
          >
            {title}
          </Text>

          <Text className="text-gray-500 mt-1">{subtitle}</Text>

            <View className="flex-row items-center mt-2">
                <Clock size={14} color="#6b7280" />
                <Text className="text-gray-500 ml-1">{time}</Text>
                <Text className="text-gray-400 mx-2">•</Text>
                <Text className="text-gray-500">{frequency}</Text>
            </View>
        </View>

        <Pressable className="bg-purple-100 p-2 rounded-xl">
            <Pencil size={16} color="#8b5cf6" />
        </Pressable>
      </View>
    </View>
  );
}
