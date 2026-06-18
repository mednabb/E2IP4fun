'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../components/navbar';
import Spinner from '../components/spinner';
import NoticeToast from '../components/notice-toast';

const TEAM_FLAGS: Record<string, string> = {
  Algeria: '🇩🇿',
  'Cabo Verde': '🇨🇻',
  'Congo DR': '🇨🇩',
  "Côte d'Ivoire": '🇨🇮',
  Egypt: '🇪🇬',
  Ghana: '🇬🇭',
  Morocco: '🇲🇦',
  Senegal: '🇸🇳',
  'South Africa': '🇿🇦',
  Tunisia: '🇹🇳',
  Argentina: '🇦🇷',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  Colombia: '🇨🇴',
  Ecuador: '🇪🇨',
  Haiti: '🇭🇹',
  Mexico: '🇲🇽',
  Panama: '🇵🇦',
  Paraguay: '🇵🇾',
  Uruguay: '🇺🇾',
  USA: '🇺🇸',
  Australia: '🇦🇺',
  'IR Iran': '🇮🇷',
  Iraq: '🇮🇶',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  'Korea Republic': '🇰🇷',
  'New Zealand': '🇳🇿',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  Uzbekistan: '🇺🇿',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  'Bosnia and Herzegovina': '🇧🇦',
  Croatia: '🇭🇷',
  Czechia: '🇨🇿',
  England: '🏴\u200d',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Netherlands: '🇳🇱',
  Norway: '🇳🇴',
  Portugal: '🇵🇹',
  Scotland: '🏴\u200d',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Türkiye: '🇹🇷',
  Serbia: '🇷🇸',
  Poland: '🇵🇱',
  Italy: '🇮🇹',
  Denmark: '🇩🇰',
  E2IP: '🔴',
  RACHAD: '⚽',
  SAAD: '⚽',
  SAFRAN: '⚽',
};
function getFlag(name: string) {
  return TEAM_FLAGS[name] ?? '🏳️';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Casablanca',
  }).format(d);
}

function minutesUntil(iso: string | null) {
  if (!iso) return Infinity;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
}
function isPast(m: any) {
  return m?.home_score != null && m?.away_score != null;
}

export default function HistoriquePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [predInputs, setPredInputs] = useState<
    Record<string, { home: string; away: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [modal, setModal] = useState<{
    open: boolean;
    match: any;
    home: string;
    away: string;
  }>({
    open: false,
    match: null,
    home: '',
    away: '',
  });

  const showNotice = useCallback((type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: ud } = await supabase.auth.getUser();
        const cur = ud?.user ?? null;
        if (!mounted) return;
        setUser(cur);

        const { data: md, error: me } = await supabase
          .from('matches')
          .select('*')
          .order('start_time', { ascending: true });
        if (me) throw me;
        if (!mounted) return;
        setMatches(md ?? []);

        if (cur) {
          const { data: pd, error: pe } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', cur.id);
          if (pe) throw pe;
          if (!mounted) return;
          const byM: Record<string, any> = {};
          const inp: Record<string, { home: string; away: string }> = {};
          (pd ?? []).forEach((p: any) => {
            byM[p.match_id] = p;
            inp[p.match_id] = {
              home: p.pred_home != null ? String(p.pred_home) : '',
              away: p.pred_away != null ? String(p.pred_away) : '',
            };
          });
          setPredictions(byM);
          setPredInputs(inp);
        }
      } catch (err: any) {
        console.error(err);
        showNotice('error', err?.message || 'Erreur.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [showNotice]);

  const groups = useMemo(() => {
    const s = new Set<string>();
    (matches ?? []).forEach((m: any) => {
      if (m?.group_name) s.add(m.group_name);
    });
    return Array.from(s).sort();
  }, [matches]);

  const filtered = useMemo(() => {
    let list = [...(matches ?? [])];
    if (filterGroup !== 'all') {
      list = list.filter((m: any) => m?.group_name === filterGroup);
    }
    if (filterDate) {
      list = list.filter((m: any) => {
        if (!m?.start_time) return false;
        const d = new Date(m.start_time).toISOString().slice(0, 10);
        return d === filterDate;
      });
    }
    return list;
  }, [matches, filterGroup, filterDate]);

  function handleInput(matchId: string, side: 'home' | 'away', value: string) {
    if (value !== '' && (!/^\d+$/.test(value) || Number(value) > 99)) return;
    setPredInputs((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] ?? { home: '', away: '' }),
        [side]: value,
      },
    }));
  }

  function openConfirm(match: any) {
    const inp = predInputs[match?.id] ?? { home: '', away: '' };
    if (inp.home === '' || inp.away === '') {
      showNotice('error', 'Entre les deux scores.');
      return;
    }
    if (isPast(match)) {
      showNotice('error', 'Match joué.');
      return;
    }
    if (minutesUntil(match?.start_time) <= 30) {
      showNotice('error', 'Verrouillé.');
      return;
    }
    setModal({ open: true, match, home: inp.home, away: inp.away });
  }

  async function confirmSubmit() {
    if (!modal?.match || !user) {
      showNotice('error', 'Connecte-toi.');
      setModal({ open: false, match: null, home: '', away: '' });
      return;
    }
    setSavingId(modal.match.id);
    try {
      const payload = {
        match_id: modal.match.id,
        user_id: user.id,
        pred_home: Number(modal.home),
        pred_away: Number(modal.away),
      };
      const { error } = await supabase
        .from('predictions')
        .upsert(payload, { onConflict: 'match_id,user_id' });
      if (error) throw error;
      setPredictions((prev) => ({
        ...prev,
        [modal.match.id]: { ...(prev[modal.match.id] ?? {}), ...payload },
      }));
      setPredInputs((prev) => ({
        ...prev,
        [modal.match.id]: {
          home: String(modal.home),
          away: String(modal.away),
        },
      }));
      setModal({ open: false, match: null, home: '', away: '' });
      showNotice('success', 'Pronostic enregistré ✅');
    } catch (err: any) {
      showNotice('error', err?.message || 'Erreur.');
    } finally {
      setSavingId(null);
    }
  }

  if (loading)
    return (
      <>
        <Navbar />
        <Spinner text="Chargement de l'historique..." />
      </>
    );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-12">
        <div className="max-w-[1050px] mx-auto px-4 pt-5">
          <div className="mb-5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              📋 Historique des pronostics
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Tous les matches — passés et à venir
            </p>
          </div>

          {notice && (
            <NoticeToast
              type={notice.type}
              text={notice.text}
              onClose={() => setNotice(null)}
            />
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <select
              value={filterGroup}
              onChange={(e: any) => setFilterGroup(e?.target?.value ?? 'all')}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Tous les groupes</option>
              {groups.map((g: string) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e: any) => setFilterDate(e?.target?.value ?? '')}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-200"
            />
            {(filterGroup !== 'all' || filterDate) && (
              <button
                onClick={() => {
                  setFilterGroup('all');
                  setFilterDate('');
                }}
                className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ✕ Réinitialiser
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400 self-center font-semibold">
              {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400">
              Aucun match trouvé pour ces filtres.
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((match: any, idx: number) => {
                const past = isPast(match);
                const locked = past || minutesUntil(match?.start_time) <= 30;
                const pred = predictions[match?.id];
                const inp = predInputs[match?.id] ?? { home: '', away: '' };

                return (
                  <div
                    key={match?.id ?? idx}
                    className={`rounded-xl p-3.5 border shadow-sm animate-fade-in ${
                      past
                        ? 'bg-gray-50 border-gray-200 opacity-70'
                        : locked
                        ? 'bg-white border-gray-200'
                        : 'bg-white border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="text-xs text-gray-500 font-bold">
                        {formatDate(match?.start_time ?? '')}
                        {match?.stadium ? ` — ${match.stadium}` : ''}
                      </div>
                      <div className="flex items-center gap-2">
                        {match?.group_name && (
                          <span className="text-xs text-gray-400 font-semibold">
                            {match.group_name}
                          </span>
                        )}
                        {past ? (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                            Terminé
                          </span>
                        ) : locked ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                            Verrouillé
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Ouvert
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">
                          {getFlag(match?.home_team ?? '')}
                        </span>
                        <span className="font-extrabold text-sm truncate">
                          {match?.home_team}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {past ? (
                          <span className="text-xl font-black">
                            {match?.home_score} - {match?.away_score}
                          </span>
                        ) : !locked ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={inp.home}
                              onChange={(e: any) =>
                                handleInput(
                                  match?.id,
                                  'home',
                                  e?.target?.value ?? ''
                                )
                              }
                              className="w-12 h-9 text-center rounded-lg border border-blue-400 text-base font-bold outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <span className="text-gray-400 font-bold">-</span>
                            <input
                              type="number"
                              min="0"
                              value={inp.away}
                              onChange={(e: any) =>
                                handleInput(
                                  match?.id,
                                  'away',
                                  e?.target?.value ?? ''
                                )
                              }
                              className="w-12 h-9 text-center rounded-lg border border-blue-400 text-base font-bold outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </>
                        ) : (
                          <span className="text-base font-bold text-gray-400">
                            —
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-extrabold text-sm truncate text-right">
                          {match?.away_team}
                        </span>
                        <span className="text-lg">
                          {getFlag(match?.away_team ?? '')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 gap-2 flex-wrap">
                      <div className="text-xs text-gray-400">
                        {pred ? (
                          <span>
                            Ton prono :{' '}
                            <strong className="text-gray-700">
                              {pred.pred_home} - {pred.pred_away}
                            </strong>
                            {pred.points != null && (
                              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                {pred.points} pts
                              </span>
                            )}
                          </span>
                        ) : (
                          'Pas de pronostic'
                        )}
                      </div>
                      {!locked && (
                        <button
                          onClick={() => openConfirm(match)}
                          disabled={savingId === match?.id}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                          {savingId === match?.id
                            ? 'Envoi...'
                            : pred
                            ? 'Modifier'
                            : 'Valider'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modal.open && modal.match && (
        <div
          className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() =>
            setModal({ open: false, match: null, home: '', away: '' })
          }
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 animate-modal-pop"
            onClick={(e: any) => e?.stopPropagation?.()}
          >
            <h3 className="text-lg font-black mb-3">Confirmer ton pronostic</h3>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 mb-4">
              <div className="font-bold">
                {modal.match?.home_team} vs {modal.match?.away_team}
              </div>
              <div className="mt-3 flex items-center justify-center gap-3 text-3xl font-black">
                {modal.home} <span className="text-gray-300 text-xl">—</span>{' '}
                {modal.away}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#006233] text-white font-bold hover:bg-[#005229] transition-colors"
              >
                ✓ Confirmer
              </button>
              <button
                onClick={() =>
                  setModal({ open: false, match: null, home: '', away: '' })
                }
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
