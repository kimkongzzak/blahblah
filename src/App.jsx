import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MessageForm from './components/MessageForm';
import Timeline from './components/Timeline';
import EnvConfigModal from './components/EnvConfigModal';
import AdminAuthModal from './components/AdminAuthModal';
import { fetchMessages, createMessage, deleteMessage } from './lib/supabase';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchTo, setSearchTo] = useState('');
  const [dbError, setDbError] = useState(null);

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('IS_ADMIN_AUTHENTICATED') === 'true';
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load Function with explicit error kill-switch
  const loadInitialData = async (searchTerm = searchTo) => {
    setLoading(true);
    setPage(0);
    setDbError(null);
    try {
      const res = await fetchMessages({ page: 0, limit: 10, searchTo: searchTerm });
      if (res.error) {
        setDbError(res.error);
        setMessages([]);
        setHasMore(false); // STOP all future requests
      } else {
        setMessages(res.data || []);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      setDbError(`[오류] ${err.message}`);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search trigger (Safe single execution)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        loadInitialData(searchTo);
      }
    }, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTo]);

  // Load more with strict guard against infinite loops
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || dbError) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetchMessages({ page: nextPage, limit: 10, searchTo });
      if (res.error) {
        setDbError(res.error);
        setHasMore(false); // STOP future requests on error
      } else {
        setMessages((prev) => [...prev, ...(res.data || [])]);
        setPage(nextPage);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      setDbError(`[오류] ${err.message}`);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMessageAdded = async ({ fromName, toName, emojiContent }) => {
    const res = await createMessage({ fromName, toName, emojiContent });
    if (res.success && res.message) {
      setMessages((prev) => [res.message, ...prev]);
      setDbError(null);
      return { success: true };
    } else {
      return { success: false, error: res.error || 'DB 등록 실패' };
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('이 메시지를 삭제하시겠습니까?')) return;

    const res = await deleteMessage(id);
    if (res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } else {
      alert(res.error || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        openConfigModal={() => setIsConfigOpen(true)}
        openAdminModal={() => setIsAdminAuthOpen(true)}
        isAdmin={isAdmin}
      />

      <main className="max-w-2xl mx-auto px-4 py-5">
        <MessageForm onMessageAdded={handleMessageAdded} />

        <Timeline
          messages={messages}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onRefresh={() => loadInitialData(searchTo)}
          searchTo={searchTo}
          setSearchTo={setSearchTo}
          isAdmin={isAdmin}
          onDeleteMessage={handleDeleteMessage}
          dbError={dbError}
        />
      </main>

      <EnvConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
      />
    </div>
  );
}
