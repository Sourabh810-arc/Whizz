import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import api from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed, link may have expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Choose a new password for your account">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              minLength={6}
              className="input-field pl-11"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          <KeyRound size={18} />
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-semibold text-primary-600 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
