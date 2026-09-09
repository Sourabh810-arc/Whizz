import { Users, MicOff, Mic, VideoOff, Video, Hand, Crown, UserX, ShieldAlert } from 'lucide-react';
import SidePanel from './SidePanel';

const ParticipantsPanel = ({ localName, isLocalHost, localMuted, localVideoOff, localHandRaised, peers, onClose, onRemove, onReport }) => {
  const list = Object.entries(peers); // [socketId, meta]

  return (
    <SidePanel title={`Participants (${list.length + 1})`} icon={Users} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {/* Local user row */}
        <div className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {localName?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white">{localName} (You)</span>
            {isLocalHost && <Crown size={13} className="text-amber-400" />}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            {localHandRaised && <Hand size={14} className="text-amber-400" />}
            {localMuted ? <MicOff size={14} /> : <Mic size={14} />}
            {localVideoOff ? <VideoOff size={14} /> : <Video size={14} />}
          </div>
        </div>

        {list.map(([socketId, p]) => (
          <div key={socketId} className="flex items-center justify-between rounded-xl bg-slate-800/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                {p.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white">{p.name}</span>
              {p.isHost && <Crown size={13} className="text-amber-400" />}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {p.handRaised && <Hand size={14} className="text-amber-400" />}
              {p.muted ? <MicOff size={14} /> : <Mic size={14} />}
              {p.videoOff ? <VideoOff size={14} /> : <Video size={14} />}
              {isLocalHost && (
                <button onClick={() => onRemove(socketId)} title="Remove" className="text-slate-400 hover:text-red-400">
                  <UserX size={15} />
                </button>
              )}
              {!isLocalHost && (
                <button onClick={() => onReport(socketId, p.name)} title="Report" className="text-slate-400 hover:text-amber-400">
                  <ShieldAlert size={15} />
                </button>
              )}
            </div>
          </div>
        ))}

        {list.length === 0 && <p className="mt-4 text-center text-sm text-slate-500">You're the only one here so far.</p>}
      </div>
    </SidePanel>
  );
};

export default ParticipantsPanel;
