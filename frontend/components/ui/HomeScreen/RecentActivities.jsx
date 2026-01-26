import { Text, View } from "react-native";

function ActivityItem({ title, time, color }) {
  return (
    <View className="flex-row items-center mb-3">
        <View className={`w-2 h-2 rounded-full mr-3 ${color}`} />
        <View>
            <Text className="font-medium">{title}</Text>
            <Text className="text-gray-500 text-sm">{time}</Text>
        </View>
    </View>
  );
}

export default function RecentActivities() {
  return (
    <View className="bg-white rounded-2xl p-4 mt-6">
        <Text className="text-lg font-bold mb-4">
            Recent Activities
        </Text>

        <ActivityItem title="Medication taken" time="2 hours ago" color="bg-green-500" />
        <ActivityItem title="Blood pressure check" time="4 hours ago" color="bg-green-500" />
        <ActivityItem title="Doctor appointment" time="Tomorrow, 10:00 AM" color="bg-blue-500" />
    </View>
  );
}
