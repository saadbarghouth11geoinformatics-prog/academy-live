# Academy Live — Deployment Guide

هذا المشروع مبني على **TanStack Start (React + Vite)** ويستخدم **Supabase** (Lovable Cloud) كقاعدة بيانات، مصادقة، تخزين، ودوال خادم.

## 1) المتطلبات

- Node.js 20+ و [Bun](https://bun.sh) (أو npm/pnpm).
- حساب [Supabase](https://supabase.com) — مشروع جديد.
- (اختياري) حساب Google Cloud لإعداد OAuth الخاص بك.

## 2) تشغيل محلي

```bash
bun install
cp .env.example .env       # ثم املأ القيم من Supabase → Project Settings → API
bun run dev
```

الموقع على http://localhost:8080

## 3) إعداد Supabase (مرة واحدة)

1. أنشئ مشروعاً جديداً على supabase.com.
2. **قاعدة البيانات:** افتح Supabase Dashboard → SQL Editor، وشغّل ملفات المهاجرة الموجودة في مجلد `supabase/migrations/` بالترتيب الزمني (الأقدم أولاً).
3. **التخزين:** أنشئ Bucket خاص باسم `exam-pdfs` (Private). سياسات الوصول موجودة داخل المهاجرات.
4. **المصادقة:** فعّل Email + Password، ثم فعّل Google provider (Authentication → Providers → Google). للنشر الإنتاجي أضف بيانات OAuth Client الخاصة بك.
5. **Redirect URLs:** أضف عنوان موقعك (مثل `https://your-app.vercel.app`) في Authentication → URL Configuration → Site URL و Redirect URLs.
6. انسخ من Project Settings → API:
   - `Project URL` → `VITE_SUPABASE_URL` و `SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_PUBLISHABLE_KEY` و `SUPABASE_PUBLISHABLE_KEY`

## 4) النشر على Vercel

1. ادفع المستودع إلى GitHub ثم Import في Vercel.
2. Framework Preset: **Vite** — Build Command: `bun run build` — Output: `dist`.
3. أضف كل المتغيرات من `.env.example` في **Project → Settings → Environment Variables** (لكل من Production و Preview).
4. أضف دومين Vercel إلى Supabase → Authentication → URL Configuration.

## 5) النشر على Netlify

1. New Site from Git → اختر المستودع.
2. Build command: `bun run build` — Publish directory: `dist`.
3. أضف نفس المتغيرات في **Site settings → Environment variables**.
4. أضف دومين Netlify إلى Supabase Redirect URLs.

## 6) الدخول بجوجل

- افتراضياً على Lovable Cloud: يعمل مباشرة بدون إعداد.
- على استضافة خارجية (Vercel/Netlify) بحساب Supabase الخاص بك: يجب إعداد Google OAuth Client في [Google Cloud Console](https://console.cloud.google.com/apis/credentials) ووضع Client ID/Secret في Supabase → Authentication → Providers → Google. Redirect URI المطلوب من Google هو الذي يعرضه Supabase في نفس الصفحة.

## 7) الجلسات وحفظ تسجيل الدخول

تسجيل الدخول محفوظ تلقائياً على نفس المتصفح/الجهاز (Supabase JS مع `persistSession: true` و `autoRefreshToken: true` — راجع `src/integrations/supabase/client.ts`)، لذا لا يحتاج المستخدم لإعادة الدخول في كل مرة.

## 8) حساب المعلم الأول

بعد النشر، افتح `/auth` واضغط "إعداد حساب المعلم لأول مرة" لإنشاء أول حساب Admin/Teacher (يعمل مرة واحدة فقط).