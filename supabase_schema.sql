-- Supabase Table Setup for Emoji Timeline
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    from_name TEXT NOT NULL DEFAULT '익명',
    to_name TEXT NOT NULL DEFAULT '누군가',
    emoji_content TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for likes" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.messages FOR DELETE USING (true);
