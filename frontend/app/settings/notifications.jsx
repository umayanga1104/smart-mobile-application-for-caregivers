import { ScrollView } from "react-native-web";
import PageTitle from "../../components/PageTitle";

const NotificationScreen = () => {
    return (
        <ScrollView>
            <PageTitle title="Notifications" description="Manage your notification preferences"/>
        </ScrollView>
    );
}

export default NotificationScreen;