import { Text, View } from "react-native";


const PageTitle = ({title, description}) => {
    return (
        <View className="p-4">
            <Text className="text-2xl font-bold">{title}</Text>
            <Text className="text-gray-600">{description}</Text>
        </View>
    );
}

export default PageTitle;