import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center dark:bg-slate-950">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 text-white">
      <Video size={26} />
    </div>
    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">404</h1>
    <p className="text-slate-500 dark:text-slate-400">This page doesn't exist.</p>
    <Link to="/dashboard" className="btn-primary">
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
