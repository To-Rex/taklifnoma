/*
# Indexes, Triggers, and Performance Optimization

This migration adds performance optimizations including indexes, 
auto-update triggers, and helper functions.

## Changes
1. **Indexes** - Added indexes on frequently queried columns
2. **Triggers** - Auto-update timestamps on row changes
3. **Helper Functions** - Usage tracking, view counting

## Performance Impact
- Faster queries on filtered and sorted columns
- Automatic timestamp management
- Real-time usage statistics
*/

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