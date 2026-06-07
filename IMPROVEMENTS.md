# MKD Slidea — Roadmap за Подобрувања

> Генерирано: Јуни 2026 · Базирано на целосна ревизија на кодната база
> Последно ажурирано: Јуни 2026 (по Sprint 8)

---

## Статус по секција

| Дел | Оценка | Приоритет |
|-----|--------|-----------|
| Routing / Pages | 4.5/5 | — |
| Landing Page | 4/5 | Низок |
| Auth Flow | ✅ 5/5 | ~~КРИТИЧНО~~ — **ЗАВРШЕНО** |
| Dashboard | ✅ 5/5 | ~~Среден~~ — **ЗАВРШЕНО** |
| Session Creation | 4/5 | Среден |
| Presenter View | ✅ 5/5 | ~~Среден~~ — **ЗАВРШЕНО** |
| Participant View | 4/5 | Низок |
| Activity Types | ✅ 5/5 | ~~ВИСОК~~ — **ЗАВРШЕНО** (сите 8 типа) |
| AI Features | ✅ 4.5/5 | ~~Среден~~ — **ЗАВРШЕНО** |
| Analytics | 4/5 | Среден |
| Templates | 4/5 | Низок |
| Settings | 4/5 | Низок |
| Pricing Page | 4/5 | Среден |
| i18n | 4/5 | Низок |
| Mobile | 4/5 | Среден |
| SEO | 4.5/5 | Низок |
| Тестови | ✅ 4/5 | ~~КРИТИЧНО~~ — **ЗАВРШЕНО** (CI + 50+ тестови) |
| Performance | 3.5/5 | Среден |
| Accessibility | 3.5/5 | Среден |
| Onboarding | 4/5 | Низок |

---

## ✅ ЗАВРШЕНО (Sprint 1 + Sprint 2)

### AUTH-1: Password Reset — ✅ ЗАВРШЕНО
- `src/hooks/useAuth.js` — `requestPasswordReset()`, `updatePassword()`
- `src/views/ResetPassword.jsx` — страница со `PASSWORD_RECOVERY` event listener, 8s timeout, strength hints
- `src/components/LoginModal.jsx` — `forgot` mode со "Заборавена лозинка?" линк

### TEST-1: CI/CD + Тест покриеност — ✅ ЗАВРШЕНО
- `.github/workflows/ci.yml` — 5-job pipeline (unit, build, e2e-smoke, e2e-auth, e2e-activities)
- `tests/host.spec.js`, `tests/participant.spec.js` — golden path e2e тестови
- `tests/activity-types.spec.js` — 14 тесови за сите 7 типа активности
- `tests/mobile.spec.js` — 15 тесови за мобил (iPhone 14, iPhone Pro, Android)
- `tests/accessibility.spec.js` — 17 тесови за достапност
- `src/__tests__/i18n.test.js`, `src/__tests__/observability.test.js` — 27 Vitest unit тесови

### ACT-1: Activity Types — ✅ ЗАВРШЕНО (аудитот беше грешен)
- Сите 8 типа се целосно имплементирани: `poll`, `quiz`, `wordcloud`, `open`, `rating`, `ranking`, `scale`, `survey`
- Нема потреба од дополнителна работа

### AI-1: Квалитет на генерација — ✅ ЗАВРШЕНО
- `src/components/AIAssistantModal.jsx` — целосно прецртан
- Regenerate копче со `callGenerate()` shared функција
- `PreviewPanel` компонент — edit question/options/correct-answer пред вметнување
- Ctrl+Enter кратенка, inline error наместо `alert()`
- AnimatePresence slide-in/out меѓу form и preview

### PRES-1: Presenter Controls — ✅ ЗАВРШЕНО
- `src/hooks/useEvent.js` — `toggleLock()`, `startTimer()`, `stopTimer()`
- `src/views/Presenter.jsx` — countdown overlay (последни 5 секунди), pause banner, `L` shortcut
- Timer dropdown: 30s/60s/90s/2min/5min
- `src/components/EventWrapper.jsx` — prop pass-through за новите hooks

### DASH-1: Dashboard Mobile — ✅ ЗАВРШЕНО
- `src/views/Dashboard.jsx` — мобилна bottom nav со 5 ставки
- Desktop sidebar скриен на мобил (`hidden md:block`)
- "Ново" копче со издигнат индиго круг (`-mt-5`), `layoutId` animated indicator

---

## 🔴 КРИТИЧНО (Недела 1–2) — сè завршено!

---

## 🟡 ВИСОК ПРИОРИТЕТ (Недела 3–4) — сè завршено! ✅

### ANALY-1: Time-series Analytics — ✅ ЗАВРШЕНО
- Votes-over-time LineChart по poll — имплементирано
- Споредба на 2 сесии — имплементирано (6 метрики, wins highlighting)
- AI Insights по настан — имплементирано (Gemini анализа: overview, weakPoints, misconceptions, nextLessonPlan, quickActions)

---

## 🟢 СРЕДЕН ПРИОРИТЕТ (Месец 2)

### ONBOARD-1: Feature Discovery — ✅ ЗАВРШЕНО

- Progress checklist во Sidebar — 4 чекори (создај настан, додај прашање, сподели, прегледај резултати)
- Collapsible card со progress bars + dismiss за 7 дена
- Supabase query за реален статус (events + polls count)
- Interactive spotlight tour — имплементиран (`OnboardingTour.jsx`): 5 чекори, SVG spotlight cutout, progress dots, skip/prev/next, `mkd_tour_v1_done` localStorage flag

### I18N-1: Language Persistence — ✅ ЗАВРШЕНО (веќе беше имплементирано)
- `localStorage` persist веќе постои во `src/i18n/index.jsx` — `detect()` + `setLocale()`

### PRICE-1: Pricing Conversion — ✅ ЗАВРШЕНО
- "Пробај Pro 14 дена бесплатно" CTA badge на врвот + на секој платен план
- Money-back guarantee, trial badge и "Откажи кога сакаш" trust strip
- "Наспроти Mentimeter" comparison table (11 редови)

### PART-1: Participant Offline UX — ✅ ЗАВРШЕНО
- Offline banner (fixed top, red, aria-live="assertive") при загуба на мрежа
- Reconnect toast (emerald, aria-live="polite", 3s auto-dismiss) при реконекција

### TMPL-1: Templates Quality — ✅ ЗАВРШЕНО
- "Verified by БРО" badge на сите официјални шаблони (emerald badge)
- StarRating компонент (пресметан од број на анкети, 3–5 ѕвезди)
- Sort dropdown: Верифицирани прво / По оценка / По бр. активности / Азбучен

### A11Y-1: Accessibility — ✅ ЗАВРШЕНО

- `role="dialog" aria-modal="true"` на сите 13 modal компоненти
- `aria-live="polite" aria-atomic="true"` на vote count displays
- `role="img" aria-label="Word cloud — топ зборови: ..."` на SVG
- `role="figure" aria-label="..."` на Area chart и Pie chart во AnalyticsTab

---

## 🔵 НИЗ ПРИОРИТЕТ (Месец 3+)

### PERF-1: Performance — ✅ ЗАВРШЕНО

- `loading="lazy"` додадено на сите 5 img тагови во app
- JSZip dynamic import во ImportPPTXModal (не се вчитува при старт)
- Tesseract.js отстранет од `vite.config.js` manualChunks (не се користи во src/)
- Bundle audit: главен vendor chunk 1.1MB (338kB gzip) — d3+framer+recharts, потребен за функционалност

### SEO-1: SEO Дополнувања — ✅ ЗАВРШЕНО
- BreadcrumbList schema на Blog и PublicTemplates
- FAQPage schema на Pricing (5 прашања)
- Organization schema во Pricing @graph

### SETTINGS-1: Settings — ✅ ЗАВРШЕНО

- Email digest toggle (зачувано во `profiles.email_digest`)
- Data export CSV — настани + гласови (client-side Blob download, 2 фајлови)
- GDPR бришење — mailto линк до support@mismath.net
- Dark mode toggle — `ProfileTab.jsx` (Moon/Sun иконки, `useDarkMode` hook, `mkd_theme` localStorage key)
  - Global fallback CSS во `src/index.css` (покрива сите компоненти без explicit `dark:` variants)
  - Explicit `dark:` classes на: `Dashboard.jsx`, `Sidebar.jsx`, `ProfileTab.jsx` (карти, форми, прекинувачи)

### DRAW-1: Drawing Annotations — ✅ ЗАВРШЕНО (веќе беше имплементирано)

- `src/components/DrawingCanvas.jsx` (203 линии) — пенкало, гума, 5 бои, дебелина, clear all
- Touch/pointer events поддршка
- Вграден во `src/views/Presenter.jsx` — toggle клавиш `D`
- Само HOST го гледа (overlay на презентерскиот екран, не учесниците)

### USAGE-1: Usage Dashboard — ✅ ЗАВРШЕНО

- `src/components/Dashboard/Sidebar.jsx` — `UsageMeter` компонент
- `useEventCount` hook — COUNT(events) за тековниот корисник
- Progress bar со боја: индиго (< 60%) → жолта (60–89%) → црвена (≥ 90%)
- При ≥ 90%: "Скоро го достигнувате лимитот" + inline "Надгради → Pro" копче
- При 100%: "Го достигнавте лимитот!" + upgrade CTA
- Скриен за Pro/Semester/Yearly/Admin (unlimited plans)
- Интегрира со `PLANS.free.maxActiveEvents = 5` од `src/lib/plans.js`

### SHARE-1: Јавни Резултати — ✅ ЗАВРШЕНО

- `src/views/PublicResults.jsx` — јавна страница `/results/:code` (без auth)
- Hero: gradient, event code chip, StatPills (прашања + гласови), Share копче
- PollCard компонент: bar chart, horizontal bars, word cloud, rating stars, open text, ranking
- `navigator.share()` + clipboard fallback; OG meta tags преку `useSEO`
- Footer badge → landing page (органски acquisition loop)
- 404 state за непознат код
- `src/App.jsx` — lazy route `/results/:code` + `isPublicRoute` проширен
- `src/components/Dashboard/PresentationsTab.jsx` — Share копче со `AnimatePresence` copied/idle состојба
- `tests/public-results.spec.js` — 10 e2e тестови (PUB-01–10)

### SCHED-1: Session Scheduling — ✅ ЗАВРШЕНО

- `supabase/migrations/20260607_events_scheduling.sql` — `starts_at TIMESTAMPTZ` + `reminded BOOLEAN` колони + индекс
- `supabase/functions/send-reminders/index.ts` — Deno Edge Function: email reminder 15 мин пред настан преку Resend API
- `src/components/Host/EventSettingsModal.jsx` — "Закажи настан" `datetime-local` picker + "Отстрани распоред" копче
- `src/components/Dashboard/HomeTab.jsx` — "Претстојни настани" секција: настани во следните 7 дена, amber pulse за ≤30 мин
- `src/components/Dashboard/PresentationsTab.jsx` — schedule badge (CalendarClock) на картичките со countdown
- `src/hooks/useDashboardData.js` — `starts_at` додаден во presentations query
- `tests/scheduling.spec.js` — 8 e2e тестови (SCHED-01–08)
- pg_cron: `*/5 * * * *` повикување на Edge Function

### REGION-1: Регионален Push

- Маркетинг за SQ, SR, BG пазари
- Localized landing pages per language

---

## Препорачан редослед на имплементација

```
Недела 1:  Password Reset + CI/CD + Playwright golden path тестови
Недела 2:  Activity Types (Rating, Ranking, Survey) + unit тестови
Недела 3:  AI Regenerate + Presenter Timer/Pause + Dashboard Mobile nav
Недела 4:  Analytics time-series + Onboarding tour
Месец 2:   Language persistence + Pricing CTA + Offline UX + Templates rating
Месец 3:   PWA + Accessibility audit + SEO + Performance
```

---

## Тест покриеност — цел

| Flow | Постои | Цел |
|------|--------|-----|
| Landing renders | ✅ | ✅ |
| Join page | ✅ | ✅ |
| Participant view | ✅ `tests/participant.spec.js` (P-01–15) | ✅ |
| Presenter view | ✅ `tests/host.spec.js` (H-09–12) | ✅ |
| Auth login/logout | ✅ `tests/auth.spec.js` | ✅ |
| Password reset | ✅ `tests/password-reset.spec.js` (PWR-01–07) | ✅ |
| Dashboard load | ✅ `tests/dashboard.spec.js` (DB-01–12) | ✅ |
| Create session | ✅ `tests/host.spec.js` (H-01–02) | ✅ |
| Add poll/quiz | ✅ `tests/host.spec.js` (H-03–04) | ✅ |
| Cast vote | ✅ `tests/participant.spec.js` (P-08) | ✅ |
| View results | ✅ `tests/host.spec.js` (H-08) | ✅ |
| AI generation | ✅ `tests/host.spec.js` (H-06/b/c — modal, mock generate, error) | ✅ |
| Settings / Profile | ✅ `tests/settings.spec.js` (SET-01–10) | ✅ |
| Pricing page | ✅ `tests/pricing.spec.js` (PR-01–10) | ✅ |
| Templates sort | ✅ `tests/templates-sort.spec.js` (TS-01–10) | ✅ |
| Export CSV (button) | ✅ `tests/settings.spec.js` SET-09 | Partial — click only |
| Mobile viewport | ✅ `tests/mobile.spec.js` (15 тести) | ✅ |
| Accessibility audit | ✅ `tests/accessibility.spec.js` (17 тести) | ✅ |
