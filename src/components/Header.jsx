import React from 'react';
import { Moon, Sun, Lock, Unlock, Settings } from 'lucide-react';

export default function Header({ darkMode, setDarkMode, openConfigModal, openAdminModal, isAdmin }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-13 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-base shadow-sm">
            🫅
          </div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-1">
              <span>임금님 귀는 당나귀 귀</span>
              <span className="text-xs">🐴👂</span>
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium">
              🎋 대나무숲
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={openAdminModal}
            className={`p-1.5 rounded text-xs flex items-center gap-1 border transition ${
              isAdmin
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="관리자"
          >
            {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isAdmin ? '🔑' : '🔐'}</span>
          </button>

          <button
            onClick={openConfigModal}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            title="설정"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
