# My Full Stack App

Portfolio site for [kylesuda.com](https://kylesuda.com) with an embedded UFC fight prediction engine.

## Stack

- **client/** — React (Vite) portfolio + UFC UI → deploys to **Vercel**
- **server/** — Express + Prisma + PostgreSQL (user API + optional prod static host) → **Railway**
- **ufc-api/** — Flask ML prediction API → **Railway** (Docker)

## Features

- Portfolio pages (home, projects, resume, contact)
- UFC upcoming-card scrape + predictions
- Custom matchup predictor with optional Vegas odds / value analysis

## Run Locally

### Frontend

```bash
cd client
npm install
npm run dev
```

Optional: point at a local UFC API:

```bash
# client/.env
VITE_UFC_API=http://localhost:5001
```

### Backend (optional — not used by the current portfolio UI)

```bash
cd server
cp ../.env.example .env   # set DATABASE_URL
npm install
npx prisma migrate dev
npm run dev
```

### UFC API

```bash
cd ufc-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/api.py          # http://localhost:5001
```

## Production

| Piece | Host | Notes |
|-------|------|--------|
| Frontend | Vercel (`client/`) | Set `VITE_UFC_API` to your live UFC API URL, then redeploy |
| UFC API | Railway Docker (`ufc-api/`) | Needs `models/` + `data/raw/ufc-master.csv` in the image |
| Express | Railway (`railway.json`) | Requires `DATABASE_URL`; `start.js` runs migrations then serves API (+ `client/dist` if used) |

Root commands:

```bash
npm run build   # build client + prisma generate
npm start       # migrate + start Express (needs DATABASE_URL)
```
