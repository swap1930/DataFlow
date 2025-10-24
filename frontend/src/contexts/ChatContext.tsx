import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../api/config';
import { getCurrentUserToken } from '../firebase/auth';

type ChatItem = {
  id: string;
  name: string;
  createdAt?: string;
  [key: string]: any;
};

type ChatState = {
  allChats: ChatItem[];
  recentChats: ChatItem[];
  loading: boolean;
  error: string | null;
  addChat: (chat: ChatItem) => void;
  deleteChat: (chatId: string) => void;
  refreshOnce: () => Promise<void>;
};

const ChatContext = createContext<ChatState | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allChats, setAllChats] = useState<ChatItem[]>([]);
  const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadedOnceRef = useRef<boolean>(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getCurrentUserToken();
      if (!token) {
        console.log('No authentication token found, skipping chat fetch');
        setAllChats([]);
        setRecentChats([]);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [allRes, recentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user-files`, { 
          method: 'GET',
          headers: headers
        }),
        fetch(`${API_BASE_URL}/user-recent-files`, { 
          method: 'GET',
          headers: headers
        })
      ]);
      
      if (!allRes.ok || !recentRes.ok) {
        throw new Error('Failed to load chats');
      }
      
      const allData = await allRes.json();
      const recentData = await recentRes.json();
      setAllChats(Array.isArray(allData?.files) ? allData.files : allData);
      setRecentChats(Array.isArray(recentData?.recent_files) ? recentData.recent_files : recentData);
    } catch (e: any) {
      console.error('ChatContext fetch error:', e);
      setError(e?.message || 'Failed to load chats');
      // Set empty arrays on error to prevent UI issues
      setAllChats([]);
      setRecentChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadedOnceRef.current) {
      loadedOnceRef.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  const addChat = useCallback((chat: ChatItem) => {
    setAllChats(prev => [chat, ...prev]);
    setRecentChats(prev => {
      const next = [chat, ...prev];
      return next.slice(0, 10);
    });
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setAllChats(prev => prev.filter(c => c.id !== chatId));
    setRecentChats(prev => prev.filter(c => c.id !== chatId));
  }, []);

  const refreshOnce = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  return (
    <ChatContext.Provider value={{ allChats, recentChats, loading, error, addChat, deleteChat, refreshOnce }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatState => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};