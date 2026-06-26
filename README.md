# SafeGuard — Parental Monitoring System

A full-stack parental control system built with React, Supabase, and a Chrome Extension. Parents can monitor their child's browsing activity, block websites, and get alerts in real time.

## How it works

```
[Child's Chrome Browser]          [Parent Dashboard]
   Chrome Extension          ←→      React Web App
          ↓                                ↓
          └──────────── Supabase ──────────┘
                     (shared database)
```

1. Parent generates a 6-digit pairing code on the dashboard
2. Child enters the code in the Chrome extension to link the device
3. Extension monitors browsing, blocks blacklisted sites, and logs visits
4. Parent sees activity, manages blocklist, and receives alerts in real time

## Tech Stack

**Dashboard**
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, realtime)
- TanStack Query

**Chrome Extension**
- Manifest V3
- Vanilla JS
- Supabase REST API (direct fetch)

## Getting Started

### Prerequisites
- Node.js & npm
- A Supabase project

### 1. Clone the repo

```sh
git clone https://github.com/riyaax07/safeguard-parent-dashboard.git
cd safeguard-parent-dashboard
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Set up the database

Run the SQL migrations in your Supabase SQL Editor (see `/supabase` folder).

### 4. Start the dashboard

```sh
npm install
npm run dev
```

### 5. Load the Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `/extension` folder
4. Open the extension popup and enter the pairing code from the dashboard

## Project Structure

```
safeguard-parent-dashboard/
├── src/
│   ├── pages/dashboard/     # Overview, Activity, Blocklist, Devices, Alerts
│   ├── hooks/               # useDevices, useBlocklist, useAlerts, useVisits
│   ├── contexts/            # AuthContext
│   ├── components/          # UI components + layout
│   └── integrations/        # Supabase client + types
├── extension/
│   ├── manifest.json
│   ├── background.js        # Service worker: navigation monitoring + blocking
│   ├── popup.html/js        # Pairing UI
│   └── blocked.html/css     # Blocked site page shown to child
└── supabase/                # SQL migrations
```

## Deployment

The dashboard is deployed on Vercel. Each push to `main` triggers an automatic redeploy.

Environment variables are set in the Vercel dashboard under Project Settings → Environment Variables.

## Features

- 🔐 Parent authentication (email + password)
- 📱 Device pairing via 6-digit code
- 🚫 Website blocklist (add/remove domains)
- 📊 Real-time browsing activity log
- ⚠️ Alerts for suspicious sites
- 🔄 Auto-syncing blocklist to extension every 30 seconds
