# تثبيت منصة عُبيدة كتطبيق

المنصة مجهزة بطريقتين: تثبيت مباشر من الرابط (PWA)، وملف Android APK اختياري.

## الطريقة الموصى بها للمستخدمين: رابط واحد على واتساب

1. انشر الموقع على رابط HTTPS ثابت.
2. أرسل للمستخدم رابط المنصة، مثل: `https://YOUR-DOMAIN.com/?install=1`.
3. سيظهر للمستخدم زر **ثبّت منصة عُبيدة** داخل الموقع.

### Android

يفتح المستخدم الرابط في Chrome ثم يضغط **تثبيت**. إذا لم يظهر الزر، يفتح قائمة Chrome (⋮) ويختار **تثبيت التطبيق** أو **إضافة إلى الشاشة الرئيسية**.

### iPhone وiPad

يفتح المستخدم الرابط في Safari، ثم يضغط زر المشاركة، ويختار **إضافة إلى الشاشة الرئيسية**، ثم **إضافة**. لا يمكن تثبيت APK على iPhone؛ النشر كملف iOS يتطلب App Store أو TestFlight وحساب Apple Developer.

### Windows وmacOS

يفتح المستخدم الرابط في Chrome أو Edge ويضغط علامة التثبيت بجوار شريط العنوان. على Safari في الإصدارات الداعمة يمكن اختيار **Add to Dock**.

التطبيق المثبت يعمل في نافذة مستقلة وله أيقونة، ويتحدث تلقائيًا عند نشر نسخة جديدة. الواجهة الأساسية متاحة عند انقطاع الاتصال، لكن تسجيل الدخول والطلاب والمحاضرات والامتحانات تحتاج الإنترنت لأنها بيانات آمنة موجودة على السيرفر.

## إخراج APK للأندرويد

تم تجهيز Capacitor ومشروع Android. نسخة APK هنا تعمل كغلاف آمن للرابط المنشور، لذلك يجب تحديد رابط HTTPS الحقيقي قبل المزامنة.

### المتطلبات

- Android Studio مع Android SDK.
- JDK المتوافق الذي يأتي مع Android Studio.
- رابط إنتاج HTTPS يعمل للمنصة.

### بناء نسخة تجريبية

من PowerShell داخل المشروع:

```powershell
$env:CAPACITOR_SERVER_URL="https://YOUR-DOMAIN.com"
npm run android:sync
npm run android:apk:debug
```

سيظهر الملف عادة في:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

يمكن إرسال `app-debug.apk` عبر واتساب للاختبار فقط. سيحتاج المستخدم إلى السماح بالتثبيت من المصدر الذي فتح منه الملف، وقد يعرض Android تحذيرًا لأن التطبيق خارج Google Play.

### بناء APK من GitHub بدون Android Studio محليًا

يوجد Workflow جاهز في `.github/workflows/android-apk.yml`:

1. افتح تبويب **Actions** في مستودع GitHub.
2. اختر **Build Android APK** ثم **Run workflow**.
3. اكتب رابط المنصة المنشور كاملًا بصيغة HTTPS.
4. بعد انتهاء التشغيل، نزّل Artifact باسم `obaida-platform-android`.
5. فك الملف المضغوط وأرسل `app-debug.apk` عبر واتساب للاختبار.

هذا ملف Debug للتوزيع الخاص. للنشر العام استخدم نسخة Release موقعة أو Google Play.

### فتح المشروع وبناء نسخة Release موقعة

```powershell
$env:CAPACITOR_SERVER_URL="https://YOUR-DOMAIN.com"
npm run android:sync
npm run android:open
```

داخل Android Studio اختر:

`Build > Generate Signed App Bundle or APK > APK`

ثم أنشئ أو اختر مفتاح توقيع `keystore` واحفظه في مكان آمن خارج Git. لا تشارك المفتاح أو كلمات مروره. للنشر العام يفضّل إنشاء Android App Bundle ورفعه إلى Google Play بدل توزيع APK يدويًا.

## عند تغيير الموقع

الـ PWA يتحدث تلقائيًا. أما APK فيحتاج تشغيل `npm run android:sync` مجددًا فقط إذا تغيّر رابط السيرفر، إعدادات Capacitor، الأيقونات الأصلية، أو أي كود Native. تغييرات واجهة الموقع وبياناته تظهر مباشرة لأن الغلاف يفتح نسخة الإنتاج المنشورة.

## ملفات التثبيت المهمة

- `public/manifest.webmanifest`: اسم التطبيق وألوانه وأيقوناته.
- `public/sw.js`: تحديث الأصول الثابتة وصفحة عدم الاتصال بدون تخزين بيانات المستخدم الحساسة.
- `public/offline.html`: شاشة واضحة عند انقطاع الإنترنت.
- `public/icons/`: أيقونات Android وiPhone والديسكتوب.
- `capacitor.config.ts`: إعداد غلاف Android.
- `android/`: مشروع Android Studio.
