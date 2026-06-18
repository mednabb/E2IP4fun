'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/matches');
  }, [router]);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui', color: '#6B7280' }}>
      Redirection...
    </div>
  );
}
