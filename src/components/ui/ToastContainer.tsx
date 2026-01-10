"use client";

import React, { useEffect, useState } from "react";

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Expose a simple global API for adding toasts (used sparingly)
    (window as any).__sm_toast = (toast: ToastItem) => {
      const id = toast.id || String(Date.now());
      setToasts((prev) => [...prev, { ...toast, id }]);
      if (toast.duration !== 0) {
        const dur = toast.duration ?? 3000;
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, dur);
      }
    };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-60 flex flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className="bg-[color:var(--surface)] border p-3 rounded-lg shadow-md max-w-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              {t.title && <div className="font-semibold text-[color:var(--foreground)]">{t.title}</div>}
              <div className="text-sm text-[color:var(--muted)]">{t.message}</div>
              {t.actionLabel && t.onAction && (
                <button
                  onClick={() => {
                    t.onAction && t.onAction();
                    remove(t.id);
                  }}
                  className="mt-2 text-sm text-blue-600 underline"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
            <div>
              <button onClick={() => remove(t.id)} className="text-[color:var(--muted)]">×</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


