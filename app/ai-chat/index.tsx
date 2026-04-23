import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/Theme';
import { Button } from '../../components/ui/Button';
import { AIService, ChatMessage } from '../../lib/ai';
import { supabase } from '../../lib/supabase';

export default function AIChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (content: string = input) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Fetch some context (today's orders) to make the AI smarter
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .gte('created_at', today);

    const context = orders ? `Today we have ${orders.length} total orders. Revenue: €${orders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(2)}.` : '';

    const response = await AIService.chat(newMessages, context);
    
    setMessages([...newMessages, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  const quickPrompts = [
    "How is today's revenue?",
    "Suggest an upsell strategy",
    "Identify busy periods",
    "Analyze order statuses"
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.title}>C&B AI Assistant</Text>
        <Text style={styles.subtitle}>Powered by Groq</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[
              styles.messageText,
              item.role === 'user' ? styles.userText : styles.assistantText
            ]}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Hello! I'm your AI manager. How can I help you today?</Text>
            <View style={styles.quickPrompts}>
              {quickPrompts.map((prompt, i) => (
                <TouchableOpacity key={i} style={styles.promptChip} onPress={() => sendMessage(prompt)}>
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask C&B AI..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Button 
          title="Send" 
          onPress={() => sendMessage()} 
          loading={isLoading}
          disabled={!input.trim()}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.cream },
  header: {
    padding: Theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: 'center'
  },
  title: { fontFamily: Theme.typography.display.fontFamily, fontSize: 24, color: Theme.colors.primaryOrange },
  subtitle: { fontFamily: Theme.typography.label.fontFamily, fontSize: 12, color: Theme.colors.mutedBrown },
  messageList: { padding: Theme.spacing.lg },
  messageBubble: {
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    marginBottom: Theme.spacing.md,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Theme.colors.primaryOrange,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  messageText: { fontFamily: Theme.typography.body.fontFamily, fontSize: 16 },
  userText: { color: Theme.colors.white },
  assistantText: { color: Theme.colors.darkBrown },
  inputContainer: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 30 : Theme.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    maxHeight: 100,
    fontFamily: Theme.typography.body.fontFamily,
    fontSize: 16,
  },
  sendButton: { marginLeft: Theme.spacing.sm, height: 45 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontFamily: Theme.typography.heading.fontFamily, fontSize: 18, color: Theme.colors.darkBrown, textAlign: 'center', marginBottom: Theme.spacing.xl },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Theme.spacing.sm },
  promptChip: { backgroundColor: Theme.colors.white, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderRadius: Theme.radius.pill, borderWidth: 1, borderColor: Theme.colors.border },
  promptChipText: { fontFamily: Theme.typography.label.fontFamily, fontSize: 14, color: Theme.colors.primaryOrange }
});
