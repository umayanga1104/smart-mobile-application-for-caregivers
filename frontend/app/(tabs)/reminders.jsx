import PageTitle from "@/components/PageTitle";
import RemindersSection from "@/components/ui/RemindersScreen/RemindersSection";
import { View } from "react-native";

export default function RemindersScreen() {
  const todayReminders = [
    {
      id: "1",
      title: "Morning Medication",
      subtitle: "Metformin 500mg",
      time: "08:00 AM",
      frequency: "Daily",
      completed: true,
    },
    {
      id: "2",
      title: "Blood Pressure Check",
      subtitle: "Record morning BP reading",
      time: "09:00 AM",
      frequency: "Daily",
      completed: true,
    },
    {
      id: "3",
      title: "Afternoon Medication",
      subtitle: "Lisinopril 10mg",
      time: "02:00 PM",
      frequency: "Daily",
      completed: false,
    },
  ];


  return (
    <View>
      <PageTitle title="Reminders" description="Stay on track, do the best"/>
      <RemindersSection remindersList={todayReminders} />
    </View>
  );
}