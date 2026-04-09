import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let toastId = 0;

const ICONS = { success: '', error: '', info: '️', warn: '️' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);

    setTimeout(() => {
      // Start exit animation
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, out: true } : t)));
      // Remove after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 320);
    }, duration);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}${t.out ? ' out' : ''}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);