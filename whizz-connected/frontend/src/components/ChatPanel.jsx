import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import SidePanel from './SidePanel';

const ChatPanel = ({ messages, onSend, onClose, myName }) => {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <SidePanel
      title="In-call messages"
      icon={MessageSquare}
      onClose={onClose}
      footer={
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-primary-500"
            placeholder="Send a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="icon-btn h-10 w-10 bg-primary-600 text-white hover:bg-primary-700">
            <Send size={16} />
          </button>
        </form>
      }
    >
      <div className="flex flex-col gap-3">
        {messages.length === 0 && <p className="text-center text-sm text-slate-500">No messages yet. Say hello!</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.senderName === myName ? 'items-end' : 'items-start'}`}>
            <span className="mb-1 text-[11px] text-slate-500">{m.senderName === myName ? 'You' : m.senderName}</span>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                m.senderName === myName ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-100'
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </SidePanel>
  );
};

export default ChatPanel;
