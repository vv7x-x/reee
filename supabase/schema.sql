-- Cosmic Living Library — Supabase Schema
-- Run this in Supabase SQL Editor to create tables and RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile (extends Supabase auth.users; link via id = auth.uid())
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'READER' CHECK (role IN ('ADMIN', 'READER')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  pdf_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_paid BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Downloads (track who downloaded what)
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories lookup (optional, for consistency)
-- You can also use a simple enum or just store category as text in books.

-- RLS Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile; admins can read all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Books: everyone can read; only admins can insert/update/delete
CREATE POLICY "Public read books" ON public.books
  FOR SELECT USING (true);

CREATE POLICY "Admins insert books" ON public.books
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins update books" ON public.books
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins delete books" ON public.books
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Downloads: users can insert own download; admins can read all
CREATE POLICY "Users can record own download" ON public.downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all downloads" ON public.downloads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Users can read own downloads" ON public.downloads
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'READER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: function to increment view_count (call from frontend or edge function)
CREATE OR REPLACE FUNCTION public.increment_book_views(book_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.books SET view_count = view_count + 1 WHERE id = book_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ——— Storage (run in Dashboard → Storage or via API) ———
-- Create two buckets: "covers" (public) and "pdfs" (public or private per your needs).
-- Policy examples for "covers" (public read, authenticated upload):
--   Allow public read: (bucket_id = 'covers')
--   Allow authenticated upload: (bucket_id = 'covers' AND auth.role() = 'authenticated')
-- Same for "pdfs" if you want public PDF links.
