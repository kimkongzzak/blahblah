import React, { useState } from 'react';
import { Send, Sparkles, User, Target, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { convertTextToEmoji, isGeminiConfigured } from '../lib/gemini';
import confetti from 'canvas-confetti';

export default function MessageForm({ onMessageAdded }) {
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [rawContent, setRawContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertedEmoji, setConvertedEmoji] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleQuickPreset = (presetText) => {
    setRawContent(presetText);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rawContent.trim()) {
      alert('변환하여 전송할 메시지(3번 창)를 입력해주세요!');
      return;
    }

    setIsSubmitting(true);
    setStatusText('Gemini AI가 이모지로 정밀 변환 중...');

    try {
      // 1. Gemini AI or Rule Fallback 이모지 변환
      const emojiResult = await convertTextToEmoji(rawContent);
      setConvertedEmoji(emojiResult);

      setStatusText('피드에 등록하는 중...');

      // 2. 부모 콜백으로 데이터 추가 (1: from_name, 2: to_name, 3: emojiResult)
      await onMessageAdded({
        fromName: fromName.trim() || '익명',
        toName: toName.trim() || '누군가',
        emojiContent: emojiResult
      });

      // 3. 성공 효과
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (err) {
        // ignore confetti errors if unsupported
      }

      // Reset content only (Keep FROM / TO for continuous posting convenience)
      setRawContent('');
      setConvertedEmoji('');
    } catch (err) {
      console.error('Submit error:', err);
      alert('메시지 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <div className="corporate-card p-4 sm:p-5 mb-6 relative overflow-hidden">
      {/* Decorative top border line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          익명 이모지 피드 작성
        </h2>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          {isGeminiConfigured() ? '✨ Gemini AI Active' : '⚡️ Rule Engine Active'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Row 1: FROM & TO Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1) FROM */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              1) FROM (보내는 이 / 닉네임)
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="예: 판교지키미, 익명A"
              maxLength={20}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* 2) TO */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3 text-slate-400" />
              2) TO (대상 / 비난 대상)
            </label>
            <input
              type="text"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="예: 옆자리PM, 월요일회의"
              maxLength={25}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* 3) RAW CONTENT TEXTAREA (이모지로 변환될 원문) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              3) 속마음 입력창 <span className="text-rose-500 font-normal">(등록 시 이모지로만 변환 저장됨)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {rawContent.length}/200
            </span>
          </div>

          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="회사 스트레스, 욕설, 속마음을 편하게 주절주절 써보세요...&#10;예: 개자식 하품하지 말고 그냥 죽었으면"
            rows={3}
            maxLength={200}
            className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
          />

          {/* Quick presets for lazy test typing */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-slate-400">예시 입력:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset('개자식 하품하지 말고 그냥 죽었으면')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              "개자식 하품하지..."
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('오늘도 야근각 커피 3잔째 멘탈 바사삭')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              "야근각 커피..."
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('월급날 돈 들어오자마자 통장 텅장 실화냐')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              "통장 텅장..."
            </button>
          </div>
        </div>

        {/* Status Indicator or Converted Emoji Preview */}
        {convertedEmoji && (
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">이모지 변환 완료:</span>
            </div>
            <span className="text-lg tracking-wider animate-emoji">{convertedEmoji}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400">
            🔒 원문 텍스트는 서버에 저장되지 않고 <b>이모지</b>만 저장됩니다.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !rawContent.trim()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>{statusText || '변환 중...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>[등록] (이모지 변환 저장)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
