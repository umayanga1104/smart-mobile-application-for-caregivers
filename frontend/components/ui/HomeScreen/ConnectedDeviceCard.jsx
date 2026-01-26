import { Pressable, Text, View } from "react-native";

export default function ConnectedDeviceCard() {
  return (
    <View className="bg-white rounded-2xl p-4 mt-6">
      <Text className="text-lg font-bold mb-2">
        Connected Device
      </Text>

      <Text className="text-gray-500 mb-4">
        No device connected. Please connect a device to monitor patient data.
      </Text>

      <Pressable className="bg-blue-600 rounded-xl py-3">
        <Text className="text-center text-white font-semibold">
          Connect Device
        </Text>
      </Pressable>
    </View>
  );
}
