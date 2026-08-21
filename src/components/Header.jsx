import React from 'react';
import { Sparkles, Database, Settings, Moon, Sun, ShieldCheck, HelpCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { isGeminiConfigured } from '../lib/gemini';

export default function Header({ darkMode, setDarkMode, openConfigModal }) {
  const supabaseOk = isSupabaseConfigured();
  const geminiOk = isGeminiConfigured();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🦹
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                WorkFeed & Status
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Anonymous Timeline
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              감정 표출은 이모지로 자동 암호화 저장되는 가벼운 피드
            </p>
          </div>
        </div>

        {/* Action Controls & Status */}
        <div className="flex items-center space-x-2">
          {/* Status Badges */}
          <button
            onClick={openConfigModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="연동 설정 상태 확인 및 변경"
          >
            <div className={`w-2 h-2 rounded-full ${supabaseOk ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="hidden md:inline font-mono text-[11px]">
              {supabaseOk ? 'Supabase' : 'Local DB'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Sparkles className={`w-3.5 h-3.5 ${geminiOk ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className="hidden md:inline font-mono text-[11px]">
              {geminiOk ? 'Gemini AI' : 'Rule Engine'}
            </span>
            <Settings className="w-3 h-3 ml-0.5 text-slate-400" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="테마 전환"
            title="다크/라이트 모드 전환"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
