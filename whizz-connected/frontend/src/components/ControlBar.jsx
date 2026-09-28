import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MonitorOff,
  MessageSquare,
  Users,
  Hand,
  Smile,
  PenTool,
  FileText,
  Captions,
  MoreVertical,
  PhoneOff,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

const ControlButton = ({ icon: Icon, active, danger, onClick, label, badge }) => (
  <button
    onClick={onClick}
    title={label}
    className={`icon-btn relative ${
      danger
        ? 'bg-red-500 text-white hover:bg-red-600'
        : active
        ? 'bg-primary-600 text-white hover:bg-primary-700'
        : 'bg-slate-700/80 text-white hover:bg-slate-600'
    }`}
  >
    <Icon size={19} />
    {badge > 0 && (
      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {badge}
      </span>
    )}
  </button>
);

const ControlBar = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isHost,
  handRaised,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleHand,
  onToggleWhiteboard,
  onToggleNotes,
  onToggleCaptions,
  onOpenReactions,
  onOpenHostControls,
  onLeave,
  unreadChat,
  participantCount,
  captionsOn,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-slate-800/95 px-4 py-3 shadow-2xl backdrop-blur">
      <ControlButton icon={isMuted ? MicOff : Mic} active={!isMuted} danger={isMuted} onClick={onToggleMute} label="Mute/Unmute" />
      <ControlButton icon={isVideoOff ? VideoOff : Video} active={!isVideoOff} danger={isVideoOff} onClick={onToggleVideo} label="Camera On/Off" />
      <ControlButton icon={isScreenSharing ? MonitorOff : ScreenShare} active={isScreenSharing} onClick={onToggleScreenShare} label="Screen Share" />
      <ControlButton icon={Hand} active={handRaised} onClick={onToggleHand} label="Raise Hand" />
      <ControlButton icon={Captions} active={captionsOn} onClick={onToggleCaptions} label="Live Captions" />

      <div className="mx-1 h-8 w-px bg-slate-600" />

      <ControlButton icon={MessageSquare} onClick={onToggleChat} label="Chat" badge={unreadChat} />
      <ControlButton icon={Users} onClick={onToggleParticipants} label="Participants" badge={participantCount} />
      <ControlButton icon={Smile} onClick={onOpenReactions} label="Reactions" />

      <div className="relative">
        <ControlButton icon={MoreVertical} onClick={() => setShowMore((s) => !s)} label="More" />
        {showMore && (
          <div className="absolute bottom-14 right-0 z-10 w-44 rounded-xl bg-slate-800 p-2 shadow-2xl">
            <button
              onClick={() => {
                onToggleWhiteboard();
                setShowMore(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              <PenTool size={16} /> Whiteboard
            </button>
            <button
              onClick={() => {
                onToggleNotes();
                setShowMore(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              <FileText size={16} /> Notes
            </button>
            {isHost && (
              <button
                onClick={() => {
                  onOpenHostControls();
                  setShowMore(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                <ShieldCheck size={16} /> Host Controls
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mx-1 h-8 w-px bg-slate-600" />

      <button onClick={onLeave} className="flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 font-semibold text-white transition-all hover:bg-red-600 active:scale-95">
        <PhoneOff size={18} />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
};

export default ControlBar;
