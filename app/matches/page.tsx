'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../components/navbar';
import Spinner from '../components/spinner';
import NoticeToast from '../components/notice-toast';

/* ── Constants ── */
const TEAM_FLAGS: Record<string, string> = {
  Algeria:'🇩🇿', 'Cabo Verde':'🇨🇻', 'Congo DR':'🇨🇩',
  "Côte d'Ivoire":'🇨🇮', Egypt:'🇪🇬', Ghana:'🇬🇭',
  Morocco:'🇲🇦', Senegal:'🇸🇳', 'South Africa':'🇿🇦',
  Tunisia:'🇹🇳', Argentina:'🇦🇷', Brazil:'🇧🇷',
  Canada:'🇨🇦', Colombia:'🇨🇴', Ecuador:'🇪🇨',
  Haiti:'🇭🇹', Mexico:'🇲🇽', Panama:'🇵🇦',
  Paraguay:'🇵🇾', Uruguay:'🇺🇾', USA:'🇺🇸',
  Australia:'🇦🇺', 'IR Iran':'🇮🇷', Iraq:'🇮🇶',
  Japan:'🇯🇵', Jordan:'🇯🇴', 'Korea Republic':'🇰🇷',
  'New Zealand':'🇳🇿', Qatar:'🇶🇦', 'Saudi Arabia':'🇸🇦',
  Uzbekistan:'🇺🇿', Austria:'🇦🇹', Belgium:'🇧🇪',
  'Bosnia and Herzegovina':'🇧🇦', Croatia:'🇭🇷',
  Czechia:'🇨🇿', England:'🏴\u200d',
  France:'🇫🇷', Germany:'🇩🇪', Netherlands:'🇳🇱',
  Norway:'🇳🇴', Portugal:'🇵🇹',
  Scotland:'🏴\u200d',
  Spain:'🇪🇸', Sweden:'🇸🇪', Switzerland:'🇨🇭',
  'Türkiye':'🇹🇷', Serbia:'🇷🇸', Poland:'🇵🇱',
  Italy:'🇮🇹', Denmark:'🇩🇰', Wales:'🏴\u200d',
  Chile:'🇨🇱', Peru:'🇵🇪', Venezuela:'🇻🇪',
  Bolivia:'🇧🇴', Honduras:'🇭🇳', 'Costa Rica':'🇨🇷',
  Jamaica:'🇯🇲', 'Trinidad and Tobago':'🇹🇹',
  Cameroon:'🇨🇲', Nigeria:'🇳🇬', Mali:'🇲🇱',
  'Burkina Faso':'🇧🇫', Uganda:'🇺🇬', Tanzania:'🇹🇿',
  Kenya:'🇰🇪', Indonesia:'🇮🇩', China:'🇨🇳',
  India:'🇮🇳', Thailand:'🇹🇭',
  E2IP:'🔴', RACHAD:'⚽', SAAD:'⚽', SAFRAN:'⚽',
};

function getFlag(name: string) {
  return TEAM_FLAGS[name] ?? '🏳️';
}

function minutesUntil(dateIso: string | null) {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  return Math.floor((new Date(dateIso).getTime() - Date.now()) / 60000);
}

function isPastMatch(m: any) {
  return m?.home_score !== null && m?.home_score !== undefined && m?.away_score !== null && m?.away_score !== undefined;
}

function getWinner(h: number | null, a: number | null) {
  if (h == null || a == null) return null;
  if (h > a) return 'home';
  if (h < a) return 'away';
  return 'draw';
}

function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca',
  }).format(d);
}

function isSameDay(dateIso: string) {
  const matchDate = new Date(dateIso);
  const now = new Date();
  const mStr = matchDate.toLocaleDateString('fr-FR', { timeZone: 'Africa/Casablanca' });
  const nStr = now.toLocaleDateString('fr-FR', { timeZone: 'Africa/Casablanca' });
  return mStr === nStr;
}

function normalizeScore(v: string): string | null {
  if (v === '') return '';
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return String(n);
}

export default function MatchesPage() {
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [predInputs, setPredInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; match: any; home: string; away: string }>({
    open: false, match: null, home: '', away: '',
  });

  const showNotice = useCallback((type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const cur = userData?.user ?? null;
        if (!mounted) return;
        setUser(cur);

        const { data: matchesData, error: mErr } = await supabase
          .from('matches').select('*').order('start_time', { ascending: true });
        if (mErr) throw mErr;
        if (!mounted) return;
        setAllMatches(matchesData ?? []);

        if (cur) {
          const { data: preds, error: pErr } = await supabase
            .from('predictions').select('*').eq('user_id', cur.id);
          if (pErr) throw pErr;
          if (!mounted) return;
          const byMatch: Record<string, any> = {};
          const inputs: Record<string, { home: string; away: string }> = {};
          (preds ?? []).forEach((p: any) => {
            byMatch[p.match_id] = p;
            inputs[p.match_id] = {
              home: p.pred_home != null ? String(p.pred_home) : '',
              away: p.pred_away != null ? String(p.pred_away) : '',
            };
          });
          setPredictions(byMatch);
          setPredInputs(inputs);
        }
      } catch (err: any) {
        console.error(err);
        showNotice('error', err?.message || 'Erreur de chargement.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [showNotice]);

  const todayMatches = allMatches.filter((m: any) => m?.start_time && isSameDay(m.start_time));
  const upcomingMatches = todayMatches.length > 0 ? todayMatches : allMatches.filter((m: any) => {
    if (!m?.start_time) return false;
    const mins = minutesUntil(m.start_time);
    return mins > -180;
  }).slice(0, 6);

  function handleInput(matchId: string, side: 'home' | 'away', value: string) {
    const norm = normalizeScore(value);
    if (norm === null) return;
    setPredInputs((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? { home: '', away: '' }), [side]: norm },
    }));
  }

  function openConfirm(match: any) {
    const input = predInputs[match?.id] ?? { home: '', away: '' };
    if (input.home === '' || input.away === '') {
      showNotice('error', 'Entre un score pour les deux équipes.');
      return;
    }
    if (isPastMatch(match)) {
      showNotice('error', 'Match déjà joué : pronostic verrouillé.');
      return;
    }
    if (minutesUntil(match?.start_time) <= 30) {
      showNotice('error', "Verrouillé à moins de 30 min du coup d'envoi.");
      return;
    }
    setModal({ open: true, match, home: input.home, away: input.away });
  }

  function closeModal() {
    setModal({ open: false, match: null, home: '', away: '' });
  }

  async function confirmSubmit() {
    if (!modal?.match || !user) {
      showNotice('error', 'Connecte-toi pour enregistrer ton pronostic.');
      closeModal();
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
        [modal.match.id]: { home: String(modal.home), away: String(modal.away) },
      }));
      closeModal();
      showNotice('success', 'Pronostic enregistré ✅');
    } catch (err: any) {
      console.error(err);
      showNotice('error', err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Spinner text="Chargement des matches..." />
      </>
    );
  }

  const displayMatches = upcomingMatches;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-12">
        <div className="max-w-[1050px] mx-auto px-4 pt-5">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              ⚽ Matches du jour
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {todayMatches.length > 0 ? (
                <><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mr-2">{todayMatches.length} match{todayMatches.length > 1 ? 'es' : ''} aujourd'hui</span></>
              ) : (
                <span className="text-gray-400">Aucun match aujourd'hui — voici les prochains</span>
              )}
              {user && (
                <span className="ml-2">— <strong className="text-[#C8102E]">{user?.email?.split?.('@')?.[0]}</strong>, tes pronostics sont sauvegardés</span>
              )}
            </p>
          </div>

          {notice && (
            <NoticeToast type={notice.type} text={notice.text} onClose={() => setNotice(null)} />
          )}

          {displayMatches.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400">
              Aucun match trouvé.
            </div>
          ) : (
            <div className="grid gap-4">
              {displayMatches.map((match: any, idx: number) => (
                <MatchCard
                  key={match?.id ?? idx}
                  match={match}
                  user={user}
                  input={predInputs[match?.id] ?? { home: '', away: '' }}
                  prediction={predictions[match?.id]}
                  saving={savingId === match?.id}
                  onInput={handleInput}
                  onSubmit={openConfirm}
                />
              ))}
            </div>
          )}

          <ScoringRules />
        </div>
      </div>

      {modal.open && modal.match && (
        <div
          className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 animate-modal-pop"
            onClick={(e: any) => e?.stopPropagation?.()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Confirmer ton pronostic</h3>
                <p className="mt-1 text-sm text-gray-500">Vérifie le score avant validation.</p>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-xl font-black hover:bg-gray-50"
              >
                ×
              </button>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-4">
              <div className="font-extrabold text-base">{modal.match?.home_team} vs {modal.match?.away_team}</div>
              <div className="mt-1 text-gray-500 text-sm">{formatDate(modal.match?.start_time ?? '')}</div>
              <div className="mt-4 flex items-center justify-center gap-3 text-4xl font-black">
                <span>{modal.home}</span>
                <span className="text-gray-300 text-2xl">—</span>
                <span>{modal.away}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSubmit}
                className="flex-1 py-3 rounded-xl bg-[#006233] text-white font-black text-[15px] hover:bg-[#005229] transition-colors shadow-lg"
              >
                ✓ Confirmer
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold text-[15px] hover:bg-gray-50 transition-colors"
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

function MatchCard({ match, user, input, prediction, saving, onInput, onSubmit }: any) {
  const mins = minutesUntil(match?.start_time);
  const past = isPastMatch(match);
  const locked = past || mins <= 30;
  const winner = getWinner(match?.home_score, match?.away_score);

  return (
    <section
      className={`rounded-2xl p-4 border shadow-sm transition-all animate-fade-in ${
        past ? 'bg-gray-50 border-gray-300 opacity-75' : locked ? 'bg-gray-50/50 border-gray-200 opacity-80' : 'bg-white border-amber-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
        <div>
          <div className="text-xs text-gray-500 font-bold">
            {formatDate(match?.start_time ?? '')}
            {match?.stadium ? ` — ${match.stadium}` : ''}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {past ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">Match joué</span>
            ) : locked ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">Pronostics verrouillés</span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">Ouvert aux pronostics</span>
            )}
            {!past && mins > 30 && mins <= 60 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">{mins} min</span>
            )}
          </div>
        </div>
        {match?.group_name && (
          <span className="text-xs text-gray-400 font-semibold">{match.group_name}</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl flex-shrink-0" aria-label={match?.home_team}>{getFlag(match?.home_team ?? '')}</span>
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold leading-tight break-words">{match?.home_team}</div>
            {past && winner === 'home' && <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">Gagnant</span>}
            {past && winner === 'draw' && <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">Nul</span>}
          </div>
        </div>

        <div className="min-w-[160px] flex items-center justify-center">
          {past ? (
            <div className="text-center">
              <div className="text-3xl font-black tracking-tighter">{match?.home_score} — {match?.away_score}</div>
              <div className="text-[11px] text-gray-400 font-bold mt-0.5">score officiel</div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" step="1" inputMode="numeric"
                value={input?.home ?? ''}
                disabled={locked}
                onChange={(e: any) => onInput?.(match?.id, 'home', e?.target?.value ?? '')}
                className={`w-16 h-12 text-center rounded-xl border text-xl font-extrabold outline-none ${
                  locked ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-blue-500 bg-white text-gray-900 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              <span className="text-gray-400 font-black text-lg">—</span>
              <input
                type="number" min="0" step="1" inputMode="numeric"
                value={input?.away ?? ''}
                disabled={locked}
                onChange={(e: any) => onInput?.(match?.id, 'away', e?.target?.value ?? '')}
                className={`w-16 h-12 text-center rounded-xl border text-xl font-extrabold outline-none ${
                  locked ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-blue-500 bg-white text-gray-900 focus:ring-2 focus:ring-blue-200'
                }`}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 min-w-0">
          <div className="min-w-0 text-right">
            <div className="text-[15px] font-extrabold leading-tight break-words">{match?.away_team}</div>
            {past && winner === 'away' && <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">Gagnant</span>}
            {past && winner === 'draw' && <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">Nul</span>}
          </div>
          <span className="text-2xl flex-shrink-0" aria-label={match?.away_team}>{getFlag(match?.away_team ?? '')}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-3.5 flex-wrap">
        <button
          onClick={() => !locked && onSubmit?.(match)}
          disabled={locked || saving}
          className={`flex-1 min-w-[200px] py-3 rounded-xl font-black text-sm transition-all ${
            locked
              ? 'bg-gray-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer'
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin-slow w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Enregistrement...
            </span>
          ) : past ? 'Match joué' : locked ? 'Verrouillé' : 'Valider mon pronostic'}
        </button>

        <div className="flex-1 min-w-[200px] p-3 rounded-xl border border-gray-200 bg-white">
          <div className="text-[11px] text-gray-400 font-bold mb-1">Ton pronostic</div>
          {prediction ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-black">{prediction?.pred_home} — {prediction?.pred_away}</span>
              {prediction?.points != null && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-[#C8102E] text-xs font-bold border border-red-200">
                  {prediction.points} pts
                </span>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Aucun pronostic enregistré.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function ScoringRules() {
  return (
    <section className="mt-10 mb-6">
      <h2 className="text-xl font-black text-gray-900 mb-4">📝 Règles de scoring</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl mb-3">🎯</div>
          <div className="text-2xl font-black text-emerald-700">3 points</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Score exact</div>
          <p className="text-xs text-gray-400 mt-2">Tu devines le score exact du match (ex: 2-1)</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl mb-3">👍</div>
          <div className="text-2xl font-black text-amber-600">1 point</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Bon résultat</div>
          <p className="text-xs text-gray-400 mt-2">Tu devines le résultat (victoire, nul, défaite) sans le score exact</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl mb-3">❌</div>
          <div className="text-2xl font-black text-red-500">0 point</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">Mauvais pronostic</div>
          <p className="text-xs text-gray-400 mt-2">Le résultat et le score ne correspondent pas</p>
        </div>
      </div>
    </section>
  );
}
