import { Video } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Video size={20} />
          </div>
          <span className="text-2xl font-extrabold">Whizz</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Meetings, reimagined with AI.</h2>
          <p className="mt-4 text-primary-100">
            Live captions, instant summaries, action items, and real-time voice translation — all built into
            every call.
          </p>
        </div>

        <p className="text-sm text-primary-200">© {new Date().getFullYear()} Whizz. All rights reserved.</p>

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mb-8 flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 text-white">
              <Video size={18} />
            </div>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">Whizz</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-sm animate-fadeIn">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
