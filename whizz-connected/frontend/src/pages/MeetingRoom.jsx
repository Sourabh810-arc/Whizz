import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Link2, Check } from 'lucide-react';

import PreJoin from '../components/PreJoin';
import VideoTile from '../components/VideoTile';
import ControlBar from '../components/ControlBar';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import NotesPanel from '../components/NotesPanel';
import Whiteboard from '../components/Whiteboard';
import CaptionsOverlay from '../components/CaptionsOverlay';
import { ReactionPicker, ReactionsOverlay } from '../components/ReactionsOverlay';
import HostControlsModal from '../components/HostControlsModal';
import Modal from '../components/Modal';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useLiveCaptions } from '../hooks/useLiveCaptions';
import { useMeetingTimer } from '../hooks/useMeetingTimer';
import api from '../utils/api';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [preJoinState, setPreJoinState] = useState(null); // { stream, muted, videoOff } from PreJoin
  const [linkCopied, setLinkCopied] = useState(false);

  const meetingLink = `${window.location.origin}/meeting/${meetingId}`;

  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'participants' | 'notes' | null
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  const [showReportModal, setShowReportModal] = useState(null); // { socketId, name }
  const [reportReason, setReportReason] = useState('');

  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [showCaptions, setShowCaptions] = useState(false);
  const [localHandRaised, setLocalHandRaised] = useState(false);

  const { formatted: timerDisplay } = useMeetingTimer(meeting?.startedAt);

  const webrtc = useWebRTC({
    socket,
    meetingId: joined ? meetingId : null,
    userName: user?.name,
    isHost,
    initialStream: preJoinState?.stream,
    initialMuted: preJoinState?.muted,
    initialVideoOff: preJoinState?.videoOff,
  });
  useLiveCaptions({
    socket,
    meetingId: joined ? meetingId : null,
    userName: user?.name,
    language: user?.preferredLanguage,
    enabled: joined && showCaptions,
  });

  // ---------- Load meeting data ----------
  useEffect(() => {
    api
      .get(`/meetings/${meetingId}`)
      .then(({ data }) => {
        setMeeting(data.meeting);
        setIsHost(data.meeting.host?._id === user?._id);
      })
      .catch(() => toast.error('Meeting not found'))
      .finally(() => setLoading(false));
  }, [meetingId, user]);

  // ---------- Socket event wiring for chat / captions / host actions ----------
  useEffect(() => {
    if (!socket || !joined) return;

    const onChat = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      setUnreadChat((c) => (activePanel === 'chat' ? c : c + 1));
    };
    const onReaction = ({ emoji }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setReactions((prev) => [...prev, { id, emoji, left: 20 + Math.random() * 60 }]);
      setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), 2300);
    };
    const onCaption = ({ speaker, text }) => setCaptions((prev) => [...prev.slice(-19), { speaker, text }]);
    const onForceMute = () => {
      webrtc.forceMuteLocal();
      toast('You were muted by the host', { icon: '🔇' });
    };
    const onRemoved = () => {
      toast.error('You were removed from the meeting by the host');
      navigate('/dashboard');
    };
    const onMeetingEnded = () => {
      toast('The host ended the meeting', { icon: '📞' });
      navigate(`/meeting/${meetingId}/summary`);
    };
    const onLockChanged = ({ locked }) => {
      setMeeting((m) => (m ? { ...m, isLocked: locked } : m));
      toast(locked ? 'Meeting locked' : 'Meeting unlocked');
    };

    socket.on('chat-message', onChat);
    socket.on('reaction', onReaction);
    socket.on('caption-line', onCaption);
    socket.on('force-mute', onForceMute);
    socket.on('removed-from-meeting', onRemoved);
    socket.on('meeting-ended-by-host', onMeetingEnded);
    socket.on('meeting-lock-changed', onLockChanged);

    return () => {
      socket.off('chat-message', onChat);
      socket.off('reaction', onReaction);
      socket.off('caption-line', onCaption);
      socket.off('force-mute', onForceMute);
      socket.off('removed-from-meeting', onRemoved);
      socket.off('meeting-ended-by-host', onMeetingEnded);
      socket.off('meeting-lock-changed', onLockChanged);
    };
  }, [socket, joined, activePanel, navigate, meetingId, webrtc]);

  const handleJoin = async (preJoin) => {
    try {
      const { data } = await api.post(`/meetings/${meetingId}/join`);
      setMeeting(data.meeting);
      setPreJoinState(preJoin); // carries the PreJoin camera/mic stream + chosen mute state into the call
      setJoined(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join meeting');
      // The PreJoin stream was already handed off — if we can't actually join,
      // release the camera/mic instead of leaving them running unused.
      preJoin?.stream?.getTracks().forEach((t) => t.stop());
    }
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink).then(() => {
      setLinkCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const openPanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
    if (panel === 'chat') setUnreadChat(0);
  };

  const sendChat = (message) => {
    socket.emit('chat-message', { meetingId, message, senderName: user.name });
    api.post(`/meetings/${meetingId}/chat`, { message }).catch(() => {});
  };

  const sendReaction = (emoji) => {
    socket.emit('reaction', { meetingId, emoji, name: user.name });
  };

  const handleToggleHand = () => {
    const next = !localHandRaised;
    setLocalHandRaised(next);
    socket.emit('raise-hand', { meetingId, raised: next, name: user.name });
  };

  const handleToggleScreenShare = () => {
    webrtc.isScreenSharing ? webrtc.stopScreenShare() : webrtc.startScreenShare();
  };

  const handleLeave = async () => {
    // Record the leave on the backend *before* navigating away — this is what
    // makes the meeting show up in "Recent Meetings"/history reliably, rather
    // than relying purely on the socket disconnecting in time.
    try {
      await api.put(`/meetings/${meetingId}/leave`);
    } catch {
      // non-fatal — still leave the call locally
    }
    webrtc.leaveCall();
    navigate('/dashboard');
  };

  const handleEndForEveryone = async () => {
    try {
      await api.put(`/meetings/${meetingId}/end`);
      socket.emit('host-end-meeting', { meetingId });
      webrtc.leaveCall();
      navigate(`/meeting/${meetingId}/summary`);
    } catch {
      toast.error('Could not end meeting');
    }
  };

  // If the user closes the tab instead of clicking "Leave", the REST call
  // above never fires — but the socket's `disconnect` event still reaches the
  // backend, which records the leave the same way (see backend/socket/
  // meetingSocket.js). That's the safety net for the "just closed the tab"
  // case that used to leave meetings stuck as "ongoing" forever.

  const handleMuteAll = () => {
    socket.emit('host-mute-all', { meetingId });
    toast.success('Muted all participants');
  };

  const handleToggleLock = async () => {
    try {
      const { data } = await api.put(`/meetings/${meetingId}/lock`);
      socket.emit('host-lock-meeting', { meetingId, locked: data.isLocked });
      setMeeting((m) => ({ ...m, isLocked: data.isLocked }));
    } catch {
      toast.error('Could not update lock status');
    }
  };

  const handleRemoveParticipant = (targetSocketId) => {
    socket.emit('host-remove-participant', { meetingId, targetSocketId });
  };

  const submitReport = async () => {
    try {
      await api.post('/admin/reports', {
        reportedUser: null,
        meeting: meeting?._id,
        reason: `Reported ${showReportModal.name} during meeting ${meetingId}: ${reportReason}`,
      });
      toast.success('Report submitted to admins');
      setShowReportModal(null);
      setReportReason('');
    } catch {
      toast.error('Could not submit report');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-950 text-white">
        <p>Meeting not found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!joined) {
    return <PreJoin meetingTitle={meeting.title} meetingLink={meetingLink} onJoin={handleJoin} />;
  }

  const peerEntries = Object.entries(webrtc.remoteStreams);
  const gridCols =
    peerEntries.length === 0
      ? 'grid-cols-1'
      : peerEntries.length <= 1
      ? 'grid-cols-1 sm:grid-cols-2'
      : peerEntries.length <= 3
      ? 'grid-cols-2'
      : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex h-screen bg-slate-950">
      <div className="relative flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="font-semibold text-white">{meeting.title}</h2>
            <code className="text-xs text-slate-500">{meeting.meetingId}</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyMeetingLink}
              title="Copy invite link"
              className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            >
              {linkCopied ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied' : 'Invite'}</span>
            </button>
            <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1.5 text-sm text-white">
              <Clock size={14} />
              {timerDisplay}
            </div>
          </div>
        </div>

        {/* Video grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className={`grid gap-4 ${gridCols}`}>
            <VideoTile
              stream={webrtc.screenStream || webrtc.localStream}
              name={user.name}
              isLocal
              muted={webrtc.isMuted}
              videoOff={webrtc.isVideoOff}
              handRaised={localHandRaised}
              isHost={isHost}
            />
            {peerEntries.map(([socketId, stream]) => {
              const meta = webrtc.peersMeta[socketId] || {};
              return (
                <VideoTile
                  key={socketId}
                  stream={stream}
                  name={meta.name || 'Participant'}
                  muted={meta.muted}
                  videoOff={meta.videoOff}
                  handRaised={meta.handRaised}
                  isHost={meta.isHost}
                />
              );
            })}
          </div>
        </div>

        <CaptionsOverlay captions={captions} showCaptions={showCaptions} />

        {showReactionPicker && <ReactionPicker onPick={sendReaction} onClose={() => setShowReactionPicker(false)} />}
        <ReactionsOverlay reactions={reactions} />

        {/* Control bar */}
        <div className="flex justify-center pb-6">
          <ControlBar
            isMuted={webrtc.isMuted}
            isVideoOff={webrtc.isVideoOff}
            isScreenSharing={webrtc.isScreenSharing}
            isHost={isHost}
            handRaised={localHandRaised}
            onToggleMute={webrtc.toggleMute}
            onToggleVideo={webrtc.toggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleChat={() => openPanel('chat')}
            onToggleParticipants={() => openPanel('participants')}
            onToggleHand={handleToggleHand}
            onToggleWhiteboard={() => setShowWhiteboard(true)}
            onToggleNotes={() => openPanel('notes')}
            onToggleCaptions={() => setShowCaptions((s) => !s)}
            onOpenReactions={() => setShowReactionPicker((s) => !s)}
            onOpenHostControls={() => setShowHostControls(true)}
            onLeave={isHost ? handleEndForEveryone : handleLeave}
            unreadChat={unreadChat}
            participantCount={peerEntries.length + 1}
            captionsOn={showCaptions}
          />
        </div>
      </div>

      {/* Side panels */}
      {activePanel === 'chat' && (
        <ChatPanel messages={chatMessages} onSend={sendChat} onClose={() => setActivePanel(null)} myName={user.name} />
      )}
      {activePanel === 'participants' && (
        <ParticipantsPanel
          localName={user.name}
          isLocalHost={isHost}
          localMuted={webrtc.isMuted}
          localVideoOff={webrtc.isVideoOff}
          localHandRaised={localHandRaised}
          peers={webrtc.peersMeta}
          onClose={() => setActivePanel(null)}
          onRemove={handleRemoveParticipant}
          onReport={(socketId, name) => setShowReportModal({ socketId, name })}
        />
      )}
      {activePanel === 'notes' && <NotesPanel socket={socket} meetingId={meetingId} onClose={() => setActivePanel(null)} />}

      {showWhiteboard && <Whiteboard socket={socket} meetingId={meetingId} onClose={() => setShowWhiteboard(false)} />}

      <HostControlsModal
        open={showHostControls}
        onClose={() => setShowHostControls(false)}
        isLocked={meeting.isLocked}
        onMuteAll={handleMuteAll}
        onToggleLock={handleToggleLock}
        onEndForEveryone={handleEndForEveryone}
      />

      <Modal open={!!showReportModal} onClose={() => setShowReportModal(null)} title={`Report ${showReportModal?.name || ''}`}>
        <textarea
          className="input-field h-28 resize-none"
          placeholder="Describe the issue..."
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        />
        <button onClick={submitReport} className="btn-danger mt-4 w-full">
          Submit Report
        </button>
      </Modal>

      {!connected && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
          Reconnecting...
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
