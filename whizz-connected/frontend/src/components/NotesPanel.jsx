import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import SidePanel from './SidePanel';
import api from '../utils/api';

let debounceTimer;

const NotesPanel = ({ socket, meetingId, onClose }) => {
  const [notes, setNotes] = useState('');
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    api.get(`/meetings/${meetingId}`).then(({ data }) => setNotes(data.meeting.notes || '')).catch(() => {});
  }, [meetingId]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ notes: incoming }) => {
      isRemoteUpdate.current = true;
      setNotes(incoming);
    };
    socket.on('notes-update', handler);
    return () => socket.off('notes-update', handler);
  }, [socket]);

  const handleChange = (val) => {
    setNotes(val);
    socket?.emit('notes-update', { meetingId, notes: val });
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      api.put(`/meetings/${meetingId}/notes`, { notes: val }).catch(() => {});
    }, 800);
  };

  return (
    <SidePanel title="Meeting Notes" icon={FileText} onClose={onClose}>
      <textarea
        className="h-full min-h-[60vh] w-full resize-none rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary-500"
        placeholder="Take shared notes during the meeting — everyone sees updates live..."
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
      />
    </SidePanel>
  );
};

export default NotesPanel;
