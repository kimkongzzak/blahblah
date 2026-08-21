import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { convertTextToEmoji } from '../lib/gemini';
import confetti from 'canvas-confetti';

export default function MessageForm({ onMessageAdded }) {
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rawContent.trim()) return;

    setIsSubmitting(true);

    try {
      const emojiResult = await convertTextToEmoji(rawContent);

      await onMessageAdded({
        fromName: fromName.trim() || '익명',
        toName: toName.trim() || '누군가',
        emojiContent: emojiResult
      });

      try {
        confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
      } catch (err) {}

      setRawContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="corporate-card p-4 mb-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              FROM
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="FROM"
              maxLength={20}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              TO
            </label>
            <input
              type="text"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="TO"
              maxLength={25}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            MESSAGE
          </label>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="MESSAGE"
            rows={3}
            maxLength={200}
            className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !rawContent.trim()}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" /> 변환 중
              </span>
            ) : (
              '[변환]'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
