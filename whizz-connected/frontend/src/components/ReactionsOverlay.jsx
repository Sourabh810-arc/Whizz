import { useEffect, useState } from 'react';

const EMOJIS = ['👍', '❤️', '😂', '👏', '🎉', '🙌', '😮'];

export const ReactionPicker = ({ onPick, onClose }) => (
  <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-2xl bg-slate-800/95 p-2.5 shadow-2xl">
    {EMOJIS.map((e) => (
      <button
        key={e}
        onClick={() => {
          onPick(e);
          onClose();
        }}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-transform hover:scale-125"
      >
        {e}
      </button>
    ))}
  </div>
);

export const ReactionsOverlay = ({ reactions }) => (
  <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
    {reactions.map((r) => (
      <FloatingEmoji key={r.id} emoji={r.emoji} left={r.left} />
    ))}
  </div>
);

const FloatingEmoji = ({ emoji, left }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <span
      className="absolute bottom-24 animate-[floatUp_2.2s_ease-out_forwards] text-3xl"
      style={{ left: `${left}%`, animationName: 'floatUp' }}
    >
      {emoji}
      <style>{`@keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-220px); opacity: 0; } }`}</style>
    </span>
  );
};
