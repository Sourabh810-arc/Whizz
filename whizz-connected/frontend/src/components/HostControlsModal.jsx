import { ShieldCheck, MicOff, Lock, Unlock, PhoneOff } from 'lucide-react';
import Modal from './Modal';

const HostControlsModal = ({ open, onClose, isLocked, onMuteAll, onToggleLock, onEndForEveryone }) => {
  return (
    <Modal open={open} onClose={onClose} title="Host Controls">
      <div className="flex flex-col gap-3">
        <button onClick={onMuteAll} className="btn-secondary w-full justify-start">
          <MicOff size={18} className="text-slate-500" />
          Mute all participants
        </button>
        <button onClick={onToggleLock} className="btn-secondary w-full justify-start">
          {isLocked ? <Unlock size={18} className="text-slate-500" /> : <Lock size={18} className="text-slate-500" />}
          {isLocked ? 'Unlock meeting' : 'Lock meeting'}
        </button>
        <button onClick={onEndForEveryone} className="btn-danger w-full justify-start">
          <PhoneOff size={18} />
          End meeting for everyone
        </button>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck size={13} /> Only visible to you as the meeting host.
      </p>
    </Modal>
  );
};

export default HostControlsModal;
