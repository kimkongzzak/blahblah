import React, { useState } from 'react';
import { ThumbsUp, Copy, Check, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { incrementLike } from '../lib/supabase';

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

export default function MessageCard({ message, isAdmin, onDelete }) {
  const [likes, setLikes] = useState(message.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const emojiArray = Array.from(message.emoji_content || '');

  return (
    <div className="corporate-card p-3.5 hover:shadow-sm transition">
      <div className="flex items-center justify-between text-xs mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {message.from_name || '익명'}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            @{message.to_name || '누군가'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(message.created_at)}</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="메시지 삭제 (관리자)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="my-2 py-1.5 px-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 text-2xl tracking-wide select-all">
          {emojiArray.map((emo, idx) => (
            <span key={idx}>{emo}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium transition ${
              hasLiked
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-0.5 rounded text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {copied ? (
              <span className="text-emerald-600 font-medium">복사됨</span>
            ) : (
              <span>복사</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
