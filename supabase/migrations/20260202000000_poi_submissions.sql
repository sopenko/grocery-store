-- POI Submissions & Approval System
-- Adds status workflow to points_of_interest

-- ============================================
-- 1. Add status column to points_of_interest
-- ============================================

ALTER TABLE public.points_of_interest
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.points_of_interest
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.points_of_interest
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.points_of_interest
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE public.points_of_interest
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================
-- 2. Update RLS policies for submissions
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view active POIs" ON public.points_of_interest;
DROP POLICY IF EXISTS "Admins can manage POIs" ON public.points_of_interest;

-- Anyone can view approved POIs
CREATE POLICY "Anyone can view approved POIs"
    ON public.points_of_interest
    FOR SELECT
    USING (status = 'approved' AND is_active = true);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
    ON public.points_of_interest
    FOR SELECT
    USING (submitted_by = auth.uid());

-- Authenticated users can submit POIs
CREATE POLICY "Users can submit POIs"
    ON public.points_of_interest
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND status = 'pending'
        AND submitted_by = auth.uid()
    );

-- Users can update their pending submissions
CREATE POLICY "Users can update own pending submissions"
    ON public.points_of_interest
    FOR UPDATE
    USING (
        submitted_by = auth.uid()
        AND status = 'pending'
    )
    WITH CHECK (
        submitted_by = auth.uid()
        AND status = 'pending'
    );

-- Users can delete their pending submissions
CREATE POLICY "Users can delete own pending submissions"
    ON public.points_of_interest
    FOR DELETE
    USING (
        submitted_by = auth.uid()
        AND status = 'pending'
    );

-- Admins/moderators can do everything
CREATE POLICY "Admins can manage all POIs"
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
-- 3. Create index for status queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pois_status ON public.points_of_interest(status);
CREATE INDEX IF NOT EXISTS idx_pois_submitted_by ON public.points_of_interest(submitted_by);
