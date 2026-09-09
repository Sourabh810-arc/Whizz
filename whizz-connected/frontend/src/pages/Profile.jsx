import { useEffect, useState } from 'react';
import { User, Lock, Save, History, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LANGUAGES } from '../utils/languages';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en-US');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    api
      .get('/users/meeting-history')
      .then(({ data }) => setHistory(data.meetings))
      .catch(() => {});
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', { name, preferredLanguage });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api.put('/users/change-password', pwForm);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <AppLayout title="Profile">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 animate-fadeIn lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
              <User size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Edit Profile</h3>
          </div>
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input className="input-field opacity-60" value={user?.email} disabled />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Languages size={14} /> Speech language (for live captions)
              </label>
              <select className="input-field" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary mt-2 w-full">
              <Save size={16} />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
              <Lock size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Change Password</h3>
          </div>
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Current password</label>
              <input
                type="password"
                required
                className="input-field"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>
            <button type="submit" disabled={savingPw} className="btn-secondary mt-2 w-full">
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <History size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Meeting History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Meeting ID</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m._id} className="border-b border-slate-50 dark:border-slate-800/60">
                    <td className="py-2.5 font-medium text-slate-700 dark:text-slate-200">{m.title}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                      <code>{m.meetingId}</code>
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                      {format(new Date(m.startedAt || m.scheduledAt || m.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No meeting history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
