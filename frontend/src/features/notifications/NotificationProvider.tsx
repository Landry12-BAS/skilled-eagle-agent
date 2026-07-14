"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type NotificationType = "success" | "error" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const borders = {
  success: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  info: "border-blue-200 bg-blue-50",
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence initial={false}>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-sm ${borders[n.type]}`}
            >
              <div className="shrink-0 mt-0.5">{icons[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black">{n.title}</p>
                {n.message && <p className="text-xs text-black/60 mt-0.5">{n.message}</p>}
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="shrink-0 text-black/30 hover:text-black/60 transition-colors mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}
