import React, { useState } from 'react';
import { X, Database, Sparkles, Key, Check, Copy, AlertTriangle, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { isGeminiConfigured } from '../lib/gemini';

export default function EnvConfigModal({ isOpen, onClose, onSaveKeys }) {
  const [supabaseUrl, setSupabaseUrl] = useState(
    import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('CUSTOM_SUPABASE_URL') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || ''
  );
  const [geminiKey, setGeminiKey] = useState(
    import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('CUSTOM_GEMINI_API_KEY') || ''
  );

  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (supabaseUrl) localStorage.setItem('CUSTOM_SUPABASE_URL', supabaseUrl.trim());
    if (supabaseKey) localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', supabaseKey.trim());
    if (geminiKey) localStorage.setItem('CUSTOM_GEMINI_API_KEY', geminiKey.trim());

    alert('설정이 저장되었습니다! 페이지를 새로고침하여 적용합니다.');
    window.location.reload();
  };

  const handleCopySql = () => {
    const sqlText = `-- Supabase Table Setup SQL
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    from_name TEXT NOT NULL DEFAULT '익명',
    to_name TEXT NOT NULL DEFAULT '누군가',
    emoji_content TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for likes" ON public.messages FOR UPDATE USING (true);`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="corporate-card max-w-lg w-full p-5 bg-white dark:bg-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              Supabase & Gemini API 설정 가이드
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
          {/* Status Box */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-semibold text-slate-700 dark:text-slate-300">현재 연결 상태:</div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" /> Supabase DB:
              </span>
              <span className={`font-semibold ${isSupabaseConfigured() ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isSupabaseConfigured() ? '연동 완료 (Cloud DB)' : '미연동 (Local Storage Fallback)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Gemini AI API:
              </span>
              <span className={`font-semibold ${isGeminiConfigured() ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                {isGeminiConfigured() ? 'Gemini 2.5 Flash Connected' : 'Rule Engine Fallback'}
              </span>
            </div>
          </div>

          {/* 1. Supabase Config */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-blue-500" /> 1) Supabase URL
              </label>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                대시보드 이동 <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />

            <label className="font-semibold text-slate-800 dark:text-slate-200 block pt-1">
              2) Supabase Anon Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          {/* SQL Snippet Copy Button */}
          <div className="p-2.5 rounded bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Supabase SQL Editor에 실행할 SQL 스크립트:
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 transition"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? '복사 완료' : 'SQL 복사'}</span>
            </button>
          </div>

          {/* 2. Gemini Config */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 3) Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
              >
                무료 키 발급받기 <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            💡 설정 파일인 프로젝트 루트의 <b>.env</b> 파일에 키를 적어두셔도 자동 인식됩니다.
          </p>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
            >
              저장하기 & 적용
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
