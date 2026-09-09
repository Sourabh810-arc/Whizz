import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import api from '../utils/api';

const ScheduleMeetingModal = ({ open, onClose, onScheduled }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('Please select a date and time');
      return;
    }
    setLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const { data } = await api.post('/meetings/schedule', { title, scheduledAt, duration });
      toast.success('Meeting scheduled!');
      onScheduled?.(data.meeting);
      onClose();
      setTitle('');
      setDate('');
      setTime('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule a meeting">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Meeting title</label>
          <input className="input-field" placeholder="Weekly sync" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input type="date" required className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Time</label>
            <input type="time" required className="input-field" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</label>
          <input type="number" min={15} step={15} className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? 'Scheduling...' : 'Schedule Meeting'}
        </button>
      </form>
    </Modal>
  );
};

export default ScheduleMeetingModal;
