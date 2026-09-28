import { Menu, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onMenuClick, title = 'Dashboard' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-slate-500 lg:hidden">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="icon-btn bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <Bell size={19} />
        </button>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="icon-btn bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50"
          title="Log out"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
