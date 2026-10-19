"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
const ToastContext = createContext<(message: string) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 8000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed right-4 bottom-4 left-4 z-50 ml-auto max-w-md"
      >
        {message && (
          <div className="flex items-start gap-4 rounded-card border border-border bg-white p-5 shadow-xl">
            <p className="flex-1 text-[15px]">{message}</p>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              className="p-1"
              onClick={() => setMessage("")}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
