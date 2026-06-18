'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      setUser(data?.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e: any, session: any) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth');
  }

  const username = user?.email ? user.email.split('@')[0] : null;
  const linkClasses = (href: string) =>
    `text-sm font-bold px-3 py-1.5 rounded-lg transition-all ${
      pathname === href
        ? 'bg-gray-100 text-gray-900'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/matches"
          className="flex items-center gap-2.5 no-underline"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#006233] text-white flex items-center justify-center font-black text-[11px] tracking-wide flex-shrink-0">
            E2IP
          </div>
          <span className="font-extrabold text-[15px] text-gray-900">
            WC 2026
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/matches" className={linkClasses('/matches')}>
            ⚽ Matches
          </Link>
          <Link href="/historique" className={linkClasses('/historique')}>
            📋 Historique
          </Link>
          <Link href="/classement" className={linkClasses('/classement')}>
            🏆 Classement
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                🇲🇦 <strong className="text-[#C8102E]">{username}</strong>
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-lg bg-[#C8102E] text-white font-bold text-xs no-underline hover:bg-[#a00d24] transition-colors"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
