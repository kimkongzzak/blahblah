import React, { useState } from 'react';
import { ThumbsUp, Copy, Clock, Trash2, MessageCircle, Send } from 'lucide-react';
import { incrementLike, addComment, deleteComment } from '../lib/supabase';

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

  const [commentsList, setCommentsList] = useState(message.comments || []);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await addComment({
        messageId: message.id,
        commentText: commentText.trim(),
        authorName: authorName.trim() || '익명'
      });

      if (res.success && res.comment) {
        setCommentsList(prev => [...prev, res.comment]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const res = await deleteComment(commentId);
    if (res.success) {
      setCommentsList(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const emojiArray = Array.from(message.emoji_content || '');

  return (
    <div className="corporate-card p-3.5 hover:shadow-sm transition">
      {/* Header: Trash Target & From */}
      <div className="flex items-center justify-between text-xs mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-100 dark:border-emerald-900/40">
            🗑️ @{message.to_name || '누군가'}
          </span>
          <span className="text-[11px] text-slate-400">
            (by 🎭 {message.from_name || '익명'})
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
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Emoji Story in Speech Bubble Container */}
      <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 relative">
        <div className="flex flex-wrap items-center gap-1.5 text-2xl tracking-wide select-all">
          {emojiArray.map((emo, idx) => (
            <span key={idx}>{emo}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between text-xs pt-1 pb-1.5">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium transition ${
              hasLiked
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
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

        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <MessageCircle className="w-3 h-3" />
          <span>댓글 {commentsList.length}개</span>
        </div>
      </div>

      {/* Auto-Expanded Comments List */}
      <div className="mt-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        {commentsList.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {commentsList.map((c) => (
              <div
                key={c.id}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 text-xs flex items-start justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mr-1.5 text-[11px]">
                    💬 {c.author_name || '익명'}:
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 text-xs">
                    {c.comment_text}
                  </span>
                  <span className="ml-2 text-[10px] text-slate-400 font-mono">
                    {formatTimeAgo(c.created_at)}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-rose-400 hover:text-rose-600 text-[10px] ml-1"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="닉네임"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-20 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          <input
            type="text"
            placeholder="댓글 수군수군..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmittingComment || !commentText.trim()}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 transition flex items-center gap-1 whitespace-nowrap"
          >
            <Send className="w-2.5 h-2.5" />
            <span>[댓글]</span>
          </button>
        </form>
      </div>
    </div>
  );
}
