# 🚀 PunchOS Deployment Guide

Deploy the full stack in ~30 minutes. Total cost on free tiers: **$0**.

```
┌─────────────────────┐      ┌─────────────────────┐
│  punch-pwa          │      │  dashboard          │
│  (Student phone)    │      │  (Faculty scanner)  │
│  Vercel             │      │  Vercel             │
└──────────┬──────────┘      └──────────┬──────────┘
           │  HTTPS (WebAuthn required) │
           ▼                            ▼
           ┌──────────────────────────────┐
           │  server (Express + Prisma)   │
           │  Railway + Postgres          │
           └──────────────────────────────┘
```

## 0. Prerequisites

- GitHub repo pushed
- Render account (100% Free tier available) or Railway account
- Vercel account (free) — recommended for frontend Next.js apps

## 1. Option A: Render (Free Backend + Free Postgres)

### Quickest Way: Render Blueprint (Automatic)
1. Push this repo to GitHub (includes [`render.yaml`](file:///e:/shiva/college/6th%20sem%20mini%20project/QR-Attendance-System/render.yaml)).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically create:
   - **PostgreSQL Database** (`punchos-db`)
   - **Express Web Service** (`punchos-api`) linked to the database.
5. Click **Apply**. Once built, copy your backend URL (e.g. `https://punchos-api.onrender.com`).

### Manual Setup on Render
1. **Create Database**: **New +** → **PostgreSQL** → Name: `punchos-db` → Create.
2. **Create Web Service**: **New +** → **Web Service** → Connect repo.
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npx prisma db push && node dist/index.js`
   - **Environment Variables**:
     - `DATABASE_URL`: paste the *Internal Database URL* from `punchos-db`
     - `CORS_ORIGIN`: `*`
     - `NODE_VERSION`: `20`
3. Click **Create Web Service** and note your public Render URL.

## 1. Option B: Railway — Express backend + Postgres

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. When prompted for the repo folder, set **Root Directory = `server`**.
3. Railway auto-detects Node via Nixpacks and reads `railway.toml`:
   - build: `npm run build && npx prisma generate`
   - start: `npx prisma db push && node dist/index.js`
   - healthcheck: `/api/health`
4. In your project canvas: **+ New → Database → PostgreSQL**.
5. Open the **server service → Variables**, add:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference — don't paste secrets) |
   | `RP_ID` | your PWA domain, e.g. `punch-pwa.vercel.app` (set after step 2) |
   | `CORS_ORIGIN` | `https://punch-pwa-<you>.vercel.app,https://dashboard-<you>.vercel.app` (set after step 2) |

6. **Settings → Networking → Generate Domain** → note the URL, e.g.
   `https://punchos-api-production.up.railway.app` — this is your **API base**.
7. Verify: open `<railway-url>/api/health` → `{"status":"ok",...}`.

> `prisma db push` syncs the schema on every deploy, so the database is ready
> without running migrations manually.

## 2. Vercel — punch-pwa (student phone app)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
2. Before building, expand **Root Directory** → `punch-pwa`.
   Vercel auto-detects Next.js; leave build settings default (uses the
   regenerated `package-lock.json`).
3. **Environment Variables** (Production + Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_PUNCH_API_URL` | your Railway URL from step 1, e.g. `https://punchos-api-production.up.railway.app` |

4. **Deploy** → note the domain, e.g. `punch-pwa-<you>.vercel.app`.
5. Update `RP_ID` on Railway to `punch-pwa-<you>.vercel.app` (redeploys
   automatically). This makes WebAuthn passkeys work cross-device.

## 3. Vercel — dashboard (faculty scanner)

1. **Add New → Project** → import the same repo again.
2. **Root Directory** = `dashboard`.
3. **Environment Variables**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | same Railway URL |

4. **Deploy** → note the domain, e.g. `dashboard-<you>.vercel.app`.
5. Add this domain to `CORS_ORIGIN` on Railway (comma-separated with the PWA
   domain) and redeploy.

## 4. Smoke test the full flow

1. Open the **dashboard** → create a test student (or run the seed against
   Railway: `DATABASE_URL="<railway-pg-url>" npm --prefix server run seed`).
2. Open the **PWA on your phone** (scan the QR of the Vercel URL from your
   laptop screen — fastest way) → enroll with your roll number → passkey
   prompt appears (FaceID / fingerprint).
3. The rotating QR appears. Point the **dashboard camera scanner** at it
   (allow camera permission) → chime + green holographic card.
4. Click **Audit Merkle Tree** → today's root hash appears.

If any step fails, see Troubleshooting below.

## 5. Updating the LinkedIn post

Once deployed, replace `[demo link]` in [marketing/linkedin-post.md](../marketing/linkedin-post.md)
with the dashboard URL. Suggested phrasing: *"Try it live — open the student
app on your phone, enroll with any roll number, and scan yourself in."*

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Railway build fails on `prisma generate` | Prisma engines need network access | Ensure `PRISMA_GENERATE_SKIP_AUTOINSTALL` is not set; Railway Nixpacks handles this |
| Railway `/api/health` returns 502 | App crashed at boot | Check Railway → Deployments → Logs (usually missing `DATABASE_URL`) |
| Passkey prompt doesn't appear on phone | RP ID mismatch | `RP_ID` must exactly equal the PWA domain without scheme or port |
| "Signature verification failed" at scan | Enrolled under a different RP ID | Delete the student's `PunchKey` rows and re-enroll |
| Dashboard shows red "Disconnected" | SSE blocked by CORS or proxy | Add the dashboard domain to `CORS_ORIGIN`; SSE needs the exact origin match |
| Vercel build fails on `npm ci` | Stale lockfile with `file:..` dep | Already fixed in this branch — lockfiles were regenerated |
| Mixed content error in browser | Calling `http://` from an HTTPS page | Ensure `NEXT_PUBLIC_*` variables use `https://` |

## Costs & limits (free tier)

- **Vercel Hobby**: unlimited static/SSR deploys, 100 GB bandwidth — fine.
- **Railway**: $5 trial credit, then Hobby plan $5/mo. Postgres included.
  This is the only potentially paid component (long-running process).
- **Render free tier** is an alternative if you want $0 total, but the free
  Postgres expires after 30 days and the service sleeps after 15 min idle
  (which breaks SSE demos — not great for a live portfolio link).
