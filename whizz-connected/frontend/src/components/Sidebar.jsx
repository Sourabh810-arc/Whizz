import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, ShieldCheck, Video, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
];

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 h-full w-64 transform border-r border-slate-100 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 text-white shadow-soft">
              <Video size={18} />
            </div>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">Whizz</span>
          </div>
          <button onClick={onClose} className="text-slate-500 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <ShieldCheck size={18} />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
