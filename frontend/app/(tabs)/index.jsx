import { SafeAreaView } from "react-native-safe-area-context";
import PageTitle from "../../components/PageTitle";
import ConnectedDeviceCard from "../../components/ui/HomeScreen/ConnectedDeviceCard";
import HealthStatsGrid from "../../components/ui/HomeScreen/HealthStatsGrid";
import InsightCard from "../../components/ui/HomeScreen/InsightCard";
import RecentActivities from "../../components/ui/HomeScreen/RecentActivities";
import AppScrollView from "../../components/utility/AppScrollView";

export default function Home() {
  return (
    <SafeAreaView className="bg-red-900" style={{flex: 1}} edges={['top']}>
      <AppScrollView>
        <PageTitle title="Home" description="Here's your patient's health overview"/>
        <HealthStatsGrid />
        <InsightCard />
        <RecentActivities />
        <ConnectedDeviceCard />
      </AppScrollView>
    </SafeAreaView>
  );
}