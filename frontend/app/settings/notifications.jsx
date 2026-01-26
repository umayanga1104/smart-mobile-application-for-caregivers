import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-web";
import PageTitle from "../../components/PageTitle";

const NotificationScreen = () => {
    return (
        <SafeAreaView>
            <ScrollView>
                <PageTitle title="Notifications" description="Manage your notification preferences"/>
            </ScrollView>
        </SafeAreaView>
    );
}

export default NotificationScreen;