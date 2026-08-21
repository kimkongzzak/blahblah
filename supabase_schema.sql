-- ==========================================
-- Supabase Table Setup for Anonymous Emoji Timeline
-- Supabase 대시보드의 SQL Editor에 복사하여 실행(Run)하세요.
-- ==========================================

-- 1. messages 테이블 생성
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    from_name TEXT NOT NULL DEFAULT '익명',
    to_name TEXT NOT NULL DEFAULT '누군가',
    emoji_content TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0
);

-- 2. Index 생성 (빠른 최신순 페이징 조회)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_name ON public.messages (to_name);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. 누구나 읽기 허용 정책
CREATE POLICY "Allow public read access" 
ON public.messages FOR SELECT 
USING (true);

-- 5. 누구나 데이터 추가(등록) 허용 정책
CREATE POLICY "Allow public insert access" 
ON public.messages FOR INSERT 
WITH CHECK (true);

-- 6. 누구나 좋아요(업데이트) 허용 정책
CREATE POLICY "Allow public update access for likes" 
ON public.messages FOR UPDATE 
USING (true);

-- realtime 기능 활성화 (선택 사항: 새로운 메시지가 등록되면 실시간 반영)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
