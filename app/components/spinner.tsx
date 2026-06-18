'use client';
export default function Spinner({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
      <div className="animate-spin-slow w-10 h-10 border-4 border-[#006233] border-t-transparent rounded-full" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
