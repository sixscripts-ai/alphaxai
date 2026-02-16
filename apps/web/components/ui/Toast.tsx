'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-400" size={20} />;
      case 'error': return <AlertCircle className="text-red-400" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-400" size={20} />;
      default: return <Info className="text-blue-400" size={20} />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md ${getStyles(t.type)} min-w-[300px] max-w-[400px]`}
            >
              {getIcon(t.type)}
              <p className="text-white text-sm flex-1">{t.message}</p>
              <button 
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
