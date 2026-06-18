'use client';

import { useEffect, useState } from 'react';
import supabase from '../../lib/supabaseClient';

const BRAND_RED = '#C8102E';
const BRAND_GREEN = '#006233';
const BORDER = '#E5E7EB';
const BG = '#F6F7FB';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Masque l'email : affiche uniquement la partie avant le @
  function formatUsername(email) {
    if (!email) return '—';
    return email.split('@')[0];
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          color: '#6B7280',
          fontFamily: 'system-ui, Arial',
          fontSize: 16,
        }}
      >
        Chargement du classement...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          color: BRAND_RED,
          fontFamily: 'system-ui, Arial',
        }}
      >
        Erreur : {error}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, #fff 0%, ${BG} 100%)`,
        fontFamily: 'system-ui, Arial',
        color: '#0F172A',
        padding: '20px 14px 48px',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Titre */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            🏆 Classement
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14 }}>
            Top pronostiqueurs de la Coupe du Monde 2026
          </p>
        </div>

        {/* Tableau */}
        {rows.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: 24,
              textAlign: 'center',
              color: '#6B7280',
            }}
          >
            Aucun participant pour l'instant.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map((row, i) => {
              const isTop3 = i < 3;
              return (
                <div
                  key={row.user_id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${isTop3 ? '#FCD34D' : BORDER}`,
                    borderRadius: 16,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: isTop3
                      ? '0 4px 14px rgba(252,211,77,0.2)'
                      : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Rang */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isTop3 ? '#FEF9C3' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: isTop3 ? 18 : 14,
                      flexShrink: 0,
                      color: '#374151',
                    }}
                  >
                    {isTop3 ? MEDALS[i] : i + 1}
                  </div>

                  {/* Pseudo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatUsername(row.email)}
                    </div>
                    <div
                      style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}
                    >
                      {row.nb_predictions ?? 0} pronostic
                      {(row.nb_predictions ?? 0) > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Points */}
                  <div
                    style={{
                      padding: '4px 14px',
                      borderRadius: 99,
                      background: isTop3 ? BRAND_GREEN : '#F1F5F9',
                      color: isTop3 ? '#fff' : '#374151',
                      fontWeight: 900,
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {row.total_points ?? 0} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
