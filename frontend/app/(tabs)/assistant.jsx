import PageTitle from "@/components/PageTitle";
import { FlatList, ScrollView, Text, View } from "react-native";
import ChatBubble from "../../components/ui/AssistantScreen/ChatBubble";
import ChatInputBar from "../../components/ui/AssistantScreen/ChatInputBar";
import QuickActionChip from "../../components/ui/AssistantScreen/QuickActionChip";

export default function AssistantScreen() {
  const messages = [
    {
      id: "1",
      message:
        "Hello! I'm your AI care assistant. I can help you with medication information, care tips, and answer questions about your patient's health. How can I assist you today?",
      isAI: true,
      time: "10:30 AM",
    },
  ];

  return (
    <View className="flex-1">
      <PageTitle title="AI Assistant" description="get instant care guidance"/>

      <View className="flex-1 bg-gray-100">
        {/* Quick actions */}
        <Text className="mt-4 text-gray-600 font-semibold">QUICK ACTIONS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} className="h-10">
          <QuickActionChip label="Medication interactions" />
          <QuickActionChip label="Care tips for diabetes" />
          <QuickActionChip label="Emergency symptoms" />
        </ScrollView>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <ChatBubble {...item} />}
      />

      {/* Input */}
      <ChatInputBar />
    </View>
  );
}
