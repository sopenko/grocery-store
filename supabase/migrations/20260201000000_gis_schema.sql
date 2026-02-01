-- GIS Schema for Town Portal
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Add location fields to existing tables
-- ============================================

-- Add coordinates to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add coordinates to events (venue location)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- ============================================
-- 2. Points of Interest Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.points_of_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'cultural', 'landmark', 'government', 'health',
        'education', 'religious', 'recreation', 'transport', 'other'
    )),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    website_url TEXT,
    image_url TEXT,
    opening_hours JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for points_of_interest
ALTER TABLE public.points_of_interest ENABLE ROW LEVEL SECURITY;

-- Everyone can view active POIs
CREATE POLICY "Anyone can view active POIs"
    ON public.points_of_interest
    FOR SELECT
    USING (is_active = true);

-- Admins can manage POIs
CREATE POLICY "Admins can manage POIs"
    ON public.points_of_interest
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

-- ============================================
-- 3. Land Parcels Table (for property/land management)
-- ============================================

CREATE TABLE IF NOT EXISTS public.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id VARCHAR(50) UNIQUE NOT NULL,  -- Official parcel ID
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'residential', 'commercial', 'agricultural', 'public',
        'communal', 'protected', 'industrial', 'mixed', 'other'
    )),
    -- Store polygon as GeoJSON
    geometry JSONB NOT NULL,
    -- Centroid for quick lookups
    centroid_lat DECIMAL(10, 8),
    centroid_lng DECIMAL(11, 8),
    area_sqm DECIMAL(12, 2),
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    owner_name VARCHAR(255),
    address TEXT,
    zoning_info TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for parcels
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Everyone can view public parcels
CREATE POLICY "Anyone can view public parcels"
    ON public.parcels
    FOR SELECT
    USING (is_public = true);

-- Owners can view their own parcels
CREATE POLICY "Owners can view own parcels"
    ON public.parcels
    FOR SELECT
    USING (owner_id = auth.uid());

-- Admins can manage all parcels
CREATE POLICY "Admins can manage parcels"
    ON public.parcels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================
-- 4. Map Layers Table (for organizing map data)
-- ============================================

CREATE TABLE IF NOT EXISTS public.map_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    layer_type VARCHAR(20) NOT NULL CHECK (layer_type IN ('points', 'polygons', 'lines')),
    source_table VARCHAR(50) NOT NULL,
    style JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for map_layers
ALTER TABLE public.map_layers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active layers
CREATE POLICY "Anyone can view active layers"
    ON public.map_layers
    FOR SELECT
    USING (is_active = true);

-- Admins can manage layers
CREATE POLICY "Admins can manage layers"
    ON public.map_layers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================
-- 5. Seed default map layers
-- ============================================

INSERT INTO public.map_layers (name, slug, description, layer_type, source_table, style, is_default, sort_order)
VALUES
    ('Negocios', 'businesses', 'Negocios y comercios locales', 'points', 'businesses',
     '{"color": "#f59e0b", "icon": "store"}'::jsonb, true, 1),
    ('Eventos', 'events', 'Ubicaciones de eventos', 'points', 'events',
     '{"color": "#8b5cf6", "icon": "calendar"}'::jsonb, true, 2),
    ('Puntos de Interés', 'pois', 'Sitios culturales y lugares importantes', 'points', 'points_of_interest',
     '{"color": "#10b981", "icon": "map-pin"}'::jsonb, true, 3),
    ('Parcelas', 'parcels', 'Terrenos y propiedades', 'polygons', 'parcels',
     '{"fillColor": "#3b82f6", "fillOpacity": 0.3, "strokeColor": "#1d4ed8"}'::jsonb, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 6. Create indexes for geo queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_location
    ON public.businesses(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_location
    ON public.events(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pois_location
    ON public.points_of_interest(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_parcels_centroid
    ON public.parcels(centroid_lat, centroid_lng);

-- ============================================
-- 7. Updated_at triggers
-- ============================================

DROP TRIGGER IF EXISTS set_updated_at ON public.points_of_interest;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.points_of_interest
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.parcels;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
