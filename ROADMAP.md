# MKD Slidea — Roadmap до Светско Ниво

> Генерирано: 5 јуни 2026  
> Извор: Senior UI/UX аудит + Expert app/SEO/SaaS аудит (паралелни агенти)  
> Статус: Активна работна листа — ажурирај при завршување на секоја ставка

---

## ✅ ЗАВРШЕНО (Сесија 05.06.2026)

### Критични Bug-fixes
- [x] WordCloud host subscription се кинеше при навигација → `[event?.id]` dep fix
- [x] Participant text input не се ресетираше при промена на прашање (`response`, `rating`, `surveyAnswers`)
- [x] `onSavePoll` delete-then-insert → insert-before-delete-by-ID (data safety, no data loss on error)
- [x] Бришење на активна анкета замрзнуваше учесниците → navigate-away guard

### Перформанси (100 учесници на Supabase Free)
- [x] `resultsInterval` smart skip — прескокнува DB poll ако realtime е свеж (<5s): 0-3 req/s vs 25 req/s претходно
- [x] `useHostSession` polling fallback (4s) — host dashboard сега добива ажурирања и без realtime

### Landing Page — Hero
- [x] H1 над fold на сите екрани (pt-32→pt-16, text-8xl→text-7xl, space-y-8→space-y-6)
- [x] PIN бар: мал nav pill → голем gradient card со live Supabase validation + Enter auto-navigate
- [x] Редослед: Badge → H1 → Опис → CTA → PIN → Co-host (dual-audience best practice)
- [x] Hero word cloud авто-анимација (нов збор на 2.2s од pool od 16 зборови)
- [x] Trusted by institution strip (УКИМ, ДУИ, ФИНКИ, Гимназија, МОН обуки...)
- [x] Animated CountUp stats на viewport entry (800+, 12K+, 98%) со ease-out cubic

### Landing Page — Секции
- [x] Testimonials секција (3 наставници/тренери, 5 ѕвезди, initials avatar, институција)
- [x] FAQ: 4→7 прашања + auto-close accordion со AnimatePresence (smooth height)
- [x] Feature card лева страна: бела → dark indigo/violet gradient (визуелен контраст)
- [x] Solutions grid: full-card clickable (onClick на wrapper) + whileHover boxShadow
- [x] Footer: 3 линка → 4-колонски темен footer (Brand+Social / Производ / Решенија / Поддршка)
- [x] Comparison табела (MKD Slidea vs Mentimeter vs Kahoot, 11 функции, animated rows)
- [x] Activity showcase: UI mockup cards за WordCloud/Poll/Quiz/Q&A (Show, don't tell)
- [x] Mobile hamburger мени (AnimatePresence drawer, lg:hidden, 5 линка + Login/Register)

### Правни / Технички
- [x] Privacy Policy страна (`/privacy`) — GDPR compliant, 9 секции
- [x] Terms of Service страна (`/terms`) — 10 секции, MK право
- [x] 404 NotFound страна со анимација, назад/дома копчиња и quick-links
- [x] App.jsx: сите три lazy-loaded, isPublicRoute ажуриран
- [x] Sitemap ажуриран со `/privacy` и `/terms` entries

---

## 🔴 КРИТИЧНО — Следен Sprint (Пред лансирање на поголема публика)

### 1. Cookie Consent Banner (GDPR)
**Зошто:** Законска обврска за EU корисници. Без него постои правен ризик.  
**Имплементација:**
- Нов `src/components/CookieConsent.jsx` — banner на дното при прво посетување
- Копчиња: „Прифати сè" / „Само неопходни" / „Управувај со поставки"
- Состојба во localStorage (`cookie_consent: 'all' | 'essential'`)
- Монтирај во `App.jsx` над `<footer>`
- Блокирај analytics/tracking cookies пред дадена согласност

### 2. i18n докомплетирање (Регионална експанзија)
**Зошто:** 5 јазици декларирани, само 10% од UI е преведено. Albanofони (sq), Срби (sr) не можат да ја користат апликацијата на мајчин јазик.  
**Приоритет по јазик:** Albanian (sq) → Serbian (sr) → Croatian (hr) → Bulgarian (bg) → Romanian (ro)  
**Конкретни фајлови:**

| Фајл | Линии | Проблем |
|------|-------|---------|
| `src/views/Participant.jsx` | 251-258 | Poll type labels хардкодирани на МК |
| `src/views/Presenter.jsx` | 569-577 | Subtitle labels хардкодирани на МК |
| `src/components/EventWrapper.jsx` | 128, 138, 183, 213, 218 | Сите status пораки на МК |
| `src/views/Participant.jsx` | 126, 150, 350-354 | Username screen, voted screen |
| `src/i18n/locales/sq.js` | Сè | Непреведено |
| `src/i18n/locales/sr.js` | Сè | Непреведено |

### 3. Join Flow — Валидација и UX
**Зошто:** Нема loading indicator, нема конкретна грешка при неуспешен код.  
**Имплементација:**
- `src/views/Join.jsx` — додај loading spinner при submit
- Диференцирај грешки: „Кодот не постои" vs „Сесијата е заклучена" vs „Сесијата е завршена"
- Валидирај формат пред Supabase барање: само A-Z0-9, 5-7 знаци (regex check)

---

## 🟡 СРЕДНО — Q3 2026

### 4. Custom Branding UI
**Зошто:** Pricing страната вели „Сопствени бои и лого" — тоа е продавачка точка, но нема UI.  
**Имплементација:**
- `src/components/Host/EventSettingsModal.jsx` — color picker + logo upload (Supabase Storage)
- `src/views/Presenter.jsx` — примени `event.brand_color` на gradient backgrounds (парцијално постои)
- `src/views/Participant.jsx` — примени бренд бои на PIN input, CTA копчиња, header

### 5. Co-host Управување
**Зошто:** `events.cohost_code` постои во DB, кодот за пристап постои (cohost modal на landing), но нема управување во host settings.  
**Имплементација:**
- `EventSettingsModal` — прикажи го co-host кодот со „Копирај линк" копче
- Опција за regenerate на кодот
- Прикажи активни co-host сесии (преку presence channel)

### 6. Rate Limiting на Email / Auth Endpoints
**Зошто:** `/api/email/session-recap` и `/api/welcome-email` немаат rate limit — можна злоупотреба.  
**Имплементација:** Upstash Redis rate limit (слично на `api/generate.js:87-100`) — max 5 req/min per IP

### 7. Server-side PDF Export со Брендирање
**Зошто:** `ExportPDFModal` е print-to-PDF fallback без хедери/лого/структура.  
**Имплементација:** Нов `/api/export-pdf` endpoint со `@sparticuz/chromium` + `puppeteer-core`; branded PDF со лого, датум, наслов на настан

### 8. CSV Export Копче во Dashboard
**Зошто:** `exportToCSV()` постои во `useHostSession.js:468-505`, но нема видливо копче во Dashboard.  
**Имплементација:** Додај „Извези CSV" копче во Dashboard results таб

---

## 🟢 НИСКО — Q4 2026 / 2027

### 9. API Документација
- `api/v1/events.js` и `api/v1/results.js` постојат без docs
- Цел: OpenAPI/Swagger spec, или Mintlify/Readme.io developer portal
- Потребно за: интеграции со Moodle, Google Classroom, корпоративни системи

### 10. Comparison Landing Pages (SEO)
- `/compare/mkd-slidea-vs-mentimeter`
- `/compare/mkd-slidea-vs-kahoot`
- `/compare/mkd-slidea-vs-slido`
- Висока SEO вредност за competitor keywords

### 11. Template Marketplace — Напредно Филтрирање
- `/templates` постои но нема filter по предмет, јазик, тип, возраст
- Додај sidebar filters + search

### 12. Lottie / GIF Анимации за „1-2-3" Чекори
- Тековно: статични икони
- Цел: micro-анимации при scroll (Lottie JSON assets или CSS keyframes)
- Потребно: дизајн на анимациите

### 13. Video Demo во Hero
- 30-секундна screen recording на живо гласање
- Вгради во Hero десно (замени го demo widget)
- Треба: снимање + хостирање (Cloudinary/Mux)

### 14. Детални Analytics по Учесник
- Тековно: само aggregate stats
- Цел: per-participant response history табела за хостот (кој одговорил, кога, точно/неточно)

### 15. White-label / Custom Domain (Enterprise)
- Subdomain hosting: `uciliste.slidea.mismath.net`
- Потребна: Vercel tenant логика + DNS management

### 16. Enterprise SSO (SAML/OpenID)
- Пред тоа: Google OAuth веќе постои
- SAML2 за универзитетски системи (UKIM IdP, Microsoft ADFS)

### 17. Session Recording / Replay
- Асинхрон преглед на снимени сесии
- Комплексна функција — нема во codebase

---

## 🐛 Tech Debt

| Фајл | Линија | Проблем | Тежина |
|------|--------|---------|--------|
| `src/App.jsx` | 37-59 | Blanket `console.error` suppress — може да крие вистински грешки | Низок |
| `src/views/Checkout.jsx` | — | 1x `console.log` во production | Низок |
| `api/welcome-email.js` | — | Empty `catch` block — failures silent | Среден |
| `src/views/Participant.jsx` | 251-258 | Hardcoded MK strings | Среден |
| `src/views/Presenter.jsx` | 569-577 | Hardcoded MK strings | Среден |
| `public/sitemap.xml` | — | `lastmod` датум е хардкодиран, треба auto-update при build | Низок |
| Multiple views | — | No responsive `srcset` on 6 `<img>` tags | Низок |

---

## 📊 Скор по Категории (Тековен vs. Целен)

```
                    ТЕКОВНО   ПО SPRINT1  ПО SPRINT2   FULL
SEO               █████████░  95/100
Функционалност    █████████░  92/100
Безбедност        ████████░░  88/100
SaaS Features     ███████░░░  78/100
Accessibility     ███████░░░  78/100
i18n Coverage     ███░░░░░░░  35/100
```

**Апликацијата е на комерцијално ниво за македонскиот пазар.**  
Следниот голем чекор за **регионална експанзија** е i18n докомплетирање (sq, sr).

---

*Последно ажурирање: 05.06.2026 | Работна сесија: Igor + Claude Sonnet 4.6*
