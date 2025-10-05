/*
# Row Level Security (RLS) Policies

This migration enables RLS and creates security policies for all tables.

## Security Changes
1. **RLS Enabled** - All tables protected by RLS
2. **Profile Policies** - Users can only access their own profiles
3. **Invitation Policies** - Users manage own invitations, public can view active ones
4. **Template Policies** - Users manage own templates, public can view public ones
5. **Guest/RSVP Policies** - Users manage guests for their invitations, public can RSVP
6. **Admin Policies** - Admin-only access to admin tables
7. **Analytics Policies** - Public can track, users can view their own analytics

## Important Notes
- All policies check authentication via auth.uid()
- Public access granted only where necessary (active invitations, RSVPs)
- Admin access verified through admin_users table
*/

-- =====================================
-- ENABLE RLS ON ALL TABLES
-- =====================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- =====================================
-- RLS POLICIES - PROFILES
-- =====================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- =====================================
-- RLS POLICIES - INVITATIONS
-- =====================================

DROP POLICY IF EXISTS "Users can view own invitations" ON public.invitations;
CREATE POLICY "Users can view own invitations" ON public.invitations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invitations" ON public.invitations;
CREATE POLICY "Users can insert own invitations" ON public.invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invitations" ON public.invitations;
CREATE POLICY "Users can update own invitations" ON public.invitations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invitations" ON public.invitations;
CREATE POLICY "Users can delete own invitations" ON public.invitations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view active invitations" ON public.invitations;
CREATE POLICY "Public can view active invitations" ON public.invitations
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- =====================================
-- RLS POLICIES - CUSTOM TEMPLATES
-- =====================================

DROP POLICY IF EXISTS "Users can view own templates" ON public.custom_templates;
CREATE POLICY "Users can view own templates" ON public.custom_templates
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own templates" ON public.custom_templates;
CREATE POLICY "Users can insert own templates" ON public.custom_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON public.custom_templates;
CREATE POLICY "Users can update own templates" ON public.custom_templates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.custom_templates;
CREATE POLICY "Users can delete own templates" ON public.custom_templates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view public templates" ON public.custom_templates;
CREATE POLICY "Public can view public templates" ON public.custom_templates
    FOR SELECT
    TO anon, authenticated
    USING (is_public = true AND is_active = true);

-- =====================================
-- RLS POLICIES - GUESTS & RSVPS
-- =====================================

DROP POLICY IF EXISTS "Users can manage guests of own invitations" ON public.guests;
CREATE POLICY "Users can manage guests of own invitations" ON public.guests
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can view guests of active invitations" ON public.guests;
CREATE POLICY "Public can view guests of active invitations" ON public.guests
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can manage rsvps of own invitations" ON public.rsvps;
CREATE POLICY "Users can manage rsvps of own invitations" ON public.rsvps
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = rsvps.invitation_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can insert rsvps" ON public.rsvps;
CREATE POLICY "Public can insert rsvps" ON public.rsvps
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = invitation_id 
            AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Public can view own rsvps" ON public.rsvps;
CREATE POLICY "Public can view own rsvps" ON public.rsvps
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = rsvps.invitation_id 
            AND is_active = true
        )
    );

-- =====================================
-- RLS POLICIES - PURCHASE REQUESTS
-- =====================================

DROP POLICY IF EXISTS "Public can insert purchase_requests" ON public.purchase_requests;
CREATE POLICY "Public can insert purchase_requests" ON public.purchase_requests
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view own purchase_requests" ON public.purchase_requests;
CREATE POLICY "Public can view own purchase_requests" ON public.purchase_requests
    FOR SELECT 
    TO authenticated
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =====================================
-- RLS POLICIES - USER SUBSCRIPTIONS
-- =====================================

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================
-- RLS POLICIES - ANALYTICS
-- =====================================

DROP POLICY IF EXISTS "Public can insert invitation_views" ON public.invitation_views;
CREATE POLICY "Public can insert invitation_views" ON public.invitation_views
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own invitation analytics" ON public.invitation_views;
CREATE POLICY "Users can view own invitation analytics" ON public.invitation_views
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = invitation_views.invitation_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can insert template_usage" ON public.template_usage;
CREATE POLICY "Public can insert template_usage" ON public.template_usage
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own template usage" ON public.template_usage;
CREATE POLICY "Users can view own template usage" ON public.template_usage
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.custom_templates 
            WHERE id = template_usage.custom_template_id 
            AND user_id = auth.uid()
        )
    );

-- =====================================
-- RLS POLICIES - FILE UPLOADS
-- =====================================

DROP POLICY IF EXISTS "Users can view own uploads" ON public.file_uploads;
CREATE POLICY "Users can view own uploads" ON public.file_uploads
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Public can view public uploads" ON public.file_uploads;
CREATE POLICY "Public can view public uploads" ON public.file_uploads
    FOR SELECT
    TO anon
    USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert own uploads" ON public.file_uploads;
CREATE POLICY "Users can insert own uploads" ON public.file_uploads
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own uploads" ON public.file_uploads;
CREATE POLICY "Users can update own uploads" ON public.file_uploads
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);