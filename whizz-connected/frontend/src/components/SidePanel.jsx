import { X } from 'lucide-react';

const SidePanel = ({ title, icon: Icon, onClose, children, footer }) => (
  <div className="flex h-full w-full flex-col border-l border-slate-800 bg-slate-900 sm:w-80">
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
      <div className="flex items-center gap-2 text-white">
        {Icon && <Icon size={18} />}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        <X size={18} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-4">{children}</div>
    {footer && <div className="border-t border-slate-800 p-3">{footer}</div>}
  </div>
);

export default SidePanel;
