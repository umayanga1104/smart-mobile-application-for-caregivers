import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  return (
    <SafeAreaView className="bg-green-300" style={{flex: 1}} edges={['top']}>
      <View className="h-full bg-purple-300">
        <Text>Profile Screen</Text>
      </View>
    </SafeAreaView>
  );  
}