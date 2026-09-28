import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent if the account exists');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="We'll email you a link to reset it">
      {sent ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          If an account exists for <b>{email}</b>, a password reset link has been sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                className="input-field pl-11"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            <Send size={18} />
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
