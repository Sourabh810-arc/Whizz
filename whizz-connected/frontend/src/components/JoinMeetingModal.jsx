import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from './Modal';

const JoinMeetingModal = ({ open, onClose }) => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Enter a meeting ID or paste an invite link');
      return;
    }
    // Accept either a raw meeting ID or a full invite link
    const match = code.match(/([a-z]{4}-[a-z]{4}-[a-z]{4})/i);
    const meetingId = match ? match[1] : code.trim();
    navigate(`/meeting/${meetingId}`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a meeting">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Meeting ID or invite link
          </label>
          <input
            className="input-field"
            placeholder="abcd-efgh-ijkl"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary mt-2 w-full">
          Join Meeting
        </button>
      </form>
    </Modal>
  );
};

export default JoinMeetingModal;
