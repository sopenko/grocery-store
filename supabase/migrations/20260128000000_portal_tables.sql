-- Town Portal Schema Migration
-- Adds portal tables to existing Curicaueri Supabase project

-- ============================================
-- 1. Extend Users Table (if columns don't exist)
-- ============================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_resident BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb;

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

-- Everyone can view published announcements that haven't expired
CREATE POLICY "Anyone can view published announcements"
    ON public.announcements
    FOR SELECT
    USING (
        is_published = true
        AND (expires_at IS NULL OR expires_at > now())
    );

-- Authors can view their own announcements
CREATE POLICY "Authors can view own announcements"
    ON public.announcements
    FOR SELECT
    USING (author_id = auth.uid());

-- Admins and moderators can manage announcements
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

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_announcements_published
    ON public.announcements(is_published, published_at DESC)
    WHERE is_published = true;

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

-- Organizers can view their own events
CREATE POLICY "Organizers can view own events"
    ON public.events
    FOR SELECT
    USING (organizer_id = auth.uid());

-- Admins and moderators can manage events
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

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_upcoming
    ON public.events(start_time)
    WHERE is_published = true AND start_time > now();

-- ============================================
-- 5. Event Attendees (RSVP)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- RLS for event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Users can manage their own RSVPs
CREATE POLICY "Users can manage own RSVPs"
    ON public.event_attendees
    FOR ALL
    USING (user_id = auth.uid());

-- Event organizers can view attendees
CREATE POLICY "Organizers can view event attendees"
    ON public.event_attendees
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 6. Business Directory
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

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_businesses_category
    ON public.businesses(category)
    WHERE is_active = true;

-- ============================================
-- 7. Seed Initial Town Apps
-- ============================================

INSERT INTO public.town_apps (name, slug, description, icon_url, app_url, sort_order)
VALUES
    ('Curicaueri', 'curicaueri', 'Learn P''urhépecha language with native speaker recordings', '/icons/curicaueri.svg', '/apps/curicaueri', 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 8. Updated_at Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
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
