import { AlertCircle, Database, CheckCircle2, Copy, Eye, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { setupDatabase, checkDatabaseStatus } from "@/lib/database-setup";

interface DatabaseSetupGuideProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export default function DatabaseSetupGuide({
  isVisible,
  onDismiss,
}: DatabaseSetupGuideProps) {
  const [copied, setCopied] = useState(false);
  const [showFullScript, setShowFullScript] = useState(false);

  if (!isVisible) return null;

  const sqlScript = `-- TaklifNoma Complete Database Schema
-- =====================================
-- Yuklab oling: database-setup-complete.sql
-- Supabase SQL Editor da ishga tushiring

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

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

CREATE TABLE IF NOT EXISTS public.guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    plus_one BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    will_attend BOOLEAN NOT NULL,
    plus_one_attending BOOLEAN,
    message TEXT,
    email TEXT,
    phone TEXT
);

-- Admin tables for admin panel
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
    full_name TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    plan_type TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_name TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'rejected')),
    processed_by UUID REFERENCES public.admin_users(id),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    price DECIMAL(10,2)
);

-- Insert default admin user (admin/admin)
INSERT INTO public.admin_users (username, password_hash, role, full_name, email)
VALUES ('admin', '$2a$10$defaulthashforadmin', 'admin', 'System Administrator', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- Row Level Security yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for invitations
CREATE POLICY "Users can view own invitations" ON public.invitations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations" ON public.invitations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitations" ON public.invitations
    FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access to invitations for viewing (by slug)
CREATE POLICY "Public can view active invitations by slug" ON public.invitations
    FOR SELECT USING (is_active = true);

-- RLS policies for guests
CREATE POLICY "Users can manage guests of own invitations" ON public.guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE id = guests.invitation_id
            AND user_id = auth.uid()
        )
    );

-- Public access to guests for invitation viewing
CREATE POLICY "Public can view guests of active invitations" ON public.guests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE id = guests.invitation_id
            AND is_active = true
        )
    );

-- RLS policies for rsvps
CREATE POLICY "Users can manage rsvps of own invitations" ON public.rsvps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE id = rsvps.invitation_id
            AND user_id = auth.uid()
        )
    );

-- Public access to insert rsvps
CREATE POLICY "Public can insert rsvps" ON public.rsvps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE id = invitation_id
            AND is_active = true
        )
    );

-- Admin table policies (only accessible by admin users or service role)
CREATE POLICY "Admin users can access admin_users" ON public.admin_users
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Public can read purchase_requests" ON public.purchase_requests
    FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert purchase_requests" ON public.purchase_requests
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin users can access purchase_requests" ON public.purchase_requests
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin users can access user_subscriptions" ON public.user_subscriptions
    FOR ALL TO authenticated USING (true);`;

  const copyToClipboard = async () => {
    try {
      // Birinchi Clipboard API dan foydalanishga harakat qilamiz
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(sqlScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback: eski execCommand usuli
      const textArea = document.createElement("textarea");
      textArea.value = sqlScript;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error("execCommand nusxalash muvaffaqiyatsiz");
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Clipboard ga nusxalashda xatolik:", err?.message || err);
      // Foydalanuvchiga manual copy ni taklif qilamiz
      alert(
        "Avtomatik nusxalash ishlamadi. Iltimos, matnni qo'lda belgilab nusxalang.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="card-modern max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                Ma'lumotlar Bazasini Sozlash
              </h2>
              <p className="text-muted-foreground">
                TaklifNoma to'liq ishlashi uchun Supabase ma'lumotlar bazasida
                jadvallar yaratish kerak.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-theme-warning/10 border border-theme-warning/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-theme-warning" />
                <h3 className="font-medium text-foreground">
                  Jadvallar topilmadi
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Supabase ma'lumotlar bazasida kerakli jadvallar mavjud emas.
                Hozir demo rejimida ishlamoqda.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-3">Qadamlar:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      Supabase Dashboard ga kiring
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        supabase.com/dashboard
                      </a>{" "}
                      da loyihangizni oching
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      SQL Editor ga o'ting
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chap menyudan "SQL Editor" ni tanlang
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      SQL kodni nusxalang va ishga tushiring
                    </p>
                    <div className="mt-2">
                      {!showFullScript ? (
                        <div className="bg-muted p-4 rounded-lg text-sm">
                          <p className="text-muted-foreground mb-2">
                            Database yaratish uchun SQL skript tayyorlandi.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setShowFullScript(true)}
                              size="sm"
                              variant="outline"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              SQL Kodni Ko'rish
                            </Button>
                            <Button
                              onClick={copyToClipboard}
                              size="sm"
                              variant="outline"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Nusxalandi!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Kodni Nusxalash
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-muted p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto border">
                            <textarea
                              readOnly
                              value={sqlScript}
                              className="w-full h-40 bg-transparent border-none resize-none outline-none text-xs"
                              onClick={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.select();
                              }}
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={copyToClipboard}
                              size="sm"
                              variant="outline"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Nusxalandi!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Kodni Nusxalash
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => setShowFullScript(false)}
                              size="sm"
                              variant="ghost"
                            >
                              Yashirish
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Matn maydoniga bosib, Ctrl+A va Ctrl+C bilan
                            nusxalashingiz mumkin
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      Sahifani yangilang
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Jadvallar yaratilgandan so'ng sahifani yangilang
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">
                Demo rejimida davom etish
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ma'lumotlar bazasini hozir sozlamagan bo'lsangiz, demo rejimida
                ishlatishda davom etishingiz mumkin. Barcha ma'lumotlar
                vaqtincha saqlanadi.
              </p>
              <Button onClick={onDismiss} variant="outline">
                Demo da Davom Etish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
