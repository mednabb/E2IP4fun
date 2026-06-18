'use client';
import { useEffect } from 'react';

interface NoticeProps {
  type: 'success' | 'error';
  text: string;
  onClose: () => void;
}

export default function NoticeToast({ type, text, onClose }: NoticeProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed top-20 right-4 z-[1200] max-w-sm animate-slide-down">
      <div
        className={`px-4 py-3 rounded-2xl shadow-xl font-bold text-sm border ${
          type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
