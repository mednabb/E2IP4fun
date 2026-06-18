'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';

const BRAND_RED = '#C8102E';
const BRAND_GREEN = '#006233';
const BORDER = '#E5E7EB';
const BG = '#F6F7FB';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: string }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Connecté ✅ — redirection...' });
      setTimeout(() => router.push('/matches'), 1000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erreur : ' + (err.message || String(err)),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.user) {
        setMessage({
          type: 'success',
          text: 'Compte créé ✅ — redirection...',
        });
        setTimeout(() => router.push('/matches'), 1000);
      } else {
        setMessage({
          type: 'success',
          text: 'Vérifie ta boîte email pour confirmer ton inscription.',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erreur : ' + (err.message || String(err)),
      });
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    fontSize: 15,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, Arial',
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '9px 0',
    borderRadius: 10,
    border: 'none',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    background: active ? '#0F172A' : 'transparent',
    color: active ? '#fff' : '#6B7280',
    transition: 'all 150ms ease',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, #fff 0%, ${BG} 100%)`,
        fontFamily: 'system-ui, Arial',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 14px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: 22,
          padding: '28px 24px',
          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_GREEN})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 14,
              margin: '0 auto 12px',
            }}
          >
            E2IP
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
            Pronostics WC 2026
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14 }}>
            Connecte-toi pour sauvegarder tes pronostics
          </p>
        </div>

        {/* Onglets Login / Inscription */}
        <div
          style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: 12,
            padding: 4,
            marginBottom: 22,
            gap: 4,
          }}
        >
          <button
            style={tabStyle(mode === 'login')}
            onClick={() => {
              setMode('login');
              setMessage(null);
            }}
          >
            Se connecter
          </button>
          <button
            style={tabStyle(mode === 'signup')}
            onClick={() => {
              setMode('signup');
              setMessage(null);
            }}
          >
            S'inscrire
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp}>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
                color: '#374151',
              }}
            >
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ton@email.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
                color: '#374151',
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Au moins 6 caractères"
              style={inputStyle}
            />
          </div>

          {/* Message succès / erreur */}
          {message && (
            <div
              style={{
                padding: '11px 14px',
                borderRadius: 12,
                marginBottom: 16,
                background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${
                  message.type === 'success' ? '#A7F3D0' : '#FECACA'
                }`,
                color: message.type === 'success' ? BRAND_GREEN : BRAND_RED,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 14,
              border: 'none',
              background: loading ? '#9CA3AF' : BRAND_RED,
              color: '#fff',
              fontWeight: 900,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            {loading
              ? 'En cours...'
              : mode === 'login'
              ? 'Se connecter'
              : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
