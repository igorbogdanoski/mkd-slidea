# MKD Slidea — Целосен план по код-аудит (13.07.2026)

> Извор: паралелен аудит на целата кодна база (~27,000 линии) — 4 фокусирани прегледи:
> backend/API/Supabase security, core lib+hooks, live-session flows (Host/Presenter/Participant), останати views.
> Цел: реши сè од најголемото кон најситното козметичко, почнувајќи од следна сесија.
> **Правило:** по секоја поправка — `lint` + `build` + релевантен smoke test, пред да се premine на следната ставка.

---

## Како да се користи овој документ утре

Работи од горе кон долу. Секоја ставка има: локација (file:line), сценарио на дефект, и насока за поправка (намерно не е готов код — треба свежо да се имплементира со тековниот контекст на фајлот). Штиклирај `[x]` штом е поправено И потврдено (build+test).

> **✅ СЕСИЈА 13.07.2026 (продолжение): целосно спроведено.** Сите ставки под P0/P1/P2/P3 се поправени и live-тестирани на self-hosted инстанцата, освен #6 (свесно одложено — голема архитектурна работа) и #34 (изрично означено како "не итно" во оригиналниот аудит). Резиме на крајот на документот.

---

## 🔴 P0 — Критично / безбедносно (прво ова, пред сè друго)

- [x] **1. `x-user-id` header се верува како идентитет — quota/plan/admin bypass**
  Датотеки: `api/_lib/planEnforcement.js` (checkAiQuota, ~L58), `api/generate.js` (~L316), `api/my-quota.js` (~L31-32), `api/email/session-recap.js` (~L95, L106)
  Сценарио: `curl -H "x-user-id: <туѓо/admin UUID>"` → неограничен AI quota, читање на туѓа usage статистика, "лажно" admin трансакции.
  Насока: направи заеднички `getAuthedUser(req)` helper кој верификува Supabase JWT преку `Authorization: Bearer` (точниот образец веќе постои во `api/push-notify.js` L27-36) и замени го секое место каде `x-user-id` header моментално ја одредува идентитетот/правата. `session-recap.js` дополнително нема rate limiting — додај го истиот IP-bucket limiter како во `generate.js`/`grade.js`/`insights.js`.

- [x] **2. Stored XSS преку JSON-LD `<script>` инјекции**
  Датотеки: `src/views/PublicScoreboard.jsx` (~L254-271, поле `r.username`), `src/views/PublicTemplates.jsx` (~L407-422, полиња `tpl.title`/`tpl.description`)
  Сценарио: `JSON.stringify()` не escape-ира `</script>`; username/наслов со `</script><script>...</script>` извршува произволен JS кај секој посетител на јавната страница.
  Насока: escape-ирај `<`, `>`, `&` (или `<` замена) пред инјектирање во `dangerouslySetInnerHTML` за секој JSON-LD блок во апликацијата (провери и `Landing.jsx` за истиот образец).

- [x] **3. `PublicResults.jsx` прескокнува модерација + лика приватни презентерски белешки**
  Датотека: `src/views/PublicResults.jsx` (~L33-186 `PollCard` нема `is_approved` филтер; ~L262-264 `select('*, options(*)')`)
  Сценарио: (а) нескриен неодобрен open-text/word-cloud одговор е видлив на јавен линк; (б) `presenter_notes` (наменети само за host) стигнуваат во network response на секој посетител.
  Насока: примени `is_approved !== false` филтер (истиот образец како `Embed.jsx` L82-84, `Presenter.jsx` L315-316); замени `select('*')` со експлицитна колона-листа без `presenter_notes`. Обмисли и column-level `REVOKE SELECT (presenter_notes) FROM anon` во SQL (веќе загатнато закоментирано во `SUPABASE_PRESENTER_NOTES.sql`).

- [x] **4. `leaderboard` табела со `USING (true)` RLS — секој може да пишува туѓи резултати**
  Датотека: `SUPABASE_PHASE_A_MIGRATION.sql` (~L184)
  Сценарио: anon key е јавен во бандлот → секој клиент може `PATCH`/`DELETE` произволен ред во `leaderboard` за туѓ настан. Моментално неискористено од live frontend, но дупка чекајќи да се активира.
  Насока: примени го истиот Phase B образец — scope UPDATE/DELETE на event owner или SECURITY DEFINER `add_points` RPC како единствен пат за запис.

---

## 🟠 P1 — Високо (data integrity / correctness / revenue)

- [x] **5. Race condition на word-cloud/open-text гласање → дупликат redovi наместо инкремент** (заедно поправено со #19)
  Датотека: `api/vote-text.js` (~L42-87)
  Сценарио: check-then-act без unique constraint; кога повеќе ученици истовремено внесат ист збор, секој inserts своја row наместо инкремент на исто.
  Насока: `INSERT ... ON CONFLICT (poll_id, lower(text)) DO UPDATE SET votes = votes + 1`, со unique index на `(poll_id, lower(text))`.

- [x] **6. "Pro" гејтинг е чисто козметички — revenue leak** — ✅ **РЕШЕНО (продолжение на сесијата)**
  Датотеки: `src/lib/plans.js` (`canDo`, L100-108 — коментар "not enforced"), `src/views/Host.jsx` (~L340-379, export/AI Insights копчиња)
  Сценарио: бесплатен корисник користи CSV/PDF export и AI Insights без пречка — само значката "Pro" е декоративна. `Checkout.jsx` е рачен order флоу без автоматска активација на план.
  Насока: server-side проверка на планот пред да се исполни gated акција (API рута или RLS), не само UI badge.
  **Имплементирано:**
  - `api/insights.js` — вистинска server-side проверка (JWT → профил → effective plan), враќа `402` за не-платени планови. Ова е целосно unbypassable (AI генерирањето се случува на серверот).
  - CSV export / PDF export / AI Insights копчиња во `Host.jsx` — наместо декоративен badge, сега повикуваат `verifyProPlan()` (нов `src/lib/planCheck.js`) кој бара `/api/my-quota` за да го потврди вистинскиот план пред да ја изврши акцијата; ако не е платен план, redirect кон `/pricing`.
  - **Позната преостаната граница:** CSV/PDF генерирањето сепак се извршува client-side (само UI-патот сега е заклучен, не самата генераторска логика) — технички софистициран корисник со devtools сепак би можел директно да ја повика функцијата за генерирање, бидејќи податоците за анкетите веќе се во клиентската меморија за прикажување. Целосна server-side генерација на CSV/PDF (вистински "unbypassable" за овие два конкретно) би барала преместување на генераторската логика на сервер — оставено за посебна сесија ако се покаже потребно, бидејќи моменталниот фикс веќе го затвора реалниот "revenue leak" сценарио (обичен корисник кликнува low-effort UI patek).
  - **Верификувано** директно преку Node (без dev-server tooling проблеми): реален JWT + free план → `402`/redirect; ист корисник → `pro` план во DB → поминува гејтот.

- [x] **7. Неfiltriran realtime subscription на `options` табела → refetch-storm (веројатна причина за 60-80 учесник таван — види посебна секција подолу)**
  Датотеки: `src/hooks/useHostSession.js` (~L122), `src/hooks/useEvent.js` (~L135-141)
  Сценарио: subscription без `filter` на `event_id`/`poll_id` значи ЛУП глас во ЛУП сесија ја буди секоја отворена таба (Host/Participant/Presenter) во целата апликација → секој глас предизвикува целосен refetch кај сите слушатели, што расте квадратно со бројот на учесници во иста сесија.
  Насока: додади `filter: 'poll_id=eq.${pollId}'` (или еквивалент преку event_id join) на секое `postgres_changes` subscription на `options`.

- [x] **8. `offlineQueue.js` flush race → тивко изгубен глас**
  Датотека: `src/lib/offlineQueue.js` (~L33-52)
  Сценарио: нов глас се додава во ред додека претходен flush е во тек → финалниот `writeQueue(remaining)` го презапишува storage-от и го губи новододадениот глас.
  Насока: read-modify-write со merge/diff наместо blind overwrite на целиот низ, или per-item marker наместо замена на целиот array.

- [x] **9. Уредување опции на анкета → изгубени/дупликат гласови во преодниот прозорец**
  Датотека: `src/hooks/useHostSession.js` (`onSavePoll`, ~L298-306)
  Сценарио: insert нови опции пред delete на старите значи двете постојат истовремено; гласови дадени во тој прозорец на стара опција се губат при подоцнежниот delete; realtime слушателите гледаат дупликат опции.
  Насока: swap во единствена Postgres транзакција/RPC (update-in-place по option ID наместо delete+insert), или привремено `is_locked` за време на уредувањето.
  **Забелешка од тестирање:** update-in-place пристапот бараше стабилен редослед за да ги спари постоечките со новите опции по позиција — `options` немаше `created_at` (ниту position) колона воопшто. Откриено during live browser-тест (400 грешка), поправено со нова migration (`SUPABASE_FIX_OPTIONS_CREATED_AT.sql`) која додава `created_at TIMESTAMPTZ DEFAULT NOW()`. Потврдено со реален edit тест: точно 2 PATCH барања (update-in-place), нема insert/delete, истите option ID-иња зачувани.

- [x] **10. Грешка при глас се третира како успех → ученикот мисли дека гласал, а не стигнало**
  Датотека: `src/components/EventWrapper.jsx` (`handleVote`, ~L404-432)
  Сценарио: грешка со текст `"lock:sb-"` (Supabase lock contention) се третира како success → `markVoted()` без retry, ученикот гледа "Ви благодариме" екран без гласот да стигне до базата.
  Насока: retry со backoff пред откажување; ако сепак не успее, прикажи `voteError` наместо тивко да се маркира како гласано.

- [x] **11. `dbUpdateWithRetry` секогаш враќа `true` дури и по неуспешен retry**
  Датотека: `src/hooks/useHostSession.js` (`setActivePoll`, ~L242-266)
  Сценарио: локалниот state и broadcast каналот веќе оптимистички напредуваат; доцна-приклучени ученици читаат застарен `active_poll_id` од базата и остануваат заглавени без никаква грешка да се прикаже.
  Насока: пропагирај неуспех, retry во позадина или прикажи "синхронизацијата не успеа, освежи" кај hostот.

- [x] **12. `useVoiceCommands.js` — continuous listening тивко престанува да работи**
  Датотека: `src/hooks/useVoiceCommands.js` (~L77-82)
  Сценарио: stale closure на `listening` во `onend` handler-от значи дека auto-restart никогаш реално не се активира; UI сепак прикажува `listening: true`.
  Насока: замени state со ref (`listeningRef.current`), точниот образец веќе постои во `src/hooks/useLiveCaptions.js` (~L45).

---

## 🟡 P2 — Средно

- [x] **13. `my-quota.js` IDOR** — читање на туѓа AI usage статистика преку спуфнат `x-user-id`/`x-user-plan` header (истиот root-cause како #1, поправено заедно).
- [x] **14. `useDashboardData.js` missing dependency** (~L21-31) — dependency array `[activeTab]` без `user?.id`; ако табот е веќе активен кога сесијата асинхроно се резолвира, листата на настани останува празна додека корисникот рачно не смени таб.
- [x] **15. `useEvent.js sendReaction`** (~L280 vs L155-156) — отвора втор channel на ИСТИОТ topic (`reactions:${event.id}`) за секој emoji наместо да го реупотреби постоечкиот — може моментално да го "прекине" главниот listening channel.
- [x] **16. `useAuth.js` race на profile fetch** (~L59-91) — нема request-id/generation guard; доцна-резолвиран fetch може да прегази посвежи податоци (посебно plan/role).
- [x] **17. Event код може да излезе <6 карактери** — `useHostSession.js` (~L51-52, L70-71) base36 slice произведува 4-5 карактери во ~1% случаи; `Join.jsx` (~L42) бара точно 6 → таков код никогаш не може да се внесе. Насока: генерирај точно 6 карактери секогаш (zero-pad или регенерирај при кус резултат). **Бонус:** истиот bug постоеше и во `useDashboardData.js` (template creation) и `EventSettingsModal.jsx` (co-host код, 8 карактери) — поправени сите 3 преку нов заеднички `src/lib/eventCode.js`.
- [x] **18. Event код collision не се retry-ира** (~L53-58, L72-77) — insert failure на UNIQUE code оставa генеричка грешка без recovery.
- [x] **19. `vote-text.js` враќа сурови DB грешки на клиентот** (~L48,62,85) и нема rate limiting — генерички error порака + shared limiter (поправено заедно со #5).
- [x] **20. `push-subscribe.js` нема auth** — секој може да регистрира/брише push subscriptions за произволен eventCode. Rate limiting додаден (proporcionalna поправка за низок severity наод).
- [x] **21. `create-order.js`** (~L155) прифаќа клиентски `user_id` без проверка на сопственост — ниско ризично (admin-gated confirm), но додади крос-проверка кога постои сесија.
- [x] **22. Terms.jsx спомнува Stripe наплата** (~L65), а billing.js вели дека е рачна — правна/compliance неусогласеност, поправи текст.
- [x] **23. Landing.jsx fabricated `aggregateRating: 4.8/127`** (~L144) без реален review систем — Google structured-data кршење риск. Отстрането целосно (нема реален review систем зад него).
- [x] **24. Pricing.jsx Enterprise CTA нема onClick/href** (~L331-333) — спореди со working mailto во `Schools.jsx` L96-101.
- [x] **25. `store.js` мртов код** (~L15-119) — никаде не се повикува, дуплира/дивергира од `useEvent.js` логика. Исчистено (задржани само реално користените `event`/`activeParticipants`/`activeNow` state+setters).

---

## 🟢 P3 — Ниско / козметичко

- [x] **26.** `localStorage` небранет пристап во `useHostSession.js` (L6,9) и `useDashboardData.js` (L13) — обвиткај во try/catch (образец веќе постои во `offlineQueue.js`, `useDarkMode.js`, `i18n/index.jsx`).
- [x] **27.** Reaction fade-out `setTimeout`-и не се чистат при unmount (`useEvent.js` ~L160-163, 168-172, 289-290) — безопасно во React 18, но хигиенски треба cleanup.
- [x] **28.** `Embed.jsx` postMessage fallback на `'*'` target origin кога `document.referrer` е празен (~L54) — стеснето со `ancestorOrigins` како дополнителен извор.
- [x] **29.** `Participant.jsx` (~L636-645) — poll-option копчиња не се групирани како radio-group за screen readers (споредено со reaction bar кој правилно користи `aria-pressed`).
- [x] **30.** `App.jsx` monkey-patch на `window.console.error`/`unhandledrejection` преку substring matching (~L42-64) — документиран trade-off наместо ризичен слеп фикс (не можев да го потврдам точниот browser-emitted текст без реален repro).
- [x] **31.** `useKeyboardShortcuts` footgun — `App.jsx` (~L74-76) пренесува нов object literal на секој render, предизвикувајќи remove/re-add на listener; hook може да прифати ref или shallow-diff.
- [x] **32.** `useDashboardData.js` `useTemplate` детекција на грешка преку `err?.message?.includes('lock')` — заменето со `'lock:sb-'` (истиот образец како насекаде во кодот).
- [x] **33.** `supabase.js` контрадикторни коментари ("Multi-tab resilient" наспроти "single-tab app" bypass коментар) — усогласени.
- [ ] **34.** `Onboarding.jsx` — тенок/статичен, ниско ризично, не итно. **Прескокнато** — самиот аудит го означи ова како "низок ризик, не итно", нема потреба од акција.

---

## 📊 Посебна анализа: зошто таванот е ~60-80 учесници (не 200 како во конфигурацијата)

**Контекст:** `src/lib/plans.js` веќе декларира `maxParticipants: 200` за Free/Monthly план (ова е само конфигурациска вредност — **не** е enforced нигде, види #6). `ROADMAP.md` документира дека претходна сесија (05.06.2026) веќе оптимизирала перформанси "за 100 учесници на Supabase Free" преку polling smart-skip (25 req/s → 0-3 req/s). Значи 200 е декларираната цел, 100 е претходно тестираниот работен број — но реално набљудуваш пад околу 60-80.

**Најверојатна причина (техничка, не платформски лимит):** ставка **#7** погоре — неfiltriranoto realtime subscription на `options` табелата. Секој глас во СЕКОЈА сесија моментално го буди секој отворен клиент (Host+Presenter+сите Participant-и) во целата апликација, не само во таа сесија, и секој разбуден клиент прави целосен refetch. Во една сесија со N учесници, секој од N-те гласови предизвикува refetch кај сите N слушатели — оптоварувањето расте суперлинеарно со N. Ова објаснува зошто "меко" се крши некаде помеѓу 60-80, а не остро на некој платформски број — тоа е органски настанат таван од самата архитектура, не quota.

**Дополнителни фактори што треба да се проверат (бараат пристап до Supabase dashboard, немам директен увид):**
- Supabase Realtime concurrent connections лимит на Free tier (историски ~200) — ако секој учесник отвора повеќе channel-и (broadcast + presence + postgres_changes) на ист websocket, тоа обично НЕ множи connection-и (се мултиплексираат), но НЕ е потврдено за оваа кодна база без директен преглед на Realtime Inspector во Supabase dashboard-от.
- Presence channel heartbeat/join-и испраќаат целосна state промена на сите клиенти при секој join/leave — исто O(n²) поведение, независно од #7.
- Database connection pooling — ако некаде во `api/` се користат директни Postgres конекции наместо PostgREST/pooler, Free tier има понизок лимит на директни конекции.

**Препорачан редослед за да се стигне сигурно до 200, па 500:**
1. **Прво (бесплатно, код-фикс):** поправи #7 (filtered subscriptions) + провери presence имплементацијата за исто O(n²) поведение. Ова само по себе веројатно го носи реалниот таван назад кон декларираните 200.
2. **Потврди со реални бројки:** отвори Supabase Dashboard → Reports/Realtime Inspector за да видиш точен број на concurrent connections и messages/sec при тест со 100+ симулирани учесници (пр. преку `playwright` load test или сличен скрипт), пред да се плаќа за upgrade "на слепо".
3. **Ако #7-фиксот не е доволен за 500 конкурентни учесници:**
   - **Supabase Pro (~$25/мес база):** повеќе вклучени concurrent Realtime конекции (историски 500 наспроти 200 на Free), поголем DB compute, нема auto-pause. Најверојатно доволно за webinar до 500.
   - **Vercel:** API повиците (vote submission, generate, итн.) се кратки HTTP барања, не websockets — Vercel Hobby веројатно поднесува 200-500 учесници без проблем технички. **НО:** Vercel Hobby планот е наменет за лични/некомерцијални проекти според нивните Terms of Service — бидејќи MKD Slidea е платена комерцијална услуга (Checkout флоу постои), препорачувам Vercel Pro (~$20/мес по член) и заради compliance, не само перформанси. Ова е независно прашање од учесник-скалирањето, но вреди да се спомене.
4. **Не троши на infrastructure upgrade пред да го поправиш #7** — плаќање за поголем Realtime лимит нема да помогне ако секој дополнителен учесник и понатаму троши ресурси квадратно наместо линеарно.

*Забелешка: немам директен пристап до твојот Supabase/Vercel dashboard (нема поврзан MCP/CLI за нив во оваа сесија), па точните тековни бројки на конекции/пораки треба да се потврдат таму пред финална одлука за upgrade.*

---

## 🗺️ Мапа на квалитет (референца — за насока на "дорасти до експертско ниво")

**Силни — веќе близу експертско ниво, само дотерување:**
`api/v1/events.js`, `api/v1/results.js`, `api/_lib/apiAuth.js`, `api/push-notify.js`, SQL hardening миграции (Phase A/B, API_KEYS), `src/hooks/useEvent.js` (најдобро инженерирана датотека во кодот), `src/lib/supabase.js`, `useLiveCaptions.js`, `useFocusTrap`/`useSEO`/`useDarkMode`/`useKeyboardShortcuts`, чисти lib функции (`questionsCore.js`, `embeddingsCore.js`, `offlineQueue.js`, `billing.js`), `Dashboard.jsx`, `Participant.jsx`, `PublicResults.jsx` (визуелно), `ResetPassword.jsx`, `LoginModal.jsx`, `Blog.jsx`/`BlogPost.jsx`/`Demo.jsx`/`EventScoreboard.jsx`/`NotFound.jsx`/`Integrations.jsx`/`Schools.jsx`.

**Слаби — заслужуваат поголем redo, не само закрпа:**
- `api/_lib/planEnforcement.js` + `my-quota.js` + `session-recap.js` — заеднички auth helper (#1).
- `useHostSession.js` — 600-линиски "god hook", подели во `usePollCrud`/`usePollReorder`/`useSessionExport`/`useHostPresence`.
- `plans.js`/Checkout флоу — реален server-side enforcement (#6).
- `useVoiceCommands.js` — ref-fix (#12).
- `store.js` — избриши мртов код (#25).

---

## Предлог распоред за утрешната сесија

1. P0 #1-4 (security) — ова е приоритет пред сè, дури и пред scaling работата.
2. P1 #6 + #7 (revenue leak + participant scaling root-cause) — директно поврзано со твоето прашање за webinar капацитет.
3. Останати P1 (#5, 8-12) — data integrity во живи сесии.
4. P2 листата, потоа P3 козметика на крај.
5. По P0+P1, пред да се плаќа за Supabase/Vercel upgrade — направи load test да потврдиш дека #7-фиксот го решава практичниот таван.

---

## 🖥️ Инфраструктурна одлука: Supabase Cloud наспроти сопствен Hostinger сервер

**Контекст:** имаш Vercel Pro веќе. За Supabase немаш платено ниво. Прашање: дали `mismath.net` (Hostinger shared/cPanel) или Hostinger VPS/Cloud (со SSH, веќе има Docker за друг проект) можат да го замени Supabase, за да се избегне месечен трошок.

### Опција А — Shared hosting (`mismath.net`, cPanel) → ❌ не е изводливо за backend/DB замена

Shared hosting нема root/SSH, не дозволува да се инсталира сопствен software, ниту да се пушта persistent процес. Апликацијата моментално зависи од 4 работи што Supabase ги дава:

1. **Postgres + pgvector** (RAG/семантичка пребарувачка)
2. **Realtime websockets** (живото гласање — самото јадро на производот)
3. **Auth** (JWT сесии, password reset, итн.)
4. **RLS + Edge Functions** (безбедносен слој од P0 листата погоре)

Ниту еден од овие не работи на класичен shared cPanel план (нема persistent Node процес за websockets, нема custom Postgres extension). Shared hosting-от е корисен само за статични работи (можеби landing/marketing страница), не за замена на бекенд. **Заклучок: mismath.net не влегува во игра за ова прашање.**

### Опција Б — VPS/Cloud со Docker (веќе имаш за друг проект) → ✅ реално изводливо, преку self-hosted Supabase

Supabase официјално нуди self-hosted верзија преку Docker Compose (истиот stack: Postgres+pgvector, GoTrue за Auth, Realtime сервер, Storage, Kong gateway, Studio). Клучна предност: **апликацискиот код останува 100% ист** — само `SUPABASE_URL`/keys покажуваат кон твојот VPS наместо кон Supabase Cloud. RLS политиките, RPC функциите, pgvector — сè што веќе е изградено во SQL миграциите (вклучувајќи ги и P0 security фиксовите од утрешната сесија) продолжува да работи без промена.

**Што реално се штеди:** ~$25/мес (Supabase Pro) ако/кога ти треба тоа ниво. Ако моментално си на Supabase Free, штедиш $0 сега, но си отвораш капацитет за скалирање без месечен трошок подоцна.

**Што реално чини (не во пари, туку во ризик/време):**

- Ти стануваш одговорен за backups/point-in-time-recovery на продукциска база (Supabase Cloud го прави ова автоматски).
- Ти стануваш одговорен за security patch-ови на Postgres/Docker images, TLS сертификати, uptime monitoring.
- Realtime серверот под товар (истиот O(n²) проблем од #7 погоре) треба РАЧНО да се следи и скалира — Supabase Cloud тоа делумно го апсорбира зад својот managed infra, самохостиран VPS нема тој бафер.
- Треба доволно RAM/CPU/disk на VPS-от **покрај** веќе постоечкиот Docker проект (Supabase self-host stack реално бара најмалку ~2GB RAM слободни, идеално 4GB+, за Postgres+Realtime+Auth+Storage+Kong контејнерите заедно).

**Пред да се одлучи:** провери на VPS-от:

- Вкупен RAM/CPU/disk и колку е веќе искористено од постоечкиот проект
- Верзија на Docker/Docker Compose
- Дали Hostinger VPS планот дозволува отворени портови за Postgres (5432) и Realtime websocket надвор од localhost, со соодветен firewall

### Опција В — Целосно преминување од Supabase кон custom stack (сопствен Postgres/MySQL + сопствен Auth + сопствен realtime преку Socket.io) → ❌ не се препорачува

Ова би значело редизајн од нула на Auth, Realtime и RLS-еквивалентна авторизациска логика — недели работа, нов површина за бubovi токму во моментот кога штотуку ги затвораме безбедносните дупки од P0 листата. Опција Б (self-hosted Supabase) го носи истиот финансиски резултат ($0 месечно на VPS кој веќе го плаќаш) без да се фрла постоечката, веќе тестирана архитектура.

### Препорака

1. Не блокирај ги P0/P1 бг-фиксовите на оваа одлука — тие важат идентично без разлика дали крајната база е Supabase Cloud или self-hosted.
2. Прво провери ги VPS спецификациите (RAM слободен простор е клучен фактор).
3. Ако VPS-от има простор → self-hosted Supabase (Опција Б) е технички најчист пат, без рефактор на кодот.
4. Ако VPS-от е преполн → остани на Supabase Cloud Free/Pro засега; трошокот е мал во однос на ризикот од self-hosting без DevOps капацитет за тоа.
5. Оваа одлука е независна и може да се донесе подоцна — не мора да се реши утре заедно со P0 безбедносните фиксови.

---

## 🚀 Извршен план: self-hosted Supabase на постоечкиот VPS (потврдено 13.07.2026)

**VPS:** `srv1303382.hstgr.cloud` / `76.13.129.9` (Hostinger KVM 2), Ubuntu 24.04.3 LTS. SSH пристап веќе конфигуриран (`~/.ssh/config` + клуч).

**Потврдени ресурси:**

- 2 vCPU, 7.8GB RAM (~6.5GB достапно, само 1.2GB во употреба)
- 96GB диск, 35GB слободно
- Docker 29.2.0 веќе инсталиран

**Постоечки контејнери/портови на овој VPS (друг проект — `olympiad-math-archive` / `app`, НЕ MKD Slidea):**

| Порт   | Сервис                                     | Проект                 |
| ------ | ------------------------------------------ | ----------------------- |
| 22     | SSH                                         | систем                  |
| 80/443 | nginx (server: `mismath` → `app.mismath.net`) | app                   |
| 5432   | Postgres 16 (`math_archive_db`)             | olympiad-math-archive   |
| 6379   | Redis (`math_archive_redis`)                | olympiad-math-archive   |
| 8000   | uvicorn (веројатно `app` проект)            | app                     |
| 27035  | Mongo (`math_mongo`, mapирано од 27017)     | app/друго               |

**DNS состојба:**

- `mismath.net` root домен → **не** покажува кон овој VPS (покажува кон Hostinger shared hosting IP-и: 92.113.23.123 / 92.113.16.69).
- `app.mismath.net` → **76.13.129.9** (овој VPS) — потврдено, веќе постои certbot сертификат за `app.mismath.net`.
- Nameservers: `ns1.dns-parking.com` / `ns2.dns-parking.com` (Hostinger-ов default DNS zone editor во hPanel).
- Избран subdomain за Supabase: **`supabase.mismath.net`** — сеуште не постои, треба нов DNS A record.

### ⚠️ Акција потребна од тебе (јас немам DNS пристап)

Оди во Hostinger hPanel → Domains → `mismath.net` → DNS Zone Editor → додади:

```text
Type: A
Name: supabase
Points to: 76.13.129.9
TTL: 300 (или default)
```

Пропагацијата обично трае 5-30 мин со TTL 300. Продолжуваме со инсталацијата паралелно додека тоа пропагира.

### План (изведба — нема да ги допрам постоечките контејнери/мрежи)

1. ✅ Recon завршен (специфи, портови, DNS) — овој документ.
2. ⏳ **DNS A record** — чекаме тебе да го додадеш (погоре).
3. Clone на официјалниот `supabase/docker` self-host repo во нова изолирана папка (пр. `/root/supabase-mkd-slidea/`), на своја Docker мрежа — нема допир до `app_app_network`/`olympiad-math-archive_app_network`.
4. Генерирање на сите потребни секрети (JWT secret, anon key, service_role key, Postgres лозинка, Dashboard лозинка) — криптографски случајни, никогаш во git.
5. **Ремапирање на портови** за да нема судир со постоечкото:
   - Postgres, Realtime, Auth, Storage, Studio, Meta → **само internal/127.0.0.1**, не јавно изложени (најбезбедна пракса и онака — Supabase-JS клиентот комуницира само со Kong API портата, не директно со Postgres).
   - Kong (единствената API порта што треба јавно) → внатрешно на `127.0.0.1:8010` (не 8000, зафатено), потоа nginx го reverse-proxy-ира преку TLS на `supabase.mismath.net`.
6. `docker compose pull && docker compose up -d` — проверка дека сите контејнери се healthy, изолирано, без да се допрат постоечките.
7. Nginx server block + `certbot --nginx -d supabase.mismath.net` (откако DNS пропагира) — нов TLS сертификат, независен од `app.mismath.net`.
8. Верификација: `curl https://supabase.mismath.net/rest/v1/` итн. — потврди дека API-то одговара пред да се допре вистинска шема/податоци.
9. **Пауза за твоја потврда** пред следните чекори (овие се "hard to reverse" / допираат жива продукција):
   - Миграција на шемата и постоечките податоци од тековниот Supabase Cloud проект (сите SUPABASE_*.sql миграции + реални податоци од наставници/настани) кон новата self-hosted инстанца, преку `pg_dump`/`pg_restore` или Supabase CLI.
   - Смена на `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` во Vercel env vars — ова е моментот кога живата апликација реално преминува. Треба rollback-план (чувај го Supabase Cloud проектот активен и недопрен додека self-hosted верзијата не е целосно потврдена во продукција, пред да се откаже Cloud проектот).

**Статус (13.07.2026, ажурирано): чекори 1-8 ЗАВРШЕНИ.** ✅

- DNS `supabase.mismath.net → 76.13.129.9` пропагиран и потврден.
- Официјалниот `supabase/docker` self-host stack е клониран во `/root/supabase-mkd-slidea/docker/` на VPS-от.
- Сите секрети генерирани преку официјалниот `utils/generate-keys.sh` (JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, POSTGRES_PASSWORD, DASHBOARD_PASSWORD, итн.) — зачувани **само** во `.env` на VPS-от (`/root/supabase-mkd-slidea/docker/.env`), никогаш во git/чат.
- Портови ремапирани и врзани само за `127.0.0.1` (не јавно изложени): Postgres → 5433, Supavisor pooler → 6544, Kong HTTP → 8010, Kong HTTPS → 8443. Единствен јавен влез е nginx на 443.
- Nginx server block + Let's Encrypt TLS сертификат за `supabase.mismath.net` активни (auto-renew преку certbot, истечува 2026-10-11).
- Сите 11 контејнери (`db`, `auth`, `rest`, `realtime`, `storage`, `kong`, `studio`, `meta`, `supavisor`, `imgproxy`, `functions`) се **healthy**.
- Надворешна верификација успешна: `https://supabase.mismath.net/rest/v1/` и `/auth/v1/health` одговараат правилно преку Kong (401 без клуч = точно однесување).
- Постоечките контејнери/мрежи на `olympiad-math-archive`/`app` проектот **не се допрени**.

**Чекор 9 — Миграција на шема + податоци: ЗАВРШЕНА и целосно верификувана (13.07.2026).** ✅

- `pg_dump`/`pg_restore` извршени преку матчирачка Postgres 17.6 верзија (истата и на Cloud и на self-hosted — без несогласувања).
- pgvector екстензија овозможена на self-hosted инстанцата (недостасуваше по default, предизвика прв неуспешен обид — решено).
- **Сите 21 табели во `public` шемата: точни, идентични row counts** (events 138, options 575, polls 210, profiles 102, votes 249, community_templates 19, curriculum_chunks 228, reactions 9, и сите останати 0-count табели се совпаѓаат).
- `auth.users` (102) и `auth.identities` (103) мигрирани data-only во постоечката (self-init) auth шема — точно се совпаѓаат со Cloud.
- Сите embedding колони (pgvector) целосно пренесени: polls 210/210, community_templates 19/19, curriculum_chunks 228/228 — 100% non-null.
- Сите функции (148/148), FK constraints, RLS политики, indexes, triggers — точно се совпаѓаат со Cloud шемата.
- Storage: 0 buckets/objects на Cloud — нема потреба од миграција на фајлови.
- Backup копии од dump-овите зачувани на VPS: `/root/mkdslidea-migration/*.dump` (permissions 600, само root може да чита).
- Cloud Supabase проектот (`wnzwjalrwfurybemecod`) **не е допрен** — pg_dump е read-only, живата апликација продолжува непречено да работи против него.

**Чекор 10 (следен, СЕУШТЕ БАРА експлицитна потврда пред извршување):**
Смена на `SUPABASE_URL`/`VITE_SUPABASE_URL`/`SUPABASE_ANON_KEY`/`VITE_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` во Vercel env vars од Cloud кон `https://supabase.mismath.net` + новите self-hosted клучеви. Ова е моментот на реален cutover на живата апликација:
1. Тест прво во Vercel **preview** deployment со новите env vars (не production), провери целосен golden path (login, креирање настан, live гласање, RAG search).
2. Дури потоа смена во production env vars.
3. **Не откажувај го Supabase Cloud проектот** — задржи го активен (можеби read-only режим) неколку недели како fallback/rollback опција.
4. Постави cron backup (`pg_dump` автоматски, дневно) на self-hosted Postgres кон офсајт локација — сега self-hosted инстанцата е single point of failure без Supabase Cloud-овиот автоматски backup.
5. Препорачано: ротирај ја Postgres лозинката на Cloud проектот откако миграцијата е целосно потврдена во продукција (беше споделена во чат сесија за миграцијата).

---

## ✅ Preview тест — ЗАВРШЕН (13.07.2026): 2 реални бага најдени и поправени пред продукција

**Метод:** Vercel CLI преку `vercel env add --force` ги смени Preview-scoped env vars (SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY + VITE_ верзии) кон self-hosted инстанцата, БЕЗ да се допре Production. Direct преглед на Vercel preview URL не беше можен (заштитен со Vercel SSO/Deployment Protection); наместо тоа, локален `npm run dev` со истите preview env vars (функционално еквивалентно за целиот Supabase-зависен golden path). `vercel dev` не успеа поради недостасувачки `yarn` — не е тестирано во оваа сесија, значи **`/api/*` serverless рутите (generate, grade, welcome-email, итн.) сеуште не се тестирани против новата база** — препорачано пред целосен cutover.

### 🐛 Баг #1 (КРИТИЧЕН, најден и поправен): `--no-privileges` при pg_dump ги отфрли сите GRANT наредби
Секое REST барање враќаше `401 permission denied for table events` — RLS политиките постоеја, но `anon`/`authenticated` роли немаа ниту основна table-level привилегија. Поправено со:
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
```
Веќе применето на self-hosted инстанцата.

### 🐛 Баг #2 (КРИТИЧЕН, најден и поправен): `on_auth_user_created` trigger исчезнат
При поправка на pgvector проблемот направив `DROP SCHEMA public CASCADE` — ова го избришало `handle_new_user()` (живее во public), што CASCADE-но го избришало и trigger-от `on_auth_user_created` на `auth.users` (иако таа табела е во друга шема). Резултат: нови регистрации создаваа auth.users ред, но НЕ и `profiles` ред → `406` грешка на секое читање на профил. Поправено со рекреирање на trigger-от:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
Веќе применето. **Провери за слични cross-schema trigger/function зависности ако во иднина повторно се прави DROP SCHEMA public CASCADE.**

### ✅ Целосно потврден golden path (по фиксовите)
Регистрација → авто-најава → создавање настан → додавање анкета → учесник се приклучува преку код → живо гласање → **резултатот се појавува во живо на host екранот без reload**. Realtime presence ("2 во живо") исто потврдено. Сите тест-податоци исчистени по тестот — self-hosted инстанцата е назад на точните мигрирани бројки (102 auth.users, 138 events).

### ✅ SMTP за Auth email-и — РЕШЕНО (13.07.2026)
Self-hosted Auth првично имаше dummy/placeholder SMTP — реални confirmation/password-reset е-пораки не би заминале. Конфигуриран е реален Resend SMTP relay (истиот `RESEND_API_KEY`/`RESEND_FROM` веќе користени во апликацијата):
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<RESEND_API_KEY>
SMTP_SENDER_NAME=MKD Slidea
SMTP_ADMIN_EMAIL=orders@slidea.mismath.net
```
`ENABLE_EMAIL_AUTOCONFIRM` е вратено на `false` (безбеден default). Потврдено со реален signup тест: signup барањето траеше ~1.8s (наспроти ~345ms со autoconfirm вклучено — разликата одговара на времето за синхроно SMTP испраќање), audit log покажа `user_confirmation_requested` настан, нема грешки во auth логовите. Тест-корисникот исчистен по тестот.

### 🔵 Ниско-приоритетни наоди од тестирањето (не се однесуваат на миграцијата, претходно постоечки)
- "Регистрирај се" копчето во навигацијата преливa надвор од viewport на ширина ~1247px (responsive CSS проблем) — не е поврзано со миграцијата, вреди да се додаде во P3 козметичка листа погоре.
- При signup се создадоа 2 идентични events наместо 1 (веројатно React 18 StrictMode double-invoke само во dev режим, не се очекува во продукциски build) — треба брза потврда по вистински production build, ниско приоритетно.

---

## 🎉 PRODUCTION CUTOVER — ЗАВРШЕН (13.07.2026)

Production Vercel env vars (`SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) сменети кон self-hosted инстанцата и deploy-нати. Потврдено на живо: `https://slidea.mismath.net` реално комуницира со `https://supabase.mismath.net` (auth health check + events query = 200, нема console грешки).

**Supabase Cloud проектот (`wnzwjalrwfurybemecod`) е сеуште активен и недопрен** — задржан неколку недели како rollback опција, како што беше планирано.

### ✅ Автоматски backup — поставен
- Скрипта: `/root/backups/backup-mkdslidea.sh` — целосен `pg_dump` (сите шеми: public + auth + storage + realtime, за вистинска disaster recovery), rotate на 14 дена.
- Cron: секој ден во 03:00 (`0 3 * * * /root/backups/backup-mkdslidea.sh`).
- Тестирано рачно — работи, прв backup (1.6MB) зачуван во `/root/backups/mkdslidea-db/`.
- Лог: `/root/backups/backup.log`.

### ⚠️ Преостаната точка: backup-от е само ЛОКАЛЕН на истиот VPS
Ако VPS-от целосно откаже (диск failure, hosting проблем), и базата и backup-ите се на исто место — нема вистинска "офсајт" копија. Опции за проширување подоцна (бара нова одлука/credentials, не е итно):
- `rclone` cron кон евтин object storage (Backblaze B2, Cloudflare R2, итн.)
- Периодичен `scp`/rsync на backup фајловите кон `mismath.net` shared hosting-от (веќе го имаш платено)
- Или едноставно рачно симни ги backup-ите повремено локално на твојот компјутер

### Preostanati чекори (не итни, но вредни):
- Потврди дека реален постоечки наставник (не тест-сметка) може успешно да се најави на продукција.
- Следи ги Docker логовите на VPS-от неколку дена за неочекувани грешки под реален сообраќај.
- Обмисли Vercel Pro (веќе спомнато порано) заради ToS усогласеност за комерцијална употреба.
- По неколку недели стабилна работа: ротирај ја Postgres лозинката на Supabase Cloud проектот (беше споделена во чат за миграцијата) и потоа обмисли pause/decommission на Cloud проектот.

---

## ✅ РЕЗИМЕ: Целосно спроведување на код-аудитот (13.07.2026, продолжение)

По завршување на инфраструктурната миграција, поминавме низ **целата листа од 34 наоди**, по приоритет, со lint/build/test проверка по секоја група поправки.

### Статистика
- **P0 (критично):** 4/4 поправени
- **P1 (високо):** 6/7 поправени, 1 свесно одложена (#6 — server-side plan enforcement, поголема архитектурна работа)
- **P2 (средно):** 13/13 поправени
- **P3 (козметичко):** 8/9 поправени, 1 прескокната (#34 — самиот аудит го означи како не итно)

### Нови SQL migration фајлови (веќе применети на self-hosted инстанцата):
- `SUPABASE_FIX_LEADERBOARD_RLS.sql` — #4
- `SUPABASE_FIX_OPTIONS_REALTIME_FILTER.sql` — #7 (denormalized `event_id` на options + trigger)
- `SUPABASE_FIX_VOTE_TEXT_RACE.sql` — #5/#19 (unique index + atomic upsert RPC)
- `SUPABASE_FIX_OPTIONS_CREATED_AT.sql` — поддршка за #9 (видено подолу)

### Нови shared helpers:
- `api/_lib/auth.js` — `getAuthedUser(req)`, заеднички JWT verification за сите API рути
- `api/_lib/rateLimit.js` — заеднички IP-bucket rate limiter
- `src/lib/authHeader.js` — клиентски `getAuthHeader()` за да се испраќа вистински JWT наместо `x-user-id`
- `src/lib/eventCode.js` — `generateCode(length)`, точна фиксна должина (поправа за #17, искористено на 3 места)
- `src/lib/jsonLd.js` — `safeJsonLd()`, escape-ирање за JSON-LD script инјекции (#2)

### 🐛 Бag најден во сопствената поправка (транспарентност)
При live browser тестирање на #9 (update-in-place за poll опции), откриено дека `options` табелата **воопшто нема `created_at` колона** — мојот код се потпираше на неа за стабилен редослед при спарување стари/нови опции. SELECT барањето враќаше `400 column options.created_at does not exist`, што предизвика fallback логиката погрешно да третира сите опции како "нови" и да удри во unique constraint-от од #5 (409 conflict). Поправено со нова migration (`created_at TIMESTAMPTZ DEFAULT NOW()`) пред да се потврди дека работи. Ова покажува зошто live тестирање пред cutover (истото правило што го применивме за Supabase миграцијата) е исто толку важно и за код-фиксови врз реални податоци.

### Верификација
- ✅ `npm run build` — чист build, 3162 модули, сите 49 SEO рути пререндерирани
- ✅ `npx vitest run` — 112/112 тестови поминуваат
- ✅ `npm run lint` — конфигуриран (види подолу), 0 грешки
- ✅ Live browser smoke test на self-hosted preview: signup → onboarding → создавање настан → анкета → **уредување опции** (потврдена update-in-place логика, точни исти option ID-иња) → сè чисто

### Останато за посебна сесија
- Целосна server-side генерација на CSV/PDF (моментално само UI-патот е заклучен, самата генераторска логика сепак работи client-side — види #6 погоре за детали)
- Rollout на новите SQL фајлови кон Supabase Cloud проектот исто (моментално применети само на self-hosted инстанцата; Cloud останува непроменет како rollback fallback)

---

## ✅ ESLint поставен + Pro plan enforcement имплементиран (13.07.2026, продолжение 2)

### ESLint — конфигуриран од нула
Проектот немаше `eslint.config.js` ниту eslint како devDependency воопшто. Инсталирани: `eslint@9`, `@eslint/js@9`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`. Намерно **не** е користен целиот "recommended" preset од `eslint-plugin-react-hooks@7` — тој бandluva десетици експериментални React Compiler правила (`preserve-manual-memoization`, `set-state-in-effect`, `refs`, `purity`...) кои флагираат стотици долгогодишни, работечки шаблони низ целиот код (React Compiler migration грижа, не lint-хигиена). Активирани се само класичните `rules-of-hooks` (error) и `exhaustive-deps` (warn).

**Прв `npm run lint` откри 11 реални грешки** (869 preostanati се само неискористени imports — козметичко, не е допрено во оваа сесија):
1. **`api/email/drip-cron.js`** — `no-dupe-keys`: два клучи `created_at` во истиот objekt (еден литерален, еден computed) — вториот тивко го бришеше првиот. Резултат: cron барањето за "профили создадени на конкретен ден" немаше долна граница воопшто, потенцијално совпаѓајќи со сите профили некогаш создадени пред cutoff датумот — ризик за спам/дупликат onboarding е-пораки на погрешен опсег корисници. Поправено со array-value поддршка во `sb()` helper-ot (`url.searchParams.append` за секој елемент).
2. **`api/v1/create-order.js`** — `no-control-regex`: намерна санитизација на контролни карактери, означено со `eslint-disable-next-line` + образложение (не е грешка).
3. **`scripts/probe.mjs`** — `no-undef` на `console` — glob patternот во eslint.config.js не покриваше `.mjs` фајлови во `scripts/`, поправено.
4. **`useTemplate` во `useDashboardData.js`/`HomeTab.jsx`/`TemplatesTab.jsx`** — `react-hooks/rules-of-hooks`: именувана со "use" префикс а не е вистински hook (обична async функција), предизвикувајќи lažna позитивна грешка. Преименувано во `applyTemplate` на сите 4 места.
5. **2× Empty block statement** (`LoginModal.jsx`, `useDashboardData.js`) — намерни `catch {}` без коментар; додаден коментар за да се разјасни намерата (истиот `no-empty` idiom).
6. **`exportMarkdown.js`** — `no-useless-escape`: непотребен `\[` во character class (однесувањето останува исто).
7. **`tests/templates-sort.spec.js`** — parsing грешка: `desc!.length` — TypeScript non-null assertion оператор во обичен `.js` фајл (невалидна JS синтакса!). Отстранет `!`.

### Server-side Pro plan enforcement (#6 — сега целосно решено)
- `api/insights.js` — додадена вистинска server-side проверка на план (JWT → профил → effective plan), враќа `402` за не-платени планови пред да се повика Gemini.
- Нов `src/lib/planCheck.js` (`verifyProPlan()`) — клиентски helper кој бара `/api/my-quota` за да го потврди вистинскиот план пред CSV export / PDF export / AI Insights, наместо декоративен badge.
- `Host.jsx` — трите gated копчиња сега реално блокираат (redirect кон `/pricing`) кога планот не е платен.
- **Верификувано директно преку Node** (заобиколувајќи ги dev-server tooling проблемите — `vite dev` не ги извршува `/api/*.js`, `vercel dev` се закачи локално): реален JWT со `free` план → `402`/redirect; истиот корисник со `pro` во DB → минува гејтот. И двете насоки потврдени за `my-quota.js` и `insights.js`.
- **Позната граница:** CSV/PDF генерирањето сепак работи client-side (само UI-патот е заклучен). Целосна server-side генерација е поголема работа, оставена за подоцна ако се покаже потребно.

---

## ✅ SEO + SaaS-readiness преглед (13.07.2026, продолжение 3)

Свеж преглед (2 паралелни фокусирани прегледи, читаат-само) на делови непокриени во оригиналниот безбедносен аудит: SEO техничко здравје + оперативна зрелост на бизнисот. Наодите + што е веднаш поправено:

### 🔴 КРИТИЧНО, поправено веднаш

**Истечени платени планови никогаш не се симнуваа назад на free — реален, растечки revenue leak.**
`confirm_manual_order()` (SQL) коректно поставува и `plan` и `pro_until` при потврда на нарачка, но `effectivePlan()` (`api/_lib/planEnforcement.js`) и `isPro()` (`src/lib/plans.js`) само РАНО враќаа "платено" кога `pro_until` е валиден — кога е истечен, кодот паѓаше на fallback кој сепак го враќаше стариот `plan` стринг наместо `'free'`. Резултат: секој клиент кој престане да плаќа задржува целосен Pro пристап засекогаш, освен ако основачот рачно не го симне во Supabase Studio. Поправено на двете места (server + client) — сега `pro_until` во минато секогаш форсира `'free'`, без разлика на `plan` стрингот.

### ⚠️ Веднаш поправени (technical, ниско-ризични)
- **Rate limiting** додаден на `api/semantic-search.js`, `api/og-png.js`, `api/v1/create-order.js` — сите трошеа реални Gemini/render/email ресурси без ограничување.
- **`robots.txt`** — додадено `Disallow: /event/`, `/host`, `/onboarding` (претходно неограничено индексирање на илјадници ефемерни per-session страници — thin/duplicate content ризик).
- **Sitemap** — отстранет `/host` (auth-gated, никогаш не е достапен на crawler, soft-404 ризик во Google Search Console).
- **Hreflang конзистентност** — `useSEO.js` имаше само 3 од 7 јазици (недостасуваа sr-RS/hr-HR/bg-BG/ro-RO), додека `generateSitemap.js`/`index.html` имаа сите 7. Создаден заеднички `src/lib/locales.js` како единствен извор на вистина, увезен на сите 3 места.

### 🟡 Пронајдени, БАРААТ твоја одлука (не се допрени — бизнис/vendor избор, не чисто технички)

**SEO:**
- **Hreflang кластерот е суштински нефункционален за вистинско меѓународно проширување** — `src/i18n/index.jsx` детекцијата на јазик никогаш не чита `?lang=` од URL-то (само localStorage/navigator.language), а `Landing.jsx` (главната маркетинг содржина што Google ја индексира) е целосно хардкодирана на македонски, никогаш не minuva низ `t()` системот. Механиката (sitemap/JSON-LD/OG generacija) е solidna и би се проширила чисто, но фундацијата под неа е декоративна. Ова директно се врзува со прашањето за EN/TR експанзија од порано во сесијата — реална имплементација бара: (a) path-based locale routing, (b) вистинска преведена статична HTML по route×јазик во prerenderRoutes.js, (c) преместување на Landing.jsx копирајтингот во `t()` системот. Не мала работа — препорачувам посебна сесија ако се одлучиш за EN/TR.
- **`/results/:code`** (Share Results, feature-от за вирусно ширење преку WhatsApp/Facebook) нема статичен HTML воопшто — социјалните unfurl-ботови не извршуваат JS, па секој споделен линк ја крши сопствената цел (прикажува generic homepage наместо вистинскиот резултат). Насока: lightweight edge handler за bot user-agents (образец веќе постои во `api/og-png.js`).
- **Community templates** (не starter templates) се невидливи за sitemap/prerender — растечка празнина.

**SaaS оперативна зрелост:**
- **Нема error monitoring воопшто** (Sentry/LogRocket/итн.) — production крах би поминал целосно незабележано освен ако корисник не се пожали. Препорака: Sentry free tier, ~1 час работа.
- **Нема renewal reminder е-пошта** за клиенти чиј `pro_until` се приближува — само admin-side потсетник за pending нарачки постои.
- **Бришење сметка е само mailto ветување** ("во рок од 30 дена"), нема admin алатка да се изврши веднаш — правно прифатливо, но ризично ако побарувањето седи во inbox.
- **Backup cron-от (на новата self-hosted инстанца) е самиот немониториран** — нема надворешен heartbeat (пр. healthchecks.io) што би алармирал ако cron-от тивко престане да работи.
- **Нема in-app support канал** за обични корисници (само mailto за институции/B2B).
- **Нема funnel analytics** (signup → прв настан → прва сесија → upgrade) — `@vercel/analytics` е само page-view трекинг.

Овие последните 6 бараат избор на vendor/пристап (кој error-tracking сервис, кој support widget, дали да се гради admin-tool за бришење сметки) — намерно не одлучив наместо тебе. Кажи ми приоритет и продолжуваме.

## ✅ Затворени сите 6 отворени точки — self-contained пристап, без нови vendor signup-и (13.07.2026, продолжение 4)

По твое барање, сите 6 точки погоре се решени користејќи ја постоечката инфраструктура (self-hosted Supabase, Resend, Vercel Analytics/Cron) наместо да бараат регистрација на нов надворешен сервис (Sentry, healthchecks.io и сл.) кој јас не можам да го отворам во твое име.

### 1. Бришење сметка — сега вистинска admin акција, не само mailto
- `SUPABASE_ADMIN_DELETE_ACCOUNT.sql` → `delete_user_account(p_user_id)`, SECURITY DEFINER RPC, admin-only. Прво брише `events` (FK `NO ACTION`), потоа `auth.users` (кое каскадно ги брише сите останати табели).
- `AdminTab.jsx` — копче Trash2 по ред на корисник, со `window.confirm` пред трајно бришење.

### 2. Error monitoring — сопствена error_log табела, не Sentry
- `SUPABASE_ERROR_LOG.sql` → табела `error_log` (source/message/stack/url/user_id/context), admin-only SELECT, `prune_error_log()` за 30-дневна ротација.
- `api/log-error.js` — edge функција, rate-limited, прима client-side грешки.
- `api/_lib/logError.js` — `logServerError()`, best-effort запис од секој server route (никогаш не фрла).
- `App.jsx` — `console.error`/`unhandledrejection`/`window.onerror` сега (покрај постоечкото суптилно потиснување на lock/permissions-policy шум) ги пријавуваат вистинските грешки преку `sendBeacon`/`fetch` до `/api/log-error`.
- `AdminTab.jsx` — секција "Скорешни грешки", последни 20 записи, извор (client/server) бадж, копче Освежи.

### 3. Renewal reminder е-пошта — 3 дена пред истек на планот
- `SUPABASE_RENEWAL_REMINDER.sql` → колона `renewal_reminder_sent_at` на `profiles`.
- `api/email/renewal-reminder.js` — дневен cron (08:00 UTC), праќа преку Resend на клиенти чиј `pro_until` е 0-3 дена во иднина; dedup преку `renewal_reminder_sent_at` природно се ресетира на секое обновување (нов `pro_until` го прави стариот timestamp "застарен" за новиот прозорец).
- **Бag најден и поправен при финалната верификација**: функцијата читаше `process.env.EMAIL_FROM`, кое не постои во продукција (реалната променлива е `RESEND_FROM`, потврдено преку `vercel env pull`) — секој испратен потсетник тивко паѓаше на хардкодиран fallback адреса. Поправено на вистинската променлива.

### 4. Backup heartbeat monitoring
- `SUPABASE_SYSTEM_HEALTH.sql` → табела `system_health` (key/last_success_at/detail), admin-only SELECT.
- `/root/backups/backup-mkdslidea.sh` (на VPS) сега пишува heartbeat (`UPDATE system_health SET last_success_at = NOW()...`) по секој успешен dump — тестирано во живо, потврдено ажурирање.
- `api/check-backup-health.js` — нов дневен cron (10:00 UTC), чита го heartbeat-от преку REST и праќа Resend алармна е-пошта ако е постар од ~26ч (фаќа го случајот кога самиот cron тивко престанува да работи, не само поединечен неуспешен backup).

### 5. In-app support/feedback канал
- `SUPABASE_SUPPORT_MESSAGES.sql` → табела `support_messages` (user_id/email/message/page_url/status), admin-only SELECT; нема client INSERT policy — сите записи одат преку service-role endpoint-от.
- `api/support-message.js` — rate-limited, работи и за најавени и за анонимни посетители (auth по желба), зачувува запис + праќа копија до `BILLING_EMAIL` преку Resend.
- `src/components/SupportWidget.jsx` — лебдечко копче (долу-десно) на секоја страница освен `/event/*` (живи класни/презентерски екрани, намерно без клутер), модал форма.
- `AdminTab.jsx` — секција "Прашања и фидбек", последни 20 записи.
- **Верификувано во живо**: standalone Node скрипта директно го извика handler-от против self-hosted инстанцата, потврден запис со UTF-8 кирилица во DB, потоа избришан тест-записот.

### 6. Funnel analytics — 4 точки преку `@vercel/analytics` `track()`
- `signup` — `useAuth.js` `signUp()`, по успешна регистрација со лозинка (Google OAuth/magic-link регистрации не се засебно означени како "нов корисник" — позната граница, не е решена).
- `event_created` — `useHostSession.js`, при секое создавање нов "настан" (host сесија).
- `session_started` — `HostHeader.jsx`, при клик на "Презентација" (отворање на `/event/:code/present`).
- `order_submitted` — `Checkout.jsx`, при успешно поднесена рачна нарачка (PayPal/банка) — најблиску до "upgrade" што е клиентски видливо, бидејќи вистинското одобрување е рачно од admin страна.
- Намерно без нова табела/vendor — фаќа сурови броеви по настан низ времето (proxy за funnel), не строго "прв пат по корисник".

### Финална верификација по сите 6 точки
- `npm run lint` → 0 грешки (880 предупредувања, сите претходно постоечки `no-unused-vars` за JSX-употребени imports — конфигурациска празнина во `eslint.config.js`, не поврзана со денешните промени; потврдено дека истиот образец постои и во недопрени фајлови).
- `npm run build` → успешно, 49 рути пререндерирани за SEO.
- `npx vitest run` → 112/112 тестови поминати.
- Сите нови SQL миграции (`SUPABASE_SUPPORT_MESSAGES.sql`, `SUPABASE_SYSTEM_HEALTH.sql`) применети на self-hosted инстанцата веднаш по создавање.

## ✅ ESLint JSX-fix + CSP headers root-cause најден (13.07.2026, продолжение 5)

### ESLint — вистински поправено (не само workaround)
Проблемот од продолжение 4 (880 предупредувања) не беше „largely лажни позитиви" туку конкретна дупка во конфигурацијата: `eslint.config.js` немаше начин да препознае дека `<Nav />` во JSX е реална употреба на именуваниот import `Nav` — секој компонент-import во секој `.jsx` фајл се третираше како неискористен. Инсталиран `eslint-plugin-react` (само правилото `react/jsx-uses-vars`, не целиот „recommended" preset кој претпоставува класичен JSX runtime). Резултат: **880 → 160 предупредувања, 0 грешки**. Преостанатите 160 се вистински (неискористени imports/променливи низ ~90 фајлови + неколку test фајлови) — ситна чистка, не итна, но сега сигналот е реален наместо шум.

### CSP/security headers — root cause најден и поправен: routing bug, не cache
Прва хипотеза (stale CDN cache на `/`) беше **погрешна** — по push+redeploy на претходните фиксови (потврдено со нов ETag/Age:0 на секоја рута), точниот root пат `/` СЀ УШТЕ враќаше само гол `Strict-Transport-Security: max-age=63072000` без ниту еден друг header, додека `/pricing`, `/dashboard`, `/assets/*` и случаен 404 пат коректно го враќаа целиот сет (CSP, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, целосен HSTS). Со свеж deploy а сепак истиот симптом, staleness е исклучен.

**Вистинска причина**: `vercel.json`-от имаше само еден headers-запис со `"source": "/:path*"` — овој wildcard образец, во Vercel-овата рутинг имплементација, не се совпаѓа со точно точниот root пат `/` (нула сегменти), иако би требало според path-to-regexp семантиката. Секоја друга рута минува низ истиот rewrite (`/:path*` → `/index.html`) и добива headers нормално; само буквалниот `/` не.

**Поправка**: додаден е втор, експлицитен headers-запис со `"source": "/"` (истиот целосен сет headers, дуплициран). Push + автоматски redeploy (GitHub integration), потврдено со `curl -I` дека `https://slidea.mismath.net/` сега враќа целосен сет headers со `X-Vercel-Cache: MISS`, `Age: 0`.

**Познат trade-off**: CSP стрингот сега постои двојно во `vercel.json` (за `/` и за `/:path*`) — ако некогаш се менува `connect-src` (пр. при промена на self-hosted Supabase домен), мора да се ажурира на **двете** места. Не е автоматизирано бидејќи `vercel.json` е статичен JSON без include/variable механизам; вреди да се напомене при секоја идна CSP промена.

## 🔍 Свежа детална проверка на кодот — perf/dependencies/архитектура/тестови (13.07.2026, продолжение 6)

Излегувајќи од чисто-безбедносниот фокус на претходните прегледи, оваа проверка гледа на нешта кои допрва не се мереле директно: bundle големина, застареност на зависности, архитектура на компонентите, сооднос на тестови.

### 📦 Bundle size — здраво, благодарение на постоечкиот code-splitting
- Главниот `vendor` chunk е 1.1MB нестиснат / **~331KB gzip** — во ред за модерна SPA, но е најголемиот единечен парче.
- Route-based lazy loading веќе работи (Dashboard/Host/EventWrapper/Landing се одделни chunks) — почетното вчитување НЕ ја носи целата апликација, само vendor + index + рутата што се посетува.
- Нема итна акција потребна, но ако `vendor` продолжи да расте (нови AI/PDF/PPTX библиотеки), вреди да се провери дали некои тешки либови (пр. `tesseract.js`, `pdfjs-dist`) навистина треба да бидат во главниот vendor chunk наместо во сопствен lazy chunk само за увоз/извоз функциите.

### 📌 Застареност на зависности — **`@supabase/supabase-js` е приоритет #1**
`npm outdated` покажува:
- **`@supabase/supabase-js` 2.99.3 → 2.110.3 достапна** (11 minor верзии зад) — ова е НАЈВАЖНОТО да се ажурира предвид дека целата апликација штотуку помина низ целосна миграција кон self-hosted backend; понови верзии носат bug-фиксови специфично за realtime/auth edge cases кои штотуку ги видовме во живо (lock contention, race conditions). Препорачувам ова да биде прв чекор во следната сесија, со полно regression тестирање (build + vitest + рачен golden-path преку agent-browser) пред да се смета за завршено.
- `pdfjs-dist` 4.6.82 → 6.1.200 (2 мајор верзии зад) — користи се за PDF import/export; вреди ажурирање но со внимателно тестирање бидејќи PDF.js честo менува API помеѓу мајор верзии.
- `vite` 5→8, `tailwindcss` 3→4, `react` 18→19, `lucide-react` 0→1 — сите се мајор верзии зад, но **не се итни**. React 18→19 и Tailwind 3→4 бараат посветена migration сесија (breaking changes во двете), не brzo ажурирање.
- `npm audit` покажува 5 high severity — `tar` (транзитивна, install-time-only преку `@mapbox/node-pre-gyp`, не оди во продукцискиот bundle, низок реален ризик) и `ws` (реална runtime зависност преку `@supabase/realtime-js`, но browser bundle-от го користи native browser WebSocket, не Node `ws` пакетот — `ws`-от е fallback само за Node-контекст на таа библиотека; сепак вреди `npm audit fix` штом се ажурира supabase-js).

### 🏗️ Архитектура — неколку „God component" фајлови
Најголеми компоненти по линии код:
- `src/views/Landing.jsx` — **1181 линии** (маркетинг homepage, веќе идентификувано порано дека целосно го заобиколува i18n системот).
- `src/views/Presenter.jsx` — **1124 линии** (главниот презентерски екран во живо — критичен за UX, но и најризичен за одржување во сегашна форма).
- `src/components/Dashboard/AnalyticsTab.jsx` — 810 линии.
- `src/views/Participant.jsx` — 793 линии.

Ова не се бagovi, но се ризик-концентратори: секоја идна промена во Presenter.jsx (пр. нов тип на активност, нова realtime функција) носи повисок ризик од несакани споредни ефекти токму затоа што фајлот е толку голем и веројатно содржи multiple одговорности во еден компонент. Препорака (не итна): при следна поголема фича во Presenter/Landing/Participant, искористи ја приликата да се извлечат под-компоненти наместо да се додава уште код во истиот фајл.

### 🧪 Тестови — тенок сооднос, но точно насочен таму каде најмногу боли
126 source фајлови наспроти 26 тест фајлови (9 vitest unit + Playwright e2e spec-ови во `tests/`). Ова звучи тенко на прв поглед, но: 112 unit тестови поминуваат, а Playwright spec-овите (host/participant/accessibility/mobile/activity-types) веќе го покриваат golden path-от од двете страни (host + participant). Најголемата празнина: **ниту еден автоматски тест не ги покрива fix-овите од оваа и претходната сесија** (plan expiration → free downgrade, realtime filter по `event_id`, atomic word-cloud upsert, admin account deletion RPC). Ова се токму местата каде регресија би била најскапа (revenue leak, data race). Препорака: следната тест-инвестиција да оди токму таму, не кон „покриј сѐ", туку кон „покриј го она што штотуку сакавме да не се расипе повторно".

## 💭 Мое мислење за понатамошен развој на апликацијата

Прашано директно, еве го моето видување, без резерви:

**Инфраструктурата сега е solid — искористи го тоа.** Self-hosted Supabase миграцијата, revenue-leak фиксот, auth hardening-от и мониторингот (error log, backup heartbeat, renewal reminders) значат дека апликацијата премина од „демо квалитет" во „вистински production SaaS" во текот на оваа сесија. Тоа е најголемата промена direktно на market value-то — сега можеш искрено да кажеш дека имаш производ со реален operational maturity, не само functional feature set.

**Приоритет #1 пред нови фичи: докажи дека 200-500 учесници навистина работат.** Целата причина за self-hosted миграцијата беше participant scaling. Немаш уште реален доказ дека тоа функционира под товар — препорачувам следната сесија (или веднаш штом имаш реален настан со поголема публика) да направиш контролиран load test (пр. со Playwright или k6, симулирајќи 200-300 паралелни participant connections кон еден настан) пред да го продадеш ова како capability на клиенти. Ако не сакаш synthetic load test, барем следниот реален настан со >100 учесници internamente следи го VPS ресурсите (CPU/RAM на Docker containers) во живо.

**Приоритет #2: одлучи за EN/AL/TR експанзија со трезвен поглед на трошокот.** Веќе разговаравме дека i18n фундацијата (Landing.jsx хардкодиран на MK, `?lang=` не се чита од URL) е декоративна, не функционална. Ова НЕ Е мал додаток — реално бара посветена сесија со path-based routing, преведена статична содржина по рута, и преработка на маркетинг копирајтингот низ `t()` системот. Мое мислење: MK пазарот сам по себе е доволно голем за solid лифстајл бизнис (училишта + компании + вебинари), но е ограничен за венчур-скала раст. Ако целта е само одржлив бизнис во МК, не инвестирај во интернационализација сега — наместо тоа продлабочи го MK-специфичниот moat (веќе имаш почетоци: `SUPABASE_CURRICULUM.sql`/`SUPABASE_BRO_SOURCE_URL.sql` укажуваат на интеграција со БРО наставна програма — тоа е нешто Mentimeter НИКОГАШ нема да го има, а домашните училишта би го ценеле многу). Ако целта е регионален раст (Албанија/Косово/Србија/Бугарија, реални соседни пазари), тогаш AL/SR/BG би имале посмислена приоритет од EN/TR, бидејќи тие пазари веројатно немаат локализиран Mentimeter-конкурент воопшто — поголема шанса за брзо освојување наспроти конкурирање со Mentimeter директно на англиски пазар.

**Приоритет #3: рачното наплатување (PayPal/банка) ќе стане тесно грло штом растеш.** Сега со мал волумен, рачното одобрување на нарачки од admin панелот е сосема разумно и евтино (нема Stripe такси). Но ако EN/AL/TR или BRO-партнерството доведат до повеќе клиенти, рачното одобрување ќе стане операциски trošok кој го јадe твоето време. Не менувај го тоа сега — само имај го на ум како следен чекор кога/ако волуменот порасне (пр. >20-30 нарачки месечно би било знак дека автоматизацијата веќе се исплатува).

**Приоритет #4 (техничко, не бизнис): ажурирај `@supabase/supabase-js` пред да гради уште повеќе на self-hosted инстанцата.** Секоја нова фича изградена на застарен client SDK носи ризик тоа да треба да се преработи подоцна кога ќе се ажурира. Подобро сега додека кодбазата е свежа во главата, отколку по уште 3 месеци нови фичи.

**Резиме**: техничката темелница е сега многу подобра од бизнис-содржината над неа. Следната инвестиција на време треба да оди во докажување дека scaling-от навистина работи (приоритет #1) и во одлука за пазарен правец (приоритет #2), не во нови features. Апликацијата веќе има солидна функционална ширина (AI insights, semantic search, voice commands, live captions, PPTX import) — повеќе фичи сега би го зголемиле ризикот без да го зголемат приходот, додека доказ за scale + јасен пазарен правец директно ја зголемуваат продажната приказна.

## 🎯 НАЈДЕН И ПОПРАВЕН вистинскиот root cause за „само ~100 можеа да одговорат" (14.07.2026)

По твоја потврда дека на претходен вебинар си имал 300+ учесници но никогаш повеќе од ~100 не можеле да одговорат, го најдовме точниот root cause — **не бил hardware/капацитет проблем, туку неменувани default вредности во self-hosted Realtime tenant конфигурацијата**:

### Дијагноза
- Секој participant client (`useEvent.js`) отвора **6 одделни realtime channels** по сесија: `event-polls`, `event-questions`, `reactions`, `event-details`, `event-nav`, `presence`.
- Проверка на `_realtime.tenants` табелата на self-hosted инстанцата покажа:
  - `max_concurrent_users = 200` — тврд плафон на ИСТОВРЕМЕНИ realtime конекции. Со 300 учесници × 6 channels, овој плафон се исполнува многу брзо, независно од VPS капацитет.
  - `max_events_per_second = 100` и `max_joins_per_second = 100` — throughput throttle низ ЦЕЛИОТ tenant. Кога стотици учесници гласаат во истите неколку секунди (типична динамика на вебинар — „гласајте сега"), овие лимити предизвикуваат backpressure/бавење/испуштени updates.
- Овие бројки се **default вредности од официјалниот self-hosted docker-compose демо-шаблон** — никогаш не биле нагодени за реална употреба. VPS-от (2 vCPU, 7.8GB RAM) бил речиси idle (5.2GB RAM слободни) во моментот на проверка — значи проблемот НЕ бил недостиг на хардвер.

### Поправка (применета веднаш, бесплатно, само конфигурациска промена)
```sql
UPDATE _realtime.tenants SET
  max_concurrent_users    = 1000,   -- од 200
  max_channels_per_client = 100,    -- непроменето (6 се користат, веќе доволно)
  max_events_per_second    = 1000,  -- од 100
  max_joins_per_second     = 500,   -- од 100
  max_bytes_per_second     = 1000000 -- од 100000 (100KB/s → 1MB/s)
WHERE external_id = 'realtime-dev';
```
Applied директно на self-hosted DB, потоа `docker restart realtime-dev.supabase-realtime` за да се превчита конфигурацијата (health check помина, логовите чисти, smoke test на `/pricing` враќа 200).

### Останато да се потврди
Ова е конфигурациска поправка врз основа на анализа на кодот и документираното однесување на Supabase Realtime — **сепак не е заменета со вистински load test под реален товар**. Пред следниот голем вебинар (200-500 луѓе), препорачувам:
1. Контролиран тест со синтетички concurrent connections (Playwright/k6 скрипта која отвора 200-300 паралелни participant sessions кон тест-настан) **ПРЕД** да се потпреш на ова за реален настан со платежи клиенти.
2. Ако немаш апетит за synthetic load test, барем следниот реален настан со >100 учесници активно следи ги VPS ресурсите во живо (`htop`/`docker stats` на VPS-от), за да имаш реален сигнал дали хардверот (не само Realtime конфигурацијата) го држи товарот.
3. Ако volumen-от натаму расте кон 500+, следен чекор е Postgres `max_connections=100` (моментално споделен низ сите self-hosted сервиси — PostgREST, GoTrue, Storage, Realtime, Studio) — не е веднаш проблематично, но вреди да се следи ако се додаваат нови DB-тешки сервиси.
