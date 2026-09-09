import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fadeIn">
      <div className={`w-full ${sizes[size]} rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
