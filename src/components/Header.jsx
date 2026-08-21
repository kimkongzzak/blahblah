import React from 'react';
import { Moon, Sun, Lock, Unlock, Settings } from 'lucide-react';

export default function Header({ darkMode, setDarkMode, openConfigModal, openAdminModal, isAdmin }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-lg shadow-sm">
            🫅
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight flex items-center gap-1.5">
              <span>임금님 귀는 당나귀 귀</span>
              <span className="text-sm">🐴👂</span>
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium">
              🎋 대나무숲
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={openAdminModal}
            className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 border transition ${
              isAdmin
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="관리자"
          >
            {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">{isAdmin ? '🔑 관리자' : '🔐 인증'}</span>
          </button>

          <button
            onClick={openConfigModal}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
