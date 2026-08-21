-- ================================================
-- 🎋 임금님 귀는 당나귀 귀 (King's Donkey Ears) DB Schema
-- ================================================

-- 1. Messages Table (대나무숲 대통과 이모지 속마음 메시지 + 원본 인코딩 텍스트)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  from_name VARCHAR(50) DEFAULT '익명' NOT NULL,
  to_name VARCHAR(50) DEFAULT '누군가' NOT NULL,
  emoji_content TEXT NOT NULL,
  raw_text_encoded TEXT,
  likes_count INT DEFAULT 0 NOT NULL
);

-- 2. Comments Table (메시지 수군수군 댓글)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  author_name VARCHAR(50) DEFAULT '익명' NOT NULL,
  comment_text TEXT NOT NULL
);

-- 3. AI Execution Logs Table (Gemini AI 호출 성공/실패 및 이모지 로그)
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  input_text TEXT NOT NULL,
  is_success BOOLEAN NOT NULL,
  used_model VARCHAR(100) NOT NULL,
  output_emoji TEXT NOT NULL,
  error_message TEXT
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_name ON public.messages (to_name);
CREATE INDEX IF NOT EXISTS idx_comments_message_id ON public.comments (message_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_logs (created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous public read & insert policies
CREATE POLICY "Allow public select on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on messages" ON public.messages FOR DELETE USING (true);

CREATE POLICY "Allow public select on comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on comments" ON public.comments FOR DELETE USING (true);

CREATE POLICY "Allow public select on ai_logs" ON public.ai_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_logs" ON public.ai_logs FOR INSERT WITH CHECK (true);
