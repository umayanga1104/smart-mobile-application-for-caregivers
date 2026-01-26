import { Plus } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import ReminderCard from "./ReminderCard";

const RemindersSection = ({ remindersList }) => {
    return (
        <View className="flex flex-col">
            <FlatList
                data={remindersList}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <View className="px-2 pt-2 pb-4 bg-gray-100">

                    {/* Add button */}
                    <Pressable className="bg-blue-600 rounded-2xl py-4 mt-2 flex-row items-center justify-center">
                        <Plus color="white" size={20} />
                        <Text className="text-white font-semibold ml-2">
                            Add New Reminder
                        </Text>
                    </Pressable>

                    <Text className="mt-6 mb-2 text-gray-600 font-semibold">
                        TODAY
                    </Text>
                    </View>
                }
                renderItem={({ item }) => <ReminderCard {...item} />}
            />
        </View>
    );
}

export default RemindersSection;