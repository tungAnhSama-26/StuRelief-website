import { useState, useEffect } from 'react';
import { api } from '../../infrastructure/api/client';

export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>('/conversations');
      setConversations(data.conversations || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return { conversations, loading, error, refetch: fetchConversations };
}
