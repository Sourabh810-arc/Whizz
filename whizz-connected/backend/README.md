# Whizz Backend — Minimal (~30%) Version

This is a **stripped-down subset** of the full Whizz backend, containing just enough
to make the frontend's **Signup, Login, Forgot/Reset Password, Profile, and Dashboard**
(basic meeting create/join/list) work end-to-end.

## ✅ Included
- MongoDB connection (`config/db.js`)
- `User` and `Meeting` models
- JWT auth middleware + error handler
- **Auth**: signup, login, forgot-password (emails a reset link), reset-password, `GET /api/auth/me`
- **User**: edit profile, change password, meeting history
- **Meetings (basic)**: create instant meeting, schedule meeting, get meeting by ID, join meeting, dashboard summary (upcoming/recent), end meeting

## ❌ Not included yet (available on request)
- **Socket.IO** — no real-time video signaling, chat, whiteboard sync, live captions, or host controls (mute all / remove / lock) yet. The Meeting Room page in the frontend needs this to actually connect calls.
- **AI routes** — no meeting summary/minutes/action-item generation, PDF export, or email-summary endpoints.
- **Admin panel routes** — no user management, analytics, or reports endpoints.

## Setup

```bash
cp .env.example .env
# edit .env: set MONGO_URI (MongoDB Atlas connection string) and JWT_SECRET at minimum
npm install
npm run dev          # starts on http://localhost:5000
```

Optional — create an admin account (for later, once the admin panel routes are added):
```bash
npm run seed:admin
```

## Try it
1. Start this backend (`npm run dev`)
2. Start the frontend (`npm run dev` in the `frontend` folder — proxies `/api` to `localhost:5000`)
3. Go to `http://localhost:5173`, sign up, log in, and you should land on the Dashboard.
4. "New Meeting" / "Schedule" will work and create real MongoDB documents. Actually joining a live video call won't work until the Socket.IO + WebRTC layer is added.

## API Endpoints in this version

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
| PUT | `/api/meetings/:meetingId/end` | ✅ | End meeting (host only) |

---
Ready for the next ~30%? Say the word and I'll add the Socket.IO/WebRTC signaling layer next (needed for actual video calls, chat, and host controls).
