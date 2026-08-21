import React, { useState } from 'react';
import { X, Lock, Key } from 'lucide-react';

export default function AdminAuthModal({ isOpen, onClose, isAdmin, setIsAdmin }) {
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const validAdminKey = import.meta.env.VITE_ADMIN_KEY || localStorage.getItem('CUSTOM_ADMIN_KEY') || 'admin1234';

  const handleVerify = (e) => {
    e.preventDefault();
    if (inputKey.trim() === validAdminKey.trim()) {
      setIsAdmin(true);
      localStorage.setItem('IS_ADMIN_AUTHENTICATED', 'true');
      setInputKey('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('관리자 키가 일치하지 않습니다.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('IS_ADMIN_AUTHENTICATED');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="corporate-card max-w-xs w-full p-4 bg-white dark:bg-slate-900 shadow-xl relative">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>관리자 인증</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAdmin ? (
          <div className="space-y-3 text-xs">
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              ✅ 현재 관리자로 인증되어 있습니다. (메시지 삭제 가능)
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200"
            >
              관리자 해제 (로그아웃)
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                관리자 비밀키 입력
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => { setInputKey(e.target.value); setErrorMsg(''); }}
                placeholder="비밀키 입력..."
                className="w-full px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
              {errorMsg && <p className="text-[11px] text-rose-500 mt-1">{errorMsg}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 text-slate-500 hover:bg-slate-100 rounded"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
              >
                인증
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
