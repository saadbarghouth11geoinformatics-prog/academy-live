# 🗄️ النسخ الاحتياطي واستعادة قاعدة البيانات — Academy Live

هذا الدليل يشرح بالتفصيل كيفية أخذ نسخة احتياطية كاملة من قاعدة بيانات المشروع (Supabase / Lovable Cloud) واستعادتها لاحقاً — سواء عند الانتقال لاستضافة جديدة، أو إعادة النشر، أو للحفاظ على بياناتك بشكل دوري.

> ⚠️ ملاحظة مهمة: قاعدة البيانات هي Postgres مُدارة عبر Supabase. النسخ الاحتياطي يشمل: **الجداول + البيانات + الـ RLS Policies + الـ Functions + Storage (ملفات PDF للامتحانات)**.

---

## 📋 الفهرس

1. النسخ الاحتياطي التلقائي من Supabase
2. نسخ احتياطي يدوي كامل عبر `pg_dump`
3. نسخ احتياطي لملفات Storage (PDF)
4. استعادة قاعدة البيانات على مشروع جديد
5. استعادة ملفات Storage
6. النقل الكامل إلى استضافة جديدة
7. أتمتة النسخ الاحتياطي الدوري

---

## 1. النسخ الاحتياطي التلقائي

Supabase تعمل نسخة احتياطية يومية تلقائياً لمشاريع Pro plan (يتم الاحتفاظ بها لمدة 7 أيام). للمشاريع المجانية: يجب عمل النسخ يدوياً.

**من داخل Lovable:** افتح **Cloud → Advanced settings → Export data** لتنزيل نسخة CSV من كل الجداول.

---

## 2. النسخ الاحتياطي اليدوي (pg_dump)

### المتطلبات

تثبيت PostgreSQL client على جهازك:

```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# macOS
brew install postgresql

# Windows: نزّل من https://www.postgresql.org/download/windows/
```

### الحصول على بيانات الاتصال

من Supabase Dashboard → **Project Settings → Database → Connection string** انسخ:
- `Host` مثل `db.<PROJECT_REF>.supabase.co`
- `Database name` (عادة `postgres`)
- `Port` (5432)
- `User` (postgres)
- `Password` (كلمة سر قاعدة البيانات)

### تنفيذ النسخ الاحتياطي الكامل (Schema + Data + RLS + Functions)

```bash
pg_dump \
  --host=db.<PROJECT_REF>.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema=public \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file=academy-live-backup-$(date +%Y%m%d-%H%M%S).sql
```

### نسخة البيانات فقط

```bash
pg_dump --host=db.<PROJECT_REF>.supabase.co --username=postgres \
  --dbname=postgres --schema=public --data-only \
  --file=academy-live-data-only.sql
```

### نسخة مضغوطة (موصى بها للنسخ الدورية)

```bash
pg_dump --host=db.<PROJECT_REF>.supabase.co --username=postgres \
  --dbname=postgres --schema=public --format=custom \
  --file=academy-live-backup.dump
```

---

## 3. نسخ احتياطي لملفات Storage

ملفات الامتحانات PDF مخزنة في bucket اسمه `exam-pdfs`.

### الطريقة 1: Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
supabase storage download --recursive exam-pdfs ./backup-storage/
```

### الطريقة 2: سكربت Node.js

أنشئ `backup-storage.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://<PROJECT_REF>.supabase.co',
  '<SERVICE_ROLE_KEY>' // ليس anon key
);

const BUCKET = 'exam-pdfs';
const OUTPUT_DIR = './backup-storage';

async function downloadAll(prefix = '') {
  const { data: files } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  for (const file of files || []) {
    const filePath = prefix ? `${prefix}/${file.name}` : file.name;
    if (file.id === null) {
      await downloadAll(filePath);
    } else {
      const { data } = await supabase.storage.from(BUCKET).download(filePath);
      const localPath = path.join(OUTPUT_DIR, filePath);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, Buffer.from(await data.arrayBuffer()));
      console.log('✓', filePath);
    }
  }
}

downloadAll();
```

```bash
node backup-storage.mjs
```

---

## 4. استعادة قاعدة البيانات

### على مشروع Supabase جديد

1. أنشئ مشروع Supabase جديد من [supabase.com](https://supabase.com).
2. احصل على connection string.
3. نفّذ الاستعادة:

**لملف `.sql`:**
```bash
psql --host=db.<NEW_PROJECT_REF>.supabase.co --username=postgres \
  --dbname=postgres --file=academy-live-backup-YYYYMMDD.sql
```

**لملف `.dump` المضغوط:**
```bash
pg_restore --host=db.<NEW_PROJECT_REF>.supabase.co --username=postgres \
  --dbname=postgres --no-owner --no-privileges --clean --if-exists \
  academy-live-backup.dump
```

### إعادة إنشاء Schema من migrations (بدون بيانات)

الملفات موجودة في `supabase/migrations/`:

```bash
supabase link --project-ref <NEW_PROJECT_REF>
supabase db push
```

---

## 5. استعادة ملفات Storage

```bash
supabase storage upload --recursive ./backup-storage/ exam-pdfs
```

أو استخدم سكربت Node.js مع `.upload()` بدل `.download()`.

**⚠️ مهم:** تأكد أن bucket `exam-pdfs` موجود و private، وأن RLS policies مطبقة (تُنشأ تلقائياً من migrations).

---

## 6. النقل الكامل إلى استضافة جديدة

### الخطوات بالترتيب

1. **خذ نسخة احتياطية كاملة** (خطوات 2 + 3).
2. **أنشئ مشروع Supabase جديد** واحفظ:
   - `PROJECT_URL`
   - `ANON_KEY` (publishable)
   - `SERVICE_ROLE_KEY` (سري)
3. **استعد قاعدة البيانات** (خطوة 4).
4. **استعد ملفات Storage** (خطوة 5).
5. **حدّث متغيرات البيئة** في `.env` أو Vercel/Netlify Dashboard:
   ```
   VITE_SUPABASE_URL=https://<NEW_PROJECT_REF>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<NEW_ANON_KEY>
   VITE_SUPABASE_PROJECT_ID=<NEW_PROJECT_REF>
   ```
6. **أعد تفعيل Google OAuth** إذا كنت تستخدمه:
   - Supabase → Authentication → Providers → Google
   - أضف Client ID و Secret من Google Cloud Console
   - أضف redirect URL الجديد في Google Console:
     `https://<NEW_PROJECT_REF>.supabase.co/auth/v1/callback`
7. **أعد نشر التطبيق** (redeploy).
8. **اختبر:** سجّل الدخول، افتح الامتحانات، ارفع PDF تجريبي، تأكد من ظهور الطلاب والحضور.

---

## 7. أتمتة النسخ الاحتياطي الدوري

### سكربت Bash يومي (Linux/macOS)

أنشئ `backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="$HOME/academy-backups"
DATE=$(date +%Y%m%d-%H%M%S)
PROJECT_REF="<YOUR_PROJECT_REF>"
export PGPASSWORD="<YOUR_DB_PASSWORD>"

mkdir -p "$BACKUP_DIR"

pg_dump --host=db.$PROJECT_REF.supabase.co --username=postgres \
  --dbname=postgres --schema=public --format=custom \
  --file="$BACKUP_DIR/academy-$DATE.dump"

# احتفظ بآخر 30 نسخة
ls -tp "$BACKUP_DIR"/*.dump | tail -n +31 | xargs -I {} rm -- {} 2>/dev/null || true

echo "✓ Backup completed: academy-$DATE.dump"
```

```bash
chmod +x backup.sh

# جدولة يومية عبر cron (كل يوم 3 صباحاً)
crontab -e
# أضف:
0 3 * * * /path/to/backup.sh >> /var/log/academy-backup.log 2>&1
```

### رفع النسخ إلى تخزين بعيد

```bash
# إلى AWS S3
aws s3 cp "$BACKUP_DIR/academy-$DATE.dump" s3://my-bucket/academy-backups/

# إلى Google Drive عبر rclone
rclone copy "$BACKUP_DIR/academy-$DATE.dump" gdrive:academy-backups/
```

---

## ✅ قائمة تحقق قبل تغيير الاستضافة

- [ ] أخذت نسخة `pg_dump` كاملة (Schema + Data).
- [ ] نزّلت كل ملفات `exam-pdfs` bucket.
- [ ] احتفظت بنسخة من `supabase/migrations/` (موجودة في الريبو).
- [ ] سجّلت `PROJECT_REF` و `ANON_KEY` القديم كمرجع.
- [ ] لديك `.env.example` جاهز للاستضافة الجديدة.
- [ ] اختبرت الاستعادة على مشروع Supabase تجريبي قبل الانتقال الفعلي.
- [ ] حدّثت Google OAuth redirect URLs.
- [ ] تأكدت من ظهور بيانات الطلاب والامتحانات والحضور بعد الاستعادة.

---

## 📞 موارد إضافية

- [Supabase Backups Docs](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL pg_dump Docs](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase CLI Storage](https://supabase.com/docs/reference/cli/supabase-storage)

آخر تحديث: 2026
