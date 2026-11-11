import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: 'bg-sage/90 text-dark border-sage-dark/40',
  error: 'bg-[#fde8e8] text-[#c0392b] border-[#f5b7b1]',
  info: 'bg-warm text-dark border-dark/15',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-20 z-[2000] w-[min(92vw,460px)] -translate-x-1/2 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium shadow-soft ${STYLES[t.type] || STYLES.info}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast();  toast('Saved!', 'success') */
export const useToast = () => useContext(ToastContext);
