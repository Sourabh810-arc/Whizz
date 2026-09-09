# What changed in this fix pass

## 1. Camera/mic chosen on the pre-join screen now actually carries into the call
- `frontend/src/components/PreJoin.jsx` — instead of stopping its preview
  stream when you click "Join Now", it now hands that exact `MediaStream`
  (with your mute/camera choice already applied) up to `MeetingRoom`.
- `frontend/src/pages/MeetingRoom.jsx` — stores that handoff (`preJoinState`)
  and passes it into `useWebRTC` as `initialStream` / `initialMuted` /
  `initialVideoOff`.
- `frontend/src/hooks/useWebRTC.js` — the local-media effect now only runs
  once you've actually joined (previously it fired on mount, before you even
  saw the Join button — a second, redundant `getUserMedia` call). It reuses
  the handed-off stream when present, and initializes `isMuted` / `isVideoOff`
  to match what you picked in PreJoin. It also emits the initial
  `toggle-audio` / `toggle-video` state to peers right after joining, so
  other participants immediately see you as muted/camera-off if you chose
  that.

## 2. Meetings now show up in "Recent Meetings" reliably
Root cause: a meeting only became `status: 'ended'` if the host explicitly
clicked "End for Everyone." If the host just closed the tab, or a regular
participant left, nothing was ever recorded.

- `backend/utils/meetingLifecycle.js` (new) — shared `recordParticipantLeave`
  helper: marks the leaving participant's `leftAt`, and auto-ends the meeting
  (so it moves into history) when either the host leaves or everyone who
  joined has left.
- `backend/controllers/meetingController.js` / `routes/meetingRoutes.js` —
  new `PUT /api/meetings/:meetingId/leave` endpoint using that helper.
- `frontend/src/pages/MeetingRoom.jsx` — `handleLeave` now calls that
  endpoint before navigating away.
- `backend/socket/meetingSocket.js` — the socket `disconnect` handler also
  calls the same helper, so closing the tab (no explicit "Leave" click) still
  correctly ends/records the meeting.

## 3. Share/invite link
Didn't exist before. Added a copy-to-clipboard invite link (`/meeting/:id`)
in three places:
- `frontend/src/components/PreJoin.jsx` — on the pre-join screen, before you
  even enter the call.
- `frontend/src/pages/MeetingRoom.jsx` — an "Invite" button in the top bar
  during the live call.
- `frontend/src/components/MeetingCard.jsx` — a small copy-link icon on
  upcoming/ongoing meeting cards on the dashboard.

## 4. Added the missing Socket.IO signaling server
The backend's own README flagged this as a deliberately unfinished ~30%
slice — Socket.IO wasn't included at all, so live calls, chat, reactions,
and host controls couldn't work regardless of the fixes above. Added:
- `backend/middleware/socketAuth.js` — JWT auth for the socket handshake.
- `backend/socket/meetingSocket.js` — WebRTC offer/answer/ICE relay,
  chat/reactions/hand-raise relay, notes/whiteboard relay, host controls
  (mute all / lock / remove / end), and presence tracking + the leave/
  disconnect handling from item 2.
- `backend/server.js` — now creates an `http.Server` and attaches
  `socket.io`, listening on the same port as the REST API.
- `backend/package.json` — added the `socket.io` dependency.

## Still not included (per the original backend README, unrelated to your bugs)
AI meeting summaries/PDF export/email summary, and the Admin panel routes.
Say the word if you'd like those built out too.

## Running it
Same as before — see the top-level `README.md`. One extra step: run
`npm install` in `backend/` again to pull in the new `socket.io` dependency.
