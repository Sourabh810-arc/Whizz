import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, CalendarPlus, LogIn as JoinIcon, History, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import MeetingCard from '../components/MeetingCard';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import JoinMeetingModal from '../components/JoinMeetingModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings/dashboard/summary');
      setUpcoming(data.upcoming);
      setRecent(data.recent);
      setTotalMeetings(data.totalMeetings);
    } catch {
      toast.error('Could not load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const startInstantMeeting = async () => {
    try {
      const { data } = await api.post('/meetings/instant', {});
      navigate(`/meeting/${data.meeting.meetingId}`);
    } catch {
      toast.error('Could not start meeting');
    }
  };

  const quickActions = [
    { label: 'New Meeting', desc: 'Start an instant call', icon: Video, action: startInstantMeeting, color: 'from-primary-600 to-primary-500' },
    { label: 'Join Meeting', desc: 'Enter a meeting ID', icon: JoinIcon, action: () => setJoinOpen(true), color: 'from-accent-500 to-accent-400' },
    { label: 'Schedule', desc: 'Plan a future meeting', icon: CalendarPlus, action: () => setScheduleOpen(true), color: 'from-purple-600 to-primary-500' },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="animate-fadeIn">
        <div className="card mb-8 overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-accent-500 p-8 text-white">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="mt-2 max-w-lg text-primary-100">
            You've hosted or joined {totalMeetings} meeting{totalMeetings === 1 ? '' : 's'} so far. Ready for your
            next one?
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map(({ label, desc, icon: Icon, action, color }) => (
            <button
              key={label}
              onClick={action}
              className="card group flex items-center gap-4 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-soft transition-transform group-hover:scale-110`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Upcoming Meetings</h3>
          </div>
          {loading ? (
            <SkeletonRow />
          ) : upcoming.length === 0 ? (
            <EmptyState text="No upcoming meetings. Schedule one to get started." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((m) => (
                <MeetingCard key={m._id} meeting={m} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <History size={18} className="text-primary-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Meetings</h3>
          </div>
          {loading ? (
            <SkeletonRow />
          ) : recent.length === 0 ? (
            <EmptyState text="Your meeting history will show up here." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((m) => (
                <MeetingCard key={m._id} meeting={m} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ScheduleMeetingModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} onScheduled={loadDashboard} />
      <JoinMeetingModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </AppLayout>
  );
};

const EmptyState = ({ text }) => (
  <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
    <Video size={28} className="text-slate-300 dark:text-slate-700" />
    <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
  </div>
);

const SkeletonRow = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="card h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />
    ))}
  </div>
);

export default Dashboard;
