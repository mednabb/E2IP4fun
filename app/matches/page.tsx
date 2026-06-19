'use client';

import React, { useEffect, useRef, useState } from 'react';
import supabase from '../../lib/supabaseClient';

const BRAND_RED = '#C8102E';
const BRAND_GREEN = '#006233';
const BRAND_BLUE = '#2563EB';
const BRAND_DARK = '#0F172A';
const BORDER = '#E5E7EB';
const BG = '#F6F7FB';

const TEAM_FLAG_EMOJI = {
  // Afrique
  Algeria:            '🇩🇿',
  'Cabo Verde':       '🇨🇻',
  'Congo DR':         '🇨🇩',
  "Côte d'Ivoire":   '🇨🇮',
  Egypt:              '🇪🇬',
  Ghana:              '🇬🇭',
  Morocco:            '🇲🇦',
  Senegal:            '🇸🇳',
  'South Africa':     '🇿🇦',
  Tunisia:            '🇹🇳',

  // Amériques
  Argentina:          '🇦🇷',
  Brazil:             '🇧🇷',
  Canada:             '🇨🇦',
  Colombia:           '🇨🇴',
  Ecuador:            '🇪🇨',
  Haiti:              '🇭🇹',
  Mexico:             '🇲🇽',
  Panama:             '🇵🇦',
  Paraguay:           '🇵🇾',
  Uruguay:            '🇺🇾',
  USA:                '🇺🇸',

  // Asie / Moyen-Orient
  Australia:          '🇦🇺',
  'IR Iran':          '🇮🇷',
  Iraq:               '🇮🇶',
  Japan:              '🇯🇵',
  Jordan:             '🇯🇴',
  'Korea Republic':   '🇰🇷',
  'New Zealand':      '🇳🇿',
  Qatar:              '🇶🇦',
  'Saudi Arabia':     '🇸🇦',
  Uzbekistan:         '🇺🇿',

  // Europe
  Austria:            '🇦🇹',
  Belgium:            '🇧🇪',
  'Bosnia and Herzegovina': '🇧🇦',
  Croatia:            '🇭🇷',
  'Curaçao':          '🇨🇼',
  Czechia:            '🇨🇿',
  England:            '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France:             '🇫🇷',
  Germany:            '🇩🇪',
  Netherlands:        '🇳🇱',
  Norway:             '🇳🇴',
  Portugal:           '🇵🇹',
  Scotland:           '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  Spain:              '🇪🇸',
  Sweden:             '🇸🇪',
  Switzerland:        '🇨🇭',
  'Türkiye':          '🇹🇷',

  // Équipes fictives / internes
  E2IP:    '🔴',
  RACHAD:  '⚽',
  SAAD:    '⚽',
  SAFRAN:  '⚽',
  'Team A': '🔵',
  'Team B': '🔵',
  'Team C': '🔵',
  'Team D': '🔵',
};

function minutesUntil(dateIso) {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  return Math.floor((new Date(dateIso).getTime() - Date.now()) / 60000);
}
function isPastMatch(match) {
  return match?.home_score !== null && match?.away_score !== null;
}
function getWinner(homeScore, awayScore) {
  if (homeScore == null || awayScore == null) return null;
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}
function formatDateTime(dateIso) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
function normalizeScoreInput(value) {
  if (value === '') return '';
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return String(n);
}

function FlagImg({ teamName, size = 32 }) {
  const emoji = TEAM_FLAG_EMOJI[teamName];

  return (
    <span
      aria-label={teamName}
      style={{
        width: size,
        height: Math.round(size * 0.72),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        background: '#F8FAFC',
        border: `1px solid ${BORDER}`,
        fontSize: Math.round(size * 0.6),
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {emoji ?? '🏳️'}
    </span>
  );
}

function InfoBadge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#EEF2FF', fg: '#3730A3', bd: '#C7D2FE' },
    red: { bg: '#FEF2F2', fg: BRAND_RED, bd: '#FECACA' },
    green: { bg: '#ECFDF5', fg: BRAND_GREEN, bd: '#A7F3D0' },
    gray: { bg: '#F3F4F6', fg: '#374151', bd: '#E5E7EB' },
    blue: { bg: '#EFF6FF', fg: BRAND_BLUE, bd: '#BFDBFE' },
  };
  const t = tones[tone] ?? tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [predInputs, setPredInputs] = useState({});
  const [predictionsByMatch, setPredictionsByMatch] = useState({});
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState({
    open: false,
    match: null,
    home: '',
    away: '',
  });
  const noticeTimer = useRef(null);
  const mountedRef = useRef(true);

  // URL du webhook (tâche planifiée) qui force une mise à jour immédiate des scores.
  const SCORE_REFRESH_WEBHOOK_URL =
    'https://pa007.abacus.ai/cluster-proxy/api/webhooks?abacus_deployment_token=MjU2MDM2OTA6MTcyMDAzMDA6NDgwNTpk.b0182e7dda320a491fc92f044089a92f&v=1';

  // Charge (ou recharge) les matches + les pronostics de l'utilisateur depuis Supabase.
  async function loadData() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user ?? null;
      if (!mountedRef.current) return;
      setUser(currentUser);

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('start_time', { ascending: true });
      if (matchesError) throw matchesError;
      if (!mountedRef.current) return;
      setMatches(matchesData ?? []);

      if (currentUser) {
        const { data: predsData, error: predsError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', currentUser.id);
        if (predsError) throw predsError;
        if (!mountedRef.current) return;
        const byMatch = {};
        const inputs = {};
        (predsData ?? []).forEach((p) => {
          byMatch[p.match_id] = p;
          inputs[p.match_id] = {
            home: p.home_score ?? '',
            away: p.away_score ?? '',
          };
        });
        setPredictionsByMatch(byMatch);
        setPredInputs(inputs);
      }
    } catch (err) {
      console.error(err);
      if (mountedRef.current)
        showNotice('error', err.message || 'Erreur de chargement.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // Déclenche le webhook de mise à jour des scores, puis recharge la liste.
  async function refreshScores() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const resp = await fetch(SCORE_REFRESH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'matches-page', trigger: 'manual' }),
      });
      if (!resp.ok) {
        throw new Error(`Webhook a répondu ${resp.status}`);
      }
      showNotice(
        'success',
        'Mise à jour des scores déclenchée ⏳ Actualisation en cours...'
      );
      // Laisse le temps au script côté serveur de mettre à jour Supabase,
      // puis on recharge les données affichées.
      await new Promise((r) => setTimeout(r, 4000));
      await loadData();
      if (mountedRef.current)
        showNotice('success', 'Scores actualisés ✅');
    } catch (err) {
      console.error(err);
      if (mountedRef.current)
        showNotice(
          'error',
          err.message || 'Échec du rafraîchissement des scores.'
        );
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => clearTimeout(noticeTimer.current);
  }, []);

  function showNotice(type, text) {
    setNotice({ type, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  }

  function handleInputChange(matchId, side, value) {
    const normalized = normalizeScoreInput(value);
    if (normalized === null) return;
    setPredInputs((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? {}), [side]: normalized },
    }));
  }

  function openConfirmModal(match) {
    const input = predInputs[match.id] ?? { home: '', away: '' };
    const home = input.home === '' ? '' : Number(input.home);
    const away = input.away === '' ? '' : Number(input.away);
    if (home === '' || away === '') {
      showNotice('error', 'Entre un score pour les deux équipes.');
      return;
    }
    if (isPastMatch(match)) {
      showNotice('error', 'Match déjà joué : pronostic verrouillé.');
      return;
    }
    if (minutesUntil(match.start_time) <= 30) {
      showNotice('error', "Verrouillé à moins de 30 min du coup d'envoi.");
      return;
    }
    setModal({ open: true, match, home, away });
  }

  function closeModal() {
    setModal({ open: false, match: null, home: '', away: '' });
  }

  async function confirmSubmit() {
    if (!modal.match || !user) {
      showNotice('error', 'Connecte-toi pour enregistrer ton pronostic.');
      closeModal();
      return;
    }
    setSavingMatchId(modal.match.id);
    try {
      const payload = {
        match_id: modal.match.id,
        user_id: user.id,
        home_score: modal.home,
        away_score: modal.away,
      };
      const { error } = await supabase
        .from('predictions')
        .upsert(payload, { onConflict: 'match_id,user_id' });
      if (error) throw error;
      setPredictionsByMatch((prev) => ({
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
      closeModal();
      showNotice('success', 'Pronostic enregistré ✅');
    } catch (err) {
      console.error(err);
      showNotice('error', err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSavingMatchId(null);
    }
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
          fontSize: 16,
          fontFamily: 'system-ui',
        }}
      >
        Chargement des matches...
      </div>
    );
  }
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, #fff 0%, ${BG} 100%)`,
        fontFamily: 'system-ui, Arial',
        color: BRAND_DARK,
        padding: '20px 14px 48px',
      }}
    >
      <div style={{ maxWidth: 1050, margin: '0 auto' }}>
        <div
          style={{
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              ⚽ Matches — Coupe du Monde 2026
            </h1>
            <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14 }}>
              {user ? (
                <>
                  <strong style={{ color: BRAND_RED }}>
                    {user.email.split('@')[0]}
                  </strong>{' '}
                  — tes pronostics sont sauvegardés
                </>
              ) : (
                'Connecte-toi pour enregistrer tes pronostics.'
              )}
            </p>
          </div>

          <button
            onClick={refreshScores}
            disabled={refreshing}
            title="Forcer une mise à jour des scores depuis l'API"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: '11px 18px',
              borderRadius: 14,
              border: 'none',
              fontWeight: 900,
              fontSize: 14,
              color: '#fff',
              whiteSpace: 'nowrap',
              cursor: refreshing ? 'wait' : 'pointer',
              background: refreshing ? '#94A3B8' : BRAND_GREEN,
              boxShadow: refreshing
                ? 'none'
                : '0 8px 18px rgba(0,98,51,0.22)',
              transition: 'all 160ms ease',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                fontSize: 16,
                lineHeight: 1,
                animation: refreshing
                  ? 'spin 0.9s linear infinite'
                  : 'none',
              }}
            >
              ↻
            </span>
            {refreshing ? 'Mise à jour...' : 'Rafraîchir les scores'}
          </button>
        </div>

        {notice && (
          <div
            style={{
              position: 'fixed',
              top: 72,
              right: 16,
              zIndex: 1200,
              maxWidth: 360,
              background: notice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${
                notice.type === 'success' ? '#A7F3D0' : '#FECACA'
              }`,
              color: notice.type === 'success' ? BRAND_GREEN : BRAND_RED,
              padding: '12px 16px',
              borderRadius: 14,
              boxShadow: '0 14px 30px rgba(0,0,0,0.12)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {notice.text}
          </div>
        )}

        {matches.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: 24,
              color: '#6B7280',
              textAlign: 'center',
            }}
          >
            Aucun match trouvé.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {matches.map((match) => {
              const mins = minutesUntil(match.start_time);
              const past = isPastMatch(match);
              const locked = past || mins <= 30;
              const userPred = predictionsByMatch[match.id];
              const input = predInputs[match.id] ?? {
                home: userPred?.home_score ?? '',
                away: userPred?.away_score ?? '',
              };
              const winner = getWinner(match.home_score, match.away_score);
              const cardBg = past ? '#F8FAFC' : locked ? '#FBFBFC' : '#fff';
              const borderColor = past
                ? '#CBD5E1'
                : locked
                ? '#E5E7EB'
                : '#FCD34D';
              const statusText = past
                ? 'Match joué'
                : mins <= 30
                ? 'Pronostics verrouillés'
                : 'Ouvert aux pronostics';
              const statusTone = past ? 'gray' : locked ? 'blue' : 'green';

              return (
                <section
                  key={match.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 20,
                    padding: 16,
                    boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
                    opacity: locked ? 0.8 : 1,
                    transition: 'all 180ms ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginBottom: 14,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#6B7280',
                          fontWeight: 700,
                        }}
                      >
                        {formatDateTime(match.start_time)}
                        {match.stadium ? ` — ${match.stadium}` : ''}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <InfoBadge tone={statusTone}>{statusText}</InfoBadge>
                        {!past && mins > 30 && mins <= 60 && (
                          <InfoBadge tone="red">{mins} min</InfoBadge>
                        )}
                        {past && (
                          <InfoBadge tone="gray">Résultat officiel</InfoBadge>
                        )}
                      </div>
                    </div>
                    {match.city && (
                      <div style={{ color: '#6B7280', fontSize: 13 }}>
                        {match.city}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <FlagImg teamName={match.home_team} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            wordBreak: 'break-word',
                          }}
                        >
                          {match.home_team}
                        </div>
                        {past && winner === 'home' && (
                          <div style={{ marginTop: 4 }}>
                            <InfoBadge tone="green">Gagnant</InfoBadge>
                          </div>
                        )}
                        {past && winner === 'draw' && (
                          <div style={{ marginTop: 4 }}>
                            <InfoBadge tone="gray">Nul</InfoBadge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {past ? (
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: 30,
                              fontWeight: 900,
                              letterSpacing: -1,
                            }}
                          >
                            {match.home_score} — {match.away_score}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6B7280',
                              fontWeight: 700,
                              marginTop: 2,
                            }}
                          >
                            score officiel
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={input.home}
                            disabled={locked}
                            onChange={(e) =>
                              handleInputChange(
                                match.id,
                                'home',
                                e.target.value
                              )
                            }
                            style={{
                              width: 66,
                              height: 50,
                              textAlign: 'center',
                              borderRadius: 12,
                              border: `1px solid ${
                                locked ? '#E5E7EB' : BRAND_BLUE
                              }`,
                              fontSize: 22,
                              fontWeight: 800,
                              outline: 'none',
                              background: locked ? '#F3F4F6' : '#fff',
                            }}
                          />
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: 18,
                              color: '#9CA3AF',
                            }}
                          >
                            —
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={input.away}
                            disabled={locked}
                            onChange={(e) =>
                              handleInputChange(
                                match.id,
                                'away',
                                e.target.value
                              )
                            }
                            style={{
                              width: 66,
                              height: 50,
                              textAlign: 'center',
                              borderRadius: 12,
                              border: `1px solid ${
                                locked ? '#E5E7EB' : BRAND_BLUE
                              }`,
                              fontSize: 22,
                              fontWeight: 800,
                              outline: 'none',
                              background: locked ? '#F3F4F6' : '#fff',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ minWidth: 0, textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            wordBreak: 'break-word',
                          }}
                        >
                          {match.away_team}
                        </div>
                        {past && winner === 'away' && (
                          <div style={{ marginTop: 4 }}>
                            <InfoBadge tone="green">Gagnant</InfoBadge>
                          </div>
                        )}
                        {past && winner === 'draw' && (
                          <div style={{ marginTop: 4 }}>
                            <InfoBadge tone="gray">Nul</InfoBadge>
                          </div>
                        )}
                      </div>
                      <FlagImg teamName={match.away_team} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      marginTop: 14,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      onClick={() => !locked && openConfirmModal(match)}
                      disabled={locked || savingMatchId === match.id}
                      style={{
                        flex: '1 1 220px',
                        padding: '13px 16px',
                        borderRadius: 14,
                        border: 'none',
                        fontWeight: 900,
                        cursor: locked ? 'not-allowed' : 'pointer',
                        color: '#fff',
                        background: locked ? '#9CA3AF' : BRAND_BLUE,
                        boxShadow: locked
                          ? 'none'
                          : '0 8px 18px rgba(37,99,235,0.22)',
                      }}
                    >
                      {savingMatchId === match.id
                        ? 'Enregistrement...'
                        : past
                        ? 'Match joué'
                        : locked
                        ? 'Verrouillé'
                        : 'Valider mon pronostic'}
                    </button>

                    <div
                      style={{
                        flex: '1 1 220px',
                        padding: 12,
                        borderRadius: 14,
                        border: `1px solid ${BORDER}`,
                        background: '#fff',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6B7280',
                          fontWeight: 700,
                          marginBottom: 5,
                        }}
                      >
                        Ton pronostic
                      </div>
                      {userPred ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 900 }}>
                            {userPred.home_score} — {userPred.away_score}
                          </div>
                          {userPred.points != null && (
                            <InfoBadge tone="red">
                              {userPred.points} pts
                            </InfoBadge>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#9CA3AF', fontSize: 14 }}>
                          Aucun pronostic enregistré.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {modal.open && modal.match && (
          <div
            onClick={closeModal}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1100,
              background: 'rgba(15,23,42,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 460,
                background: '#fff',
                borderRadius: 22,
                padding: 24,
                boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
                border: `1px solid ${BORDER}`,
                animation: 'modalPop 190ms ease-out',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                    Confirmer ton pronostic
                  </h3>
                  <div style={{ marginTop: 4, color: '#6B7280', fontSize: 14 }}>
                    Vérifie le score avant validation.
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Fermer"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: `1px solid ${BORDER}`,
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 20,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: '#F8FAFC',
                  border: `1px solid ${BORDER}`,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16 }}>
                  {modal.match.home_team} vs {modal.match.away_team}
                </div>
                <div style={{ marginTop: 4, color: '#6B7280', fontSize: 13 }}>
                  {formatDateTime(modal.match.start_time)}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: -1,
                  }}
                >
                  <span>{modal.home}</span>
                  <span style={{ color: '#94A3B8', fontSize: 24 }}>—</span>
                  <span>{modal.away}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={confirmSubmit}
                  style={{
                    flex: '1 1 160px',
                    padding: '13px',
                    borderRadius: 14,
                    border: 'none',
                    background: BRAND_GREEN,
                    color: '#fff',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontSize: 15,
                    boxShadow: '0 8px 18px rgba(0,98,51,0.2)',
                  }}
                >
                  ✓ Confirmer
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    flex: '1 1 160px',
                    padding: '13px',
                    borderRadius: 14,
                    border: `1px solid ${BORDER}`,
                    background: '#fff',
                    color: BRAND_DARK,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes modalPop {
          from { transform: scale(0.94) translateY(10px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
