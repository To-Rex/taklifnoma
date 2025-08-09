# 🚀 TaklifNoma Database Setup (O'zbek tilida)

TaklifNoma web ilovasini to'liq ishlashi uchun Supabase ma'lumotlar bazasini sozlash kerak.

## 📋 Tezkor Sozlash

### Usul 1: Avtomatik Sozlash (Tavsiya etiladi)

1. **Web ilovani oching** va /template-builder sahifasiga o'ting
2. **"Avtomatik Database Sozlash"** tugmasini bosing
3. **2-3 soniya kuting** - barcha jadvallar avtomatik yaratiladi
4. **Sahifani yangilang** - endi barcha funksiyalar ishlaydi!

### Usul 2: Qo'lda Sozlash

Agar avtomatik sozlash ishlamasa:

1. **Supabase Dashboard** ga kiring: [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Loyihangizni** tanlang
3. **SQL Editor** ga o'ting (chap menyudan)
4. **Yangi query** yarating
5. **`database-setup-complete.sql`** faylining mazmunini nusxalang
6. **Run** tugmasini bosing

## 🗂 Yaratiluvchi Jadvallar

### Asosiy Jadvallar
- **`profiles`** - Foydalanuvchi profillari
- **`custom_templates`** - Maxsus shablonlar  
- **`invitations`** - Taklifnomalar
- **`guests`** - Mehmonlar ro'yxati
- **`rsvps`** - Javoblar (kelaman/kelmayman)

### Admin Jadvallar
- **`admin_users`** - Admin foydalanuvchilar
- **`purchase_requests`** - Sotib olish so'rovlari
- **`user_subscriptions`** - Foydalanuvchi obunalari

### Analytics Jadvallar
- **`invitation_views`** - Ko'rishlar statistikasi
- **`template_usage`** - Shablon foydalanish statistikasi

## 🔐 Xavfsizlik (RLS)

Barcha jadvallar uchun **Row Level Security** yoqilgan:

- ✅ Foydalanuvchilar faqat o'z ma'lumotlarini ko'radi
- ✅ Ommaviy taklifnomalar hamma tomonidan ko'riladi
- ✅ Adminlar barcha ma'lumotlarga kirish huquqiga ega
- ✅ Anonymous foydalanuvchilar faqat RSVP qo'sha oladi

## ⚡ Avtomatik Funksiyalar

### Triggers
- **`updated_at`** - Har bir o'zgartirishda avtomatik yangilanadi
- **`handle_new_user`** - Yangi foydalanuvchi ro'yxatdan o'tganda profil yaratadi
- **`increment_template_usage`** - Shablon ishlatilganda hisoblagichni oshiradi
- **`increment_invitation_views`** - Ko'rishlar sonini avtomatik hisoblaydi

### Indekslar
Tezkor qidiruv uchun barcha muhim maydonlarga indekslar qo'yilgan:
- Email, slug, created_at bo'yicha tezkor qidiruv
- Foreign key'lar uchun optimizatsiya
- Full-text search uchun tayyorlik

## 🧪 Test Ma'lumotlari

Default admin akkaunt yaratiladi:
- **Username:** `admin`
- **Password:** `admin`
- **Role:** `admin`

## 📊 Ma'lumotlar Migratsiyasi

Agar avvalgi versiyangiz bo'lsa:

1. **Backup oling** (muhim!)
2. **Yangi script** ni ishga tushiring
3. **Ma'lumotlarni** eski jadvallardan yangilariga ko'chiring

## 🔧 Muammolarni Hal Qilish

### ❌ "Table does not exist" xatoligi
```sql
-- Jadval mavjudligini tekshiring
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### ❌ RLS policy xatoligi
```sql
-- RLS holatini tekshiring
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### ❌ Permission denied
1. **Supabase** da **service_role** key ishlatilganligini tekshiring
2. **Environment variables** to'g'ri o'rnatilganligini tasdiqlang

## 📞 Yordam

Qo'shimcha yordam kerak bo'lsa:

- 📧 **Email:** support@taklifnoma.uz
- 📱 **Telegram:** @taklifnoma_support
- 🌐 **Website:** [taklifnoma.uz](https://taklifnoma.uz)

---

## 📝 Qo'shimcha Ma'lumot

### Environment Variables

`.env` faylida quyidagi o'zgaruvchilar bo'lishi kerak:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### API Endpoint'lar

Database sozlangandan keyin quyidagi API'lar ishlaydi:

- **Templates:** `/api/templates`
- **Invitations:** `/api/invitations` 
- **Analytics:** `/api/analytics`
- **Admin:** `/api/admin`

### Performance

Optimal ishlash uchun:

- ✅ Connection pooling yoqilgan
- ✅ Query caching ishlaydi
- ✅ Indekslar optimal joylashgan
- ✅ Real-time subscriptions mavjud

---

**📅 Oxirgi yangilanish:** 2024-yil, 8-dekabr  
**🔄 Schema versiyasi:** v3.0  
**✨ Yangi funksiyalar:** Avtomatik setup, real-time analytics, enhanced security
