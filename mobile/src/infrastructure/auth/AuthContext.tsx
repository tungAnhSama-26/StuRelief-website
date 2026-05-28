import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';
import { useRouter, useSegments } from 'expo-router';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  
  // Track last active timestamp for 10-minute session timeout
  const lastActiveTimestamp = useRef<number>(Date.now());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background
        lastActiveTimestamp.current = Date.now();
      } else if (nextAppState === 'active') {
        // App came to foreground
        const timeElapsed = Date.now() - lastActiveTimestamp.current;
        const TEN_MINUTES = 10 * 60 * 1000;
        
        if (timeElapsed > TEN_MINUTES) {
          // Inactive for more than 10 minutes -> logout
          signOut();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Khôi phục token và user từ SecureStore khi mở app
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const userDataString = await SecureStore.getItemAsync('userData');

        if (token && userDataString) {
          api.setToken(token);
          setUser(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error loading auth data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  // Điều hướng dựa trên trạng thái đăng nhập
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';
    
    if (!user && !inAuthGroup) {
      // Chưa đăng nhập mà vào màn hình khác -> đẩy về login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Đã đăng nhập mà vào login -> đẩy vào trang chủ
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const signIn = async (token: string, userData: User) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    api.setToken(token);
    setUser(userData);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('userData');
    api.setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
