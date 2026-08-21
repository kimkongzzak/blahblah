import React, { useEffect, useRef } from 'react';
import { Search, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import MessageCard from './MessageCard';

export default function Timeline({
  messages,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onRefresh,
  searchTo,
  setSearchTo,
  isAdmin,
  onDeleteMessage,
  dbError
}) {
  const observerTarget = useRef(null);

  useEffect(() => {
    if (dbError || !hasMore || loadingMore || loading) return;

    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !dbError) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(target);
    return () => { if (target) observer.unobserve(target); };
  }, [hasMore, loadingMore, loading, dbError, onLoadMore]);

  return (
    <div className="space-y-3">
      {dbError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-mono space-y-2">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">DB 연동 오류:</span>
              <span>{dbError}</span>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={onRefresh}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs font-medium transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>재시도</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pb-1 px-1">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <span>🎋 대나무숲 피드</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
            {messages.length}개
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-36 sm:w-48">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
              placeholder="🗑️ 쓰레기통 검색..."
              className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="새로고침"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && messages.length === 0 ? (
        <div className="space-y-2.5">
          {[1, 2].map((n) => (
            <div key={n} className="corporate-card p-3 space-y-2">
              <div className="w-24 h-3 skeleton rounded" />
              <div className="w-full h-8 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="corporate-card p-6 text-center text-xs text-slate-400">
          {dbError ? 'DB 오류로 데이터를 불러올 수 없습니다.' : '대나무 숲에 등록된 속마음이 없습니다. 🫅🐴👂'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              isAdmin={isAdmin}
              onDelete={onDeleteMessage}
            />
          ))}
        </div>
      )}

      {!dbError && (
        <div ref={observerTarget} className="py-2 text-center">
          {loadingMore && (
            <div className="flex items-center justify-center space-x-1 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>불러오는 중...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
