# Whizz — Frontend + Backend (Connected)

Two folders, pre-configured to talk to each other:
- `frontend/` — React + Vite + Tailwind (runs on port 5173)
- `backend/` — Node/Express + MongoDB (runs on port 5000)

`frontend/vite.config.js` proxies `/api` → `http://localhost:5000`, and the backend's
`CLIENT_URL` is set to `http://localhost:5173` for CORS. No extra wiring needed —
just run both.

## Run both

**Terminal 1 — backend**
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI (MongoDB Atlas) and JWT_SECRET
npm install
npm run dev
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, sign up, and you'll land on the Dashboard.

## What works right now
Auth (signup/login/forgot-reset password), profile editing, and basic meeting
create/schedule/join/dashboard — all hitting the real backend + MongoDB.

## What's not included yet
Real-time video calling (Socket.IO/WebRTC), AI meeting summaries, and the Admin
panel routes aren't in this backend slice. The related frontend pages/buttons are
present but will show connection errors until those routes are added — say the
word and I'll send that next chunk.
