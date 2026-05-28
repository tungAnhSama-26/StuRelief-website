import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api, BASE_URL } from '../../infrastructure/api/client';
import { useAuth } from '../../infrastructure/auth/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as SecureStore from 'expo-secure-store';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  // Ref để quản lý Server-Sent Events
  const eventSourceRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();
    setupSSE();
    
    return () => {
      if (eventSourceRef.current) {
        // Lưu ý: React Native polyfill cho EventSource thường có hàm close()
        try { eventSourceRef.current.close(); } catch(e){}
      }
    };
  }, [id]);

  const fetchMessages = async () => {
    try {
      const data = await api.get<any>(`/conversations/${id}/messages`);
      setMessages(data.messages || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      // Polyfill EventSource hoặc dùng XMLHttpRequest cho RN
      // Vì React Native không hỗ trợ EventSource gốc, dùng XHR để bắt luồng
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${BASE_URL}/conversations/${id}/sse`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      
      let seenBytes = 0;
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) { // LOADING
          const newData = xhr.response.substring(seenBytes);
          seenBytes = xhr.responseText.length;
          
          const lines = newData.split('\n');
          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'NEW_MESSAGE') {
                  setMessages(prev => {
                    if (prev.find(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                  });
                  // Cuộn xuống cuối
                  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                }
              } catch (e) {}
            }
          });
        }
      };
      xhr.send();
      eventSourceRef.current = { close: () => xhr.abort() };
    } catch (err) {
      console.error('SSE Error:', err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      const text = newMessage;
      setNewMessage(''); // Clear ngay lập tức
      await api.post(`/conversations/${id}/messages`, { content: text });
      // Không cần add vào state vì SSE sẽ bắt và trả về
    } catch (err) {
      console.error('Failed to send:', err);
      alert('Không thể gửi tin nhắn');
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#2563eb" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Nhập tin nhắn..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <IconSymbol name="paperplane.fill" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  myMessage: { backgroundColor: '#2563eb', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#111827' },
  timeText: { fontSize: 10, color: '#9ca3af', alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 16 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginLeft: 12, marginBottom: 2 }
});
