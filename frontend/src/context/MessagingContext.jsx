import { createContext, useContext } from 'react';

// Stub context — messaging feature not yet implemented.
// NotifBell reads `unreadCount` and `inbox` from here.
const MessagingContext = createContext({ unreadCount: 0, inbox: [] });

export function MessagingProvider({ children }) {
  return (
    <MessagingContext.Provider value={{ unreadCount: 0, inbox: [] }}>
      {children}
    </MessagingContext.Provider>
  );
}

export const useMessaging = () => useContext(MessagingContext);
