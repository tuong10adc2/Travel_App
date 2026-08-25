# TravelAI

**AI-powered travel assistant** — Flutter mobile app, Next.js web app, Next.js admin dashboard, and a Firebase backend, all sharing one data model and one AI layer.

> Trợ lý du lịch AI: gợi ý địa điểm, lên lịch trình và trả lời câu hỏi du lịch qua chat, xem trước điểm đến bằng ảnh 360°.

## Overview

TravelAI helps users discover destinations, chat with an AI assistant for recommendations, plan multi-day itineraries, and preview places in 360° VR — across three clients backed by a single Firebase project.

| Client | Audience | Stack |
|---|---|---|
| **Mobile app** (`lib/`) | End users (Android/iOS) | Flutter, Riverpod, go_router |
| **Web app** (`webapp/`) | End users (browser) | Next.js 16, React 19, Tailwind CSS 4 |
| **Admin dashboard** (`admin/`) | Content/ops team | Next.js 16, React 19, Tailwind CSS 4 |
| **Backend** (`functions/`) | Shared by all clients | Firebase Cloud Functions (TypeScript), Firestore, Auth, Storage |

## AI capabilities

The AI assistant is built on the Anthropic API (Claude) with a few deliberate design choices worth calling out:

- **Tool-use agent loop** — the assistant can call `suggest_places` and `plan_itinerary` tools (schema-constrained JSON) instead of just returning free text. A multi-round tool loop (`functions/src/index.ts`) lets the model request a computed itinerary and then narrate the result.
- **LLM for judgment, algorithms for math** — place *selection* is left to the model, but geo-clustering and route ordering are computed deterministically (haversine-based k-means + nearest-neighbor ordering, `functions/src/itinerary-planner.ts`), since LLMs are unreliable at reasoning about coordinates/distances.
- **Grounded, hallucination-resistant prompting** — the system prompt is built from the live `places` collection on every call, with explicit instructions not to invent destinations; any place ID the model returns is re-validated server-side against real data before reaching the client.
- **Prompt caching** — the (large, mostly-static) system prompt is marked with `cache_control` to cut latency/cost on repeated calls.
- **Structured moderation** — new reviews are auto-classified by a forced tool call (`tool_choice: { type: "tool" }`) for spam/hate-speech flags, feeding a human-in-the-loop moderation queue in the admin dashboard rather than auto-removing content.
- **Grounded data ingestion** (`scripts/import_places/`) — bulk place import pulls factual data (coordinates, hours, photos) from the Google Places API, then uses Claude only to generate descriptive text/tags from that verified data, never from scratch.

See [`docs/ai-improvement-roadmap.md`](docs/ai-improvement-roadmap.md) for the next set of planned upgrades (RAG/vector search, streaming responses, an eval harness, personalization, observability).

## Features

- Explore destinations with search and tag filtering
- Place details: ratings, opening hours, reviews, ticket info
- AI chat assistant with place-suggestion and itinerary cards inline in the conversation
- 360° VR place previews with gyroscope support and multi-viewpoint hotspots
- Reviews with star ratings and AI-assisted moderation
- Saved places / favorites
- Admin dashboard: place/review management, content approval queue
- Google + email/password authentication

## Architecture

```
Flutter app ───┐
Next.js webapp ├──▶ Firebase Auth / Firestore / Storage ◀── Next.js admin dashboard
               │
               └──▶ Cloud Functions (TypeScript)
                       ├── chatWithAssistant  (Claude, tool-use agent loop)
                       ├── moderateReviewOnCreate (Claude, forced-tool classification)
                       └── itinerary-planner  (geo-clustering algorithm)
```

Data model: see [`docs/firestore-schema.md`](docs/firestore-schema.md).

## Getting started

### Prerequisites
- Flutter SDK ^3.5.0
- Node.js 20+
- A Firebase project (Firestore, Auth, Storage, Functions on the Blaze plan)
- An Anthropic API key (for `chatWithAssistant` / `moderateReviewOnCreate`)
- A Google Places API key (only needed for the bulk import script)

### Mobile app
```bash
flutter pub get
flutterfire configure   # generates firebase_options.dart for your project
flutter run
```

### Cloud Functions
```bash
cd functions
npm install
firebase functions:secrets:set ANTHROPIC_API_KEY
npm run build
firebase deploy --only functions
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
lib/            Flutter app (feature-first: auth, chat, home, itinerary, place_detail, review, saved, vr360, ...)
webapp/         Next.js public web app
admin/          Next.js admin dashboard
functions/      Firebase Cloud Functions (TypeScript) — chat assistant, moderation, itinerary planner
scripts/        Data pipelines (place import, VR360 asset seeding)
docs/           Data model, AI roadmap, planning docs
```

## Docs

- [`docs/firestore-schema.md`](docs/firestore-schema.md) — Firestore collections and fields
- [`docs/ai-improvement-roadmap.md`](docs/ai-improvement-roadmap.md) — planned AI upgrades (RAG, streaming, evals, personalization)
- [`kehoach.md`](kehoach.md) — original system/architecture plan (Vietnamese)
- [`checklist.md`](checklist.md) — development progress log (Vietnamese)
