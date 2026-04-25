import { BotMessageSquare, Mic, Send, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthProvider';
import assistantService from '../../services/assistant.service';

const theme = Colors.dark;

// ─── Message Bubble ───────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.bubbleContainer,
        isUser ? styles.userContainer : styles.botContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <BotMessageSquare size={16} color={theme.accent} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.userBubbleText : styles.botBubbleText,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
};

// ─── Typing Indicator ─────────────────────────────────
const TypingIndicator = () => (
  <View style={[styles.bubbleContainer, styles.botContainer]}>
    <View style={styles.botAvatar}>
      <BotMessageSquare size={16} color={theme.accent} />
    </View>
    <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
      <Text style={styles.typingText}>● ● ●</Text>
    </View>
  </View>
);

// ─── Assistant Screen ─────────────────────────────────
const AssistantScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
  const flatListRef = useRef(null);
  const { user } = useAuth();
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // ─── Voice recording state ─────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const inputTextRef = useRef('');
  const baseTextRef = useRef('');
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const recordingDotOpacity = useRef(new Animated.Value(1)).current;

  // Keep inputText ref in sync for voice callbacks
  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  // ─── Speech recognition event hooks ────────────────
  useSpeechRecognitionEvent('start', () => {
    baseTextRef.current = inputTextRef.current;
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      const separator = baseTextRef.current ? ' ' : '';
      setInputText((baseTextRef.current + separator + transcript).slice(0, 500));
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    setIsRecording(false);
  });

  // ─── Recording pulse animation ─────────────────────
  useEffect(() => {
    let animations = [];

    if (isRecording) {
      const pulse = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

      const dotBlink = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingDotOpacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordingDotOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );

      pulse.start();
      dotBlink.start();
      animations = [pulse, dotBlink];
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
      recordingDotOpacity.setValue(1);
    }

    return () => {
      animations.forEach(a => a.stop());
    };
  }, [isRecording]);

  // ─── Voice recording controls ──────────────────────
  const startRecording = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Microphone permission is needed for voice input.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start voice recording:', e);
      Alert.alert('Voice Input', 'Failed to start voice recording. Please try again.');
    }
  };

  const stopRecording = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.error('Failed to stop voice recording:', e);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ─── Keyboard handling for Android ─────────────────
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const tabBarHeight = 60;
      const offset = e.endCoordinates.height - tabBarHeight;
      Animated.timing(keyboardHeight, {
        toValue: offset > 0 ? offset : 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ─── Load welcome message on mount ────────────────
  useEffect(() => {
    loadWelcomeMessage();
  }, []);

  const loadWelcomeMessage = async () => {
    try {
      setIsLoading(true);
      
      // Get user's name for personalized greeting
      const userName = user?.username || user?.displayName || 'there';
      const welcomePrompt = `Say a brief, warm welcome to ${userName}. Keep it to 1-2 sentences.`;
      
      // Send welcome request to get a personalized greeting
      const response = await assistantService.sendMessage(welcomePrompt);

      if (response && response.response) {
        // Store conversation_id for future messages
        if (response.conversation_id) {
          setConversationId(response.conversation_id);
        }

        const welcomeMessage = {
          id: (Date.now()).toString(),
          role: 'bot',
          content: response.response,
        };
        
        setMessages([welcomeMessage]);
        setWelcomeLoaded(true);
      } else {
        // Fallback welcome message
        setMessages([
          {
            id: '1',
            role: 'bot',
            content: `Hello! 👋 Welcome back, ${userName}. I'm your AI health assistant. How can I help you today?`,
          },
        ]);
        setWelcomeLoaded(true);
      }
    } catch (error) {
      console.error('Error loading welcome message:', error);
      
      // Fallback welcome message on error
      const userName = user?.username || 'there';
      setMessages([
        {
          id: '1',
          role: 'bot',
          content: `Hello! 👋 Welcome back, ${userName}. I'm your AI health assistant. How can I help you today?`,
        },
      ]);
      setWelcomeLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    // Stop recording if active before sending
    if (isRecording) {
      try { ExpoSpeechRecognitionModule.stop(); } catch (e) { /* ignore */ }
      setIsRecording(false);
    }

    if (inputText.trim() === '') return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await assistantService.sendMessage(messageToSend, conversationId);

      if (response && (response.response || response.message || response.reply)) {
        if (response.conversation_id && !conversationId) {
          setConversationId(response.conversation_id);
        }

        const botContent = response.response || response.message || response.reply || '';
        const botMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: botContent,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const fallbackMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: 'I received your message but could not format my response properly.',
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const status = error.response?.status;
      const serverMessage = error.response?.data?.error;
      
      let errorMessage;
      if (status === 429) {
        errorMessage = "You're sending messages too fast. Please wait a moment.";
      } else if (status === 400) {
        errorMessage = serverMessage || "This conversation is too long. Please start a new one.";
      } else if (status === 503) {
        errorMessage = "AI assistant is temporarily unavailable. Try again shortly.";
      } else if (status === 504) {
        errorMessage = "Response took too long. Please try again.";
      } else if (!error.response) {
        errorMessage = "No internet connection. Please check your network.";
      } else {
        errorMessage = "Something went wrong. Please try again.";
      }
      
      const errorBotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: `⚠️ ${errorMessage}`,
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Health & Wellness</Text>
      </View>

      <View style={styles.chatContainer}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          extraData={messages}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {/* Recording indicator banner */}
          {isRecording && (
            <View style={styles.recordingBanner}>
              <Animated.View style={[styles.recordingDot, { opacity: recordingDotOpacity }]} />
              <Text style={styles.recordingText}>Listening...</Text>
            </View>
          )}
          <View style={styles.inputWrapper}>
            {/* Mic button */}
            <View style={styles.micContainer}>
              {isRecording && (
                <Animated.View
                  style={[
                    styles.micPulseRing,
                    {
                      transform: [{ scale: pulseScale }],
                      opacity: pulseOpacity,
                    },
                  ]}
                />
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={toggleRecording}
                disabled={isLoading}
              >
                {isRecording ? (
                  <Square size={14} color="#FFFFFF" />
                ) : (
                  <Mic size={18} color={theme.tertiaryText} />
                )}
              </Pressable>
            </View>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isRecording ? 'Listening...' : 'Type a message...'}
              placeholderTextColor={isRecording ? '#FF453A' : theme.placeholder}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              editable={!isLoading}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                (inputText.trim() === '' || isLoading) && styles.sendButtonDisabled,
                pressed && !isLoading && { opacity: 0.7 },
              ]}
              onPress={sendMessage}
              disabled={inputText.trim() === '' || isLoading}
            >
              <Send
                size={18}
                color={
                  inputText.trim() !== '' && !isLoading ? '#FFFFFF' : theme.tertiaryText
                }
              />
            </Pressable>
          </View>
        </View>
        <Animated.View style={{ height: keyboardHeight }} />
      </View>
    </SafeAreaView>
  );
};

export default AssistantScreen;

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    marginTop: 2,
  },

  chatContainer: {
    flex: 1,
  },

  // Messages
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: theme.accent,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: theme.tertiaryBackground,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  botBubbleText: {
    color: theme.text,
  },

  // Typing
  typingBubble: {
    paddingVertical: 14,
  },
  typingText: {
    color: theme.secondaryText,
    fontSize: 14,
    letterSpacing: 2,
  },

  // Input
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.separator,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'android' ? 12 : 28,
    backgroundColor: theme.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.secondaryBackground,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.tertiaryBackground,
  },

  // Voice recording
  micContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  micPulseRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF453A',
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  micButtonActive: {
    backgroundColor: '#FF453A',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF453A',
  },
  recordingText: {
    fontSize: 13,
    color: '#FF453A',
    fontWeight: '600',
  },
});