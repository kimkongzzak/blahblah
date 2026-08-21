-- Supabase Table Setup for Emoji Timeline & Comments
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    from_name TEXT NOT NULL DEFAULT '익명',
    to_name TEXT NOT NULL DEFAULT '누군가',
    emoji_content TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    author_name TEXT NOT NULL DEFAULT '익명',
    comment_text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_message_id ON public.comments (message_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete messages" ON public.messages FOR DELETE USING (true);

CREATE POLICY "Allow public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete comments" ON public.comments FOR DELETE USING (true);
