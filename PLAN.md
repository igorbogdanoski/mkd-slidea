# MKD Slidea — Акционен план за светско ниво
**Цел:** Macedonia-first Mentimeter — подобро, поевтино, педагошки супериорно  
**Средина:** React + Vite + Supabase + Vercel Edge  
**Ревизија:** Април 2026 · Expert review интегриран

---

## ✅ SPRINT 0 — Завршено (9 Апр 2026)

| | Промена | Фајл |
|---|---------|------|
| ✅ | Free план: **200 учесници** (беше 50) | `src/lib/plans.js` |
| ✅ | Нови планови: monthly/quarterly/semester/yearly | `src/lib/plans.js` |
| ✅ | `isPro()` ги препознава сите платени планови | `src/lib/plans.js` |
| ✅ | Pricing страница: 200 учесници на Free | `src/views/Pricing.jsx` |
| ✅ | Gemini моделите: 1.5 → **2.0-flash / 2.5-pro** | `api/generate.js` |
| ✅ | `crypto.getRandomValues()` наместо `Math.random()` за event кодови | `Host.jsx`, `Dashboard.jsx` |

---

## 🔴 ФАЗА А — Безбедност (КРИТИЧНО пред промовирање)

### А.1 — Admin detection → server-side
```
useAuth.js: избриши го ADMIN_EMAILS array
Supabase: Authentication → Custom Access Token Hook → role: 'admin' во JWT
```

### А.2 — Row Level Security
```sql
-- Events: само читање јавно, пишување само за сопственикот
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON events FOR SELECT USING (true);
CREATE POLICY "owner_all" ON events FOR ALL USING (auth.uid() = user_id);

-- Polls, Options, Questions: исто
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_polls" ON polls FOR SELECT USING (true);
CREATE POLICY "owner_polls" ON polls FOR ALL USING (
  event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
```

### А.3 — Votes табела (Analytics е broken без неа)
```sql
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, session_id)
);
CREATE INDEX idx_votes_poll ON votes(poll_id);
CREATE INDEX idx_votes_session ON votes(session_id);
CREATE INDEX idx_polls_event ON polls(event_id);
CREATE INDEX idx_options_poll ON options(poll_id);
```

### А.4 — Persistent rate limiting
✅ Имплементирано (`api/generate.js`): distributed limiter со KV + fallback map и `Retry-After` headers

---

## 🟡 ФАЗА Б — Квалитет (2 недели)

- [x] Live counter на Presenter: "23/30 одговориле"
- [x] Confetti при крај на квиз (canvas-confetti веќе во deps!)
- [x] PWA manifest — учениците може да зачуваат на home screen
- [x] Onboarding guided тур за нови наставници
- [x] survey_responses табела за Формулар тип
- [x] Подобрен PDF извоз layout

---

## 🟢 ФАЗА В — Светски функции (1 месец)

### В.1 — Асинхрон/Homework режим
- Настанот останува отворен 24-48h без наставникот онлајн
- **Ова Mentimeter го нема на Free план**

✅ MVP имплементација: `events.async_mode` + `events.async_deadline`, Host toggle и participant deadline gate/banner

### В.2 — AI Insights по часот
- По завршување → AI анализира: „42% погрешиле на пр.3 — потребно повторување"
- Генерира план за следниот час базиран на слабите точки
- **Ова не постои кај ниту една конкурентна алатка**

✅ MVP имплементација: `api/insights.js` + Host `AIInsightsModal` (резиме, слаби точки, план за следен час, брзи акции)

### В.3 — Шаблон библиотека (crowd-sourced)
- Наставниците споделуваат свои настани
- Поврзано со македонскиот курикулум (предмет + одделение + тема)

✅ MVP имплементација: `community_templates` (schema + RLS), Host publish flow (`PublishTemplateModal`), Dashboard community listing + one-click use

### В.4 — Integrations
- Microsoft Teams Add-in (manifest.xml постои → треба publishing)
- Google Classroom SSO
- e-дневник извоз

✅ Product-side интеграции затворени:
- e-дневник CSV извоз од `ParticipantStatsModal` (ученик, одговори, точни, поени, completion, последна активност)
- Dashboard `Integrations` hub со инсталациски чекори и download линкови
- Google Workspace/Classroom-ready sign-in flow преку Google OAuth
- Microsoft PowerPoint add-in manifest подготвен за sideload / publishing

🟡 External publishing останува како оперативен чекор:
- Microsoft marketplace / admin deployment
- Google Workspace marketplace / Apps Script publishing

---

## 🏆 ФАЗА Г — Пазарна стратегија

Поврзани извршни документи:
- `docs/MARKETING_ONE_PAGER.md`
- `docs/WEEKLY_GTM_ACTIONS.md`

### 1. Позиционирање

**MKD Slidea = Macedonia-first интерактивна платформа за настава и презентации**

Порака кон пазарот:
- Не сме „уште еден poll tool“.
- Сме **локализирана педагошка платформа** за македонски наставници, училишта, обучувачи и организации.
- Главната предност не е само цената, туку комбинацијата:
  - 🇲🇰 македонски јазик,
  - 🎓 педагошки use-cases,
  - ⚡ едноставно стартување без апликација,
  - 📊 мерливи резултати по учесник,
  - 🤖 AI и homework mode како диференцијатор.

Краток positioning statement:
> За наставници и обучувачи во Македонија кои сакаат поголема вклученост и подобри резултати, MKD Slidea е интерактивна платформа што овозможува анкети, квизови и активности во живо на македонски јазик, со педагошки фокус и цена прилагодена на локалниот пазар.

### 2. Идеален купувач (ICP)

**Примарен сегмент:**
- Наставници во основни и средни училишта
- Професори и асистенти на факултети
- Едукатори за курсеви и приватни академии

**Секундарен сегмент:**
- HR и L&D тимови за корпоративни обуки
- Организатори на настани, конференции и вебинари
- Едукативни центри, невладини и проекти финансирани од донатори

**Реален beachhead за старт:**
- 1. наставници по информатика, математика, англиски и природни науки
- 2. средни училишта со активни дигитални наставници
- 3. приватни академии и центри за обука кои брзо носат одлуки

### 3. Конкурентна цена
| | Mentimeter Pro | **Slidea Годишен** |
|---|---|---|
| Цена | ~€300/год | **€20/год** |
| Јазик | Нема MK | 🇲🇰 Native |
| AI со педагогија | Нема | ✅ Bloom-based |
| **Разлика** | | **15× поевтино** |

### 4. Пакети и понуда по сегмент

**Free plan**
- Hook за органски раст
- Доволен за прва проба и мали часови
- Цел: activation, не приход

**Teacher Pro / Yearly**
- Главна комерцијална понуда
- Едноставна и јасна: ниска годишна цена, сите клучни функции
- Цел: масовна конверзија на индивидуални наставници

**School / Team пакет**
- 5-20 наставници по институција
- Централна лиценца + onboarding + амбасадор
- Цел: побрз MRR раст и понизок churn

**Training / Business пакет**
- За академии, HR и обуки
- Фокус на branding, analytics, export, team collaboration

### 5. Канали за раст

**Channel A — Директен outreach до наставници**
- Facebook групи за наставници
- Viber заедници
- LinkedIn outreach до активни едукатори и директори
- Директни пораки со јасен CTA: „10 мин демо + бесплатен pilot class"

**Channel B — Product-led growth**
- Секој free корисник добива лесен first success path
- Шаблони + onboarding + instant host start
- In-product upgrade hooks кога ќе види вредност

**Channel C — Content engine**
- YouTube: „Педагошки рецепт на недела"
- Blog/guide статии: квизови, exit tickets, formative assessment, interactive lesson ideas
- Short-form content: пред/после примери од реален час

**Channel D — Пилот институции**
- 5 пилот-училишта
- 2 приватни образовни центри
- 2 корпоративни training teams
- Цел: case studies, testimonials, бројки и доверба

### 6. Core message by segment

**За наставници:**
- „Повеќе ученици учествуваат, без да инсталираат ништо."
- „Провери разбирање за 30 секунди."
- „Извези резултати и следи кој навистина работел."

**За училишта:**
- „Ниска цена по наставник, висок ефект на настава."
- „Локализирана алатка што наставниците брзо ја усвојуваат."
- „Податоци, интеракција и дигитална модернизација без комплексен rollout."

**За HR / training:**
- „Попродуктивни обуки и презентации со реален engagement."
- „Branding, analytics и participant-level insight на едно место."

### 7. Conversion funnel

**Top of funnel**
- Landing page
- Видео демо од 60-90 секунди
- Template library
- Real use-case content

**Middle of funnel**
- Бесплатна регистрација
- 1-click template start
- Guided onboarding
- Email / in-app tips за првите 7 дена

**Bottom of funnel**
- Upgrade prompts при силен usage intent
- School пакети преку директен контакт
- Demo calls за институции

Целна activation дефиниција:
- корисникот да креира настан,
- да пушти барем 1 активност,
- да добие барем 5 одговори.

### 8. Pilot strategy

**5 пилот-училишта** → документирани резултати → поширока институционална продажба

За секое пилот-училиште:
1. 1 координатор-наставник
2. 3-5 наставници што реално ќе го користат производот
3. 30 дена мерење
4. Краток report:
   - број на часови
   - број на ученици
   - стапка на одговори
   - satisfaction feedback
   - 2-3 конкретни позитивни ефекти

Излез од пилот:
- testimonial
- logo permission
- case study
- referral кон друго училиште

### 9. Амбасадор програма

**1 наставник амбасадор по средно училиште / регион**

Амбасадорот добива:
- бесплатен Pro/Yearly
- ран пристап до нови функции
- јавен badge / recognition
- referral бонуси (или подароци / сертификати)

Амбасадорот носи:
- 3-10 нови активни наставници
- локални demo презентации
- реален feedback од терен

### 10. Content и доверба

Клучни trust assets што мора да постојат:
- 3 case studies
- 10 screenshot-based guides
- кратко product demo video
- user quotes од наставници
- страница „Како се користи во училница"
- страница „За директори и училишта"

Предлог content серија:
- „Педагошки рецепт на недела"
- „1 активност, 1 минута setup"
- „Како да направиш exit ticket со MKD Slidea"
- „Како да држиш attention во голем клас"

### 11. 90-дневен GTM план

**Први 30 дена**
- да се соберат 50 наставници на waitlist/interest list
- да се затворат 3 пилот институции
- да се објават 5 клучни landing/content страници
- да се сними 1 demo video

**Ден 31-60**
- да се активираат 100 регистрирани наставници
- да се пушти ambassador program
- да се објават 2 case studies
- да се направат 2 live webinars / demos

**Ден 61-90**
- да се затворат првите 10 плаќачки корисници
- да се добијат 5 институционални разговори
- да се стандардизира onboarding за училишта
- да се тестираат 2 acquisition loops со најдобар ROI

### 12. Retention и expansion

Корисникот останува ако брзо почувствува вредност.

Retention loops:
- шаблони по предмет и одделение
- post-session AI insights
- community templates
- e-дневник/export value
- email recap по завршен настан

Expansion loops:
- наставник → колега
- индивидуален наставник → цел актив
- пилот во едно училиште → друго училиште
- training center → client workshops

### 13. Ризици и одбрана

**Ризик:** наставниците сакаат, но немаат буџет
- Одбрана: многу силен free план + годишна цена што е лесна за лична одлука

**Ризик:** конкуренција со поголем brand
- Одбрана: локализација, pedagogy-first use-cases, пониска цена, побрза поддршка

**Ризик:** интерес има, но retention е слаб
- Одбрана: шаблони, onboarding, weekly content, in-product nudges и reports

### 14. Раст
1. **5 пилот-училишта** → документирани резултати → МОН / директори / поширока мрежа
2. **Амбасадор програма** → 1 наставник по училиште/регион, бесплатен Pro
3. **Facebook/Viber наставнички групи** → директен target на 5,000+ наставници
4. **YouTube и short-form содржина** → „Педагошки рецепт на недела"
5. **Партнерства** → приватни академии, обуки, едукативни проекти, донаторски програми

---

## 📊 KPIs

| | Денес | 3 мес | 6 мес | 12 мес |
|--|-------|-------|-------|--------|
| Регистрирани наставници | ~0 | 100 | 500 | 2,000 |
| Активни сесии/мес | ~0 | 200 | 1,000 | 5,000 |
| Плаќачки корисници | 0 | 10 | 50 | 200 |
| MRR (€) | 0 | 50 | 250 | 1,000 |

---

*Macedonian Mentimeter — направено со срце, за македонски наставници.*

---
## ОРИГИНАЛЕН ПЛАН (историски запис)

---

## ФАЗА 1 — Mentimeter ниво (Тековна)

### Критично
1. ✅ **Тајмер по активност** — 15/30/60/90s во Host nav, countdown во Presenter, лента кај учесниците
2. ✅ **Прикажување резултати** — EyeOff toggle на PollCard, "Чекај ги резултатите..." кај учесниците
3. ✅ **Квиз feedback по одговор** — Анимација correct/wrong кај учесникот, правилниот одговор осветлен
4. ✅ **Заштита од повеќекратно гласање** — Session ID во DB наместо само localStorage

### Висок приоритет
5. ✅ **Анонимен режим** — Учесникот избира со/без ime
6. ✅ **Drag and drop редослед** — Промена на редоследот на активностите
7. ✅ **Дупликат активност** — Копирај постоечка анкета/квиз
8. ✅ **Поставки по активност** — Timer per-poll (polls.timer_ends_at), скриј резултати per-poll
9. ✅ **Подобрен Word Cloud** — Спојување слични зборови, стоп-зборови
10. ✅ **Open Q модерација** — Хостот одобрува одговори пред прикажување

### Веќе завршено (од претходни сесии)
- ✅ Login modal — createPortal fix, работи на сите прелистувачи
- ✅ Web Locks конфликт на Edge — отстранет storageKey
- ✅ Шаблони — 10 богати шаблони за сите типови
- ✅ Real-time навигација — polling fallback на 3s + Supabase real-time
- ✅ Претходна/Следна + keyboard (← →)
- ✅ 4 режими на приказ — Барови / Донат / Подиум / Бројки
- ✅ Word Cloud — анимации, 11 бои, fade+grow
- ✅ Зачувување резултати — EventResultsModal + CSV извоз
- ✅ # отстранет од приказот на кодот
- ✅ Поставки на настан — toggle за повеќекратно гласање + наслов
- ✅ Ресетирај гласови — RotateCcw копче со потврда
- ✅ UptimeRobot keepalive — Auth + REST загреан

---

## ФАЗА 2 — Slido ниво

11. ⬜ **Q&A модерација** — Хостот крие/одобрува прашања
12. ⬜ **Извоз PDF** — Резултатите како PDF со графици
13. ⬜ **Брендирање на настан** — Лого + боја за вебинари/компании
14. ⬜ **Лозинка за настан** — Опционална покрај кодот
15. ⬜ **По-учесник статистика** — Кој одговорил, кога, со колку поени
16. ⬜ **Co-host** — Сподели настан со колега
17. ⬜ **Embed/iFrame** — Вгради анкета на надворешна страница

---

## ФАЗА 3 — Nearpod/Pear Deck ниво
(Бара Supabase Pro + Vercel Pro)

18. ⬜ **PDF/PPTX увоз** — Слајдови + активности помеѓу нив
19. ⬜ **Индивидуално следење** — По-ученик dashboard за наставникот
20. ⬜ **Collaborative whiteboard** — Заедничка табла
21. ⬜ **Gradebook** — Поени за наставничка евиденција / SCORM за Moodle

---

## Тековни ограничувања (Free tier)

- Supabase Realtime: 200 concurrent врски (OK за 1000 учесници)
- Supabase Storage: 500MB (треба периодично чистење)
- Supabase Auth cold start: 15-30s (UptimeRobot ги минимизира)
- Vercel Hobby cron: само 1x дневно

---

## Следен чекор — ФАЗА 2 (Slido ниво)

✅ **#11 Q&A модерација** — хостот крие/одобрува прашања од публиката
✅ **#12 Извоз PDF** — резултатите како PDF со графици
✅ **#13 Брендирање на настан** — лого + брендирачка боја во Presenter
✅ **#14 Лозинка за настан** — опционална лозинка, gate пред учесничкиот view
✅ **#15 По-учесник статистика** — кој одговорил, точни одговори, поени, completion %
✅ **#16 Co-host** — генерирање код во Settings, ко-домаќинот влегува преку Landing modal
✅ **#17 Embed/iFrame** — `/event/:id/embed` route, минималистички poll view, iFrame код во Settings

---

# 🌍 ROADMAP КОН СВЕТСКО НИВО (Април 2026 → )

**Принцип:** Сите фази изведливи со постоечки free/Tier 1 ресурси. Без paid services додека приходите не дозволат.

## Free лимити кои ги имаме
- Vercel Hobby: 100GB bandwidth → ~50,000 активни сесии/мес
- Supabase Free: 500MB DB + 2GB transfer → ~5,000 настани/мес
- Gemini Tier 1: ~$5/мес за 1000 наставници (DAILY_BUDGET=500)
- KV: 30,000 реквести/ден
- **Капацитет:** до ~1,000 активни наставници целосно бесплатно

## ФАЗА 1 — Conversion & Activation (1-2 недели) 🟢
*Цел: посетители → активни корисници*

- [ ] **1.1 Demo Mode** — "Пробај без регистрација" копче на Landing → sandbox event со fake votes, корисникот пробува host UI
- [ ] **1.2 Template Gallery (20 шаблони)** — JSON templates по предмет: математика, англиски, информатика, биологија, географија
- [ ] **1.3 First-success wizard** — По регистрација: "Креирај прв квиз за 60 секунди"
- [ ] **1.4 Empty-state CTAs** — Dashboard празен → "Импорт PowerPoint / AI генерирај"
- [ ] **1.5 Welcome email** — Supabase Edge Function + 3-step onboarding link

## ФАЗА 2 — Intelligence Layer (2-3 недели) 🟢
*Цел: AI што конкуренти не можат да го реплицираат*

- [ ] **2.1 AI Auto-grading** на отворени одговори по rubric (Gemini Flash)
- [ ] **2.2 Adaptive difficulty** — клас точно >80% → следно прашање потешко (client-side логика)
- [ ] **2.3 Misconception detector** — AI идентификува заеднички грешки → препорачува intervention
- [ ] **2.4 Lesson generator од PDF/PPTX** — tesseract.js (веќе во deps) + Gemini → 5 активности
- [ ] **2.5 Sentiment heatmap** — кога часот "губи енергија" базирано на reactions

## ФАЗА 3 — Pro Polish (1 месец) 🟢
*Цел: UI/UX како $50M startup*

- [ ] **3.1 Dark mode** (Tailwind dark: класи)
- [ ] **3.2 Keyboard shortcuts** (`?` помош, `Space` next, `R` reset, `F` fullscreen)
- [ ] **3.3 Drag & drop reorder** на полови (framer-motion веќе во deps)
- [ ] **3.4 Slide preview thumbnails** во host панел (canvas snapshot)
- [ ] **3.5 Export to Notion / Markdown** (client-side)
- [ ] **3.6 Animated backgrounds** — Mentimeter-style CSS animations
- [ ] **3.7 Custom branding** на Pro: logo, color, font

## ФАЗА 4 — Accessibility & Reach (2-3 недели) 🟢
*Цел: WCAG AA + повеќе јазици*

- [ ] **4.1 WCAG 2.1 AA** — ARIA, focus traps, screen reader, color contrast
- [ ] **4.2 Voice control** за наставникот (Web Speech API, бесплатно)
- [ ] **4.3 Live transcription** на час (Web Speech API → Supabase realtime)
- [ ] **4.4 i18n: HR/SR/BG/AL/RO** (JSON, prv превод преку Gemini)
- [ ] **4.5 Subtitles** во активности

## ФАЗА 5 — Network Effects (1 месец) 🟢
*Цел: вирален раст без маркетинг буџет*

- [ ] **5.1 Public template gallery** — SEO-friendly URLs (`community_templates`)
- [ ] **5.2 Embed widget** за блогови / WordPress (iframe + script)
- [ ] **5.3 "Powered by Slidea" badge** на Free план
- [ ] **5.4 Referral систем** "Покани наставник, добиј 1 месец Pro"
- [ ] **5.5 Public scoreboard** за квиз шампиони во MK
- [ ] **5.6 Open API** за интеграции со училишни системи (Edge Functions)

## ФАЗА 6 — Data Moat (континуирано) 🟢
*Цел: податоци кои конкуренти не можат да ги имаат*

- [ ] **6.1 Curriculum mapping** — врзи активности со MK курикулум (основно/средно)
- [ ] **6.2 Anonymous benchmark** — "вашиот клас е во 73-ти перцентил"
- [ ] **6.3 MK education vocabulary corpus** (од сите AI генерации) — data flywheel
- [ ] **6.4 Top teachers leaderboard** — retention boost

---

## Прозорец за следните 7 дена
| Ден | Задача |
|---|---|
| Пон-Вт | Demo mode + Template gallery (Ф1) |
| Сре-Чет | Dark mode + Keyboard shortcuts (Ф3 quick wins) |
| Пет | Welcome email + onboarding flow (Ф1) |
| Саб-Нед | AI auto-grading прототип (Ф2) |

## Финансиски trigger-и
- 1,000 free → 50 Pro (€20/год) = **€1,000/год** → break-even
- 2,000 free → 100 Pro + 1 училиште (€200) = **€2,200/год** → reinvest
- 5,000 free → почнува 5-цифрен годишен приход → upgrade Supabase Pro ($25/мес)
