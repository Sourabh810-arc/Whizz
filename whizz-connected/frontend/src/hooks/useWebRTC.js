import { useCallback, useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // For production, add a TURN server here, e.g.:
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' },
  ],
};

/**
 * Manages local media + a mesh of RTCPeerConnections (one per remote participant),
 * driven by Socket.IO signaling events. Suitable for small meetings (mesh topology).
 * For large-scale production use, swap this for an SFU (e.g. mediasoup/LiveKit).
 */
export const useWebRTC = ({ socket, meetingId, userName, isHost, initialStream, initialMuted, initialVideoOff }) => {
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [peersMeta, setPeersMeta] = useState({}); // { socketId: { name, isHost, muted, videoOff, handRaised } }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef({}); // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);

  // ---------- Initialize local media ----------
  // Runs once the user has actually joined (meetingId becomes truthy) rather
  // than on every mount of the room, so it doesn't grab the camera a second
  // time behind the PreJoin screen. If PreJoin already captured a stream and
  // handed it off (initialStream), reuse it — including whatever mute/camera
  // state the user picked there — instead of starting fresh with everything
  // back on.
  useEffect(() => {
    if (!meetingId) return;
    let mounted = true;

    (async () => {
      try {
        const stream = initialStream || (await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.getAudioTracks().forEach((t) => (t.enabled = !initialMuted));
        stream.getVideoTracks().forEach((t) => (t.enabled = !initialVideoOff));
        setLocalStream(stream);
        localStreamRef.current = stream;
        setIsMuted(!!initialMuted);
        setIsVideoOff(!!initialVideoOff);
      } catch (err) {
        console.error('Could not access camera/microphone:', err);
      }
    })();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const createPeerConnection = useCallback(
    (remoteSocketId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { to: remoteSocketId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({ ...prev, [remoteSocketId]: event.streams[0] }));
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[remoteSocketId];
            return copy;
          });
        }
      };

      peerConnections.current[remoteSocketId] = pc;
      return pc;
    },
    [socket]
  );

  // ---------- Signaling event wiring ----------
  useEffect(() => {
    if (!socket || !meetingId) return;

    socket.emit('join-room', { meetingId, name: userName, isHost });
    // Let peers know right away if we joined pre-muted / camera-off, so their
    // UI doesn't briefly show us as live when we chose otherwise on PreJoin.
    if (initialMuted) socket.emit('toggle-audio', { meetingId, muted: true });
    if (initialVideoOff) socket.emit('toggle-video', { meetingId, videoOff: true });

    const handleUserJoined = async ({ socketId, name, isHost: theirHost }) => {
      setPeersMeta((prev) => ({ ...prev, [socketId]: { name, isHost: theirHost, muted: false, videoOff: false, handRaised: false } }));
      const pc = createPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { to: socketId, offer });
    };

    const handleRoomParticipants = (participants) => {
      const meta = {};
      participants.forEach((p) => {
        meta[p.socketId] = { name: p.name, isHost: p.isHost, muted: p.muted, videoOff: p.videoOff, handRaised: p.handRaised };
      });
      setPeersMeta((prev) => ({ ...prev, ...meta }));
    };

    const handleOffer = async ({ from, offer }) => {
      const pc = peerConnections.current[from] || createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('ICE candidate error', e);
        }
      }
    };

    const handleParticipantLeft = ({ socketId }) => {
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
      setPeersMeta((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
    };

    const handleAudioToggled = ({ socketId, muted }) => {
      setPeersMeta((prev) => ({ ...prev, [socketId]: { ...prev[socketId], muted } }));
    };
    const handleVideoToggled = ({ socketId, videoOff }) => {
      setPeersMeta((prev) => ({ ...prev, [socketId]: { ...prev[socketId], videoOff } }));
    };
    const handleHandRaised = ({ socketId, name, raised }) => {
      setPeersMeta((prev) => ({ ...prev, [socketId]: { ...prev[socketId], name: prev[socketId]?.name || name, handRaised: raised } }));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('room-participants', handleRoomParticipants);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('peer-audio-toggled', handleAudioToggled);
    socket.on('peer-video-toggled', handleVideoToggled);
    socket.on('hand-raised', handleHandRaised);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('room-participants', handleRoomParticipants);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('peer-audio-toggled', handleAudioToggled);
      socket.off('peer-video-toggled', handleVideoToggled);
      socket.off('hand-raised', handleHandRaised);
      socket.emit('leave-room');
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, meetingId, createPeerConnection]);

  // ---------- Controls ----------
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    setIsMuted(newMuted);
    socket?.emit('toggle-audio', { meetingId, muted: newMuted });
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const newOff = !isVideoOff;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !newOff));
    setIsVideoOff(newOff);
    socket?.emit('toggle-video', { meetingId, videoOff: newOff });
  };

  const forceMuteLocal = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
    setIsMuted(true);
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      setScreenStream(stream);
      setIsScreenSharing(true);

      const screenTrack = stream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      socket?.emit('screen-share-started', { meetingId, name: userName });

      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error('Screen share failed or was cancelled', err);
    }
  };

  const stopScreenShare = () => {
    screenStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setIsScreenSharing(false);

    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(camTrack);
      });
    }
    socket?.emit('screen-share-stopped', { meetingId });
  };

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    socket?.emit('leave-room');
  };

  return {
    localStream,
    screenStream,
    remoteStreams,
    peersMeta,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    forceMuteLocal,
    startScreenShare,
    stopScreenShare,
    leaveCall,
  };
};
