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

- **مفتاح خاطئ لا يمنع تسجيل الدخول:** `auth/login` و`account/me` لا يفحصان المفتاح، لكن كل ما بعدهما يرجع `403` برد فارغ
  (حتى `notifications/unread-count`). إذا كان المالك يُرفض في كل شيء فالسبب المفتاح، لا الصلاحيات.
- **لا يُكتب المفتاح في Git.** مكانه:
  - محلياً: `VITE_APP_API_KEY` في `.env` (الملف مستثنى من Git؛ `.env.example` هو القالب).
  - على Netlify: Site configuration → Environment variables → `VITE_APP_API_KEY`، ثم إعادة النشر.
- المفتاح يُضمَّن في ملفات الواجهة عند البناء (متغيّرات `VITE_` علنية بطبيعتها)، فهو يحدد التطبيق لا يحمي البيانات وحده:
  الحماية من الـJWT والصلاحيات.
- مفتاح «Menu» (العميل `Portal`) خاص بموقع القائمة العامة، **لا يُستخدم هنا ولا يُخلط** مع مفتاح `Restaurant`.

## العنوان ورمز المطعم

- عند النشر: `https://{slug}.shoof.lambdor.com/admin/`، والـAPI على نفس الأصل `/backend/api/`، ورمز المطعم من اسم المضيف.
- على localhost أو أي مضيف بلا رمز: يُكتب الرمز في شاشة الدخول، فيصبح الـAPI `https://{slug}.{VITE_API_BASE_DOMAIN}/backend/api/`
  للوحة كلها (الطلبات وتجديد التوكن وقناة الإشعارات). النطاق ثابت في الإعدادات والرمز يُتحقق منه، فلا يصل التوكن لخادم آخر.
- بدون `VITE_API_BASE_DOMAIN` يمرّر خادم التطوير `/backend` إلى `VITE_DEV_API_ORIGIN` (ويحذف `/backend` إن كان Backend محلياً).

## ملاحظات

- كل طلب يحمل `Authorization` و`X-Api-Key` و`X-Tenant-Id` (من الـJWT) و`X-Language`.
- الصلاحيات تُقرأ من أدوار المستخدم (`GET roles` ثم `GET roles/{id}`)، وتُفلتر بها القائمة الجانبية والمسارات.
- الهوية: عنابي للشريط الجانبي والأزرار، عاجي للمحتوى، إسبريسو للنص، تيراكوتا للعلامات (انظر `DESIGN.md` و`src/index.css`).
- أصل المكوّنات المشتركة من `shoof-superadmin-dashboard`.
