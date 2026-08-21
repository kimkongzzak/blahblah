import React, { useEffect, useRef } from 'react';
import { Search, Loader2, RefreshCw, Layers, CheckCircle } from 'lucide-react';
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
  totalCount,
  isLocalMode
}) {
  const observerTarget = useRef(null);

  // IntersectionObserver for lightweight infinite scrolling
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

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, loading, onLoadMore]);

  return (
    <div className="space-y-4">
      {/* Timeline Controls & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            타임라인 피드
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
            {totalCount || messages.length}개
          </span>
        </div>

        {/* Search TO Filter Input & Refresh Button */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
              placeholder="TO 대상 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="피드 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages Feed Stack */}
      {loading && messages.length === 0 ? (
        // Initial Skeleton Loader
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="corporate-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="w-32 h-4 skeleton rounded" />
                <div className="w-16 h-3 skeleton rounded" />
              </div>
              <div className="w-full h-12 skeleton rounded" />
              <div className="w-20 h-4 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        // Empty State
        <div className="corporate-card p-8 text-center space-y-2">
          <p className="text-2xl">🤫</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {searchTo ? `'${searchTo}' 대상의 피드가 없습니다.` : '아직 등록된 익명 피드가 없습니다.'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            위 작성 창에서 속마음을 입력하고 첫 이모지 메시지를 등록해 보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageCard key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger & Load More Loader */}
      <div ref={observerTarget} className="py-4 text-center">
        {loadingMore && (
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>이전 메시지 불러오는 중...</span>
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 py-2">
            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>모든 피드를 불러왔습니다 (최신순 페이징 완료)</span>
          </div>
        )}
      </div>
    </div>
  );
}
