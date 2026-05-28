import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useConversations } from '../../presentation/hooks/useConversations';
import { ConversationCard } from '../../presentation/components/ConversationCard';
import { useAuth } from '../../infrastructure/auth/AuthContext';

import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, loading, error, refetch } = useConversations();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tin nhắn</Text>
      </View>

      {loading && !conversations.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <ConversationCard 
              conversation={item}
              currentUserId={user?.id || ''}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
  },
  emptyText: {
    color: '#6b7280',
  }
});
