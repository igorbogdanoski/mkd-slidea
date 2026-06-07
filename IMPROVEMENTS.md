# MKD Slidea — Roadmap за Подобрувања

> Генерирано: Јуни 2026 · Базирано на целосна ревизија на кодната база
> Последно ажурирано: Јуни 2026 (по Sprint 2)

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

## 🟡 ВИСОК ПРИОРИТЕТ (Недела 3–4)

### AI-1: Квалитет на генерација
- Regenerate копче (повторна генерација) — 1 ден
- Edit-before-insert preview — 2 дена ← **препорачано**
- Bloom level feedback per generated question — 2 дена
- **Фајлови:** `src/components/AIAssistantModal.jsx`

### PRES-1: Presenter Controls
- Countdown timer overlay — 1 ден
- Presenter notes panel (само за наставник) — 1 ден
- Pause/Resume гласање — 1 ден
- Second screen mode (dual window) — 3 дена
- **Фајлови:** `src/views/Presenter.jsx`

### DASH-1: Dashboard Mobile
- Bottom navigation bar за мобил (Home, Create, Results, Profile) — 2 дена
- **Фајлови:** `src/views/Dashboard.jsx`

### ANALY-1: Time-series Analytics
- Votes-over-time chart по poll — 2 дена
- Споредба на 2 сесии — 3 дена
- AI Insights по завршена сесија — 3 дена
- **Фајлови:** `src/components/AnalyticsTab.jsx`

---

## 🟢 СРЕДЕН ПРИОРИТЕТ (Месец 2)

### ONBOARD-1: Feature Discovery
- Interactive tooltip tour (Shepherd.js или custom) — 2 дена
- Progress checklist во sidebar — 2 дена
- Getting started video (30 сек) — 1 ден (снимање + embed)
- **Фајлови:** `src/views/Onboarding.jsx`, `src/views/Dashboard.jsx`

### I18N-1: Language Persistence
- `localStorage` за јазик — 30 минути ← **веднаш**
- Supabase user preferences за логирани корисници — 1 ден
- **Фајлови:** `src/i18n/index.jsx`

### PRICE-1: Pricing Conversion — ✅ ЗАВРШЕНО
- "Пробај Pro 14 дена бесплатно" CTA badge на врвот + на секој платен план
- Money-back guarantee, trial badge и "Откажи кога сакаш" trust strip
- "Наспроти Mentimeter" comparison table (11 редови)

### PART-1: Participant Offline UX — ✅ ЗАВРШЕНО
- Offline banner (fixed top, red, aria-live="assertive") при загуба на мрежа
- Reconnect toast (emerald, aria-live="polite", 3s auto-dismiss) при реконекција

### TMPL-1: Templates Quality
- 5-star rating + sort by rating — 2 дена
- "Verified by БРО" badge — 1 ден
- **Фајлови:** `src/components/TemplatesTab.jsx`

### A11Y-1: Accessibility — ✅ ДЕЛУМНО ЗАВРШЕНО
- `role="dialog" aria-modal="true"` додадено на сите 13 modal компоненти
- `aria-live="polite" aria-atomic="true"` на vote count displays во Presenter
- Keyboard-navigable charts — останато
- Alt text за Word Cloud — останато

---

## 🔵 НИЗ ПРИОРИТЕТ (Месец 3+)

### PERF-1: Performance
- Image lazy loading (Intersection Observer) — 4 часа
- Tesseract.js dynamic import — 2 часа
- Bundle size audit (Vite visualizer) — 1 час

### SEO-1: SEO Дополнувања
- Breadcrumb schema за Templates и Blog — 2 часа
- Organization schema — 1 час
- FAQ schema на Pricing — 1 час

### SETTINGS-1: Settings
- Notification preferences (email дигест on/off) — 1 ден
- Data export / GDPR download — 2 дена
- Dark mode preference во Supabase — 4 часа

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
| Participant view | ✅ (smoke) | Потребен detаilen тест |
| Presenter view | ✅ (smoke) | Потребен detаilen тест |
| Auth login/logout | ✅ | ✅ |
| **Password reset** | ❌ | Потребен по имплементација |
| Dashboard load | ✅ | ✅ |
| **Create session** | ❌ | Потребен |
| **Add poll/quiz** | ❌ | Потребен |
| **Cast vote** | ❌ | Потребен |
| **View results** | ❌ | Потребен |
| **Rating activity** | ❌ | Потребен по имплементација |
| **Ranking activity** | ❌ | Потребен по имплементација |
| **AI generation** | ❌ | Потребен |
| **Export CSV/PDF** | ❌ | Потребен |
| Mobile viewport | ❌ | Потребен |
| Accessibility audit | ❌ | Потребен |
