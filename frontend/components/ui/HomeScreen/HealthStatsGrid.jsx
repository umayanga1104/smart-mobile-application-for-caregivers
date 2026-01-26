import { Activity, Droplet, Heart, Moon } from "lucide-react-native";
import { FlatList, Text, View } from "react-native";


export function StatCard({width, icon, title, value, unit, status, statusColor = "text-green-600" }) {
  return (
    <View className="flex-1 border-2 border-red-100 border-solid bg-white rounded-2xl p-4 shadow-sm ">
      <View className="mb-2">
        {icon}
      </View>

      <Text className="text-gray-500 text-sm">{title}</Text>

      <View className="flex-row items-end mt-1">
        <Text className="text-2xl font-bold text-black">{value}</Text>
        <Text className="text-gray-500 ml-1">{unit}</Text>
      </View>

      <Text className={`${statusColor} mt-1 text-sm font-medium`}>
        {status}
      </Text>
    </View>
  );
}

export default function HealthOverview() {  
  const healthData = [
    {id: 1, title: "Heart Rate", value: "72", unit: "bpm", status: "Normal", icon: <Heart size={20} color="#ef4444" />},
    {id: 2, title: "Blood Pressure", value: "120/80", unit: "mmHg", status: "Normal", icon: <Activity size={20} color="#3b82f6" />},
    {id: 3, title: "Blood Sugar", value: "95", unit: "mg/dL", status: "Normal", icon: <Droplet size={20} color="#a855f7" />},
    {id: 4, title: "Sleep Quality", value: "7.5", unit: "hrs", status: "Good", statusColor: "text-blue-600", icon: <Moon size={20} color="#6366f1" />},
  ];

  const numberOfColumns = 2; // Define the number of columns you want

  return (
      <FlatList
      columnWrapperStyle={{ justifyContent: "space-between" }} // spreads columns
      contentContainerStyle={{ paddingVertical: 8 }}
      scrollEnabled={false} // 🔥 CHANGED → prevents nested scroll
      data={healthData}
      renderItem={({ item }) => (
        <View style={{ flex: 1, margin: 6 }}>
          <StatCard
            title={item.title}
            value={item.value}
            unit={item.unit}
            status={item.status}
            statusColor={item.statusColor}
            icon={item.icon}
          />
        </View>
        
      )}

      keyExtractor={item => item.id}
      numColumns={numberOfColumns}
      />
  );
}