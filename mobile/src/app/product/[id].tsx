import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../infrastructure/api/client';
import { useAuth } from '../../infrastructure/auth/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await api.get<any>(`/products/${id}`);
        setProduct(data.product || data);
        const reviewsData = await api.get<any>(`/products/${id}/reviews`);
        setReviews(reviewsData.reviews || []);
      } catch (err: any) {
        setError(err.message || 'Lỗi tải chi tiết sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleStartChat = async () => {
    if (!product || !user) return;
    try {
      // 1. Tạo hoặc lấy conversation với người bán
      const result = await api.post<any>('/conversations', {
        receiverId: product.sellerId,
        productId: product.id
      });
      // 2. Chuyển hướng sang màn hình chat
      router.push(`/chat/${result.id}`);
    } catch (err) {
      console.error('Failed to start chat', err);
      alert('Không thể bắt đầu chat');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error || !product) return <View style={styles.center}><Text style={styles.error}>{error || 'Không tìm thấy sản phẩm'}</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }} 
          style={styles.image} 
        />
        
        <View style={styles.infoSection}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.condition}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#f3f4f6' }]}>
              <Text style={[styles.badgeText, { color: '#4b5563' }]}>{product.category?.name || 'Đồ dùng'}</Text>
            </View>
          </View>
          
          <Text style={styles.descriptionHeader}>Mô tả chi tiết</Text>
          <Text style={styles.description}>{product.description}</Text>
          
          <View style={styles.sellerSection}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{product.seller?.fullName?.charAt(0) || 'S'}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller?.fullName || 'Người bán'}</Text>
              <Text style={styles.sellerMeta}>Uy tín: {product.seller?.reputationScore || 0} điểm</Text>
            </View>
          </View>

          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.descriptionHeader}>Đánh giá người bán ({reviews.length})</Text>
              {reviews.map((review: any) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.author?.fullName || 'Ẩn danh'}</Text>
                    <View style={styles.likeBadge}>
                      <FontAwesome5 name="thumbs-up" solid size={12} color="#1877F2" />
                      <Text style={styles.likeText}>Đã thích</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Footer Fixed */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.chatButton} 
          onPress={handleStartChat}
          disabled={user?.id === product.sellerId}
        >
          <IconSymbol name="message.fill" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>
            {user?.id === product.sellerId ? 'Đây là sản phẩm của bạn' : 'Chat với người bán'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  error: { color: '#ef4444', fontSize: 16 },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  infoSection: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  price: { fontSize: 22, fontWeight: 'bold', color: '#ef4444', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', marginBottom: 20 },
  badge: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  badgeText: { color: '#1d4ed8', fontSize: 14, fontWeight: '500' },
  descriptionHeader: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 24 },
  sellerSection: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sellerAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sellerMeta: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  chatButton: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  chatButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  reviewsSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16 },
  reviewItem: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewAuthor: { fontSize: 14, fontWeight: '600', color: '#374151' },
  likeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f0fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  likeText: { fontSize: 12, color: '#1877F2', marginLeft: 4, fontWeight: '500' },
  reviewComment: { fontSize: 14, color: '#4b5563', lineHeight: 20 }
});
