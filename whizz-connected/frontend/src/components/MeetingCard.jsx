import { useState } from 'react';
import { Calendar, Clock, Users, Video, Link2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MeetingCard = ({ meeting }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const isUpcoming = meeting.status === 'scheduled';

  const copyLink = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/meeting/${meeting.meetingId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
          <Video size={18} />
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            meeting.status === 'ended'
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : meeting.status === 'ongoing'
              ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
          }`}
        >
          {meeting.status}
        </span>
      </div>
      <h3 className="truncate font-bold text-slate-800 dark:text-white">{meeting.title}</h3>
      <div className="flex flex-col gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          {meeting.scheduledAt
            ? format(new Date(meeting.scheduledAt), 'MMM d, yyyy · h:mm a')
            : format(new Date(meeting.startedAt || meeting.createdAt), 'MMM d, yyyy · h:mm a')}
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} />
          {meeting.participants?.length || 0} participant{meeting.participants?.length === 1 ? '' : 's'}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <code className="text-xs text-slate-400">{meeting.meetingId}</code>
          {meeting.status !== 'ended' && (
            <button
              onClick={copyLink}
              title="Copy invite link"
              className="text-slate-400 hover:text-primary-500"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Link2 size={13} />}
            </button>
          )}
        </div>
        {isUpcoming ? (
          <button onClick={() => navigate(`/meeting/${meeting.meetingId}`)} className="text-xs font-semibold text-primary-600 hover:underline">
            Start now
          </button>
        ) : meeting.status === 'ongoing' ? (
          <button onClick={() => navigate(`/meeting/${meeting.meetingId}`)} className="text-xs font-semibold text-green-600 hover:underline">
            Rejoin
          </button>
        ) : (
          <button onClick={() => navigate(`/meeting/${meeting.meetingId}/summary`)} className="text-xs font-semibold text-slate-500 hover:underline">
            View summary
          </button>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;
