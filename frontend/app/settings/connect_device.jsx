import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-web";
import PageTitle from "../../components/PageTitle";

const ConnectDeviceScreen = () => {
    return (
        <SafeAreaView>
            <ScrollView>
                <PageTitle title="Connect Device" description="Connect your smart device to the application"/>
            </ScrollView>
        </SafeAreaView>
    );
}

export default ConnectDeviceScreen;