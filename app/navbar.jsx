'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import supabase from '../lib/supabaseClient';

const BRAND_RED = '#C8102E';
const BRAND_GREEN = '#006233';
const BORDER = '#E5E7EB';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/auth');
  }

  const username = user?.email ? user.email.split('@')[0] : null;

  const linkStyle = (href) => ({
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 14,
    padding: '6px 14px',
    borderRadius: 10,
    background: pathname === href ? '#F1F5F9' : 'transparent',
    color: pathname === href ? '#0F172A' : '#6B7280',
    transition: 'all 150ms ease',
  });

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Logo + titre */}
      <Link
        href="/matches"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_GREEN})`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: 0.3,
            flexShrink: 0,
          }}
        >
          E2IP
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
          WC 2026
        </span>
      </Link>

      {/* Liens de navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link href="/matches" style={linkStyle('/matches')}>
          ⚽ Matches
        </Link>
        <Link href="/leaderboard" style={linkStyle('/leaderboard')}>
          🏆 Classement
        </Link>
      </div>

      {/* Section utilisateur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <>
            <span
              style={{
                fontSize: 13,
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              🇲🇦 <strong style={{ color: BRAND_RED }}>{username}</strong>
            </span>
            <button
              onClick={handleSignOut}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: '#fff',
                color: '#374151',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: 'none',
              background: BRAND_RED,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Se connecter
          </Link>
        )}
      </div>
    </nav>
  );
}
