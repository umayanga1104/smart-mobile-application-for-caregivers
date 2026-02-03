import { ScrollView } from "react-native";

const AppScrollView = ({ children, ...props }) => {
    return (
        <ScrollView
            className="bg-green-300"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 10, flex: 1 , paddingBottom: 10}} 
            {...props}
        >
            {children}
        </ScrollView>
    );
}

export default AppScrollView;