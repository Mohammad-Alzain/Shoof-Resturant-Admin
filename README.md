# شوف · Shoof — Restaurant Admin Dashboard

لوحة تحكم المطعم: القائمة (تصنيفات، أصناف، مكوّنات)، استوديو التوليد بالذكاء الاصطناعي (3D وصور)، ملف المطعم، ثيمات القائمة،
الروابط الاجتماعية، الطاولات وQR، الفريق والأدوار. تبنى على `Shoof.Api.Restaurant`: المواصفات في `docs/functional-specs/`
والمرجع الكامل للـAPI في `docs/FE-API-INTEGRATION-GUIDE.md`.

## التشغيل
```
npm ci
cp .env.example .env     # ثم ضع VITE_APP_API_KEY (انظر «مفاتيح الـAPI» أدناه)
npm run dev              # http://localhost:3001/admin/ (المنفذ 3001 حصراً: CORS الخادم يسمح به وحده)
npm run build            # dist/ (الواجهة في dist/admin) يُنشر تحت /admin/ مع web.config
```

## مفاتيح الـAPI (`X-Api-Key`)

كل طلب للـAPI بعد تسجيل الدخول يحمل مفتاح العميل `Restaurant` في `X-Api-Key`، **ولكل بيئة مفتاحها**:

| البيئة | من أين المفتاح |
|---|---|
| Backend محلي (`dotnet run`، `https://localhost:7221`) | مفتاح التطوير `CHANGE_ME_DEV_ONLY_RESTAURANT_API_KEY` من `appsettings.Development.json` |
| الخادم المنشور (`*.shoof.lambdor.com`) | مفتاح الإنتاج من إعدادات الخادم (`ApiKeys:Clients` → `Restaurant`)، يُطلب من فريق الـBackend |

- **المفتاح مطلوب في كل طلب حتى قبل تسجيل الدخول** (`auth/login` و`refresh` و`revoke` وطلبات كلمة المرور). المفتاح الخاطئ يرجع
  `401`/`403` برأس `X-Error-Code: InvalidApiKey`، فتعرض الواجهة رسالة المفتاح بدل «كلمة المرور خاطئة». لا يوجد أي استدعاء بلا اعتماد.
- **لا يُكتب المفتاح في Git.** مكانه:
  - محلياً: `VITE_APP_API_KEY` في `.env` (الملف مستثنى من Git؛ `.env.example` هو القالب).
  - على Netlify: Site configuration → Environment variables → `VITE_APP_API_KEY`، ثم إعادة النشر.
- المفتاح يُضمَّن في ملفات الواجهة عند البناء (متغيّرات `VITE_` علنية بطبيعتها)، فهو يحدد التطبيق لا يحمي البيانات وحده:
  الحماية من الـJWT والصلاحيات.
- مفتاح «Menu» (العميل `Portal`) خاص بموقع القائمة العامة، **لا يُستخدم هنا ولا يُخلط** مع مفتاح `Restaurant`.

## العنوان ورمز المطعم

- عند النشر: `https://{slug}.shoof.lambdor.com/admin/`، والـAPI على نفس الأصل `/backend/api/`، ورمز المطعم من اسم المضيف.
- على localhost أو أي مضيف بلا رمز (ومنه Netlify): يأتي الرمز من رابط الدخول، فيصبح الـAPI `https://{slug}.{VITE_API_BASE_DOMAIN}/backend/api/`
  للوحة كلها (الطلبات وتجديد التوكن وقناة الإشعارات). النطاق ثابت في الإعدادات والرمز يُتحقق منه، فلا يصل التوكن لخادم آخر.
- **Netlify:** `netlify.toml` يضبط `VITE_API_BASE_DOMAIN=shoof.lambdor.com` ولا يمرّر `/backend` (الممرّر لا يصل إلا لمطعم واحد). يلزم أن
  يسمح CORS الخادم بنطاق الموقع، وأن يُضبط مفتاح الإنتاج `VITE_APP_API_KEY` في واجهة Netlify ثم يُعاد النشر. رابط الدخول:
  `https://{الموقع}.netlify.app/admin/login?slug={slug}`.
- **المطعم يأتي من الرابط فقط:** يرسل المطعم لموظفيه رابطاً مثل `https://{التطبيق}/admin/login?slug=pizzahut` (يقبل أيضاً `tenant` و`tenantSlug`
  و`restaurant` و`code`). تقرأ الواجهة الرمز عند الفتح وتحفظه في هذا المتصفح، فيعمل العنوان العادي بعدها. لا يوجد حقل لإدخال الرمز
  ولا عرض له ولا زر لتغييره؛ لمطعم آخر يُفتح رابطه. على نطاق المطعم نفسه (`pizzahut.shoof.lambdor.com`) يؤخذ الرمز من النطاق. إن فُتح
  العنوان بلا رمز ولم يُفتح رابط من قبل، تُعرض رسالة «افتح رابط الدخول» ويُعطَّل الزر. الرمز يُقبل بصيغته الصحيحة فقط (أحرف صغيرة وأرقام
  وشرطات) ويختار مضيفاً تحت النطاق المضبوط في الإعدادات حصراً. في وضع التطوير فقط يقوم `VITE_DEV_SLUG` مقام الرابط.
- بدون `VITE_API_BASE_DOMAIN` يمرّر خادم التطوير `/backend` إلى `VITE_DEV_API_ORIGIN` (ويحذف `/backend` إن كان Backend محلياً).

## ملاحظات

- كل طلب يحمل `Authorization` و`X-Api-Key` و`X-Tenant-Id` (من الـJWT) و`X-Language`.
- الصلاحيات تُقرأ من أدوار المستخدم (`GET roles` ثم `GET roles/{id}`)، وتُفلتر بها القائمة الجانبية والمسارات.
- الهوية: عنابي للشريط الجانبي والأزرار، عاجي للمحتوى، إسبريسو للنص، تيراكوتا للعلامات (انظر `DESIGN.md` و`src/index.css`).
- أصل المكوّنات المشتركة من `shoof-superadmin-dashboard`.
