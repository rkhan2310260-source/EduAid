import React from 'react';
import { useToast } from '@/hooks/use-toast';

export const Toaster = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right ${
            toast.variant === 'destructive'
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          <div className="font-semibold">{toast.title}</div>
          <div className="text-sm opacity-90">{toast.description}</div>
        </div>
      ))}
    </div>
  );
};