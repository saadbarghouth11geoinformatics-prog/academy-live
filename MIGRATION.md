# 🚚 ترحيل المشروع بين مزوّدي الاستضافة — Academy Live

دليل عملي لنقل Academy Live من استضافة إلى أخرى (مثلاً Lovable → Vercel، أو Vercel → Netlify، أو بين مشروعَي Supabase مختلفَين) مع ضمان **سلامة البيانات (Data Integrity)** قبل وبعد النقل.

> 📖 يعتمد هذا الدليل على `BACKUP.md` و `DEPLOYMENT.md`. اقرأهما أولاً.

---

## 📋 نظرة عامة على المراحل

1. تجهيز بيئة الاستضافة الجديدة
2. تجميد الكتابة على البيئة القديمة (Freeze)
3. أخذ نسخة كاملة من قاعدة البيانات و Storage
4. **فحوصات سلامة البيانات قبل النقل** (Pre-migration checks)
5. الاستعادة على المشروع الجديد
6. **فحوصات سلامة البيانات بعد النقل** (Post-migration checks)
7. تحويل الـ DNS / تحديث متغيرات البيئة
8. التحقق النهائي و rollback plan

---

## 1. تجهيز البيئة الجديدة

- أنشئ مشروع Supabase جديد (نفس المنطقة الجغرافية للأداء الأمثل).
- أنشئ مشروع Vercel/Netlify جديد وربطه بمستودع GitHub.
- انسخ متغيرات البيئة من `.env.example`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- **لا تُشغّل** deployment production قبل إتمام الاستعادة.

---

## 2. تجميد الكتابة (Freeze Window)

قبل أخذ النسخة الاحتياطية بدقائق:

- أعلن للمستخدمين نافذة صيانة (10–30 دقيقة).
- أوقف التسجيل مؤقتاً من **Cloud → Users → Auth Settings → Disable signups**.
- تجنّب رفع امتحانات جديدة أو تسجيل حضور خلال هذه النافذة.

الهدف: ضمان أن ما نسخته = ما يوجد في البيئة القديمة بالضبط.

---

## 3. النسخ الكاملة

### 3.1 قاعدة البيانات

\`\`\`bash
pg_dump \
  -h db.<OLD_REF>.supabase.co -U postgres -d postgres \
  --no-owner --no-privileges --clean --if-exists \
  -F c -f academy-live-\$(date +%Y%m%d-%H%M).dump
\`\`\`

### 3.2 ملفات Storage (bucket: `exam-pdfs`)

راجع `BACKUP.md` قسم Storage — استخدم Supabase CLI أو سكربت التنزيل عبر REST.

### 3.3 إعدادات المصادقة

صدّر يدوياً من **Cloud → Users → Auth Settings**:
- المزوّدون المفعّلون (Google, Email)
- Site URL و Redirect URLs
- إعدادات `auto_confirm_email` و `password_hibp_enabled`

---

## 4. فحوصات سلامة البيانات — قبل النقل

نفّذ الاستعلامات التالية على البيئة **القديمة** واحفظ النتائج في ملف `pre-migration-report.txt`:

\`\`\`sql
-- عدّ الصفوف في الجداول الرئيسية
SELECT 'profiles'          AS t, count(*) FROM public.profiles
UNION ALL SELECT 'user_roles',          count(*) FROM public.user_roles
UNION ALL SELECT 'student_profiles',    count(*) FROM public.student_profiles
UNION ALL SELECT 'teacher_profiles',    count(*) FROM public.teacher_profiles
UNION ALL SELECT 'student_parents',     count(*) FROM public.student_parents
UNION ALL SELECT 'courses',             count(*) FROM public.courses
UNION ALL SELECT 'enrollments',         count(*) FROM public.enrollments
UNION ALL SELECT 'exams',               count(*) FROM public.exams
UNION ALL SELECT 'questions',           count(*) FROM public.questions
UNION ALL SELECT 'question_options',    count(*) FROM public.question_options
UNION ALL SELECT 'exam_attempts',       count(*) FROM public.exam_attempts
UNION ALL SELECT 'attempt_answers',     count(*) FROM public.attempt_answers
UNION ALL SELECT 'attendance_sessions', count(*) FROM public.attendance_sessions
UNION ALL SELECT 'attendance_records',  count(*) FROM public.attendance_records;

-- بصمة (checksum) للبيانات الحرجة
SELECT md5(string_agg(id::text || email, ',' ORDER BY id)) AS profiles_hash FROM public.profiles;
SELECT md5(string_agg(id::text || score::text, ',' ORDER BY id)) AS attempts_hash FROM public.exam_attempts WHERE score IS NOT NULL;

-- أحدث تعديل لكل جدول
SELECT max(created_at) FROM public.exam_attempts;
SELECT max(created_at) FROM public.attendance_records;

-- عدد المستخدمين في auth
SELECT count(*) FROM auth.users;

-- عدد ملفات Storage
SELECT count(*), sum((metadata->>'size')::bigint) FROM storage.objects WHERE bucket_id = 'exam-pdfs';
\`\`\`

احتفظ بهذا التقرير — سنقارنه لاحقاً.

---

## 5. الاستعادة على المشروع الجديد

### 5.1 Schema + Data

\`\`\`bash
pg_restore \
  -h db.<NEW_REF>.supabase.co -U postgres -d postgres \
  --no-owner --no-privileges --clean --if-exists \
  academy-live-YYYYMMDD-HHMM.dump
\`\`\`

### 5.2 Storage

ارفع محتويات مجلد `exam-pdfs/` المحلي إلى المشروع الجديد (راجع `BACKUP.md`). تأكد أن الـ bucket private وأن سياسات RLS مطابقة.

### 5.3 Auth Settings

كرّر نفس الإعدادات من الخطوة 3.3 في المشروع الجديد. **مهم:** حدّث `Site URL` و `Redirect URLs` لتشير إلى الدومين الجديد، وإلا سيفشل Google OAuth.

---

## 6. فحوصات سلامة البيانات — بعد النقل

نفّذ **نفس** استعلامات القسم 4 على البيئة **الجديدة** واحفظ في `post-migration-report.txt`، ثم قارن:

\`\`\`bash
diff pre-migration-report.txt post-migration-report.txt
\`\`\`

معايير النجاح:

| المعيار | المتوقع |
|---|---|
| عدد الصفوف في كل جدول | مطابق 100% |
| `profiles_hash` و `attempts_hash` | مطابق تماماً |
| عدد `auth.users` | مطابق |
| عدد ملفات Storage والحجم الكلي | مطابق |
| RLS مفعّل على كل الجداول | ✅ (شغّل linter) |
| `teacher_exists()` يُرجع `true` | ✅ |

### فحوصات وظيفية إضافية

- سجّل دخول بحساب المعلم — تظهر لوحته وقائمة الطلاب الكاملة.
- سجّل دخول بحساب طالب — تظهر امتحاناته السابقة بنفس الدرجات.
- افتح امتحان PDF قديم — يجب أن يُحمَّل الملف بدون 404 (يؤكد سلامة Storage + Signed URLs).
- افتح تفاصيل طالب من لوحة المعلم — يظهر سجل الحضور كاملاً.

### فحص RLS

\`\`\`sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- يجب أن يكون الناتج فارغاً
\`\`\`

---

## 7. تحويل الدومين ومتغيرات البيئة

1. حدّث `.env` في Vercel/Netlify بقيم المشروع Supabase الجديد.
2. أعِد النشر (Redeploy).
3. في Supabase الجديد → **Auth → URL Configuration**: أضف الدومين الجديد إلى Redirect URLs.
4. في Google Cloud Console (إن كنت تستخدم OAuth بمفاتيحك): أضف الدومين الجديد إلى Authorized redirect URIs.
5. حدّث DNS ليشير للدومين الجديد. استخدم TTL منخفض (300s) قبل النقل بيوم.

---

## 8. Rollback Plan

إن فشل أي فحص من القسم 6:

1. **لا تحوّل الـ DNS** — أبقِ الترافيك على البيئة القديمة.
2. أعِد فتح التسجيل على البيئة القديمة.
3. احذف بيانات المشروع الجديد وأعِد الاستعادة من نفس الـ dump.
4. إن تعذّر الحل خلال نافذة الصيانة: أعلن التأجيل، وابقَ على البيئة القديمة.

احتفظ بملف الـ dump ومجلد Storage لمدة **30 يوماً على الأقل** بعد نجاح النقل.

---

## ✅ Checklist سريعة

- [ ] بيئة جديدة جاهزة (Supabase + Vercel/Netlify)
- [ ] Freeze window معلَنة
- [ ] `pg_dump` تم بنجاح
- [ ] Storage تم نسخه كاملاً
- [ ] `pre-migration-report.txt` محفوظ
- [ ] `pg_restore` بدون أخطاء
- [ ] Storage مرفوع + سياسات RLS مضبوطة
- [ ] Auth Settings + Redirect URLs محدّثة
- [ ] `post-migration-report.txt` = `pre-migration-report.txt`
- [ ] الفحوصات الوظيفية نجحت
- [ ] DNS محوّل
- [ ] نسخة احتياطية محفوظة لـ 30 يوم
