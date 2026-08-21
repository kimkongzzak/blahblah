import React, { useState } from 'react';
import { ThumbsUp, Clock, Trash2, MessageCircle, Send, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { incrementLike, addComment, deleteComment } from '../lib/supabase';
import { decodeSafeBase64 } from '../lib/gemini';

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
  const [showDecoded, setShowDecoded] = useState(false);

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
    if (e) e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

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

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
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
  const decodedRawText = decodeSafeBase64(message.raw_text_encoded);

  return (
    <div className="corporate-card p-3.5 hover:shadow-sm transition">
      {/* Header: FROM -> TO */}
      <div className="flex items-center justify-between text-xs mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-0.5">
            🎭 {message.from_name || '익명'}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            🗑️ @{message.to_name || '누군가'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(message.created_at)}</span>
          </div>

          {/* Admin Decode Toggle Button */}
          {isAdmin && decodedRawText && (
            <button
              onClick={() => setShowDecoded(!showDecoded)}
              className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[10px] flex items-center gap-1 font-semibold hover:bg-amber-100 transition"
              title="관리자 전용 원문 디코딩"
            >
              {showDecoded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showDecoded ? '원문 숨기기' : '원문 디코딩'}</span>
            </button>
          )}

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

      {/* Admin Only Decoded Text View Box */}
      {isAdmin && showDecoded && (
        <div className="mb-2 p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-mono break-all">
          <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400 block mb-0.5">
            🔑 [관리자 보안 디코딩 원문]:
          </span>
          {decodedRawText}
        </div>
      )}

      {/* Main Emoji Display */}
      <div className="my-2.5 px-1 py-1">
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

      {/* Comments List */}
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
            placeholder="댓글 수군수군... (Enter 전송)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleCommentKeyDown}
            className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmittingComment || !commentText.trim()}
            className="p-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 transition flex items-center justify-center shrink-0"
            title="댓글 등록"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
