import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('CUSTOM_SUPABASE_URL') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '';

// Supabase client instance (or null if not configured)
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey && supabaseAnonKey.length > 10);
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Fallback Storage for Demo & Offline mode
const LOCAL_STORAGE_KEY = 'emoji_timeline_messages_v1';

const getLocalMessages = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      // Default sample data
      const sample = [
        {
          id: 'demo-1',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          from_name: '판교익명A',
          to_name: '옆자리PM',
          emoji_content: '🦹🥱🙅‍♂️🪦👍',
          likes_count: 5
        },
        {
          id: 'demo-2',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          from_name: '김사원',
          to_name: '퇴근시간',
          emoji_content: '⏰🏃‍♂️💨🍻🥳',
          likes_count: 12
        },
        {
          id: 'demo-3',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          from_name: '개발자D',
          to_name: '갑자기터진버그',
          emoji_content: '🐛💥😱💻🔥☕️💣',
          likes_count: 8
        }
      ];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalMessages = (messages) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
};

// Fetch messages with pagination (limit + offset)
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
      console.warn('Supabase fetch failed, fallback to LocalStorage:', err);
    }
  }

  // LocalStorage Fallback implementation
  let list = getLocalMessages();
  if (searchTo && searchTo.trim() !== '') {
    list = list.filter(m => m.to_name.toLowerCase().includes(searchTo.trim().toLowerCase()));
  }
  
  // Sort descending by created_at
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const startIdx = page * limit;
  const pageData = list.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < list.length;

  return { data: pageData, hasMore, totalCount: list.length, isLocal: true };
};

// Add new message
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
      console.warn('Supabase insert failed, fallback to local:', err);
    }
  }

  // LocalStorage Fallback
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

// Toggle or increment like count
export const incrementLike = async (id, currentLikes = 0) => {
  if (isSupabaseConfigured() && !id.startsWith('demo-') && !id.startsWith('local-')) {
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

  // LocalStorage fallback
  const list = getLocalMessages();
  const idx = list.findIndex(m => m.id === id);
  if (idx !== -1) {
    list[idx].likes_count = (list[idx].likes_count || 0) + 1;
    saveLocalMessages(list);
    return list[idx].likes_count;
  }
  return currentLikes + 1;
};
