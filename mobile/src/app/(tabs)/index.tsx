import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductCard } from '../../presentation/components/ProductCard';
import { useProducts } from '../../presentation/hooks/useProducts';
import { useAuth } from '../../infrastructure/auth/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { products, loading, error, refetch } = useProducts();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.fullName?.split(' ')[0] || 'Bạn'}</Text>
        <Text style={styles.title}>Đồ dùng học tập mới nhất</Text>
      </View>

      {loading && !products.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <ProductCard 
              product={item} 
              onPress={() => router.push(`/product/${item.id}` as any)} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text>Chưa có sản phẩm nào.</Text>
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
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: 60, // Padding cho status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
});
