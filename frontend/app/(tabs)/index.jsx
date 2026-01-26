import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PageTitle from "../../components/PageTitle";
import ConnectedDeviceCard from "../../components/ui/HomeScreen/ConnectedDeviceCard";
import HealthStatsGrid from "../../components/ui/HomeScreen/HealthStatsGrid";
import InsightCard from "../../components/ui/HomeScreen/InsightCard";
import RecentActivities from "../../components/ui/HomeScreen/RecentActivities";

export default function Home() {
  return (
    <SafeAreaView>
      <ScrollView>
        <PageTitle title="Home" description="Here's your patient's health overview"/>
        <HealthStatsGrid />
        <InsightCard />
        <RecentActivities />
        <ConnectedDeviceCard />
      </ScrollView>
    </SafeAreaView>
  );
}