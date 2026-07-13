# Рефакторирање на најголемите фајлови — детален план (14.07.2026)

Цел: да се сведат `src/views/Presenter.jsx` (1124 линии) и `src/views/Landing.jsx` (1181 линии) на компонент-orchestrator фајлови (~150-300 линии секој), со остатокот извлечен во добро скроени под-компоненти. Ова е чисто структурен рефактор — **нема да се менува ниту еден пиксел, ниту едно однесување**, само локацијата на кодот. Секој чекор подолу е независен и мал доволно да се тестира веднаш по себе (build + vitest + рачна проверка во browser), пред да се премине на следниот.

Причина зошто е ова важно (не само козметика): и двата фајла се на најкритичните екрани — Presenter.jsx е екранот на кој дословно се потпираш пред жива публика (вебинар со стотици луѓе), а Landing.jsx е првиот допир со секој нов клиент/донатор/спонзор. Секоја идна промена во нив (нов тип активност, нова маркетинг секција) моментално носи повисок ризик од несакани споредни ефекти токму затоа што се толку големи — тешко е да се биде сигурен дека промена во ред 400 нема да влијае на нешто во ред 900.

## Redoslед на работа (најбезбедно кон најризично)

Секогаш: (1) extract, (2) `npm run build`, (3) `npx vitest run`, (4) рачна проверка во browser на засегнатиот екран, (5) commit — пред да се продолжи на следниот чекор. Никогаш повеќе од едно извлекување по commit.

---

## Presenter.jsx (1124 → проценето ~280 линии)

### Чекор 1 — Chart view компоненти (најбезбедно, нула зависности од parent state)
Извлечи во **`src/components/Presenter/ChartViews.jsx`**:
- `PALETTE` (константа, редови 38-45)
- `MODES` (редови 48-53)
- `DonutLabel` (56-68)
- `BarsView` (71-107)
- `DonutView` (110-167)
- `PodiumView` (170-230)
- `NumbersView` (233-262)

Сите се веќе чисти presentational компоненти со само `options`/`totalVotes` props — нула зависност од Presenter-овата состојба. Најлесен, нула-ризик прв чекор.

### Чекор 2 — `renderResults()` по тип активност
Ова е најголемиот и најсложен дел (редови 428-633, ~200 линии switch-налик логика за survey/wordcloud/scale/rating/ranking/open/poll-quiz). Извлечи во **`src/components/Presenter/PollResultsRenderer.jsx`** — прима `currentPoll`, `visibleOptions`, `totalVotes`, `surveyResponses`, `averageRating`, `chartMode` како props, увезува `ChartViews.jsx` компонентите + `WordCloud`. Оваа компонента е чисто derive-and-render — нема свои hooks/effects, само чиста функција на props → JSX, па е безбедна за извлекување и покрај големината.

### Чекор 3 — Header (лого/наслов/QR/код/тајмер)
Извлечи редови 722-770 во **`src/components/Presenter/PresenterHeader.jsx`** — прима `event`, `eventCode`, `joinUrl`, `brandColor`, `logoUrl`, `getSubTitle()` резултат, `timerRemaining` како props. Чисто presentational.

### Чекор 4 — Floating reactions overlay +бројач
Извлечи редови 655-720 (floating emoji анимации + кумулативен бројач) во **`src/components/Presenter/FloatingReactions.jsx`** — прима `reactions` низа. `getReactionMeta`/`reactionMetaRef`/`seenReactionIds`/`totalReactions` state треба да патуваат СО компонентата (тие се внатрешна имплементациска деталка на самата reactions-анимација, не се користат никаде поинаку во Presenter.jsx) — значи овој state се преместува исто така, не само JSX-от.

### Чекор 5 — Десен sidebar (Q&A / Leaderboard)
Извлечи редови 827-947 во **`src/components/Presenter/PresenterSidebar.jsx`** — прима `currentPoll`, `leaderboard`, `questions`, `activeParticipants`, `activeNow`, `totalVotes`, `brandColor`, `markQuestionAnswered`, `setQuestionPinned`, `setQuestionHidden` како props. `pendingAnsweredId` state (за "Потврди" двоен-клик заштита на "Одговорено" копчето) патува со компонентата.

### Чекор 6 — Footer контроли (pause/timer/confetti)
Извлечи редови 1033-1119 во **`src/components/Presenter/PresenterControls.jsx`** — прима `event`, `onToggleLock`, `lockPending`, `handleToggleLock`, `timerRemaining`, `timerPickerOpen`, `setTimerPickerOpen`, `handleStartTimer`, `handleStopTimer`, `fireConfetti` (или самата `fireConfetti` функција може да остане во главниот фајл и да се проследи како prop, бидејќи е stateless). `timerPickerRef` за outside-click detection патува со компонентата.

### Чекор 7 — Overlays (notes / countdown / pause banner)
Овие се мали (secana под 60 линии секој) — извлечи ги заедно во **`src/components/Presenter/PresenterOverlays.jsx`** ако сакаш допоплнителна чистота, или остави ги во главниот фајл (се прифатливи по големина сами по себе). Опционален чекор — не е неопходен за да се стигне под ~300 линии.

### Резултат по сите чекори
`Presenter.jsx` останува со: imports, `toggleFullscreen`/`fireConfetti` helper functions, главниот `Presenter` компонент кој содржи state/effects (hooks, keyboard shortcuts, timer countdown, survey fetch, reaction tracking) + derivирани вредности (`currentPoll`, `visibleOptions`, `totalVotes`, `averageRating`, `getSubTitle()`) + composition на извлечените под-компоненти. Проценето ~250-300 линии.

---

## Landing.jsx (1181 → проценето ~200 линии)

### Чекор 1 — Статички податоци
Премести во **`src/data/landingContent.js`**: `testimonials` (42-70), `faqItems` (72-101, **внимание**: се користи и за JSON-LD FAQPage schema во `useSEO()` повикот — мора да остане увезен во главниот фајл, не само во под-компонентата), `demoPollData` (103-107), `demoQuizOptions` (109-114), `solutions` низата (227-232). Нула ризик, чисто движење на податоци.

### Чекор 2 — `CountUp` компонента
Извлечи редови 14-40 во **`src/components/CountUp.jsx`** — целосно самостојна, нула зависности од Landing.jsx. Може да се искористи и на други места (пр. Pricing.jsx ако некогаш затреба).

### Чекор 3 — Interactive Demo Block (word cloud / poll / quiz преглед во херото)
Извлечи редови 433-567 (целиот десен-раце demo блок вклучувајќи ги трите табови) во **`src/components/Landing/InteractiveDemoBlock.jsx`**. State-от (`activeDemo`, `demoValue`, `demoWords`, плус `useEffect`-от за автоматско додавање зборови, `addWord` функцијата) патува СО компонентата — тој state воопшто не се користи надвор од овој блок. Прима `demoPollData`/`demoQuizOptions` од `landingContent.js` директно (не преку props).

### Чекор 4 — Join-code entry (PIN внес со live валидација)
Извлечи редови 316-375 во **`src/components/Landing/JoinCodeEntry.jsx`** — прима `code`, `setCode`, `setView` како props (веќе постојат како props на Landing самата, само се проследуваат натаму). `codeStatus`/`validationTimer`/`handleCodeChange` state и логика патуваат со компонентата — moментално се дефинирани на Landing ниво (172-195) но никаде не се користат надвор од PIN-полето.

### Чекор 5 — Co-host модал
Извлечи редови 1105-1176 (целиот модал + form logic) во **`src/components/Landing/CoHostModal.jsx`** — прима `isOpen`/`onClose` (наместо `isCoHostOpen`/`setIsCoHostOpen`). Внатрешна состојба (`coHostCode`, `coHostError`, `coHostLoading`) патува со компонентата. Trigger-копчето ("Сте Ко-домаќин?") останува во Hero-секцијата на Landing.jsx (или во Чекор 4-компонентата), само отвора модалот преку `onOpen` prop/callback.

### Чекор 6 — Маркетинг секции (сите чисто presentational, нула state)
Секоја од следниве станува своја компонента во `src/components/Landing/`:
- **`ThreeStepSection.jsx`** (570-628)
- **`TestimonialsSection.jsx`** (630-675, прима `testimonials` од landingContent.js)
- **`EducationSection.jsx`** (677-853, најголема од овие — содржи и "activity type showcase" под-grid-от; може да се подели дополнително ако сакаш, но не е неопходно)
- **`SolutionsSection.jsx`** (855-887, прима `solutions` + `setView`)
- **`ComparisonSection.jsx`** (889-970, вклучувајќи ја малата inline `Cell` helper компонента)
- **`FeaturesDetailSection.jsx`** (972-1027, прима `setView`)
- **`FaqSection.jsx`** (1029-1079, прима `faqItems`; `openFaq`/`setOpenFaq` state може да се пренесе внатре во компонентата бидејќи не се користи никаде инаку)
- **`TrustBannerSection.jsx`** (1081-1103, прима `setView`)

### Резултат по сите чекори
`Landing.jsx` останува со: `useSEO()` повикот (кој треба `faqItems` за JSON-LD — увезен од `landingContent.js`), state кое навистина е споделено на Hero ниво (`code`/`setCode` доаѓаат однадвор, `isCoHostOpen` за модалот), `scrollToSection` helper, и composition на сите извлечени секции по редослед. Проценето ~180-220 линии.

---

## Ризици и mitigации
- **Presenter.jsx е live-critical** — тестирај рачно во browser (отвори `/event/:code/present` со активна анкета од секој тип: poll, quiz, wordcloud, survey, scale, rating, ranking, open) по секој чекор, не само build/vitest. Ниту еден автоматски тест моментално не го покрива Presenter renderResults() патот.
- **Landing.jsx JSON-LD/SEO** — по секој чекор провери дека `view-source:` или dev tools сѐ уште покажува исправен FAQPage/EducationalApplication structured data (лесно е случајно да се скрши ако `faqItems` референцата се изгуби при преместување).
- **Co-host модал** содржи реален auth/RPC повик (`find_event_by_cohost_code`) — тестирај го вистинскиот co-host login пат по Чекор 5, не само дека модалот се отвора/затвора.
- Секој чекор = свој commit, со јасна commit порака ("refactor: extract ChartViews from Presenter.jsx, no behavior change"), за лесно `git revert` ако нешто тргне наопаку.

## Проценето вкупно траење
7 чекори за Presenter + 6 чекори за Landing = 13 мали, независни commits. Со целосно тестирање по секој, реално еднодневна до дводневна работа (не за брзање во еден потег) — токму затоа претходно препорачав ова да биде посебна, фокусирана сесија наместо да се вклопи покрај друга работа.
