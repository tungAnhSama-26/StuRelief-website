import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface PopulatedConversation {
  id: string;
  lastMessageAt: string;
  otherUser: {
    fullName: string;
    avatarUrl: string | null;
  } | null;
  product: {
    name: string;
  } | null;
  lastMessage: {
    content: string;
    senderId: string;
  } | null;
}

interface ConversationCardProps {
  conversation: PopulatedConversation;
  currentUserId: string;
  onPress: () => void;
}

export function ConversationCard({ conversation, currentUserId, onPress }: ConversationCardProps) {
  const { otherUser, product, lastMessage } = conversation;
  
  const displayName = otherUser?.fullName || 'Người dùng ẩn';
  const displayAvatar = otherUser?.avatarUrl || 'https://via.placeholder.com/150';
  const isMyLastMessage = lastMessage?.senderId === currentUserId;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: displayAvatar }} style={styles.avatar} />
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.time}>
            {new Date(conversation.lastMessageAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <Text style={styles.productName} numberOfLines={1}>
          {product?.name || 'Sản phẩm đã bị xóa'}
        </Text>
        <Text style={styles.messageSnippet} numberOfLines={1}>
          {isMyLastMessage ? 'Bạn: ' : ''}{lastMessage?.content || 'Chưa có tin nhắn'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productName: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  messageSnippet: {
    fontSize: 14,
    color: '#6b7280',
  },
});
