# Whizz Backend — Full Version

This backend now covers the whole app: auth, users, meetings, real-time
signaling (Socket.IO/WebRTC), AI meeting summaries, and the admin panel.

## ✅ Included
- MongoDB connection (`config/db.js`)
- `User`, `Meeting`, and `Report` models
- JWT auth middleware + error handler
- **Auth**: signup, login, forgot-password (emails a reset link), reset-password, `GET /api/auth/me`
- **User**: edit profile, change password, meeting history
- **Meetings**: create instant meeting, schedule meeting, get meeting by ID, join/leave/end meeting, lock/unlock, notes persistence, chat persistence, dashboard summary (upcoming/recent)
- **Socket.IO** — real-time WebRTC signaling (offer/answer/ICE relay), chat, reactions, hand-raise, live-caption transcript capture, notes/whiteboard relay, screen-share events, and host controls (mute all / lock / remove / end), plus presence + leave/disconnect handling so meetings reliably move into history
- **AI routes** — generate a summary/minutes/action-items from the captured transcript (`POST /api/ai/:meetingId/summary`), download as PDF (`GET /api/ai/:meetingId/summary/pdf`), or email the PDF to every attendee (`POST /api/ai/:meetingId/summary/email`). Works with zero setup via a built-in offline heuristic summarizer; set `ANTHROPIC_API_KEY` for real Claude-generated summaries instead.
- **Admin panel routes** — analytics, user list + suspend/reactivate, meeting oversight list, and a reports queue (any signed-in user can file a report; only admins can list/triage them)

## Setup

```bash
cp .env.example .env
# edit .env: set MONGO_URI (MongoDB Atlas connection string) and JWT_SECRET at minimum
# ANTHROPIC_API_KEY is optional — AI summaries work without it (see below)
npm install
npm run dev          # starts on http://localhost:5000
```

Create an admin account (needed to reach `/admin` in the frontend):
```bash
npm run seed:admin
```

## Try it
1. Start this backend (`npm run dev`)
2. Start the frontend (`npm run dev` in the `frontend` folder — proxies `/api` to `localhost:5000`)
3. Go to `http://localhost:5173`, sign up, log in, and you should land on the Dashboard.
4. "New Meeting" / "Schedule" work and create real MongoDB documents; joining a
   meeting connects a live WebRTC call via the Socket.IO signaling server.
5. End (or leave) a meeting, then open its "View summary" link to generate an
   AI summary, download it as a PDF, or email it to attendees.
6. Log in as the seeded admin account and visit `/admin` for analytics, user
   management, meeting oversight, and the reports queue.

## AI summaries — with or without an API key
If `ANTHROPIC_API_KEY` is unset, `backend/utils/aiSummary.js` falls back to a
dependency-free heuristic: an extractive summary plus regex-based action-item
detection over the meeting's captured transcript (from live captions) or, if
captions were never turned on, the chat log. Set `ANTHROPIC_API_KEY` (and
optionally `ANTHROPIC_MODEL`, default `claude-sonnet-5`) to call the real
Claude API for genuinely-generated summaries instead. Either way the response
shape is identical, so the frontend needs no changes.

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create account |
| POST | `/api/auth/login` | – | Log in |
| POST | `/api/auth/forgot-password` | – | Email reset link |
| PUT | `/api/auth/reset-password/:token` | – | Reset password |
| GET | `/api/auth/me` | ✅ | Current user |
| PUT | `/api/users/profile` | ✅ | Edit name/avatar/language |
| PUT | `/api/users/change-password` | ✅ | Change password |
| GET | `/api/users/meeting-history` | ✅ | Past meetings |
| GET | `/api/meetings/dashboard/summary` | ✅ | Upcoming/recent meetings |
| POST | `/api/meetings/instant` | ✅ | Create instant meeting |
| POST | `/api/meetings/schedule` | ✅ | Schedule a meeting |
| GET | `/api/meetings/:meetingId` | ✅ | Get meeting details |
| POST | `/api/meetings/:meetingId/join` | ✅ | Join a meeting |
| PUT | `/api/meetings/:meetingId/leave` | ✅ | Leave a meeting (records + may auto-end) |
| PUT | `/api/meetings/:meetingId/end` | ✅ | End meeting for everyone (host only) |
| PUT | `/api/meetings/:meetingId/lock` | ✅ | Toggle waiting-room lock (host only) |
| PUT | `/api/meetings/:meetingId/notes` | ✅ | Save shared notes doc |
| POST | `/api/meetings/:meetingId/chat` | ✅ | Persist a chat message |
| POST | `/api/ai/:meetingId/summary` | ✅ | Generate/regenerate AI summary + minutes + action items |
| GET | `/api/ai/:meetingId/summary/pdf` | ✅ | Download the summary as a PDF |
| POST | `/api/ai/:meetingId/summary/email` | ✅ (host) | Email the PDF summary to all attendees |
| GET | `/api/admin/analytics` | ✅ (admin) | Totals + 30-day meetings chart |
| GET | `/api/admin/users` | ✅ (admin) | List all users |
| PUT | `/api/admin/users/:id/status` | ✅ (admin) | Suspend / reactivate a user |
| GET | `/api/admin/meetings` | ✅ (admin) | List all meetings |
| POST | `/api/admin/reports` | ✅ | File a report (any user) |
| GET | `/api/admin/reports` | ✅ (admin) | List all reports |
| PUT | `/api/admin/reports/:id` | ✅ (admin) | Update a report's status |

Socket.IO events are documented inline in `socket/meetingSocket.js`.
