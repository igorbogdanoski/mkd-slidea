# MKD Slidea — Сеопфатен аудит-извештај + план за наредна сесија

**Датум:** 23.07.2026 · **Статус:** основа за следна сесија
**Методологија:** 4 паралелни експертски прегледи на кодот (Host/авторство · Participant/Presenter · Dashboard/SaaS/монетизација · Landing/SEO/a11y/i18n) + визуелна инспекција на 24 автоматски снимени екрани + live-probe на продукциските OG endpoints. Секој наод е со `file:line`; критичните тврдења се независно верификувани.
**Перспектива:** искусен педагог + edtech специјалист + senior frontend/UX + SEO + SaaS/growth.

> Како да се чита: секој наод е означен со тежина 🔴 critical / 🟠 high / 🟡 medium /  low и категорија. На крајот има **препорачан план по спринтови** и листа на **брзи победи** (<30 мин) за веднаш.

---

## 0. TL;DR — извршно резиме

**Апликацијата е на комерцијално ниво и архитектонски зрела** (зрел real-time sync, server-verified Pro gating, богата SEO инфраструктура, солидна a11y основа, безбеден invite flow). Сепак, аудитот откри **неколку критични проблеми што директно штетат на интегритетот на податоците, конверзијата и веродостојноста**, плус системски јаз во i18n и неколку „мртви" UI парчиња.

**Најитните 5 (штетат сега, во продукција):**
1. 🔴 **Двоен глас при брз двоен tap** — трајно ги искривува графиконите (`EventWrapper.jsx:397`).
2. 🔴 **Offline-queued гласовите никогаш не се бројат** — лажно ветување „гласот е зачуван" (`offlineQueue.js:46`).
3. 🔴 **`/api/og-png` враќа 500 во продукција** (верификувано live) — секој social share е без слика.
4. 🔴 **i18n е нефункционален** — `?lang=` не се чита, `en` е најавен но не постои, преведено е само ~2%; hreflang кластерот е 7 дупликати што Google ги отфрла.
5. 🔴 **14-дневен trial е ветен но не имплементиран** + freemium upsell-от исчезнува за `plan='free'` корисници.

**Што е одлично (ЗАЧУВАЈ — не „поправај"):** зрел real-time sync со REST fallback и lock-retry; server-verified Pro gating; дупликат-channel crash-от е навистина поправен; богата per-page SEO + 70+ prerendered рути + точен JSON-LD; skip-link + `:focus-visible` + `prefers-reduced-motion/contrast` CSS; `LiveAnnouncer`; пристапен WordCloud (stop-words + aria-label); безбеден token-based invite со revoke; `FirstSuccessWizard` (одлична активација); чесен manual billing UX за училишта.

---

## 1. 🔴 КРИТИЧНИ (поправи прво — интегритет / продукција / веродостојност)

### 1.1 Интегритет на гласовите (core flow)
- 🔴 **[bug]** `EventWrapper.jsx:397` — `if (userVoted || isVoting …) return` чита **stale closure**; брз двоен tap (чест на телефон) го вика `increment_vote` двапати пред re-render → `options.votes` е +2 трајно, додека `votes` редот се дедуплира → графиконите и табелата се разидуваат. **Фикс:** чувај `isVotingRef` (синхроно check-and-set) и прати `submitting` prop за да се disable-ираат опциите за време на await.
- 🔴 **[bug]** `EventWrapper.jsx:475` + `offlineQueue.js:46` — `flushQueue` само upsert-ира во `votes`, но агрегатите се инкрементираат **само** преку RPC (нема `AFTER INSERT ON votes` trigger) → офлајн гласовите никогаш не се бројат. **Фикс:** queue-ирај го RPC payload-от и replay-ирај го RPC во `flushQueue`, ИЛИ додај DB trigger што ги одржува `options.votes`.

### 1.2 Продукциски broken endpoint
- 🔴 **[seo/bug]** `/api/og-png` → **HTTP 500** (верификувано live: `?type=template&title=Test…`). Тоа е `og:image` за homepage, секој template detail, `/templates` и live-event share → **секој social/chat share е без слика**. Веројатна причина: WASM/font init при cold start (`api/og-png.js:51-60`). **Фикс:** поправи ја функцијата + додај статичен 1200×630 PNG fallback (`public/og-image.svg` постои но е SVG — конвертирај во commit-нат PNG и користи го како default `og:image`).

### 1.3 i18n кластер (целата мултијазична стратегија е мртва)
- 🔴 **[i18n]** `?lang=` се најавува насекаде но **никогаш не се чита** — `i18n/index.jsx:22-31` (`detect()` гледа само localStorage + `navigator.language`), додека `locales.js`, `index.html`, `useSEO.js` и sitemap емитуваат `/?lang=sq` итн. Сите 7 алтернативи служат идентична содржина → Google гледа 7 дупликати и го отфрла hreflang кластерот. **Фикс:** парсирај `?lang=` во `I18nProvider` при load.
- 🔴 **[i18n/seo]** **Англиски е најавен но не постои** — `hreflang="en"`, `?lang=en`, sitemap (сите 73 URL) и `inLanguage` JSON-LD постојат, но нема `locales/en.js`; `?lang=en` рендерира македонски. **Фикс:** испрати `en.js` (најголем organski unlock — „mentimeter alternative" се англиски пребарувања) ИЛИ отстрани `en` од hreflang/sitemap/JSON-LD додека не постои.
- 🔴 **[i18n]** **Покриеност ~2%** — секој locale фајл е ~24 клуча (nav/footer/common); `useI18n` се користи само во App/Nav/LanguageSwitcher; целата landing, Participant, Presenter, Host, Dashboard и модалите се хардкодирани МК, додека JSON-LD `featureList` тврди „Мултијазичен (mk/sq/sr/bg/hr/ro/en)". **Фикс:** преведи барем Landing + Participant + Join (страниците на кои паѓа hreflang трафикот) и ограничи ги `inLanguage`/featureList тврдењата на реалното.

### 1.4 Монетизација / веродостојност
- 🔴 **[monetization]** `Pricing.jsx` + `Checkout.jsx` — секој Pro план ветува „Пробај 14 дена бесплатно" (`trial:true`) и хедерот ветува no-card trial, но копчето води на `/checkout/:code` = **рачна банка/PayPal форма без trial активација**. Лажно ветување + изгубена активација. **Фикс:** имплементирај one-click trial grant (`pro_until = now+14d`) пред било какво плаќање — ИЛИ отстрани го trial тврдењето.
- 🔴 **[monetization]** `Sidebar.jsx:201` — `userPlan = user?.plan || 'basic'`, но канонската free вредност насекаде е `'free'` → за `plan='free'` корисници lock-иконите **и** „Upgrade to PRO" картичката (`Sidebar.jsx:259`) **не се рендерираат** → целата freemium upsell површина молчи за најчестата состојба. **Фикс:** користи ја заедничката `isPro(user)` од `lib/plans.js`.

### 1.5 Host — live-презентациски замки
- 🔴 **[ux]** `RemoteController.jsx` — full-screen overlay **без копче за излез и без `onClose`**, и го прекрива единствениот toggle („Далечинска" во HostHeader) → домаќинот е **заробен** во далечински режим без излез. (Потврдено со читање на кодот.) **Фикс:** експлицитно exit копче + Escape → `setIsRemoteMode(false)`.
- 🔴 **[bug]** `Host.jsx` — ArrowLeft/ArrowRight се регистрирани **двапати** (`useKeyboardShortcuts` + посебен `useEffect` window-listener) → еден притисок скокнува по еден слајд за време на презентација. (Потврдено со читање на кодот.) **Фикс:** отстрани го дупликат `useEffect` handler-от.

---

## 2. 🟠 HIGH — по теми

### 2.1 Монетизација / конверзија / SaaS
- 🟠 **[billing/стратешки]** Checkout е 100% рачен со „рачна потврда до 24h" (`Checkout.jsx`, `billing.js`: „Stripe ќе се додаде подоцна"). Ова е **намерен** ран избор, но за €5–20 импулсен производ тоа е најголемиот conversion-лимитер. **Препорака:** додај PayPal SDK / Stripe instant активација како примарен пат, задржи го manual само како fallback.
- 🟠 **[monetization]** `Pricing.jsx:71` vs `plans.js` vs `useEventCount` — „До 5 настани **месечно**" е всушност **lifetime total** (нема месечен ресет); UsageMeter брои сите настани некогаш. Лажно „месечно". **Фикс:** месечен ресет ИЛИ копи „вкупно".
- 🟠 **[monetization]** `PlanTab.jsx:5` покажува free `polls:'3'`, додека `plans.js` = 10 и Pricing = „10 анкети по настан" → in-app ја контрадицира pricing страницата во моментот на евалуација. **Фикс:** еден извор (`plans.js`).
- 🟠 **[bug]** `Sidebar.jsx:228-245` — `locked` е чисто козметички: `onClick` не го проверува, па „заклучен" Analytics сепак се отвора целосно. **Фикс:** спроведи го gate-от (upgrade екран) или отстрани ја lock иконата.
- 🟠 **[monetization]** Два преклопувачки „тим" концепта: заклучен „Креирај тим" stub vs. целосно функционален **Organizations** таб отклучен за сите (и free). Pricing продава тимска соработка што free корисниците веќе ја имаат. **Фикс:** консолидирај во еден Teams/Orgs surface; gate-ирај **места** по план.
- 🟠 **[monetization]** `AnalyticsTab.jsx:630-660` AI Insights е платен по `plans.js`, но UI го покажува на сите **без Pro badge и без gate** → revenue leak или лош UX. **Фикс:** Pro badge + inline upgrade CTA + `verifyProPlan()`.
- 🟠 **[monetization]** Pro-badge шема недоследна — amber „Pro" постои само во Host/EventSettings; dashboard Pro-gated фичи (AI Insights, SemanticSearch, AI генерирање) немаат ознака → free корисник го открива paywall-от преку server грешка. **Фикс:** еден `<ProBadge/>` + upgrade-popover насекаде.
- 🟠 **[conversion]** Pricing има две конкурентни „најдобро" сигнали (Semester „ПОПУЛАРНО" vs Yearly „НАЈДОБРА ПОНУДА" со доминантна темна картичка) → разреден anchor ефект. **Фикс:** еден визуелно препорачан план.
- 🟠 **[conversion]** Нема внатрешна Free-vs-Pro feature матрица (купувачот не гледа што отклучува CSV/PDF, брендирање, cohost, embed, advanced analytics). **Фикс:** споредбена мрежа генерирана од `plans.js`.
- 🟠 **[conversion/SEO]** Hero H1 „Слајдови кои слушаат. Идеи кои водат." е поетски но **без категорија** — h1 (најтежкиот on-page SEO текст) ги троши клучните зборови „интерактивни презентации/анкети во живо". **Фикс:** задржи го гласот но додај ја категоријата во H1.

### 2.2 SEO исправност
- 🟠 **[seo]** Prerendered страниците носат **контрадикторни дупликат hreflang + og:url** — `seoHelpers.js:injectMeta` додава page-specific алтернативи но не ги отстранува базните од `index.html` (7 root-pointing) ниту root `og:url` → `/pricing/index.html` има 11 конфликтни hreflang + два og:url; инжектираниот сет ги испушта sr/hr/bg/ro (4 од 7). **Фикс:** во `injectMeta` исфрли ги сите постоечки `link[rel=alternate]` и `meta[og:url]` пред да инжектираш, и емитувај ги сите 7 од заедничкиот `LOCALES`.
- 🟠 **[seo]** **Landing `/` не е prerendered** — најважната money страница е суров Vite SPA shell (празен `#root`); hero/FAQ/линкови постојат само по JS. **Фикс:** додај `/` во prerender листата (статичен hero/FAQ HTML или барем цел meta+JSON-LD сет) → воедно реален text LCP.
- 🟠 **[seo]** `useSEO` никогаш не чисти stale `og:image` → навигација BlogPost → `/terms` го остава post-от og:image → погрешен share preview. **Фикс:** reset на default во cleanup.
- 🟠 **[seo]** Sitemap `lastmod` = build датум за сите 73 URL → Google попустува униформни lastmod-и. **Фикс:** реални датуми (`blogPosts.date`, template `created_at`).
- 🟠 **[seo]** Prerendered `/templates` и `/blog` имаат **нула внатрешни линкови** (grid-овите се client-side) → откривањето на ~58 detail URL зависи од JS. **Фикс:** бидејќи `prerenderRoutes.js` веќе ги вчитува STARTER_TEMPLATES/blogPosts при build, инжектирај ги линковите во prerendered HTML.
- 🟠 **[seo]** Blog share слики се SVG (`/api/og`) — Facebook/LinkedIn/Twitter не рендерираат SVG og, и контрадицира со site-wide `og:image:type image/png`. **Фикс:** рутирај ги низ поправениот `/api/og-png`.

### 2.3 Accessibility (WCAG)
- 🟠 **[a11y]** **Модалите немаат focus-trap / Escape / initial-focus** — CreatePoll/CreateQuiz/EventSettings имаат `role=dialog aria-modal` но ништо од горното (2.1.2/2.4.3); исто CoHostModal (нема ни dialog semantics), OnboardingTour/HomeTab/FirstSuccessWizard модалите. Backdrop-click затвора, но keyboard корисник не може да затвори и Tab бега зад модалот. **Фикс:** focus containment + initial focus + Escape насекаде (една заедничка `useFocusTrap`/Modal wrapper).
- 🟠 **[a11y]** `Participant.jsx:640` — секоја poll опција има `aria-checked="false"` **хардкодирано** → SR секогаш најавува „not checked". **Фикс:** или тргни го radio/radiogroup (обични копчиња, бидејќи опциите веднаш submit-ираат), или следеј ја селекцијата искрено.
- 🟠 **[a11y]** `Participant.jsx` — нема live-region кога домаќинот менува активност → прашањето се менува молкум за SR (Presenter го има announcer-от). **Фикс:** ист announcer во Participant при `currentPoll.id` промена + при потврда на глас.
- 🟠 **[a11y]** `Participant.jsx:452-510` — survey scale + star копчиња **лош контраст** (unselected ~2.4:1; „below-selection" бел текст на светли пастели ~1.5:1; scale white-on-hsl, нијанси 36–72 под 3:1) + нема aria-label/min-max semantics. **Фикс:** темен текст на светли fill-ови, ≥4.5:1, селеција со border/weight, `aria-label="7 од 10 — {maxLabel}"`, ѕвездите `aria-label="Оцени n од 5"` + `aria-pressed`.
- 🟠 **[a11y]** `Nav.jsx:177-205` mega-menu е **mouse-only** (`onMouseEnter`), trigger-ите немаат `aria-expanded`/`aria-haspopup`, секој item е `<div onClick>` → недостапен за keyboard/SR. **Фикс:** отворај на focus/click, `aria-expanded`, items како `<button>`/`<a>`, Escape затвора.
- 🟠 **[a11y]** `SolutionsSection.jsx:15-19` картичките се click-only `motion.div` без role/tabIndex/key → keyboard губи 4 CTA (и сите водат на `/pricing`, што не одговара на „Дознај повеќе"). **Фикс:** вистински `<button>`/`<Link>` + коректна дестинација/лабела.
- 🟠 **[a11y]** `ComparisonSection.jsx:60-66` табелата е нечитлива за SR — ✓/✗/„Делумно" само со икони без text alt, `<th>` без `scope`, нема `<caption>`. **Фикс:** `sr-only` „Да/Не/Делумно" + `scope="col"`.
- 🟠 **[a11y]** Нема focus management при route change (`App.jsx` `AnimatePresence`) → SR/keyboard остануваат на врвот по секоја навигација. **Фикс:** focus `main` (tabIndex=-1) при `pathname` промена + announce.
- 🟠 **[a11y]** **Framer Motion го игнорира `prefers-reduced-motion`** — CSS kill-switch-от важи само за CSS анимации; сите Framer spring/keyframe (floating реакции, 22rem countdown, card entrances, hero floating icons) продолжуваат. **Фикс:** `<MotionConfig reducedMotion="user">` околу app-от.
- 🟠 **[a11y]** Контраст на мал текст site-wide — `text-slate-300/400` на бело (~3.0:1) за 11–12px лабели (Landing „Користат наставници од:", ThreeStep описи, dashboard празни состојби `slate-200/300`), `placeholder:text-white/40` на indigo PIN (~2:1), presenter footer `slate-500/600` на `slate-900` (~2.8:1). **Фикс:** `slate-500/600` by default за сè што се чита.

### 2.4 Перформанси (ризик при стотици учесници)
- 🟠 **[perf]** `useEvent.js:142-160,286` + `WordCloud.jsx:96` — **секој глас** → `postgres_changes` на `options` → full `polls+options` refetch → цел Presenter tree re-render (layout springs, AnimatedBackground, heatmap), и за wordcloud скапиот d3-cloud simulated-annealing layout рестартира од нула по глас. **Фикс:** debounce `fetchPolls` (~300–500ms trailing) + memoize/patch WordCloud зборови наместо full relayout.
- 🟠 **[perf]** `EventWrapper.jsx:123-140` — leaderboard effect зависи од `polls` (идентитет се менува по секој глас) → projector-от прави full `votes` scan низ сите quiz polls по глас — најтежкиот query во апликацијата, пуштен со vote-rate. **Фикс:** зависи од quiz-poll ID-ња (joined string) + throttle, ИЛИ subscribe на `votes` inserts.
- 🟠 **[perf]** Landing eager payload — еден голем `vendor` chunk + landing eagerly влече framer-motion + supabase-js (за PIN validation + Nav `warmUp`) пред било каква интеракција; заедно со непререндерираното `/` → LCP е JS-painted. **Фикс:** prerender `/`, `modulepreload` landing chunk-от, lazy-init Supabase на прв PIN keystroke.

### 2.5 Багови / коректност (host + participant + nav)
- 🟠 **[bug]** `useHostSession.js:onSavePoll` + `Host.jsx:onSave` — `onSavePoll` голта грешки (`alert` + return false наместо throw) → модалот се затвора и `finally` ја **брише формата и при неуспешен save** → домаќинот го губи draft-от. **Фикс:** rethrow (или модалот да го провери boolean-от) и задржи го модалот + полињата при грешка.
- 🟠 **[bug]** `EventWrapper.jsx:152` + `Participant.jsx:349` — со `allow_multiple_votes`, `userVoted` е forced false, но quiz feedback (`quizResult`) се рендерира само во `userVoted ? …` гранката → учениците во multi-vote quiz **никогаш не гледаат дали биле точни**. **Фикс:** рендерирај го `quizResult` независно од `userVoted`.
- 🟠 **[bug]** `Participant.jsx:141-145` — `submitRating` ги match-ира ѕвездите по `options.findIndex(o.text === val.toString())`; ако rating опциите не се буквално „1"–„5", индексот е −1 и tap-от **молкум не прави ништо**. **Фикс:** map по позиција (`handleVote(star-1)`) или error state.
- 🟠 **[omission]** `store.js:17` + `PresenterSidebar.jsx:27-33` — `setActiveNow` **никогаш не се вика** → `activeNow` е трајно 0 → „🔥 X активни сега" никогаш не се појавува. **Фикс:** имплементирај 4s activity ping (presence track на vote/reaction) или отстрани го мртвиот UI.
- 🟠 **[bug]** `useEvent.js:314` — `sendReaction` проверува `event.is_reactions_enabled`, но колоната **не е во select листата** → секогаш undefined → toggle-от „исклучи реакции" е молкум игнориран; `bg_variant` (Presenter:175) исто unfetched → background секогаш 'aurora'. **Фикс:** додај ги во select.
- 🟠 **[bug]** `EventWrapper.jsx:354-357` — participant `timerRemaining`/`timerExpired` се пресметуваат еднаш по render без ticking interval → countdown замрзнува меѓу re-render-и и „time's up" lockout-от доцни; Presenter си има свој interval → двете view-а дрифтуваат. **Фикс:** 1s interval effect во EventWrapper.
- 🟠 **[bug]** Footer „Решенија" колона = 4 мртви линка (`App.jsx:345-347`, `<div className="cursor-pointer">` без onClick/href, не-focusable). **Фикс:** `#education`/`#solutions`/`/schools` како вистински `<a>`/`<button>`.
- 🟠 **[bug]** Footer social линкови водат на генерички homepages (`App.jsx:311-313` linkedin.com/facebook.com/instagram.com без профил) → лажна social proof + leak на клик. **Фикс:** реални профили или отстрани ги иконите.
- 🟠 **[bug]** Footer „Функционалности" + Nav mega-menu feature линкови dead-end во login за анонимни (`view:'host'` → ProtectedRoute bounce). **Фикс:** рутирај на јавни страници (`/demo`, `/templates`, features секција).
- 🟠 **[bug]** Nav „Ресурси" mega-menu items се inert (`Nav.jsx:146-160`, немаат `type` → onClick само го затвора менито). **Фикс:** Блог→`/blog`, ЧПП→`#faq`; отстрани ги оние без дестинација.
- 🟠 **[bug]** `CoHostModal.jsx:64-66` co-host flow ги заробува анонимните (ProtectedRoute ги пренасочува на login без објаснување). **Фикс:** „најавете се за да продолжите" пред навигација.
- 🟠 **[ux]** `Participant.jsx` ranking се потпира на HTML5 `draggable`/`onDrop` што **не работи на touch** — примарната participant површина; ↑/↓ копчињата се единствениот мобилен пат но се визуелно секундарни. **Фикс:** pointer-based reorder или промовирај ги копчињата како примарен affordance на мали екрани.

### 2.6 Responsive / mobile (визуелно + код)
- 🟠 **[ui/responsive]** **Desktop nav overflow на ~1440px** (визуелно потврдено): примарното CTA „Регистрирај се" е **отсечено** од десниот раб; „ПРИКЛУЧИ СЕ"/„Најави се" се превиткуваат во 2 реда. Site-wide (Nav). **Фикс:** collapse во hamburger порано / shrink+wrap грациозно / осигурај CTA никогаш да не се сече.
- 🟠 **[ux/mobile]** Dashboard mobile bottom-nav покажува **само 5 таба** (`hidden md:block` sidebar) → Organizations, Templates, Plan, Referrals, Integrations, API се **целосно недостапни** на телефон. **Фикс:** „Повеќе" sheet/menu.
- 🟠 **[ui/mobile]** Participant header overflow ≤390px (визуелно): „АКТИВНО" pill отсечен десно; статус-редот не собира. **Фикс:** wrap/condense статус-редот.
- 🟠 **[a11y/mobile]** Cover/logo „remove" копчиња користат `opacity-0 group-hover:opacity-100` → **недостапни на touch и keyboard** (hover-only). **Фикс:** покажи на focus + мин. tap target.

---

## 3. 🟡 MEDIUM (групирани)

**Конзистентност на error-handling (host):** `setAllowMultipleVotes` optimistic без revert; речиси секој `events.update` во EventSettingsModal е silent (неколку `setEvent` трчаат независно од успех); PollCard `toggleModeration`/`resetVotes` без revert; `handleDrop` reorder без revert/resync. → Стандардизирај optimistic-set-with-revert-on-error насекаде + toast/inline грешка.
**Stale uncontrolled inputs:** EventSettings title/cover/password користат `defaultValue`+`onBlur` → при промена на `event` од realtime/co-host покажуваат stale вредности. → controlled или key by prop.
**EventSettings footer „Зачувај и затвори"** само вика `onClose()` (полињата persist на blur) → лабелата лаже. → преименувај во „Затвори" или имплементирај save-all.
**Timer expiry молкум** (`HostNavBar`) — нема најава/звук/auto-lock кога countdown стигне 0. → `announce('Времето истече', {assertive})` и/или auto-lock.
**CreatePollModal `getTitle` нема `case 'rating'`** → rating активност покажува погрешен header „Нова анкета". → додај rating наслов.
**Survey `choice` под-прашање може да се зачува со 0–1 опции** (валидација проверува само текст). → барај ≥2 non-empty за choice.
**Presence count неточен** — ги брои host/presenter + multi-tab дупликати, нема heartbeat (ghost keys при тивко умрен WebSocket). → исклучи `role:'host'` од participant-facing count + периодичен re-track.
**Survey double-submit** (`surveySubmitting` stale-closure, нема conflict target, catch само console.error). → ref guard + `voteError` + dedupe на `(poll_id, session_id)`.
**`allow_multiple_votes` re-vote stacking** — ranking ги таложи Borda тежините, quiz додава extra correct редови во leaderboard, survey дупликат одговори. → cap per real session server-side или aggregate by distinct session.
**`voteError` не се чисти** при `activePollIndex` промена → stale „Гласањето не успеа" следи на следното прашање. → reset во `currentPollId` effect.
**Waiting-state fallback poll нема `type`** → Participant рендерира празен radiogroup под „Чекаме домаќинот…". → додај `type:'poll'`.
**Join code input без `<label>`/aria** (placeholder-only) + нема loading state / inline feedback за погрешен код. → видлива лабела + `aria-describedby` error slot.
**„X/Y одговориле" chip** (`PresenterSidebar`) бесмислен за ranking (Borda sums) и wordcloud (повеќе зборови/лице), и whitelist-от вклучува `'quiz'` што никогаш не е `currentPoll.type` (quiz е `type:'poll'+is_quiz`). → derive од distinct sessions + match `is_quiz`.
**4 преклопувачки first-run искуства** (redirect `/onboarding` + spotlight tour + HomeTab auto „Брз водич" модал + FirstSuccessWizard) — можат да се наредат два дијалога. → еден канонски activation path.
**OnboardingChecklist „Сподели со учесници"** има `action:null` (само localStorage flag) → никогаш не се завршува од checklist-от → трајно го блокира „🎉 Подготвен!". → реална акција.
**PlanTab `isPro` игнорира `pro_until`** expiry → `plan='yearly'` со истечен `pro_until` е Pro тука но не на друго место. → единствен `isPro`/`effectivePlan` helper.
**PlanTab usage bars се декоративни** (free=`w-full`, pro=`w-1/4`; именителот го повторува истиот број). → реален usage или отстрани ги.
**Upgrade CTA рутирање недоследно + PlanTab е purchase dead-end** (нема buy копче; корисникот мора да отскокне на маркетинг Pricing). → директни per-plan checkout CTA на PlanTab.
**Ветени фичи без UI:** yearly „Интеграции: PowerPoint/Google/e-дневник" е static asset страница што сама вели „Product-side интеграции се затворени"; „Сопствени бои/брендирање" мапира на `branding` flag **без** brand-color settings екран. → продавај само што има UI; изгради branding settings панел.
**Org seat/member lifecycle нецелосен** — `{member_count}/{seats}` е read-only; owner не може да додава/вади места/членови, менува улоги, пренесува ownership. → member/role/seat management за owner/admin.
**Invite без email** — owner мора рачно да го копира линкот (висок friction за нетехнички наставници). → Supabase Edge Function email (link-copy како fallback).
**AcceptInvite success нема ориентација** кон org/заеднички настани. → land на org view / shared events.
**Referral program закопан** — нема prompt во моментот на delight. → referral CTA на checklist complete + post-session recap.
**„Неделен дигест" toggle без output** — `email_digest` се persist-ира но нема видлива recap испорака ниту in-app recap картичка. → изгради recap email + in-app recap на Home.
**QR `fgColor={brandColor}` без luminance guard** — светла brand боја (жолта) прави QR нечитлив на проектор во моментот кога стотици се приклучуваат. → force dark fgColor кога контрастот со бело е под ~3:1.
**`submitResponse` го чисти текстот веднаш** без await → ако гласот падне, внесениот одговор е загубен. → задржи го додека не резолвира / врати го при грешка.
**Comparison табела спорни тврдења** — „Бесплатно до 200 — Mentimeter ✗" (Mentimeter free нема hard cap) и „Модерација — Mentimeter ✗" (има). Погрешни comparative-advertising тврдења = правен/credibility ризик. → верификувај секоја ќелија + sources footnote + држи го датумот свеж.
**Social proof unverifiable** — CountUp (800+/12 000+/98%) + имиња на институции без permission trail/source. → користи само институции со дозвола + stats од реална DB.
**Нема consent механизам** — Vercel Analytics unconditional + `mkd_referrer` 90 дена во localStorage; PrivacyPolicy открива само session cookies. → откриј ги двете во policy-то; consent gate ако додадеш cookie analytics.
**Participant reaction bar overflow** (визуелно) — последната емоција отсечена десно на тесни екрани. → wrap/scroll.
**Dashboard-home onboarding tour spotlight** го прекрива dashboard-от (визуелно) → размисли за помалку блокирачки прв-пат pattern / јасен skip.

---

## 4. 🟢 LOW (листа за чистење)

- `Participant.jsx:371` **„Не точно" е правописна грешка** → „Неточно" (еден збор); огледај во results view-ата.
- `EventWrapper.jsx:47` vs `useEvent.js:9` — **две паралелни session-ID имплементации** со различни localStorage клучеви (`mkd_session_id` vs `mkd_session`) → ист browser = две сесии. → консолидирај.
- `Presenter.jsx:72,88` — `eventCode` fallback хардкодиран `'982341'` (QR би покажал на bogus настан); `averageRating` `parseInt(opt.text)` дава „NaN" во 12rem ако опциите не се нумерички. → guard оба.
- `EventWrapper.jsx:186` not-found екран го исфрла суровиот driver message во monospace на учениците. → log + пријателска порака.
- `apple-touch-icon` покажува на SVG (`index.html:17`) → iOS home-screen shortcut добива screenshot thumbnail. → `/icon-color.png`.
- Sitemap ги испушта indexable `/privacy` и `/terms`. → додај ги.
- Дупликат/конфликтен structured data — landing носи и `index.html` SoftwareApplication (5 offers) и `Landing.jsx` EducationalApplication (3 offers); contact email се разидува (`support@slidea…` vs `support@mismath…`); `/pricing` PriceSpecification без цена. → еден конзистентен graph.
- Leftover хардкодирани стрингови каде постојат клучеви (`App.jsx` Suspense „Се вчитува…", copyright/„Направено со ❤️ во МК", `Nav.jsx` `aria-label="Мени"`).
- Word-cloud demo ги ре-анимира сите зборови на секој tick (`InteractiveDemoBlock.jsx:96-104`, key by index). → key by `word.text`.
- `HomeTab` quick stats vanity метрики — „Вкупно настани" покажува `'6+'` за секој со >5 (`.limit(6)`); „Типови активности" хардкодиран `'7'`; „Шаблони" е catalog size. → реални weekly votes/participants.
- `Checkout.jsx` `orderId` се регенерира на секој mount → refresh го осира pending order-от; нема валидација освен email, нема промена на план од checkout. → persist draft order id + plan edit/summary.
- Dashboard default `case` „Наскоро достапно…" + `case 'team'` хардкодиран stub → испрати ги или отстрани ги од навигацијата (dead-end-и).
- `Dashboard.jsx` `activeTab` е само local state → табовите не се URL-synced (нема deep-link, refresh секогаш на Home). → sync со URL.
- Sidebar nav нема arrow-key/roving tabindex, нема skip-link; bell dropdown без `aria-expanded`. → keyboard nav + disclosure semantics.
- FAQ accordion без `aria-expanded`/`aria-controls`. → додај ги + id/aria-labelledby.
- Неколку input-и без програмски лабели (JoinCodeEntry PIN, demo word, CoHostModal placeholder-only, LoginModal `<label>` без htmlFor/id). → aria-label или htmlFor/id.
- PIN validation status visual-only (spinner/check/X без aria-live). → `aria-live="polite"`.
- Remote mode live question/count/% без aria-live region. → polite live region.
- Quiz authoring parity gap — нема presenter notes/curriculum tags/cover image (што CreatePoll ги има), само еден точен одговор (нема multi-select). → parity за feedback/explanation flows.
- `RemoteController` `responsePct` capped на 100 но со multiple votes `responseCount` може да надмине `activeParticipants` → progress bar pinned, ratio бесмислен. → unique voters или појасни ја метриката.
- `Host.jsx:runIfPro` `proCheckPending` ги disable-ира **сите** Pro копчиња одеднаш без per-button spinner. → loading само на кликнатото копче.
- `PollCard` inline breakdown рендерира само `options.slice(0,4)` → за 5–8 опции домаќинот не го гледа остатокот без presenter. → сите или „+N more".
- `sendPushToParticipants` праќа push на **секој** `setActivePoll` → брзо Next/Prev (лесно со double-nav багот) ги спамира учесниците. → debounce / skip при навигација назад.
- `OnboardingTour`/HomeTab/FirstSuccessWizard модали — tour overlay full-screen `<svg onClick>` без focus trap/aria-modal/ESC. → focus trap + ESC + role=dialog.

---

## 5. ✅ ШТО Е ОДЛИЧНО — ЗАЧУВАЈ (не „поправај" во следна сесија)

- **Зрел real-time sync**: 3s REST fallback со time-based grace window (не се disable-ира трајно), посебен 8s lock-state poll, `withLockRetry` за `lock:sb-*` contention, stale `active_poll_id` guard, `ended_at`-базирана ended-vs-paused диференцијација.
- **Дупликат-channel crash навистина поправен**: presence во еден `presence:${id}` канал, `sendReaction` го ре-користи `reactionChannelRef`, cleanup ги вади сите 6 канали + pending timeouts.
- **Server-verified Pro gating** (`runIfPro`/`verifyProPlan`) — не верува на клиентскиот `user.plan`.
- **Богата per-page SEO**: секој public view вика `useSEO` со уникатни наслови/описи; 70+ prerendered рути со точен `Course`/`BlogPosting`/`BreadcrumbList`/`CollectionPage` JSON-LD; events правилно `noindex` со динамички наслови.
- **Sitemap & robots точни**: 73 URL (вкл. community темплејти), full 7-locale + x-default hreflang од еден `LOCALES` извор, robots блокира `/event/`,`/api/`,`/host`,`/dashboard`,`/onboarding`.
- **Силна a11y основа**: skip-link, глобален `:focus-visible` 3px, `prefers-reduced-motion`+`prefers-contrast` CSS, `LiveAnnouncer`, `role=dialog`+`aria-modal` на ~15 модали, ѕвездите најавени како „X од 5 ѕвезди".
- **Пристапен WordCloud**: МК stop-word филтер, case-insensitive merge, `aria-label` со top 10 зборови + броеви.
- **Безбеден invite flow**: single-use token линкови + copy + optimistic revoke + duplicate handling (`23505`) + јасно „no auto-email"; `AcceptInvite` чисто ракува invalid/expired.
- **`UsageMeter` = учебник contextual upgrade nudge** (warn ≥60% / critical ≥90% со inline CTA во моментот на scarcity).
- **`FirstSuccessWizard` = одлична активација** (subject → готов час → launch Host во 3 клика, „Без AI · без чекање").
- **Силен B2B/училишен billing UX**: 3 локализирани методи + copy-to-clipboard банка + invoice/legal-entity полиња (org name, ЕДБ, `needs_invoice`).
- **`AnalyticsTab` богат и retention-worthy**: real-time per-poll drill-down, session A/B, AI insights, со guided empty states.
- **ProfileTab зрелост**: self-serve GDPR CSV export + delete-request, dark-mode, notification prefs.
- **Vote-preserving edit path**: `onSavePoll` ги update-ира option редови in-place по id (без delete-then-insert vote loss).
- **Quiz секогаш има точно еден точен одговор** (default + reassign при бришење); ranking/poll не можат со <2/празни опции.
- **Визуелно полирано** (инспекција на 24 екрани): hero, login модал (Google-first + Workspace/Classroom note = паметно за edtech), remote control (mobile-first, јасни affordances, disabled prev кога е прв poll), participant poll опции (добри touch targets), presenter results (читливо на проектор).

---

## 6. 🗓️ ПРЕПОРАЧАН ПЛАН ЗА СЛЕДНА СЕСИЈА (приоритизиран, по спринтови)

> Секој чекор = build + e2e (веќе имаме покриеност за 8 типови + remote + live flow) + commit. Не менувај однесување освен каде наодот експлицитно бара.

### Sprint 1 — критично: интегритет + продукција + правна веродостојност *(највисок ROI, најитно)*
1. Double-vote race → `isVotingRef` + `submitting` disable (`EventWrapper.jsx:397`).
2. Offline queue → replay RPC / DB trigger (`offlineQueue.js:46`).
3. **Поправи `/api/og-png` 500** + статичен PNG fallback (верификувај live по deploy).
4. **i18n core**: парсирај `?lang=`; испрати `en.js` (или отстрани `en` од hreflang/sitemap/JSON-LD); gate-ирај ги `inLanguage`/featureList тврдењата.
5. Trial: имплементирај one-click grant ИЛИ отстрани го тврдењето (`Pricing.jsx`/`Checkout.jsx`).
6. `plan='free'` upsell → `isPro(user)` (`Sidebar.jsx:201,259`).
7. Remote exit копче + Escape; отстрани го дупликат arrow handler (`Host.jsx`).
*Верификација:* e2e за double-tap (два брзи клика → options.votes=1); curl/web_fetch на `/api/og-png` → 200 + PNG; `?lang=en` рендерира англиски (или 404/redirect ако не постои).

### Sprint 2 — a11y + SEO исправност + мртви линкови *(квалитет/комплајанс/краулабилност)*
8. Заедничка `useFocusTrap`/Modal wrapper → сите модали (focus trap + Escape + initial focus + CoHost dialog semantics).
9. `<MotionConfig reducedMotion="user">` околу app-от.
10. Participant a11y: тргни hardcoded `aria-checked` (обични копчиња), live-region при ново прашање, aria-label/контраст на scale+stars, focus на route change.
11. Nav mega-menu + Solutions картички + Comparison табела → вистински контроли + SR текст + scope/caption + keyboard.
12. Контраст sweep: `slate-300/400`→`500/600` за читлив текст (landing, dashboard, presenter footer, PIN placeholder).
13. SEO: `injectMeta` исфрли дупликат hreflang/og:url + емитувај 7 locales; **prerender `/`**; `useSEO` чисти stale og:image; реални sitemap lastmod; внатрешни линкови во prerendered `/templates`,`/blog`; blog og→`og-png`.
14. Мртви линкови: footer „Решенија", social, nav/footer feature dead-ends, inert „Ресурси", co-host anon strand.
*Верификација:* Lighthouse a11y ≥90 на landing; view-source на `/pricing` покажува еден конзистентен hreflang сет; `/` prerendered со hero текст во HTML.

### Sprint 3 — монетизацијска јасност + mobile *(конверзија/ARPU)*
15. Еден извор за планови (`plans.js`) → синхронизирај Pricing/PlanTab/Sidebar (polls, настани месечно vs вкупно, locked gate спроведен).
16. Консолидирај Teams/Orgs (gate места по план); Pro badge + gate на AI Insights/SemanticSearch; Free-vs-Pro матрица; еден препорачан план.
17. Instant payment (PayPal SDK/Stripe) како примарен пат; manual fallback.
18. Mobile: dashboard „Повеќе" sheet; ranking pointer-reorder; hover-only remove копчиња → focus+tap; participant header overflow; desktop nav overflow (hamburger порано).
19. Branding settings панел (ветената фича); org seat/member management; invite email (Edge Function).
*Верификација:* free корисник ги гледа lock-овите + upsell; locked таб не се отвора; mobile сите табови достапни.

### Sprint 4 — перформанси при скала + полирање *(стабилност на големи настани)*
20. Debounce `fetchPolls` + memoize/patch WordCloud; leaderboard effect по quiz-poll IDs + throttle (или votes-insert subscription).
21. Landing perf: prerender `/` + `modulepreload` + lazy-init Supabase на прв PIN keystroke.
22. Error-handling sweep во host (optimistic+revert стандард за сите toggles/updates/drag; toast на EventSettings fail; задржи draft при save fail).
23. Participant/Presenter коректност: quiz feedback под multi-vote; `submitRating` по позиција; `setActiveNow` ping или отстрани; `is_reactions_enabled`/`bg_variant` во select; participant timer interval; waiting fallback `type`.
24. LOW листа (правопис „Неточно", session-ID консолидација, eventCode/averageRating guards, apple-touch-icon PNG, sitemap /privacy /terms, structured-data консолидација, vanity метрики, checkout orderId persist, demo word-cloud key, итн.).
*Верификација:* load test 300→500 учесници со vote-burst (веќе имаме скрипта на VPS) — потврди дека per-vote query storm-от е намален.

### ⚡ Брзи победи (<30 мин секоја, веднаш)
„Неточно" typo · `apple-touch-icon`→PNG · `eventCode`/`averageRating` guards · footer 4 мртви линка + social линкови · nav inert „Ресурси" · `useSEO` stale og:image clear · sitemap +`/privacy`,`/terms` + реални lastmod · `submitRating` по позиција · waiting fallback `type:'poll'` · demo word-cloud key by text.

---

## 7. Додаток — визуелни наоди од инспекција на 24 екрани
(Интегрирани погоре во 2.6/3; овде прегледно.) Desktop nav overflow (CTA clipped) · participant header overflow ≤390px · reaction bar overflow · Pricing „Бесплатен" без card контејнер (недоследност) · dashboard-home onboarding tour го прекрива dashboard-от · Pricing = **5 нивоа** (Бесплатен/Месечен €5/Квартален €10/Семестрален €15/Годишен €20) + 14-дневен no-card trial + 30-дневна гаранција (моите инвеститор-документ и упатство го потценија ова — **ажурирај ги**). Позитивно: hero, login модал, remote control, participant опции, presenter резултати — полирано.

---

## 8. Додаток — верификации направени оваа сесија
- `/api/og-png?type=template&title=Test&subject=Math&grade=G5` → **HTTP 500** (live, потврдено).
- Double arrow handler + remote-no-exit → потврдено со читање на `Host.jsx`/`RemoteController.jsx`.
- Nav overflow / mobile overflows / Pricing 5 нивоа → потврдено визуелно (24 автоматски снимки во `docs/user-manual/images/`).
- `gemini-embedding-2` враќа 768-dim (потврдено) → RAG миграцијата е безбедна по димензија.

---

*Овој извештај е основа за следната сесија. Препорачан старт: **Sprint 1** (интегритет на гласовите + `/api/og-png` + i18n core + trial/upsell + host замки) — најголемо влијание врз коректност, продукциски share-ови, organski трафик и конверзија, со најмалку ризик по постоечкото однесување.*
