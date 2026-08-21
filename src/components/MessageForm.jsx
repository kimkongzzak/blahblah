import React, { useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { convertTextToEmoji } from '../lib/gemini';
import confetti from 'canvas-confetti';

export default function MessageForm({ onMessageAdded }) {
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!rawContent.trim()) return;

    setIsSubmitting(true);

    try {
      const emojiResult = await convertTextToEmoji(rawContent);

      const res = await onMessageAdded({
        fromName: fromName.trim() || '익명',
        toName: toName.trim() || '누군가',
        emojiContent: emojiResult
      });

      if (res && !res.success) {
        setFormError(res.error || 'DB 저장 실패');
        return;
      }

      try {
        confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 } });
      } catch (err) {}

      setRawContent('');
    } catch (err) {
      setFormError(`[오류] ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="corporate-card p-4 mb-5 relative">
      <form onSubmit={handleSubmit} className="space-y-3">
        {formError && (
          <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Inputs Row: 1) FROM (Left), 2) TO (Right) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* 🎭 FROM */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm select-none">
              🎭
            </span>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="FROM"
              maxLength={20}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* 🗑️ TO */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm select-none">
              🗑️
            </span>
            <input
              type="text"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="TO"
              maxLength={25}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 💬 Speech Bubble Secret Box */}
        <div className="relative group">
          <div className="absolute -top-2 left-6 w-3 h-3 bg-slate-100 dark:bg-slate-800 border-t border-l border-slate-200 dark:border-slate-700 rotate-45 z-10" />
          
          <div className="relative z-0">
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="💬 털어놓을 욕/속마음을 써보세요..."
              rows={3}
              maxLength={200}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-slate-400">
            🔒 이모지로 변환 저장
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !rawContent.trim()}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>변환 중...</span>
              </>
            ) : (
              <>
                <span>🗑️ 버리기</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
