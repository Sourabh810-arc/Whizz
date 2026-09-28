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
Everything the frontend has UI for is now wired up end-to-end:
- Auth (signup/login/forgot-reset password), profile editing
- Meeting create/schedule/join/leave/end/lock, dashboard, meeting history
- Real-time calls: Socket.IO signaling for WebRTC, chat, reactions, hand-raise,
  live captions/transcript capture, notes + whiteboard relay, screen share
  events, and host controls (mute all / lock / remove / end)
- AI meeting summaries: generate a summary + minutes + action items from the
  captured transcript, download as PDF, or email the PDF to everyone who
  attended
- Admin panel: analytics (totals + 30-day activity chart), user list +
  suspend/reactivate, meeting oversight list, and a reports queue (any user
  can file a report from inside a call; admins triage it)

See `CHANGES.md` for the most recent fix pass, and `backend/README.md` /
route files for the full API surface.

## AI summaries — with or without an API key
`POST /api/ai/:meetingId/summary` works out of the box with **no extra setup**:
if `ANTHROPIC_API_KEY` isn't set in `backend/.env`, it falls back to a built-in
offline heuristic summarizer (extractive summary + regex-based action-item
detection) so the feature is fully functional immediately. Set
`ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`, default
`claude-sonnet-5`) in `backend/.env` to get real Claude-generated summaries
instead — see `backend/.env.example`.

## Nothing left on the "not included" list
The previous README noted that AI summaries and the Admin panel routes were
missing — both are now implemented. If you find something that's still
broken or missing, open an issue / say the word.
