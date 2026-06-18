'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../components/navbar';
import Spinner from '../components/spinner';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ClassementPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error: err } = await supabase
          .from('leaderboard')
          .select('*')
          .order('total_points', { ascending: false });
        if (err) throw err;
        setRows(data ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Erreur');
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading)
    return (
      <>
        <Navbar />
        <Spinner text="Chargement du classement..." />
      </>
    );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-12">
        <div className="max-w-[700px] mx-auto px-4 pt-5">
          <div className="mb-5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              🏆 Classement
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Top pronostiqueurs de la Coupe du Monde 2026
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 font-bold">
              Erreur : {error}
            </div>
          ) : (rows?.length ?? 0) === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400">
              Aucun participant pour l'instant.
            </div>
          ) : (
            <div className="grid gap-2">
              {rows.map((row: any, i: number) => {
                const isTop3 = i < 3;
                const username = row?.email ? row.email.split('@')[0] : '—';
                return (
                  <div
                    key={row?.user_id ?? i}
                    className={`flex items-center gap-4 rounded-2xl px-5 py-3.5 border shadow-sm animate-fade-in transition-all hover:shadow-md ${
                      isTop3
                        ? 'bg-white border-amber-300 shadow-amber-100'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                        isTop3
                          ? 'bg-amber-50 text-xl'
                          : 'bg-gray-100 text-sm text-gray-500'
                      }`}
                    >
                      {isTop3 ? MEDALS[i] : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-[15px] text-gray-900 truncate">
                        {username}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {row?.nb_predictions ?? 0} pronostic
                        {(row?.nb_predictions ?? 0) > 1 ? 's' : ''}
                      </div>
                    </div>

                    <div
                      className={`px-4 py-1.5 rounded-full font-black text-[15px] flex-shrink-0 ${
                        isTop3
                          ? 'bg-[#006233] text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {row?.total_points ?? 0} pts
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
