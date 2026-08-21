import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('CUSTOM_SUPABASE_URL') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey && supabaseAnonKey.length > 10);
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'emoji_timeline_messages_v1';

const getLocalMessages = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalMessages = (messages) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
};

export const fetchMessages = async ({ page = 0, limit = 10, searchTo = '' }) => {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (searchTo && searchTo.trim() !== '') {
        query = query.ilike('to_name', `%${searchTo.trim()}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data || [], hasMore: (page + 1) * limit < (count || 0), totalCount: count || 0, isLocal: false };
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
    }
  }

  let list = getLocalMessages();
  if (searchTo && searchTo.trim() !== '') {
    list = list.filter(m => m.to_name.toLowerCase().includes(searchTo.trim().toLowerCase()));
  }
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const startIdx = page * limit;
  const pageData = list.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < list.length;

  return { data: pageData, hasMore, totalCount: list.length, isLocal: true };
};

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

      if (error) throw error;
      return { success: true, message: data[0], isLocal: false };
    } catch (err) {
      console.warn('Supabase insert failed:', err);
    }
  }

  const list = getLocalMessages();
  const created = {
    ...newMessage,
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString()
  };
  list.unshift(created);
  saveLocalMessages(list);

  return { success: true, message: created, isLocal: true };
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
      console.warn('Supabase update like failed:', err);
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

// Delete message function
export const deleteMessage = async (id) => {
  if (isSupabaseConfigured() && !String(id).startsWith('local-')) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('Supabase delete failed:', err);
      return { success: false, error: err.message };
    }
  }

  const list = getLocalMessages().filter(m => m.id !== id);
  saveLocalMessages(list);
  return { success: true };
};
