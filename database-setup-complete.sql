-- TaklifNoma Complete Database Schema v3.0
-- ===============================================
-- Supabase SQL Editor da ishga tushiring
-- Barcha jadvallar, indekslar va triggerlarni yaratadi

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ===============================================
-- CORE TABLES
-- ===============================================

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

-- Custom Templates for user-created designs
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

-- Invitations with enhanced features
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

-- ===============================================
-- ADMIN & BUSINESS TABLES
-- ===============================================

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

-- ===============================================
-- ANALYTICS & TRACKING TABLES
-- ===============================================

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

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

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

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_invitation_views_invitation_id ON public.invitation_views(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_views_created_at ON public.invitation_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON public.template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_custom_template_id ON public.template_usage(custom_template_id);

-- ===============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ===============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_templates_updated_at ON public.custom_templates;
CREATE TRIGGER update_custom_templates_updated_at BEFORE UPDATE ON public.custom_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guests_updated_at ON public.guests;
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rsvps_updated_at ON public.rsvps;
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_requests_updated_at ON public.purchase_requests;
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
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
DROP TRIGGER IF EXISTS increment_template_usage_trigger ON public.invitations;
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
DROP TRIGGER IF EXISTS increment_invitation_views_trigger ON public.invitation_views;
CREATE TRIGGER increment_invitation_views_trigger 
    AFTER INSERT ON public.invitation_views 
    FOR EACH ROW 
    EXECUTE FUNCTION increment_invitation_views();

-- ===============================================
-- ROW LEVEL SECURITY (RLS)
-- ===============================================

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

-- ===============================================
-- RLS POLICIES - PROFILES
-- ===============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ===============================================
-- RLS POLICIES - INVITATIONS
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can insert own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can update own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can delete own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public can view active invitations" ON public.invitations;

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

-- ===============================================
-- RLS POLICIES - CUSTOM TEMPLATES
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Public can view public templates" ON public.custom_templates;

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

-- ===============================================
-- RLS POLICIES - GUESTS & RSVPS
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Public can view guests" ON public.guests;
DROP POLICY IF EXISTS "Users can manage rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Public can insert rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Public can view rsvps" ON public.rsvps;

-- Guests policies
CREATE POLICY "Users can manage guests" ON public.guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view guests" ON public.guests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND is_active = true
        )
    );

-- RSVPs policies
CREATE POLICY "Users can manage rsvps" ON public.rsvps
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

CREATE POLICY "Public can view rsvps" ON public.rsvps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = rsvps.invitation_id 
            AND is_active = true
        )
    );

-- ===============================================
-- RLS POLICIES - ADMIN TABLES
-- ===============================================

-- Admin users (only service role can access for now)
CREATE POLICY "Service role can access admin_users" ON public.admin_users
    FOR ALL TO service_role USING (true);

-- Purchase requests
DROP POLICY IF EXISTS "Public can insert purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Public can view own purchase_requests" ON public.purchase_requests;

CREATE POLICY "Public can insert purchase_requests" ON public.purchase_requests
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can view own purchase_requests" ON public.purchase_requests
    FOR SELECT TO anon, authenticated USING (
        email = COALESCE(auth.jwt()->>'email', email)
    );

-- User subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- ===============================================
-- RLS POLICIES - ANALYTICS
-- ===============================================

-- Invitation views
DROP POLICY IF EXISTS "Public can insert invitation_views" ON public.invitation_views;
DROP POLICY IF EXISTS "Users can view invitation analytics" ON public.invitation_views;

CREATE POLICY "Public can insert invitation_views" ON public.invitation_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view invitation analytics" ON public.invitation_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = invitation_views.invitation_id 
            AND user_id = auth.uid()
        )
    );

-- Template usage analytics
DROP POLICY IF EXISTS "Public can insert template_usage" ON public.template_usage;
DROP POLICY IF EXISTS "Users can view template usage" ON public.template_usage;

CREATE POLICY "Public can insert template_usage" ON public.template_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view template usage" ON public.template_usage
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.custom_templates 
            WHERE id = template_usage.custom_template_id 
            AND user_id = auth.uid()
        )
    );

-- ===============================================
-- INITIAL DATA
-- ===============================================

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

-- Handle new user function for auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- COMPLETION MESSAGE
-- ===============================================

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE '🎉 TaklifNoma database schema muvaffaqiyatli yaratildi!';
    RAISE NOTICE '📊 Jami %s ta jadval yaratildi', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'profiles', 'invitations', 'custom_templates', 'guests', 'rsvps',
            'admin_users', 'purchase_requests', 'user_subscriptions',
            'invitation_views', 'template_usage'
        )
    );
    RAISE NOTICE '🔐 Row Level Security faollashtirildi';
    RAISE NOTICE '⚡ Triggers va indekslar sozlandi';
    RAISE NOTICE '👤 Default admin: admin/admin';
    RAISE NOTICE '✅ Database to''liq tayyor!';
END $$;
