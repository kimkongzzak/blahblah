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
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.2, rootMargin: '100px' }
    );

    observer.observe(target);
    return () => { if (target) observer.unobserve(target); };
  }, [hasMore, loadingMore, loading, onLoadMore]);

  return (
    <div className="space-y-3">
      {/* DB Exception Error Alert Banner */}
      {dbError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-mono flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">DB 연동 오류 발생:</span>
            <span>{dbError}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          TIMELINE ({messages.length})
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-36 sm:w-48">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
              placeholder="TO 검색..."
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
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div key={n} className="corporate-card p-3 space-y-2">
              <div className="w-24 h-3 skeleton rounded" />
              <div className="w-full h-8 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="corporate-card p-6 text-center text-xs text-slate-400">
          등록된 피드가 없습니다.
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

      <div ref={observerTarget} className="py-2 text-center">
        {loadingMore && (
          <div className="flex items-center justify-center space-x-1 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>로딩 중...</span>
          </div>
        )}
      </div>
    </div>
  );
}
