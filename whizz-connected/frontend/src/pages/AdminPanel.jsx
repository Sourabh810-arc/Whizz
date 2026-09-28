import { useEffect, useState } from 'react';
import { Users, Video, BarChart3, Flag, ShieldBan, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import AppLayout from '../components/AppLayout';
import api from '../utils/api';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Video },
  { id: 'reports', label: 'Reports', icon: Flag },
];

const AdminPanel = () => {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, u, m, r] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/meetings'),
        api.get('/admin/reports'),
      ]);
      setAnalytics(a.data.analytics);
      setUsers(u.data.users);
      setMeetings(m.data.meetings);
      setReports(r.data.reports);
    } catch {
      toast.error('Could not load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleUserStatus = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status: status === 'active' ? 'suspended' : 'active' });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: status === 'active' ? 'suspended' : 'active' } : u)));
      toast.success('User status updated');
    } catch {
      toast.error('Could not update status');
    }
  };

  const updateReport = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      toast.success('Report updated');
    } catch {
      toast.error('Could not update report');
    }
  };

  return (
    <AppLayout title="Admin Panel">
      <div className="animate-fadeIn">
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === id
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
        ) : (
          <>
            {tab === 'analytics' && analytics && <AnalyticsTab analytics={analytics} />}
            {tab === 'users' && <UsersTab users={users} onToggle={toggleUserStatus} />}
            {tab === 'meetings' && <MeetingsTab meetings={meetings} />}
            {tab === 'reports' && <ReportsTab reports={reports} onUpdate={updateReport} />}
          </>
        )}
      </div>
    </AppLayout>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="card p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p>
  </div>
);

const AnalyticsTab = ({ analytics }) => (
  <div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total Users" value={analytics.totalUsers} color="text-primary-600" />
      <StatCard label="Total Meetings" value={analytics.totalMeetings} color="text-accent-600" />
      <StatCard label="Ongoing Now" value={analytics.ongoingMeetings} color="text-green-600" />
      <StatCard label="Meetings Today" value={analytics.activeToday} color="text-purple-600" />
    </div>
    <div className="card mt-6 p-6">
      <h3 className="mb-4 font-bold text-slate-800 dark:text-white">Meetings per day (last 30 entries)</h3>
      <div className="flex h-40 items-end gap-1.5">
        {analytics.meetingsPerDay.map((d) => {
          const max = Math.max(...analytics.meetingsPerDay.map((x) => x.count), 1);
          return (
            <div key={d._id} className="group relative flex-1">
              <div
                className="rounded-t-md bg-gradient-to-t from-primary-600 to-accent-500 transition-all group-hover:opacity-80"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const UsersTab = ({ users, onToggle }) => (
  <div className="card overflow-x-auto p-4">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
          <th className="p-3 font-medium">Name</th>
          <th className="p-3 font-medium">Email</th>
          <th className="p-3 font-medium">Role</th>
          <th className="p-3 font-medium">Status</th>
          <th className="p-3 font-medium">Joined</th>
          <th className="p-3 font-medium">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u._id} className="border-b border-slate-50 dark:border-slate-800/60">
            <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
            <td className="p-3 text-slate-500 dark:text-slate-400">{u.email}</td>
            <td className="p-3">
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {u.role}
              </span>
            </td>
            <td className="p-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  u.status === 'active'
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {u.status}
              </span>
            </td>
            <td className="p-3 text-slate-500 dark:text-slate-400">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
            <td className="p-3">
              {u.role !== 'admin' && (
                <button
                  onClick={() => onToggle(u._id, u.status)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600"
                >
                  {u.status === 'active' ? <ShieldBan size={14} /> : <ShieldCheck size={14} />}
                  {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MeetingsTab = ({ meetings }) => (
  <div className="card overflow-x-auto p-4">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
          <th className="p-3 font-medium">Title</th>
          <th className="p-3 font-medium">Host</th>
          <th className="p-3 font-medium">Meeting ID</th>
          <th className="p-3 font-medium">Status</th>
          <th className="p-3 font-medium">Participants</th>
          <th className="p-3 font-medium">Created</th>
        </tr>
      </thead>
      <tbody>
        {meetings.map((m) => (
          <tr key={m._id} className="border-b border-slate-50 dark:border-slate-800/60">
            <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{m.title}</td>
            <td className="p-3 text-slate-500 dark:text-slate-400">{m.host?.name || '—'}</td>
            <td className="p-3">
              <code className="text-xs text-slate-500">{m.meetingId}</code>
            </td>
            <td className="p-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {m.status}
              </span>
            </td>
            <td className="p-3 text-slate-500 dark:text-slate-400">{m.participants?.length || 0}</td>
            <td className="p-3 text-slate-500 dark:text-slate-400">{format(new Date(m.createdAt), 'MMM d, yyyy')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ReportsTab = ({ reports, onUpdate }) => (
  <div className="flex flex-col gap-3">
    {reports.length === 0 && <div className="card p-8 text-center text-sm text-slate-400">No reports filed yet.</div>}
    {reports.map((r) => (
      <div key={r._id} className="card flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            Reported by {r.reportedBy?.name || 'Unknown'}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              r.status === 'pending'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {r.status}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{r.reason}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => onUpdate(r._id, 'reviewed')} className="btn-secondary px-3 py-1.5 text-xs">
            Mark Reviewed
          </button>
          <button onClick={() => onUpdate(r._id, 'actioned')} className="btn-secondary px-3 py-1.5 text-xs">
            Mark Actioned
          </button>
          <button onClick={() => onUpdate(r._id, 'dismissed')} className="btn-secondary px-3 py-1.5 text-xs">
            Dismiss
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default AdminPanel;
