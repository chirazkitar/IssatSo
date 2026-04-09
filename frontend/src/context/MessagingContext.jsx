import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { messagesAPI } from '../api/index';
import { useAuth } from './AuthContext';

const MessagingContext = createContext({ unreadCount: 0, inbox: [], refresh: () => {} });

export function MessagingProvider({ children }) {
  const { user } = useAuth();
  const [inbox,       setInbox]       = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef(null);

  const fetchInbox = useCallback(async () => {
    if (!user) return;
    try {
      const [messages, countData] = await Promise.all([
        messagesAPI.inbox(),
        messagesAPI.unreadCount(),
      ]);
      setInbox(messages);
      setUnreadCount(countData.count);
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    fetchInbox();
    timerRef.current = setInterval(fetchInbox, 30_000);
    return () => clearInterval(timerRef.current);
  }, [fetchInbox]);

  return (
    <MessagingContext.Provider value={{ unreadCount, inbox, refresh: fetchInbox }}>
      {children}
    </MessagingContext.Provider>
  );
}

export const useMessaging = () => useContext(MessagingContext);