import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('CUSTOM_SUPABASE_URL') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey && supabaseAnonKey.length > 10);
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'emoji_timeline_messages_v2';
const LOCAL_COMMENTS_KEY = 'emoji_timeline_comments_v2';

// Clear old mock/sample data key if exists
try {
  localStorage.removeItem('emoji_timeline_messages_v1');
} catch (e) {}

const getLocalMessages = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const getLocalComments = () => {
  try {
    const data = localStorage.getItem(LOCAL_COMMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalMessages = (messages) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
};

const saveLocalComments = (comments) => {
  localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(comments));
};

// Fetch messages with explicit exception catching
export const fetchMessages = async ({ page = 0, limit = 10, searchTo = '' }) => {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('messages')
        .select('*, comments(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (searchTo && searchTo.trim() !== '') {
        query = query.ilike('to_name', `%${searchTo.trim()}%`);
      }

      const { data, error, count } = await query;
      
      if (error) {
        return { data: [], hasMore: false, totalCount: 0, error: `[DB 조회 실패] ${error.message} (${error.code || 'ERR'})` };
      }

      const formatted = (data || []).map(item => ({
        ...item,
        comments: (item.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      }));

      return { data: formatted, hasMore: (page + 1) * limit < (count || 0), totalCount: count || 0, error: null };
    } catch (err) {
      return { data: [], hasMore: false, totalCount: 0, error: `[DB 연결 실패] ${err.message || 'Supabase 네트워크 오류'}` };
    }
  }

  let list = getLocalMessages();
  const allComments = getLocalComments();

  if (searchTo && searchTo.trim() !== '') {
    list = list.filter(m => m.to_name.toLowerCase().includes(searchTo.trim().toLowerCase()));
  }
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const startIdx = page * limit;
  const pageData = list.slice(startIdx, startIdx + limit).map(m => ({
    ...m,
    comments: allComments.filter(c => c.message_id === m.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }));

  const hasMore = startIdx + limit < list.length;

  return { data: pageData, hasMore, totalCount: list.length, error: null };
};

// Create Message with explicit error reporting
export const createMessage = async ({ fromName, toName, emojiContent }) => {
  const newMessage = {
    from_name: fromName || '익명',
    to_name: toName || '누군가',
    emoji_content: emojiContent,
    likes_count: 0
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select();

      if (error) {
        return { success: false, error: `[DB 저장 실패] ${error.message} (테이블/RLS 확인 필요)` };
      }
      return { success: true, message: { ...data[0], comments: [] } };
    } catch (err) {
      return { success: false, error: `[DB 연결 실패] ${err.message || '네트워크 오류'}` };
    }
  }

  const list = getLocalMessages();
  const created = {
    ...newMessage,
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString(),
    comments: []
  };
  list.unshift(created);
  saveLocalMessages(list);

  return { success: true, message: created };
};

export const incrementLike = async (id, currentLikes = 0) => {
  if (isSupabaseConfigured() && !String(id).startsWith('local-')) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ likes_count: currentLikes + 1 })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0]?.likes_count || currentLikes + 1;
    } catch (err) {
      console.warn('Like update failed:', err);
    }
  }

  const list = getLocalMessages();
  const idx = list.findIndex(m => m.id === id);
  if (idx !== -1) {
    list[idx].likes_count = (list[idx].likes_count || 0) + 1;
    saveLocalMessages(list);
    return list[idx].likes_count;
  }
  return currentLikes + 1;
};

export const deleteMessage = async (id) => {
  if (isSupabaseConfigured() && !String(id).startsWith('local-')) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: `[DB 삭제 실패] ${error.message}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: `[DB 연결 실패] ${err.message}` };
    }
  }

  const list = getLocalMessages().filter(m => m.id !== id);
  saveLocalMessages(list);
  return { success: true };
};

export const addComment = async ({ messageId, commentText, authorName }) => {
  const newComment = {
    message_id: messageId,
    comment_text: commentText,
    author_name: authorName || '익명'
  };

  if (isSupabaseConfigured() && !String(messageId).startsWith('local-')) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([newComment])
        .select();

      if (error) {
        return { success: false, error: `[댓글 DB 저장 실패] ${error.message}` };
      }
      return { success: true, comment: data[0] };
    } catch (err) {
      return { success: false, error: `[DB 연결 실패] ${err.message}` };
    }
  }

  const comments = getLocalComments();
  const created = {
    ...newComment,
    id: `c-local-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString()
  };
  comments.push(created);
  saveLocalComments(comments);

  return { success: true, comment: created };
};

export const deleteComment = async (commentId) => {
  if (isSupabaseConfigured() && !String(commentId).startsWith('c-local-')) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        return { success: false, error: `[댓글 DB 삭제 실패] ${error.message}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: `[DB 연결 실패] ${err.message}` };
    }
  }

  const comments = getLocalComments().filter(c => c.id !== commentId);
  saveLocalComments(comments);
  return { success: true };
};
