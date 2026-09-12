# TravelAI

**AI-powered travel assistant** — Flutter mobile app (+ Flutter Web), Next.js web app, Next.js admin dashboard, and a Firebase backend, all sharing one data model and one AI layer.

> Trợ lý du lịch AI: gợi ý địa điểm, lên lịch trình và trả lời câu hỏi du lịch qua chat.

## Live demo

| | |
|---|---|
| 🌐 Web app | https://travel-app-6rww.vercel.app |
| 📱 App (Flutter Web) | https://web-nu-woad-82.vercel.app |
| 🛠️ Admin dashboard | https://admin-mocha-six-89.vercel.app |

## Overview

TravelAI helps users discover destinations, chat with an AI assistant for recommendations, and plan multi-day itineraries — across three clients backed by a single Firebase project.

| Client | Audience | Stack |
|---|---|---|
| **Mobile app** (`lib/`) | End users (Android, + Flutter Web) | Flutter, Riverpod, go_router |
| **Web app** (`webapp/`) | End users (browser) | Next.js 16, React 19, Tailwind CSS 4, deployed on Vercel |
| **Admin dashboard** (`admin/`) | Content/ops team | Next.js 16, React 19, Tailwind CSS 4, deployed on Vercel |
| **Backend** | Shared by all clients | Firebase (Firestore, Auth) + Next.js API routes on Vercel for AI/notifications |

`functions/` (Firebase Cloud Functions) holds the original implementation of the AI/notification
endpoints; it's kept as a reference but not deployed — see [Why Vercel instead of Cloud Functions](#why-vercel-instead-of-cloud-functions).

## AI capabilities

The AI assistant is built on the Anthropic API (Claude) with a few deliberate design choices worth calling out:

- **Tool-use agent loop** — the assistant can call `suggest_places` and `plan_itinerary` tools (schema-constrained JSON) instead of just returning free text. A multi-round tool loop (`webapp/src/app/api/chat/route.ts`) lets the model request a computed itinerary and then narrate the result.
- **LLM for judgment, algorithms for math** — place *selection* is left to the model, but geo-clustering and route ordering are computed deterministically (haversine-based k-means + nearest-neighbor ordering, `webapp/src/lib/itinerary-planner.ts`), since LLMs are unreliable at reasoning about coordinates/distances.
- **Grounded, hallucination-resistant prompting** — the system prompt is built from the live `places` collection on every call, with explicit instructions not to invent destinations; any place ID the model returns is re-validated server-side against real data before reaching the client.
- **Personalization** — declared preferences and behavioral signals (saved places, high-rated reviews) are summarized into a separate, uncached system prompt block, so generic questions ("suggest me somewhere nice") get tailored answers.
- **Prompt caching** — the (large, mostly-static) system prompt is marked with `cache_control` to cut latency/cost on repeated calls.
- **Structured moderation** — new reviews are auto-classified by a forced tool call (`tool_choice: { type: "tool" }`) for spam/hate-speech flags, feeding a human-in-the-loop moderation queue in the admin dashboard rather than auto-removing content.
- **Grounded data ingestion** (`scripts/import_places/`) — bulk place import pulls factual data (coordinates, hours, photos) from the Google Places API, then uses Claude only to generate descriptive text/tags from that verified data, never from scratch.

See [`docs/ai-improvement-roadmap.md`](docs/ai-improvement-roadmap.md) for the next set of planned upgrades (RAG/vector search, streaming responses, an eval harness, observability).

## Features

- Explore destinations with search and tag filtering
- Place details: ratings, opening hours, reviews, ticket info, highlights, local food recommendations, embedded map
- AI chat assistant with place-suggestion and itinerary cards inline in the conversation, personalized to the user
- Reviews with star ratings and AI-assisted moderation
- Saved places / favorites
- Push notifications (new places, upcoming itinerary reminders)
- Admin dashboard: place/review/user management, content approval queue, audit log
- Google sign-in only (no email/password) across all three clients

## Architecture

```
Flutter app / Flutter Web ───┐
Next.js webapp ───────────── ├──▶ Firebase Auth / Firestore ◀── Next.js admin dashboard
                              │
                              └──▶ Next.js API routes (webapp, on Vercel)
                                      ├── /api/chat               (Claude, tool-use agent loop)
                                      ├── /api/moderate-review    (Claude, forced-tool classification, cron)
                                      ├── /api/remind-itineraries (FCM, cron)
                                      └── /api/notify-new-place   (FCM, called from admin)
```

Data model: see [`docs/firestore-schema.md`](docs/firestore-schema.md).

### Why Vercel instead of Cloud Functions

Firebase Cloud Functions require the Blaze (pay-as-you-go) billing plan, which couldn't be enabled for
this project (Google rejected every card tried, for account reasons unrelated to the cards themselves).
Since Firestore/Auth don't require Blaze, only the AI + push-notification logic was ported to Next.js
API routes on Vercel (free, no billing needed) — see [`migration-vercel-ai.md`](migration-vercel-ai.md)
for the full migration notes. The original Cloud Functions code is kept in `functions/` untouched, in
case Blaze becomes available later.

## Getting started

### Prerequisites
- Flutter SDK ^3.5.0
- Node.js 20+
- A Firebase project (Firestore, Auth — Blaze/Storage not required)
- An Anthropic API key (for `/api/chat` and `/api/moderate-review`)
- A Google Places API key (only needed for the bulk import script)

### Mobile app / Flutter Web
```bash
flutter pub get
flutterfire configure   # generates firebase_options.dart for your project
flutter run                                              # mobile
flutter build web --release --pwa-strategy=none          # web (--pwa-strategy=none avoids a blank-page bug in release builds)
```

### Web app / Admin dashboard
```bash
cd webapp   # or: cd admin
npm install
npm run dev
```

### Bulk place import (optional)
```bash
cd scripts/import_places
npm install
GOOGLE_PLACES_API_KEY=... ANTHROPIC_API_KEY=... npm run import
```

## Project structure

```
lib/            Flutter app (feature-first: auth, chat, home, itinerary, place_detail, review, saved, ...)
webapp/         Next.js public web app + AI/notification API routes (deployed on Vercel)
admin/          Next.js admin dashboard (deployed on Vercel)
functions/      Original Firebase Cloud Functions implementation (kept as reference, not deployed)
scripts/        Data pipelines (place import)
docs/           Data model, AI roadmap, planning docs
```

## Docs

- [`docs/firestore-schema.md`](docs/firestore-schema.md) — Firestore collections and fields
- [`docs/ai-improvement-roadmap.md`](docs/ai-improvement-roadmap.md) — planned AI upgrades (RAG, streaming, evals)
- [`migration-vercel-ai.md`](migration-vercel-ai.md) — why/how the AI backend moved from Cloud Functions to Vercel
- [`kehoach.md`](kehoach.md) — original system/architecture plan (Vietnamese)
- [`checklist.md`](checklist.md) — development progress log (Vietnamese)
