import PageTitle from "@/components/PageTitle";
import { FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{flex: 1}}>
        <PageTitle title="AI Assistant" description="get instant care guidance"/>

        <View className="bg-gray-100">
          {/* Quick actions */}
          <Text className="mt-4 text-gray-600 font-semibold">QUICK ACTIONS</Text>
          <ScrollView className="pl-5 py-1 mt-2" horizontal showsHorizontalScrollIndicator={true}>
            <QuickActionChip label="Medication interactions" />
            <QuickActionChip label="Care tips for diabetes" />
            <QuickActionChip label="Emergency symptoms" />
          </ScrollView>
        </View>

        {/* Messages */}
        <FlatList
          className="bg-gray-300"
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <ChatBubble {...item} />}
        />

        {/* Input */}
        <ChatInputBar />
      </View>
    </SafeAreaView>
  );
}
