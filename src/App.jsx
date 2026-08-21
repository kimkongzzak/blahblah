import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MessageForm from './components/MessageForm';
import Timeline from './components/Timeline';
import EnvConfigModal from './components/EnvConfigModal';
import { fetchMessages, createMessage, isSupabaseConfigured } from './lib/supabase';
import { isGeminiConfigured } from './lib/gemini';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTo, setSearchTo] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Sync dark class on html root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load or search query change
  const loadInitialData = useCallback(async (searchTerm = searchTo) => {
    setLoading(true);
    setPage(0);
    try {
      const res = await fetchMessages({ page: 0, limit: 10, searchTo: searchTerm });
      setMessages(res.data || []);
      setHasMore(res.hasMore);
      setTotalCount(res.totalCount);
      setIsLocalMode(res.isLocal);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData(searchTo);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTo, loadInitialData]);

  // Load more pages for infinite scroll
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetchMessages({ page: nextPage, limit: 10, searchTo });
      setMessages((prev) => [...prev, ...(res.data || [])]);
      setPage(nextPage);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Add new message callback
  const handleMessageAdded = async ({ fromName, toName, emojiContent }) => {
    const res = await createMessage({ fromName, toName, emojiContent });
    if (res.success && res.message) {
      // Prepend newly added message to top of list
      setMessages((prev) => [res.message, ...prev]);
      setTotalCount((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Navbar Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        openConfigModal={() => setIsConfigOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Supabase Notice Banner if not configured */}
        {!isSupabaseConfigured() && (
          <div className="mb-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center space-x-2">
              <span className="text-base">💡</span>
              <span>
                <b>Supabase DB 연동 대기중</b>: 현재 로컬 데이터로 작동 중입니다. Supabase 연동 시 클라우드 실시간 타임라인으로 동작합니다.
              </span>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-800 transition whitespace-nowrap"
            >
              설정하기
            </button>
          </div>
        )}

        {/* Message Input Form */}
        <MessageForm onMessageAdded={handleMessageAdded} />

        {/* Timeline Feed */}
        <Timeline
          messages={messages}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onRefresh={() => loadInitialData(searchTo)}
          searchTo={searchTo}
          setSearchTo={setSearchTo}
          totalCount={totalCount}
          isLocalMode={isLocalMode}
        />
      </main>

      {/* Configuration & Key Modal */}
      <EnvConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
}
