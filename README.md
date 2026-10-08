# Gastosaurus

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

<p align="center">
  <img src="src/assets/mascot.png" alt="Gastosaurus mascot" width="180">
</p>

## My project repository

Public repository: https://github.com/francoiseee/gastosaurus

Live app (deployed): https://gastosaurus-francoise.vercel.app/

Full documentation: **[DOCUMENTATION.md](DOCUMENTATION.md)** (overview, setup, features, API, project structure, screenshots, known issues)

## What it is

Gastosaurus is a group expense tracker for barkadas, roommates and trips that splits bills *ambagan*-style, equally or item by item, so people pay only for what they had. It keeps a running balance per person, suggests the fewest payments to settle up, and has the receiver confirm each payment.

## How to run it

You need **Node.js 22** (or 20.19+), **Git**, and a free **[Supabase](https://supabase.com/)** project. Every environment variable is explained in [DOCUMENTATION.md §2](DOCUMENTATION.md#2-setup-and-installation).

1. **Get the code and install dependencies**

   ```bash
   git clone https://github.com/francoiseee/gastosaurus.git
   cd gastosaurus
   npm install
   cd server && npm install && cd ..
   ```

2. **Set up the database.** In the Supabase dashboard, open **SQL Editor** and run the five files in [`supabase/migrations/`](supabase/migrations) one at a time, in filename order. Then:
   - **Authentication → URL Configuration:** set the Site URL to `http://localhost:5173` and add `http://localhost:5173/**` to Redirect URLs.
   - **Authentication → Sign In / Providers → Email:** for local testing, turn **Confirm email** off.

   There is no seed script on purpose: sign up in the app and create a group to get data.

3. **Add your settings.** Copy the examples and fill in your own values. These are placeholders; never commit the real files (they are in `.gitignore`).

   ```bash
   cp .env.example .env.local           # frontend
   cp server/.env.example server/.env   # API
   ```

   ```bash
   # .env.local
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-publishable-key
   VITE_API_URL=

   # server/.env
   NODE_ENV=development
   PORT=4000
   DATABASE_URL=postgresql://postgres.your-project-ref:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   DATABASE_SSL=true
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-publishable-key
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. **Start it** in two terminals:

   ```bash
   cd server && npm run dev   # API on http://localhost:4000
   npm run dev                # app on http://localhost:5173
   ```

   Open **http://localhost:5173**: you should see the landing page, *"Master Your Budget, Effortlessly."*, with a **Log In** button. **http://localhost:4000/api/health** should return `{"status":"ok"}`.

To deploy it on Vercel, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Presentation

- Video (public Google Drive link): *to be added*
- Slides (link or PDF): *to be added*
- Square image: *to be added*

## AI usage

Built with heavy AI assistance. I wrote the React frontend (with some help from Google Antigravity), the Vercel deployment and the dino avatar picker. Claude (Claude Code, Claude Opus 5.5) wrote the backend (`server/`, `supabase/`), connected the frontend to it, and helped with later fixes and a cleanup pass.

Link to the `AI-USAGE.md` in my project repository:
https://github.com/francoiseee/gastosaurus/blob/main/AI-USAGE.md
