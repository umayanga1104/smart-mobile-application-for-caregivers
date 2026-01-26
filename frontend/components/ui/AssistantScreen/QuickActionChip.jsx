import { Pressable, Text } from "react-native";

export default function QuickActionChip({ label }) {
    return (
        <Pressable className="bg-blue-100 rounded-full">
            <Text className="text-blue-700 font-medium">{label}</Text>
        </Pressable>
    );
}
