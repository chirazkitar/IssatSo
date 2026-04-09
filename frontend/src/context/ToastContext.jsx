import { createContext, useCallback, useContext, useState } from 'react';
import Icon from '../components/icons';

const ToastContext = createContext(null);
let toastId = 0;

const TOAST_ICONS = {
  success: 'checkCircle',
  error:   'xCircle',
  info:    'info',
  warn:    'exclamationTriangle',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, out: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 320);
    }, duration);
  }, []);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}${t.out ? ' out' : ''}`}
          >
            <span className="toast-icon">
              <Icon name={TOAST_ICONS[t.type] || 'info'} size={16} />
            </span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => remove(t.id)}>
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
