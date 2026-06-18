'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Connecté ✅ — redirection...' });
      setTimeout(() => router.push('/matches'), 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur : ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.user) {
        setMessage({ type: 'success', text: 'Compte créé ✅ — redirection...' });
        setTimeout(() => router.push('/matches'), 800);
      } else {
        setMessage({ type: 'success', text: 'Vérifie ta boîte email pour confirmer ton inscription.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur : ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-7 shadow-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C8102E] to-[#006233] text-white flex items-center justify-center font-black text-base mx-auto mb-3">
            E2IP
          </div>
          <h1 className="text-2xl font-black text-gray-900">Pronostics WC 2026</h1>
          <p className="mt-1 text-sm text-gray-500">Connecte-toi pour sauvegarder tes pronostics</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              mode === 'login' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setMode('login'); setMessage(null); }}
          >
            Se connecter
          </button>
          <button
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              mode === 'signup' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setMode('signup'); setMessage(null); }}
          >
            S'inscrire
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-600 mb-1.5">Adresse email</label>
            <input
              type="email" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} required
              placeholder="ton@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[15px] outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-600 mb-1.5">Mot de passe</label>
            <input
              type="password" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} required minLength={6}
              placeholder="Au moins 6 caractères"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[15px] outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl mb-4 text-sm font-bold border ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full py-3 rounded-xl font-black text-[15px] transition-all ${
              loading ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#C8102E] text-white hover:bg-[#a00d24] shadow-md'
            }`}
          >
            {loading ? 'En cours...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
