import { Pressable, Text } from "react-native";

export default function QuickActionChip({ label }) {
    return (
        <Pressable className="flex-row mr-2 justify-center items-center bg-blue-200 rounded-md px-3 py-1">
            <Text className="text-blue-700 font-medium">{label}</Text>
        </Pressable>
    );
}
