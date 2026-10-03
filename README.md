# 🌿 Tend Weekly

A garden management web app. You tell it where you live and what you grow, and it builds a year-round **pruning, fertilizing, spraying and soil plan** timed for your local climate. It explains **how** to do each task, and emails you **every Friday morning** with the weekend's to-do list and the forecast.

## What's in Phase 1 (this release)

- **Passwordless sign-up/sign-in** by emailed link (public, multi-user).
- **Location onboarding**: search by town/postcode or use the browser's location. The app looks at about 10 years of daily temperatures for that spot to estimate the **USDA hardiness zone** and **average last/first frost dates**. It works worldwide and in both hemispheres, and you can override everything in Settings.
- **Plant library**: 70 hand-written care guides (roses, hydrangeas, flowering shrubs, evergreens, trees, fruit, vines, perennials, herbs, vegetables, tropicals). Each has pruning, feeding, spraying, soil and protection tasks, step-by-step how-to, products (organic first, then conventional), tools, cautions and common problems.
- **Any other plant**: if it isn't in the library, Claude writes a guide in the same format. It's cached and shared, and labeled "AI-written".
- **Scheduling engine**: task windows are stored relative to frost dates (e.g. "4 weeks before last frost"), so the same guide gives correct dates in Atlanta, Minneapolis or Melbourne. Cold-climate-only tasks are hidden in warm zones, and frost tasks are hidden where it doesn't freeze.
- **Dashboard** with this week's tasks (tick them off), overdue items, the next 6 weeks, and a **live 7-day forecast** with frost/heat/rain/wind/dry warnings and **good spray days**.
- **12-month calendar**, filterable by task type.
- **Friday email**, sent at 7am local time: weekend weather, warnings, every due task with how-to and products, and what's coming up. One-click unsubscribe.
- Settings: climate overrides, organic-only mode, °F/°C, email on/off, send a preview, delete account.

## Roadmap

- **Phase 2:** photo uploads per plant (growth timeline) and AI diagnosis of problems from a photo (free tier: 5 per month).
- **Phase 3:** watering guidance from recent rainfall plus the forecast, regional pest and disease watch, Google Calendar sync.

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS 4 · Postgres + Drizzle ORM · Resend (email) · Open-Meteo (weather, climate, geocoding; free, no key) · Anthropic Claude API (custom plant guides).

```
src/
  plants/            curated plant library + shared task templates
  lib/schedule.ts    frost-relative → calendar date engine
  lib/climate.ts     zone & frost-date estimation, geocoding
  lib/weather.ts     forecast + gardener warnings
  lib/digest.ts      Friday email builder
  lib/weekly.ts      cron sender (timezone-aware, idempotent)
  lib/ai-guide.ts    Claude-written guides for unlisted plants
  app/               pages, server actions, API routes
```

## Local development

```bash
npm install
cp .env.example .env.local      # set DATABASE_URL at minimum
npm run db:migrate
npm run dev
```

Without `RESEND_API_KEY`, emails (sign-in links, digests) are printed to the server console. Without `ANTHROPIC_API_KEY`, everything works except adding plants that aren't in the library.

```bash
npm test          # unit tests (scheduling, climate math, library integrity, warnings)
npm run lint
npm run typecheck
```

Trigger the weekly sender manually:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly
```

## Deploying on Render

1. In Render: **New → Blueprint**, then pick this repo. `render.yaml` creates the Postgres database, the web service and the hourly cron job.
2. Fill in the prompted env vars: `APP_URL` (both services), `RESEND_API_KEY`, `EMAIL_FROM`, `ANTHROPIC_API_KEY`.
3. The app works straight away at its free Render address (e.g. `https://tend-weekly.onrender.com`). Set `APP_URL` to that address.
4. Register **tendweekly.com**, add it in Render → Settings → Custom domain, and set `APP_URL=https://tendweekly.com`.
5. Emails need a domain you own: verify it in Resend so mail doesn't land in spam, and use it in `EMAIL_FROM` (e.g. `Tend Weekly <hello@tendweekly.com>`). Until then, Resend's test sender can only email your own address.

**Testing before email works:** set `TEST_LOGIN_EMAIL` and `TEST_LOGIN_PASSWORD_HASH` (from `npm run hash-password -- 'your password'`) on the web service. A "Sign in with a password instead" option then appears on the sign-in page. Delete both variables to turn it off.

Migrations run automatically on each deploy (`npm run db:migrate` in the start command).

## Notes on the plant advice

Timing reference points (zone 6–7): `lastFrost −8..−2 wk` is late-winter dormancy, `−2..+3` is bud break, `+2..+8` is spring, and `firstFrost −8` is the last feeding. Product suggestions name active ingredients with example brands. Users are always told to follow the label.
