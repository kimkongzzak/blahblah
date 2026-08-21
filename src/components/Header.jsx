import React from 'react';
import { Moon, Sun, Lock, Unlock, Settings } from 'lucide-react';

export default function Header({ darkMode, setDarkMode, openConfigModal, openAdminModal, isAdmin }) {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            🦹
          </div>
          <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Emoji Timeline
          </h1>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Admin Auth Toggle Button */}
          <button
            onClick={openAdminModal}
            className={`p-1.5 rounded text-xs flex items-center gap-1 border transition ${
              isAdmin
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="관리자 인증"
          >
            {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isAdmin ? '관리자' : '인증'}</span>
          </button>

          {/* Config Settings */}
          <button
            onClick={openConfigModal}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="DB/API 설정"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
