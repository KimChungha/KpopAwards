# 🏆 The Luminary Awards — Cloudflare Setup Guide

## What you need
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org) installed
- A GitHub account

---

## Step 1 — Push to GitHub

Create a new repository on GitHub, then in this folder run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/music-awards.git
git push -u origin main
```

---

## Step 2 — Install Wrangler and log in

```bash
npm install
npx wrangler login
```

This opens a browser window to authenticate with your Cloudflare account.

---

## Step 3 — Create the D1 database

```bash
npx wrangler d1 create music-awards-db
```

This prints something like:

```
✅ Successfully created DB 'music-awards-db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy that `database_id`** and paste it into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_DATABASE_ID`.

---

## Step 4 — Run the database schema

```bash
npx wrangler d1 execute music-awards-db --remote --file=schema.sql
```

This creates the tables. You only need to do this once.

---

## Step 5 — Deploy

```bash
npx wrangler deploy
```

Your site is now live at `https://music-awards.YOUR_SUBDOMAIN.workers.dev`

---

## Step 6 — Connect GitHub for auto-deploys (optional but recommended)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Open your Worker → **Settings** → **Builds**
3. Connect your GitHub repo
4. From now on, every push to `main` auto-deploys

---

## Local development

```bash
npx wrangler dev
```

This runs everything locally at `http://localhost:8787` including a local D1 instance — no internet required.

---

## Credentials

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `admin` |

To change them, edit `ADMIN_USER` and `ADMIN_PASS` at the top of `src/worker.js`.

---

## Project structure

```
music-awards-cf/
├── wrangler.toml          # Cloudflare config (put your DB ID here)
├── schema.sql             # Run once to create tables
├── package.json
├── src/
│   └── worker.js          # All API logic (Cloudflare Worker)
└── public/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```
"# KpopAwards" 
