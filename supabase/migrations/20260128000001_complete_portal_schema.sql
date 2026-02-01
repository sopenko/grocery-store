-- Complete Town Portal Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nswzerffyvynuvhfrilp/sql

-- ============================================
-- 1. Users Table (Core user profiles)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'learner' CHECK (role IN ('learner', 'teacher', 'moderator', 'admin')),
    points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_active TIMESTAMPTZ,
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    address TEXT,
    is_resident BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles
CREATE POLICY "Anyone can view profiles"
    ON public.users
    FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. Town Apps Registry
-- ============================================

CREATE TABLE IF NOT EXISTS public.town_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    app_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for town_apps
ALTER TABLE public.town_apps ENABLE ROW LEVEL SECURITY;

-- Everyone can view active apps
CREATE POLICY "Anyone can view active apps"
    ON public.town_apps
    FOR SELECT
    USING (is_active = true);

-- Only admins can manage apps
CREATE POLICY "Admins can manage apps"
    ON public.town_apps
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================
-- 3. Announcements Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can view published announcements
CREATE POLICY "Anyone can view published announcements"
    ON public.announcements
    FOR SELECT
    USING (
        is_published = true
        AND (expires_at IS NULL OR expires_at > now())
    );

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements"
    ON public.announcements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

-- ============================================
-- 4. Events Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    category VARCHAR(50),
    organizer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    max_attendees INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view published events
CREATE POLICY "Anyone can view published events"
    ON public.events
    FOR SELECT
    USING (is_published = true);

-- Admins can manage events
CREATE POLICY "Admins can manage events"
    ON public.events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

-- ============================================
-- 5. Business Directory
-- ============================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    hours JSONB DEFAULT '{}'::jsonb,
    logo_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Everyone can view active businesses
CREATE POLICY "Anyone can view active businesses"
    ON public.businesses
    FOR SELECT
    USING (is_active = true);

-- Owners can manage their own businesses
CREATE POLICY "Owners can manage own businesses"
    ON public.businesses
    FOR ALL
    USING (owner_id = auth.uid());

-- Admins can manage all businesses
CREATE POLICY "Admins can manage all businesses"
    ON public.businesses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================
-- 6. Seed Initial Data
-- ============================================

-- Seed Curicaueri app
INSERT INTO public.town_apps (name, slug, description, icon_url, app_url, sort_order)
VALUES
    ('Curicaueri', 'curicaueri', 'Aprende la lengua P''urhépecha con grabaciones de hablantes nativos', '/icons/curicaueri.svg', 'http://localhost:5173', 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. Updated_at Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.users;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.announcements;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.businesses;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
