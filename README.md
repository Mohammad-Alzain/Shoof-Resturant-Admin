# شوف · Shoof — Restaurant Admin Dashboard

لوحة تحكم المطعم: القائمة (تصنيفات، أصناف، مكوّنات)، استوديو التوليد بالذكاء الاصطناعي (3D وصور)، ملف المطعم، ثيمات القائمة،
الروابط الاجتماعية، الطاولات وQR، الفريق والأدوار. تبنى على `EMenu.Api.Restaurant` (انظر `docs/`).

## التشغيل
```
npm ci
cp .env.example .env     # VITE_APP_API_KEY (مفتاح العميل Restaurant)، VITE_DEV_API_ORIGIN، VITE_DEV_SLUG
npm run dev              # http://localhost:3001/admin/  (يمرّر /backend إلى VITE_DEV_API_ORIGIN)
npm run build            # dist/ يُنشر تحت /admin/ مع web.config
```

- يُخدَم تحت `/admin/` على `https://{slug}.{BaseDomain}/admin/`، والـAPI على نفس الأصل `/backend/api/`.
- رمز المطعم (slug) من أول جزء في اسم المضيف، وإلا يُطلب في شاشة الدخول.
- كل طلب يحمل `Authorization` و`X-Api-Key` و`X-Tenant-Id` (من الـJWT) و`X-Language`.
- الهوية: تيراكوتا يقود، شريط جانبي إسبريسو، عنابي كصوت ثانٍ (انظر `src/index.css`).
- أصل المكوّنات المشتركة من `shoof-superadmin-dashboard`.
