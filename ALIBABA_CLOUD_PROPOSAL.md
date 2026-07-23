# MKD Slidea — Technical Documentation & Investment Proposal

**Prepared for:** Alibaba Cloud — Investment, Cloud Infrastructure & Strategic Partnership
**Company:** MKD Slidea (slidea.mismath.net) — Skopje, North Macedonia
**Founder:** Igor Bogdanoski (full-stack engineer & product owner)
**Date:** July 2026
**Document version:** 1.0

---

## 1. Executive Summary

**MKD Slidea** is a production-ready, Macedonian-language interactive presentation and audience-response platform — a localized alternative to Mentimeter, Kahoot! and Slido, purpose-built for the North Macedonia education system and aligned with the national **BRO curriculum**. It lets teachers, trainers and event hosts run live polls, quizzes, word clouds, Q&A and surveys where audiences respond in real time from any phone, with results projected live.

The product is **live in production**, technically mature, and operating at a fraction of the cost of Western competitors because it runs on a **self-hosted open-source stack** (Supabase on a single VPS) with **Google Gemini AI** powering question generation, auto-grading and curriculum-aware semantic search.

**The opportunity:** the Western Balkans (North Macedonia, Albania, Serbia, Kosovo, Bulgaria, Croatia — ~20M people, ~5M students) has no dominant localized audience-response platform. Global tools (Mentimeter, Kahoot!) are English-first, expensive, and not aligned with local curricula. MKD Slidea has the technical foundation, the curriculum data, and the multilingual architecture to capture this market.

**The ask (combined, investor-selectable):**
1. **Cloud infrastructure support** — Alibaba Cloud credits / sponsored infrastructure to scale from a single VPS to a regional, highly-available deployment.
2. **Direct seed investment** — €25,000–€100,000 to fund regional expansion, i18n completion and enterprise features.
3. **Strategic partnership** — integration with Alibaba Cloud AI (Qwen / Model Studio), listing on the Alibaba Cloud Marketplace, and joint go-to-market for the CEE/Balkans education and enterprise segments.

---

## 2. Problem & Market

### 2.1 The problem
- Teachers and trainers in North Macedonia and the wider Balkans lack an affordable, **native-language** tool for interactive, real-time classroom engagement.
- Global alternatives (Mentimeter ~€100+/yr, Kahoot! Pro, Slido) are priced in EUR/USD for Western markets, English-first, and **not aligned with the local BRO curriculum**.
- Institutional procurement (schools, universities, NGOs, corporate training) needs local invoicing, GDPR compliance, and curriculum relevance — none of which global tools provide out of the box.

### 2.2 Target market
| Segment | Description | Willingness to pay |
|---|---|---|
| **K-12 teachers** | ~25,000 in North Macedonia; ~500,000 across the Balkans | Low (freemium → Pro) |
| **Universities & faculties** | UKIM, DUI, FINKI, regional universities | Medium (departmental licenses) |
| **Corporate trainers / NGOs** | Team workshops, trainings, conferences | Medium-High (event & seat licenses) |
| **Schools & institutions** | Centralized procurement, branding, admin control | High (institutional licenses) |

### 2.3 Competitive positioning
| Feature | MKD Slidea | Mentimeter | Kahoot! |
|---|---|---|---|
| Native Macedonian + Balkan languages | ✅ (7 locales architected) | ❌ | ❌ |
| BRO curriculum alignment + AI generation | ✅ | ❌ | ❌ |
| Self-hosted / data sovereignty option | ✅ | ❌ | ❌ |
| 8 activity types (incl. ranking, scale, survey) | ✅ | Partial | Partial |
| Free tier (200 participants) | ✅ | Limited | Limited |
| Pro price | **€20/year** | ~€100+/year | ~€60+/year |

---

## 3. Product Overview

### 3.1 Core capabilities (all live in production)
- **8 interactive activity types:** multiple-choice poll, quiz (with leaderboard & instant feedback), word cloud, open text, star rating, ranking (Borda-count scoring), 1–10 scale, and multi-question survey forms.
- **Live Presenter view:** real-time animated results (bars / donut / podium / numbers), projected to the audience; live participant counter via presence tracking; flying emoji reactions; Q&A panel with upvoting, moderation and pinning.
- **Phone-as-remote-control:** the host drives the presentation from their phone (next/previous, lock voting, reset) while it projects on screen — verified end-to-end.
- **AI-powered authoring (Google Gemini):** curriculum-aligned question generation using Bloom's taxonomy, image/PPTX import (OCR + analysis), AI auto-grading of open answers, AI insights per session, and AI session-recap emails.
- **RAG semantic search:** 228 Macedonian curriculum chunks embedded (gemini-embedding-2, 768-dim) for curriculum-aware suggestions.
- **Templates:** 39 curated starter templates across 13 subjects (Math, Physics, Chemistry, Biology, Geography, History, Macedonian, English, CS, Art, Music, PE, Business) + a public **community template gallery** with SEO-optimized detail pages.
- **Multilingual:** Macedonian (full) + architecture for Albanian, Serbian, Croatian, Bulgarian, Romanian, English (hreflang + locale files).
- **SEO:** build-time prerendering, sitemap generation, JSON-LD structured data (Course, FAQPage, EducationalApplication), per-template OG images (satori), 7-language hreflang alternates.
- **Operations:** event scheduling & async mode, co-host access, custom branding (color/font/logo), public results pages, CSV/PDF/Markdown export, web push notifications (VAPID), transactional email (Resend).
- **Legal:** GDPR-compliant Privacy Policy and Terms of Service (North Macedonia law).

### 3.2 Product maturity scores (internal audit, June 2026)
| Category | Score |
|---|---|
| SEO | 95/100 |
| Functionality | 92/100 |
| Security | 88/100 |
| SaaS features | 78/100 |
| Accessibility | 78/100 |
| i18n coverage | 35/100 (next expansion lever) |

> **The application is at commercial grade for the Macedonian market.** The next major milestone for regional expansion is completing i18n (Albanian, Serbian).

---

## 4. Technical Architecture

### 4.1 Stack overview
```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel edge CDN)                                   │
│  React 18 + Vite · TailwindCSS · Framer Motion · Zustand      │
│  React Router 7 · Recharts · d3-cloud · qrcode.react          │
└───────────────┬─────────────────────────────┬─────────────────┘
                │ HTTPS / WSS                  │ serverless
┌───────────────▼──────────────┐  ┌────────────▼────────────────┐
│  SELF-HOSTED SUPABASE         │  │  VERCEL EDGE FUNCTIONS       │
│  (Hostinger KVM2 VPS, Docker) │  │  /api/generate (Gemini)      │
│  PostgreSQL 16 + pgvector     │  │  /api/grade · /api/insights  │
│  Auth · Realtime · Storage    │  │  /api/vote-text · /api/og    │
│  Kong API gateway · nginx TLS │  │  /api/embed-batch (cron)     │
└───────────────┬──────────────┘  └────────────┬────────────────┘
                │                               │
        ┌───────▼───────────────────────────────▼────────┐
        │  GOOGLE GEMINI AI (Tier 1 paid key)             │
        │  gemini-3.6-flash (generation/grading/insights) │
        │  gemini-3.1-pro-preview (advanced reasoning)    │
        │  gemini-embedding-2 (RAG, 768-dim Matryoshka)   │
        └─────────────────────────────────────────────────┘
```

### 4.2 Key technical decisions
- **Self-hosted Supabase (open source)** on a Hostinger KVM2 VPS (2 vCPU, 7.8 GB RAM, Docker) instead of paid Supabase Cloud — **data sovereignty** (all data in the EU/region) and near-zero marginal database cost. PostgreSQL 16 with the **pgvector** extension powers RAG semantic search. All 11 Supabase containers run Docker-isolated behind an nginx reverse proxy with Let's Encrypt TLS; Postgres/Auth/Realtime are bound to localhost (only the Kong API gateway is public).
- **Real-time engine:** Supabase Realtime (WebSockets) for live vote broadcasting and presence ("N live", "X/Y answered"), with an HTTP polling fallback for resilience. Load-tested to **300 concurrent participants at 100% success (~1.6 s latency)**; 500 concurrent under extreme synthetic synchronized load reaches 85–94% (real events with natural jitter perform better).
- **AI layer:** Google Gemini via Vercel edge functions. As of July 2026 the platform runs the **latest Gemini 3 family** — `gemini-3.6-flash` (the newest stable flash model) for high-volume generation/grading/insights, `gemini-3.1-pro-preview` for advanced reasoning, and `gemini-embedding-2` (multimodal, 768-dim Matryoshka) for RAG. A daily AI budget guard and per-IP rate limiting protect cost and abuse.
- **SEO as a growth channel:** build-time prerendering + sitemap + structured data make every template and page indexable without client JS — critical for organic discovery in a small-language market.
- **Clean, maintainable codebase:** the two largest views (Presenter, Landing) were refactored from ~1,100 lines each to ~300/240 lines via well-scoped sub-components; the live-critical Presenter render path is covered by an end-to-end Playwright suite spanning all 8 activity types.

### 4.3 Data model (PostgreSQL)
Core tables: `events`, `polls`, `options`, `votes`, `questions`, `profiles`, `survey_responses`, `community_templates`, `curriculum_chunks` (pgvector), `organizations`, `org_members`, `org_invites`, `reactions`. Row-Level Security policies enforce per-event and per-organization isolation; anonymous participants vote via session-scoped identifiers.

### 4.4 Testing & quality
- **End-to-end (Playwright):** live create → vote → Presenter-results flows for all 8 activity types + remote control + landing/join flows.
- **Unit (node:test):** embeddings, SEO helpers, questions core logic.
- **Production verification:** automated build (Vite + sitemap + prerender) on every push via GitHub → Vercel.

---

## 5. Traction & Metrics

### 5.1 Verified production data (July 2026)
| Metric | Value |
|---|---|
| Registered users (auth) | 102 |
| Events created | 138+ |
| Polls / activities created | 249 |
| Curriculum chunks (RAG) | 228 |
| Starter templates | 39 (13 subjects) |
| Community templates | 19 |
| Supported activity types | 8 |
| Concurrent load proven | 300 @ 100% success |

### 5.2 Marketing reach (landing page, to be validated with analytics)
- 800+ teachers reached, 12,000+ participant responses, 98% reported satisfaction.
- "Trusted by" strip: UKIM, DUI, FINKI, Gymnasium "Skopje", MON trainings, corporate trainings.

> **Honest framing:** MKD Slidea is an **early-stage, solo-founder product with strong technical foundations and early organic traction**, not yet a scaled business. The investment thesis is the regional expansion enabled by completing i18n and enterprise features on top of an already-production-grade platform.

---

## 6. Business Model

### 6.1 Pricing (live)
| Plan | Price | Includes |
|---|---|---|
| **Free** | €0 | Up to 200 participants/event, all 8 activity types, templates |
| **Pro Monthly** | €5 / month | Unlimited participants, branding, exports, AI insights |
| **Pro Yearly** | €20 / year | Same as Pro, best value |
| **Institutional** | Custom (€200–€2,000+/yr) | Multi-teacher orgs, admin control, centralized billing, white-label option |

Billing is currently manual (PayPal, IBAN, MKD bank transfer) with Resend email notifications — a deliberate early-stage choice; automated Stripe/Paddle billing is on the roadmap.

### 6.2 Revenue streams
1. Pro subscriptions (teachers, trainers).
2. Institutional / school / university licenses (highest value).
3. Future: template marketplace revenue share, API access for LMS integrations, white-label enterprise.

---

## 7. Financial Plan (3-Year Projection)

> **The figures below are illustrative projections based on stated assumptions, not guarantees.** They model a conservative regional expansion. All amounts in EUR.

### 7.1 Current cost structure (lean, monthly)
| Item | Cost |
|---|---|
| Hostinger VPS (self-hosted Supabase) | ~€10 (existing) |
| Vercel Pro | ~€20 |
| Gemini API (Tier 1, low volume) | ~€0–20 |
| Domain + email (Resend) | ~€5 |
| **Total** | **~€35–55 / month** |

The self-hosted architecture keeps infrastructure cost near-flat as the user base grows initially — a structural margin advantage versus competitors paying per-seat SaaS infrastructure.

### 7.2 Revenue projection (illustrative)
| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Pro subscribers | 100 | 500 | 2,000 |
| Pro revenue (€20/yr avg) | €2,000 | €10,000 | €40,000 |
| Institutional licenses | 10 | 50 | 200 |
| Institutional revenue (€500 avg) | €5,000 | €25,000 | €100,000 |
| **Total ARR** | **€7,000** | **€35,000** | **€140,000** |
| Infrastructure + ops cost | €1,500 | €6,000 | €20,000 |
| Marketing & sales | €3,000 | €15,000 | €45,000 |
| **Contribution** | **€2,500** | **€14,000** | **€75,000** |

**Assumptions:** freemium → Pro conversion ~3–5%; institutional sales driven by direct outreach to schools/universities/NGOs; Year 2–3 growth unlocked by Albanian & Serbian localization (regional TAM expansion ~10×) and enterprise features (SSO, white-label).

### 7.3 Use of funds (on a €50,000 raise)
| Allocation | Amount | Purpose |
|---|---|---|
| Regional i18n & localization | €15,000 | Complete Albanian, Serbian, Croatian, Bulgarian, Romanian |
| Cloud infrastructure (scale-out) | €12,000 | Highly-available Postgres, Redis cache, CDN, object storage |
| Enterprise features | €10,000 | SSO (SAML), white-label/custom domain, automated billing, API |
| Marketing & sales | €10,000 | Content, comparison SEO, school outreach, demos |
| Contingency | €3,000 | — |

---

## 8. The Ask — Alibaba Cloud (Combined Proposal)

We propose a **flexible, tiered partnership** — Alibaba Cloud may choose any combination:

### Option A — Cloud Infrastructure Support (donation / credits)
As MKD Slidea scales from a single VPS to a regional, highly-available deployment, infrastructure becomes the primary cost and risk. We seek **Alibaba Cloud credits or sponsored infrastructure**:
- **ApsaraDB for PostgreSQL** (managed, with vector search) or ECS-hosted Supabase for high availability and automated backups.
- **Tair/Redis** for caching and rate limiting; **OSS** for media/template storage; **CDN** for low-latency delivery across the Balkans.
- **Model Studio / Qwen API credits** to diversify the AI layer (see Option C).

This removes the single-point-of-failure of the current self-hosted VPS and positions the platform for enterprise-grade SLAs.

### Option B — Direct Seed Investment
A **€25,000–€100,000** seed round to execute the 3-year plan (Section 7), in exchange for equity (terms negotiable). Funds allocated per Section 7.3. The investment thesis: a production-grade, low-burn platform with a clear, underserved regional market and a 10× TAM expansion unlocked by localization.

### Option C — Strategic Partnership
- **AI integration:** adopt **Alibaba Cloud Qwen / Model Studio** as a complementary (or alternative) LLM provider alongside Google Gemini — reducing vendor concentration, lowering inference cost, and aligning with the Alibaba ecosystem. The architecture is already provider-agnostic at the edge-function layer.
- **Marketplace distribution:** list MKD Slidea on the **Alibaba Cloud Marketplace** to reach Alibaba Cloud's education and enterprise customers in CEE/Balkans.
- **Joint go-to-market:** co-marketing to Alibaba Cloud's regional partners; MKD Slidea as a localized edtech reference customer for Alibaba Cloud in Southeast Europe.

### Strategic fit for Alibaba Cloud
- A **localized, production-grade edtech entry point** into the Western Balkans — a market global cloud providers serve but rarely localize for.
- A real-world **Qwen / Model Studio reference deployment** in education.
- Alignment with Alibaba Cloud's EMEA expansion and its open-source / developer-ecosystem strategy.

---

## 9. Roadmap (next 12 months)

**Critical (pre-scale):**
- GDPR cookie-consent banner.
- Complete i18n: Albanian (sq) → Serbian (sr) → Croatian/Bulgarian/Romanian.
- Join-flow validation & error UX.

**Q3 2026:**
- Custom branding UI (color picker + logo upload).
- Co-host management UI.
- Rate limiting on email/auth endpoints.
- Server-side branded PDF export; CSV export button.

**Q4 2026 / 2027:**
- Public REST API + OpenAPI docs (for Moodle, Google Classroom, Microsoft Teams integrations).
- Comparison SEO landing pages (vs Mentimeter / Kahoot! / Slido).
- Template marketplace advanced filtering.
- Enterprise SSO (SAML/OpenID) and white-label / custom domain.
- Per-participant analytics; session recording/replay.

---

## 10. Risks & Mitigation
| Risk | Mitigation |
|---|---|
| Solo-founder key-person risk | Documented codebase, automated tests, AI-assisted development; investment enables first hires |
| Self-hosted single point of failure | Option A cloud migration → managed HA Postgres + automated backups |
| LLM vendor concentration (Google) | Provider-agnostic AI layer; Option C adds Alibaba Qwen |
| Slow institutional sales cycle | Freemium bottom-up adoption + direct institutional outreach; local invoicing |
| Small domestic market | Regional (Balkan) expansion via i18n — 10× TAM |
| Preview-model deprecation (Gemini 3.1 Pro) | Env-driven model config; stable fallbacks; easy model swaps (proven this session) |

---

## 11. Team
**Igor Bogdanoski** — Founder & full-stack engineer. Sole developer and product owner; built the entire platform (frontend, self-hosted infrastructure, AI integration, SEO, legal) with AI-assisted engineering. Based in Prilep, North Macedonia. Contact: igorbogdanoski@mismath.net · +389 70 246 814.

---

## 12. Appendix

### 12.1 Live URLs
- Production: https://slidea.mismath.net
- Public templates: https://slidea.mismath.net/templates
- Self-hosted Supabase API: https://supabase.mismath.net

### 12.2 AI model configuration (current)
| Purpose | Model | Notes |
|---|---|---|
| Generation / grading / insights | `gemini-3.6-flash` | Latest stable flash |
| Advanced reasoning | `gemini-3.1-pro-preview` | Latest pro (preview) |
| RAG embeddings | `gemini-embedding-2` | Multimodal, 768-dim Matryoshka |

### 12.3 Technology index
React 18 · Vite · TailwindCSS · Framer Motion · Zustand · React Router 7 · Recharts · d3-cloud · Supabase (PostgreSQL 16 + pgvector, Auth, Realtime, Storage) · Docker · nginx · Let's Encrypt · Vercel (edge functions + CDN) · Google Gemini API · satori (OG images) · VAPID web push · Resend email · Playwright (e2e) · node:test (unit).

---

*This document combines technical documentation and a financial/investment proposal. Financial projections (Section 7) are illustrative and assumption-based. Prepared July 2026.*
