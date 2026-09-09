const socketAuth = require('../middleware/socketAuth');
const Meeting = require('../models/Meeting');
const { recordParticipantLeave } = require('../utils/meetingLifecycle');

// In-memory room presence: meetingId -> Map(socketId -> { userId, name, isHost, muted, videoOff, handRaised })
// This is fine for a single-process deployment / small meetings (mesh WebRTC).
// For multi-instance scaling this would need to move to Redis.
const rooms = new Map();

const getRoom = (meetingId) => {
  if (!rooms.has(meetingId)) rooms.set(meetingId, new Map());
  return rooms.get(meetingId);
};

const roomParticipantsList = (meetingId, excludeSocketId) => {
  const room = rooms.get(meetingId);
  if (!room) return [];
  return Array.from(room.entries())
    .filter(([socketId]) => socketId !== excludeSocketId)
    .map(([socketId, meta]) => ({ socketId, ...meta }));
};

function attachMeetingSocket(io) {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    // ---------- Join ----------
    socket.on('join-room', async ({ meetingId, name, isHost }) => {
      try {
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting || meeting.status === 'ended') {
          socket.emit('join-denied', { reason: 'Meeting not found or already ended' });
          return;
        }

        socket.join(meetingId);
        socket.data.meetingId = meetingId;

        const room = getRoom(meetingId);
        room.set(socket.id, {
          name: name || socket.data.userName,
          isHost: !!isHost,
          muted: false,
          videoOff: false,
          handRaised: false,
        });

        // Tell the newcomer who's already here...
        socket.emit('room-participants', roomParticipantsList(meetingId, socket.id));
        // ...and tell everyone already here that a newcomer arrived.
        socket.to(meetingId).emit('user-joined', {
          socketId: socket.id,
          name: name || socket.data.userName,
          isHost: !!isHost,
        });
      } catch (err) {
        socket.emit('join-denied', { reason: 'Could not join meeting' });
      }
    });

    // ---------- WebRTC signaling relay ----------
    socket.on('webrtc-offer', ({ to, offer }) => {
      io.to(to).emit('webrtc-offer', { from: socket.id, offer });
    });
    socket.on('webrtc-answer', ({ to, answer }) => {
      io.to(to).emit('webrtc-answer', { from: socket.id, answer });
    });
    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
    });

    // ---------- Mic / camera state ----------
    socket.on('toggle-audio', ({ meetingId, muted }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (meta) meta.muted = !!muted;
      socket.to(meetingId).emit('peer-audio-toggled', { socketId: socket.id, muted: !!muted });
    });
    socket.on('toggle-video', ({ meetingId, videoOff }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (meta) meta.videoOff = !!videoOff;
      socket.to(meetingId).emit('peer-video-toggled', { socketId: socket.id, videoOff: !!videoOff });
    });

    // ---------- Hand raise / reactions / chat / captions ----------
    socket.on('raise-hand', ({ meetingId, raised, name }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (meta) meta.handRaised = !!raised;
      socket.to(meetingId).emit('hand-raised', { socketId: socket.id, name, raised: !!raised });
    });
    socket.on('reaction', ({ meetingId, emoji, name }) => {
      socket.to(meetingId).emit('reaction', { emoji, name });
    });
    socket.on('chat-message', ({ meetingId, message, senderName }) => {
      socket.to(meetingId).emit('chat-message', { message, senderName, timestamp: new Date() });
    });
    socket.on('caption-line', ({ meetingId, speaker, text }) => {
      socket.to(meetingId).emit('caption-line', { speaker, text });
      // Best-effort persistence for later AI summary generation.
      Meeting.updateOne({ meetingId }, { $push: { transcript: { speaker, text, timestamp: new Date() } } }).catch(() => {});
    });

    // ---------- Notes / whiteboard relay ----------
    socket.on('notes-update', ({ meetingId, notes }) => {
      socket.to(meetingId).emit('notes-update', { notes });
    });
    socket.on('whiteboard-draw', ({ meetingId, stroke }) => {
      socket.to(meetingId).emit('whiteboard-draw', { stroke });
    });
    socket.on('whiteboard-clear', ({ meetingId }) => {
      socket.to(meetingId).emit('whiteboard-clear', {});
    });

    // ---------- Screen share ----------
    socket.on('screen-share-started', ({ meetingId, name }) => {
      socket.to(meetingId).emit('screen-share-started', { socketId: socket.id, name });
    });
    socket.on('screen-share-stopped', ({ meetingId }) => {
      socket.to(meetingId).emit('screen-share-stopped', { socketId: socket.id });
    });

    // ---------- Host controls ----------
    socket.on('host-mute-all', ({ meetingId }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (!meta?.isHost) return;
      room.forEach((m, socketId) => {
        if (socketId !== socket.id) m.muted = true;
      });
      socket.to(meetingId).emit('force-mute');
    });

    socket.on('host-lock-meeting', async ({ meetingId, locked }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (!meta?.isHost) return;
      io.to(meetingId).emit('meeting-lock-changed', { locked: !!locked });
    });

    socket.on('host-remove-participant', ({ meetingId, targetSocketId }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (!meta?.isHost) return;

      io.to(targetSocketId).emit('removed-from-meeting');
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(meetingId);
        targetSocket.data.meetingId = null;
      }
      room.delete(targetSocketId);
      socket.to(meetingId).emit('participant-left', { socketId: targetSocketId });
    });

    socket.on('host-end-meeting', ({ meetingId }) => {
      const room = rooms.get(meetingId);
      const meta = room?.get(socket.id);
      if (!meta?.isHost) return;
      socket.to(meetingId).emit('meeting-ended-by-host');
      rooms.delete(meetingId);
    });

    // ---------- Leave (explicit) ----------
    socket.on('leave-room', () => handleLeave(socket));

    // ---------- Leave (tab closed / connection dropped) ----------
    socket.on('disconnect', () => handleLeave(socket));

    async function handleLeave(sock) {
      const meetingId = sock.data.meetingId;
      if (!meetingId) return;

      const room = rooms.get(meetingId);
      room?.delete(sock.id);
      if (room && room.size === 0) rooms.delete(meetingId);

      sock.to(meetingId).emit('participant-left', { socketId: sock.id });
      sock.data.meetingId = null;

      // Persist the leave + auto-end the meeting when appropriate, so it
      // reliably shows up in "Recent Meetings" even if the user just closed
      // the tab instead of clicking Leave/End.
      try {
        await recordParticipantLeave(meetingId, sock.data.userId);
      } catch (err) {
        // non-fatal — REST /leave call from the client is a fallback too
      }
    }
  });
}

module.exports = attachMeetingSocket;
