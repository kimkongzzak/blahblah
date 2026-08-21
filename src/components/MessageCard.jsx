import React, { useState } from 'react';
import { ThumbsUp, Copy, Check, Clock, User, ArrowRight, Share2, Eye } from 'lucide-react';
import { incrementLike } from '../lib/supabase';

// Relative time formatter
function formatTimeAgo(dateString) {
  if (!dateString) return '방금 전';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

// Map individual emojis to friendly corporate interpretation tooltips
function getEmojiMeaning(emoji) {
  const dictionary = {
    '🦹': '분노/악당/개자식',
    '🤬': '격한 욕설/분통',
    '🖕': '강한 항의',
    '🔥': '열받음/분노 폭발',
    '💥': '멘탈 분쇄',
    '🥱': '하품/지루함/피곤',
    '😴': '수면 부족/자고싶다',
    '☕️': '카페인 연명',
    '💤': '졸림 폭발',
    '🤯': '업무 과부하',
    '🙅‍♂️': '거절/하지마/절대사절',
    '🛑': '멈춰/그만해',
    '✋': '거부/사절',
    '❌': '불가능/반대',
    '🪦': '무덤/죽고싶다/망함',
    '💀': '해골/사망각',
    '☠️': '치명적 버그',
    '👻': '유혼이 됨',
    '⚰️': '장례식/끝장',
    '👍': '따봉/자아위안/그래도승리',
    '😏': '비웃음/썩소',
    '🤡': '광대짓/현타',
    '👏': '영혼없는 박수',
    '💸': '월급 순삭',
    '🤑': '돈버는 노예',
    '💰': '보너스 소망',
    '📉': '멘탈/주가 하락',
    '😭': '오열/슬픔',
    '🐛': '신규 버그',
    '🍺': '퇴근후 한잔',
    '🏃‍♂️': '칼퇴근 런',
    '💨': '바람처럼 사라짐',
    '🥳': '주말 만세'
  };

  return dictionary[emoji] || '감정 및 동작 표현';
}

export default function MessageCard({ message }) {
  const [likes, setLikes] = useState(message.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes(prev => prev + 1);
    await incrementLike(message.id, likes);
  };

  const handleCopy = () => {
    const textToCopy = `[${message.from_name} ➡️ ${message.to_name}] ${message.emoji_content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert emoji string into Array of unicode characters
  const emojiArray = Array.from(message.emoji_content || '');

  return (
    <div className="corporate-card p-4 sm:p-4 hover:shadow-md transition group">
      {/* Card Header: FROM -> TO & Date */}
      <div className="flex items-center justify-between text-xs mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
            {message.from_name || '익명'}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-100 dark:border-blue-900/40">
            @{message.to_name || '누군가'}
          </span>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(message.created_at)}</span>
        </div>
      </div>

      {/* Main Content: Big Story Emoji Display */}
      <div className="my-3 py-2 px-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between border border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-2xl sm:text-3xl tracking-wide select-all">
          {emojiArray.map((emo, idx) => (
            <span
              key={idx}
              className="relative group/emo cursor-pointer hover:scale-125 transition-transform inline-block"
              title={`${emo} (${getEmojiMeaning(emo)})`}
            >
              {emo}
              {/* Tooltip on hover */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/emo:block z-20 px-2 py-0.5 text-[10px] whitespace-nowrap rounded bg-slate-900 text-white shadow-lg pointer-events-none">
                {getEmojiMeaning(emo)}
              </span>
            </span>
          ))}
        </div>

        {/* Quick interpretation toggle */}
        <button
          onClick={() => setShowInterpretation(!showInterpretation)}
          className="text-slate-400 hover:text-blue-500 p-1 text-[11px] flex items-center gap-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
          title="이모지 뉘앙스 해독기"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px]">{showInterpretation ? '접기' : '해독'}</span>
        </button>
      </div>

      {/* Interpretation expandable panel */}
      {showInterpretation && (
        <div className="mb-3 p-2 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
          <span className="font-semibold">🔍 감정 흐름 해독:</span>{' '}
          {emojiArray.map(emo => `${emo} ${getEmojiMeaning(emo)}`).join('  ➡️  ')}
        </div>
      )}

      {/* Card Footer: Actions */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center space-x-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              hasLiked
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="이모지 피드 복사하기"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-medium">복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>복사</span>
              </>
            )}
          </button>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          ID: {message.id ? String(message.id).slice(0, 6) : 'local'}
        </span>
      </div>
    </div>
  );
}
