-- TaklifNoma Complete Database Schema
-- =====================================
-- Run this script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================
-- CORE TABLES
-- =====================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    company_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    groom_name TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    wedding_date DATE NOT NULL,
    wedding_time TIME,
    venue TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    custom_message TEXT,
    template_id TEXT NOT NULL DEFAULT 'classic',
    custom_template_id UUID REFERENCES public.custom_templates(id) ON DELETE SET NULL,
    image_url TEXT,
    rsvp_deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    slug TEXT UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Custom Templates
CREATE TABLE IF NOT EXISTS public.custom_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'custom',
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    colors JSONB DEFAULT '{}'::jsonb,
    fonts JSONB DEFAULT '{}'::jsonb,
    layout JSONB DEFAULT '{}'::jsonb,
    custom_css TEXT,
    preview_image TEXT,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Guests
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    plus_one BOOLEAN DEFAULT FALSE,
    group_name TEXT,
    notes TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RSVPs
CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    will_attend BOOLEAN NOT NULL,
    plus_one_attending BOOLEAN,
    message TEXT,
    email TEXT,
    phone TEXT,
    dietary_requirements TEXT,
    song_request TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================
-- ADMIN & BUSINESS TABLES
-- =====================================

-- Admin Users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'support')),
    full_name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Purchase Requests
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan_type TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_name TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'processing', 'completed', 'rejected', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    processed_by UUID REFERENCES public.admin_users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'pending')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'UZS',
    payment_method TEXT,
    auto_renew BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '{}'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================
-- ANALYTICS & TRACKING TABLES
-- =====================================

-- Invitation Views (for analytics)
CREATE TABLE IF NOT EXISTS public.invitation_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    visitor_ip INET,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Template Usage Analytics
CREATE TABLE IF NOT EXISTS public.template_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    template_id TEXT,
    custom_template_id UUID REFERENCES public.custom_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'preview', 'use', 'download', 'share')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================
-- CACHE & PERFORMANCE TABLES
-- =====================================

-- Cache for frequently accessed data
CREATE TABLE IF NOT EXISTS public.cache_entries (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- File uploads and assets
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active) WHERE is_active = true;

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON public.invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON public.invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON public.invitations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_wedding_date ON public.invitations(wedding_date);
CREATE INDEX IF NOT EXISTS idx_invitations_is_active ON public.invitations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invitations_template_id ON public.invitations(template_id);
CREATE INDEX IF NOT EXISTS idx_invitations_custom_template_id ON public.invitations(custom_template_id);

-- Custom templates indexes
CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id ON public.custom_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_category ON public.custom_templates(category);
CREATE INDEX IF NOT EXISTS idx_custom_templates_is_public ON public.custom_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_custom_templates_is_featured ON public.custom_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_custom_templates_created_at ON public.custom_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_templates_usage_count ON public.custom_templates(usage_count DESC);

-- Guests indexes
CREATE INDEX IF NOT EXISTS idx_guests_invitation_id ON public.guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON public.guests(email);

-- RSVPs indexes
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON public.rsvps(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON public.rsvps(created_at DESC);

-- Purchase requests indexes
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON public.purchase_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_email ON public.purchase_requests(email);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_tags ON public.cache_entries USING GIN(tags);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_invitation_views_invitation_id ON public.invitation_views(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_views_created_at ON public.invitation_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON public.template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_custom_template_id ON public.template_usage(custom_template_id);

-- =====================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_templates_updated_at BEFORE UPDATE ON public.custom_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_template_id IS NOT NULL THEN
        UPDATE public.custom_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.custom_template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment usage count when invitation uses custom template
CREATE TRIGGER increment_template_usage_trigger 
    AFTER INSERT ON public.invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION increment_template_usage();

-- Function to increment invitation view count
CREATE OR REPLACE FUNCTION increment_invitation_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.invitations 
    SET view_count = view_count + 1 
    WHERE id = NEW.invitation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment view count
CREATE TRIGGER increment_invitation_views_trigger 
    AFTER INSERT ON public.invitation_views 
    FOR EACH ROW 
    EXECUTE FUNCTION increment_invitation_views();

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Enable RLS on all tables
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

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================
-- RLS POLICIES - INVITATIONS
-- =====================================

-- Users can manage their own invitations
CREATE POLICY "Users can view own invitations" ON public.invitations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations" ON public.invitations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitations" ON public.invitations
    FOR DELETE USING (auth.uid() = user_id);

-- Public can view active invitations (for sharing)
CREATE POLICY "Public can view active invitations" ON public.invitations
    FOR SELECT USING (is_active = true);

-- =====================================
-- RLS POLICIES - CUSTOM TEMPLATES
-- =====================================

-- Users can manage their own templates
CREATE POLICY "Users can view own templates" ON public.custom_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.custom_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.custom_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.custom_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Public can view public templates
CREATE POLICY "Public can view public templates" ON public.custom_templates
    FOR SELECT USING (is_public = true AND is_active = true);

-- =====================================
-- RLS POLICIES - GUESTS & RSVPS
-- =====================================

-- Guests policies
CREATE POLICY "Users can manage guests of own invitations" ON public.guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view guests of active invitations" ON public.guests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND is_active = true
        )
    );

-- RSVPs policies
CREATE POLICY "Users can manage rsvps of own invitations" ON public.rsvps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = rsvps.invitation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Public can insert rsvps" ON public.rsvps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = invitation_id 
            AND is_active = true
        )
    );

CREATE POLICY "Public can view own rsvps" ON public.rsvps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = rsvps.invitation_id 
            AND is_active = true
        )
    );

-- =====================================
-- RLS POLICIES - ADMIN TABLES
-- =====================================

-- Admin users (only admins can access)
CREATE POLICY "Admins can access admin_users" ON public.admin_users
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = auth.jwt()->>'sub' 
            AND is_active = true
        )
    );

-- Purchase requests
CREATE POLICY "Public can insert purchase_requests" ON public.purchase_requests
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can view own purchase_requests" ON public.purchase_requests
    FOR SELECT TO anon, authenticated USING (
        email = COALESCE(auth.jwt()->>'email', email)
    );

CREATE POLICY "Admins can access all purchase_requests" ON public.purchase_requests
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = auth.jwt()->>'sub' 
            AND is_active = true
        )
    );

-- User subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can access all subscriptions" ON public.user_subscriptions
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id::text = auth.jwt()->>'sub' 
            AND is_active = true
        )
    );

-- =====================================
-- RLS POLICIES - ANALYTICS
-- =====================================

-- Invitation views (public can insert, users can view own)
CREATE POLICY "Public can insert invitation_views" ON public.invitation_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own invitation analytics" ON public.invitation_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = invitation_views.invitation_id 
            AND user_id = auth.uid()
        )
    );

-- Template usage analytics
CREATE POLICY "Public can insert template_usage" ON public.template_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own template usage" ON public.template_usage
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.custom_templates 
            WHERE id = template_usage.custom_template_id 
            AND user_id = auth.uid()
        )
    );

-- =====================================
-- RLS POLICIES - CACHE & FILES
-- =====================================

-- Cache entries (service role only)
CREATE POLICY "Service role can access cache" ON public.cache_entries
    FOR ALL TO service_role USING (true);

-- File uploads
CREATE POLICY "Users can view own uploads" ON public.file_uploads
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own uploads" ON public.file_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON public.file_uploads
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================
-- INITIAL DATA
-- =====================================

-- Insert default admin user
INSERT INTO public.admin_users (username, password_hash, role, full_name, email, permissions) 
VALUES (
    'admin', 
    '$2a$10$defaulthashforadmin', 
    'admin', 
    'System Administrator', 
    'admin@taklifnoma.uz',
    '{"all": true}'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- Insert sample manager user
INSERT INTO public.admin_users (username, password_hash, role, full_name, email, permissions) 
VALUES (
    'manager', 
    '$2a$10$defaulthashformanager', 
    'manager', 
    'Content Manager', 
    'manager@taklifnoma.uz',
    '{"templates": true, "users": true, "analytics": true}'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- =====================================
-- CACHE MANAGEMENT FUNCTIONS
-- =====================================

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.cache_entries WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cached value
CREATE OR REPLACE FUNCTION get_cache(cache_key TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT value INTO result 
    FROM public.cache_entries 
    WHERE key = cache_key AND expires_at > NOW();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set cache value
CREATE OR REPLACE FUNCTION set_cache(cache_key TEXT, cache_value JSONB, expire_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.cache_entries (key, value, expires_at)
    VALUES (cache_key, cache_value, NOW() + INTERVAL '1 minute' * expire_minutes)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- ANALYTICS FUNCTIONS
-- =====================================

-- Function to get invitation analytics
CREATE OR REPLACE FUNCTION get_invitation_analytics(invitation_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_views', COALESCE(i.view_count, 0),
        'total_rsvps', COALESCE(rsvp_stats.total_rsvps, 0),
        'attending', COALESCE(rsvp_stats.attending, 0),
        'not_attending', COALESCE(rsvp_stats.not_attending, 0),
        'pending', COALESCE(guest_stats.total_guests, 0) - COALESCE(rsvp_stats.total_rsvps, 0),
        'total_guests', COALESCE(guest_stats.total_guests, 0),
        'recent_views', recent_views.views
    ) INTO result
    FROM public.invitations i
    LEFT JOIN (
        SELECT 
            invitation_id,
            COUNT(*) as total_rsvps,
            COUNT(*) FILTER (WHERE will_attend = true) as attending,
            COUNT(*) FILTER (WHERE will_attend = false) as not_attending
        FROM public.rsvps 
        WHERE invitation_id = invitation_uuid
        GROUP BY invitation_id
    ) rsvp_stats ON i.id = rsvp_stats.invitation_id
    LEFT JOIN (
        SELECT 
            invitation_id,
            COUNT(*) as total_guests
        FROM public.guests 
        WHERE invitation_id = invitation_uuid
        GROUP BY invitation_id
    ) guest_stats ON i.id = guest_stats.invitation_id
    LEFT JOIN (
        SELECT 
            invitation_id,
            jsonb_agg(
                jsonb_build_object(
                    'date', created_at::date,
                    'count', 1
                ) ORDER BY created_at DESC
            ) as views
        FROM public.invitation_views 
        WHERE invitation_id = invitation_uuid 
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY invitation_id
    ) recent_views ON i.id = recent_views.invitation_id
    WHERE i.id = invitation_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- PERFORMANCE OPTIMIZATION
-- =====================================

-- Create materialized view for popular templates
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_templates AS
SELECT 
    ct.*,
    COALESCE(usage_stats.usage_count, 0) as current_usage_count,
    COALESCE(usage_stats.recent_usage, 0) as recent_usage_count
FROM public.custom_templates ct
LEFT JOIN (
    SELECT 
        custom_template_id,
        COUNT(*) as usage_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_usage
    FROM public.invitations
    WHERE custom_template_id IS NOT NULL
    GROUP BY custom_template_id
) usage_stats ON ct.id = usage_stats.custom_template_id
WHERE ct.is_active = true AND ct.is_public = true
ORDER BY current_usage_count DESC, recent_usage_count DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_templates_usage ON popular_templates(current_usage_count DESC);

-- Function to refresh popular templates
CREATE OR REPLACE FUNCTION refresh_popular_templates()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW popular_templates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule to refresh every hour (you can set this up as a cron job)
-- pg_cron.schedule('refresh-popular-templates', '0 * * * *', 'SELECT refresh_popular_templates();');

-- =====================================
-- SEARCH FUNCTIONS
-- =====================================

-- Full text search configuration
CREATE INDEX IF NOT EXISTS idx_invitations_search 
ON public.invitations USING GIN(
    to_tsvector('english', 
        COALESCE(groom_name, '') || ' ' || 
        COALESCE(bride_name, '') || ' ' || 
        COALESCE(venue, '') || ' ' || 
        COALESCE(city, '') || ' ' ||
        COALESCE(custom_message, '')
    )
);

CREATE INDEX IF NOT EXISTS idx_templates_search 
ON public.custom_templates USING GIN(
    to_tsvector('english', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(category, '') || ' ' ||
        array_to_string(tags, ' ')
    )
);

-- Function to search invitations
CREATE OR REPLACE FUNCTION search_invitations(search_query TEXT, user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    groom_name TEXT,
    bride_name TEXT,
    wedding_date DATE,
    venue TEXT,
    city TEXT,
    template_id TEXT,
    is_active BOOLEAN,
    view_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.groom_name,
        i.bride_name,
        i.wedding_date,
        i.venue,
        i.city,
        i.template_id,
        i.is_active,
        i.view_count,
        i.created_at,
        ts_rank(
            to_tsvector('english', 
                COALESCE(i.groom_name, '') || ' ' || 
                COALESCE(i.bride_name, '') || ' ' || 
                COALESCE(i.venue, '') || ' ' || 
                COALESCE(i.city, '') || ' ' ||
                COALESCE(i.custom_message, '')
            ),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM public.invitations i
    WHERE 
        (user_uuid IS NULL OR i.user_id = user_uuid) AND
        (i.is_active = true OR i.user_id = user_uuid) AND
        to_tsvector('english', 
            COALESCE(i.groom_name, '') || ' ' || 
            COALESCE(i.bride_name, '') || ' ' || 
            COALESCE(i.venue, '') || ' ' || 
            COALESCE(i.city, '') || ' ' ||
            COALESCE(i.custom_message, '')
        ) @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- COMPLETION MESSAGE
-- =====================================

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'TaklifNoma database schema created successfully!';
    RAISE NOTICE 'Total tables created: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'profiles', 'invitations', 'custom_templates', 'guests', 'rsvps',
            'admin_users', 'purchase_requests', 'user_subscriptions',
            'invitation_views', 'template_usage', 'cache_entries', 'file_uploads'
        )
    );
    RAISE NOTICE 'Default admin credentials: admin/admin';
    RAISE NOTICE 'Performance optimizations: Indexes, triggers, caching, and analytics enabled';
END $$;
