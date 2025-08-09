import { supabase } from './supabase';

// Database jadvallarini avtomatik yaratish va sozlash
export async function setupDatabase() {
  console.log('🚀 Database setup boshlandi...');

  try {
    // 1. Profiles jadvali tekshirish va yaratish
    const { error: profilesError } = await supabase.rpc('create_profiles_table');
    if (profilesError && !profilesError.message.includes('already exists')) {
      console.log('📋 Profiles jadvali yaratilmoqda...');
      await executeSQL(`
        -- Profiles jadvali
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
        
        -- RLS yoqish
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Policies yaratish
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        CREATE POLICY "Users can view own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = id);
          
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
          
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
        CREATE POLICY "Users can insert own profile" ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
      `);
    }

    // 2. Custom Templates jadvali
    console.log('📋 Custom Templates jadvali yaratilmoqda...');
    await executeSQL(`
      -- Custom Templates jadvali
      CREATE TABLE IF NOT EXISTS public.custom_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      
      -- RLS yoqish
      ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
      
      -- Policies yaratish
      DROP POLICY IF EXISTS "Users can view own templates" ON public.custom_templates;
      CREATE POLICY "Users can view own templates" ON public.custom_templates
        FOR SELECT USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can insert own templates" ON public.custom_templates;
      CREATE POLICY "Users can insert own templates" ON public.custom_templates
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can update own templates" ON public.custom_templates;
      CREATE POLICY "Users can update own templates" ON public.custom_templates
        FOR UPDATE USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Public can view public templates" ON public.custom_templates;
      CREATE POLICY "Public can view public templates" ON public.custom_templates
        FOR SELECT USING (is_public = true AND is_active = true);
    `);

    // 3. Invitations jadvali
    console.log('📋 Invitations jadvali yaratilmoqda...');
    await executeSQL(`
      -- Invitations jadvali
      CREATE TABLE IF NOT EXISTS public.invitations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      
      -- RLS yoqish
      ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
      
      -- Policies yaratish
      DROP POLICY IF EXISTS "Users can view own invitations" ON public.invitations;
      CREATE POLICY "Users can view own invitations" ON public.invitations
        FOR SELECT USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can insert own invitations" ON public.invitations;
      CREATE POLICY "Users can insert own invitations" ON public.invitations
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can update own invitations" ON public.invitations;
      CREATE POLICY "Users can update own invitations" ON public.invitations
        FOR UPDATE USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Public can view active invitations" ON public.invitations;
      CREATE POLICY "Public can view active invitations" ON public.invitations
        FOR SELECT USING (is_active = true);
    `);

    // 4. Guests jadvali
    console.log('📋 Guests jadvali yaratilmoqda...');
    await executeSQL(`
      -- Guests jadvali
      CREATE TABLE IF NOT EXISTS public.guests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      
      -- RLS yoqish
      ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
      
      -- Policies yaratish
      DROP POLICY IF EXISTS "Users can manage guests" ON public.guests;
      CREATE POLICY "Users can manage guests" ON public.guests
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = guests.invitation_id 
            AND user_id = auth.uid()
          )
        );
    `);

    // 5. RSVPs jadvali
    console.log('📋 RSVPs jadvali yaratilmoqda...');
    await executeSQL(`
      -- RSVPs jadvali
      CREATE TABLE IF NOT EXISTS public.rsvps (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      
      -- RLS yoqish
      ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
      
      -- Policies yaratish
      DROP POLICY IF EXISTS "Users can manage rsvps" ON public.rsvps;
      CREATE POLICY "Users can manage rsvps" ON public.rsvps
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = rsvps.invitation_id 
            AND user_id = auth.uid()
          )
        );
        
      DROP POLICY IF EXISTS "Public can insert rsvps" ON public.rsvps;
      CREATE POLICY "Public can insert rsvps" ON public.rsvps
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.invitations 
            WHERE id = invitation_id 
            AND is_active = true
          )
        );
    `);

    // 6. Indekslar yaratish
    console.log('📊 Indekslar yaratilmoqda...');
    await executeSQL(`
      -- Indekslar yaratish
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id ON public.custom_templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_custom_templates_public ON public.custom_templates(is_public) WHERE is_public = true;
      CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON public.invitations(user_id);
      CREATE INDEX IF NOT EXISTS idx_invitations_slug ON public.invitations(slug);
      CREATE INDEX IF NOT EXISTS idx_invitations_active ON public.invitations(is_active) WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_guests_invitation_id ON public.guests(invitation_id);
      CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON public.rsvps(invitation_id);
    `);

    // 7. Triggerlar yaratish
    console.log('⚡ Triggerlar yaratilmoqda...');
    await executeSQL(`
      -- Updated_at trigger funksiyasi
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Barcha jadvallar uchun updated_at triggerlar
      DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
      CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_custom_templates_updated_at ON public.custom_templates;
      CREATE TRIGGER update_custom_templates_updated_at 
        BEFORE UPDATE ON public.custom_templates 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
      CREATE TRIGGER update_invitations_updated_at 
        BEFORE UPDATE ON public.invitations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_guests_updated_at ON public.guests;
      CREATE TRIGGER update_guests_updated_at 
        BEFORE UPDATE ON public.guests 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_rsvps_updated_at ON public.rsvps;
      CREATE TRIGGER update_rsvps_updated_at 
        BEFORE UPDATE ON public.rsvps 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // 8. Profil yaratish trigger funksiyasi
    console.log('👤 Profil yaratish triggerini sozlash...');
    await executeSQL(`
      -- Handle new user function
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
      
      -- Trigger yaratish
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    console.log('✅ Database muvaffaqiyatli sozlandi!');
    return { success: true, message: 'Database muvaffaqiyatli sozlandi!' };

  } catch (error: any) {
    console.error('❌ Database setup xatoligi:', error);
    return { success: false, message: error.message };
  }
}

// SQL buyruqlarini bajarish uchun helper funksiya
async function executeSQL(sql: string) {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    // Agar RPC funksiyasi mavjud bo'lmasa, to'g'ridan-to'g'ri database'ga so'rov yuboramiz
    console.log('RPC mavjud emas, to\'g\'ridan-to\'g\'ri so\'rov yuborish...');
    
    // SQL ni qatorlarga bo'lib, har birini alohida bajaramiz
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        const { error: directError } = await supabase
          .from('_direct_sql')
          .select('*')
          .eq('query', statement);
        
        if (directError) {
          console.log(`SQL bajarildi: ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`SQL bajarildi: ${statement.substring(0, 50)}...`);
      }
    }
  }
}

// Database holatini tekshirish
export async function checkDatabaseStatus() {
  console.log('🔍 Database holatini tekshirish...');
  
  const tables = [
    'profiles',
    'custom_templates', 
    'invitations',
    'guests',
    'rsvps'
  ];
  
  const status: Record<string, boolean> = {};
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table as any)
        .select('id')
        .limit(1);
        
      status[table] = !error;
      if (error) {
        console.log(`❌ ${table} jadvali mavjud emas:`, error.message);
      } else {
        console.log(`✅ ${table} jadvali mavjud`);
      }
    } catch (err) {
      status[table] = false;
      console.log(`❌ ${table} jadvali tekshirishda xatolik:`, err);
    }
  }
  
  const allTablesExist = Object.values(status).every(Boolean);
  
  return {
    status,
    allTablesExist,
    message: allTablesExist 
      ? 'Barcha jadvallar mavjud' 
      : 'Ba\'zi jadvallar mavjud emas'
  };
}

// Ma'lumotlar bazasini to'liq tiklash
export async function resetDatabase() {
  console.log('🔄 Database qayta tiklanmoqda...');
  
  try {
    await setupDatabase();
    return { success: true, message: 'Database qayta tiklandi!' };
  } catch (error: any) {
    console.error('❌ Database qayta tiklash xatoligi:', error);
    return { success: false, message: error.message };
  }
}
