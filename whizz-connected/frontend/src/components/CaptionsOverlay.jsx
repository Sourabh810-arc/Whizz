import { Captions } from 'lucide-react';

const CaptionsOverlay = ({ captions, showCaptions }) => {
  if (!showCaptions) return null;

  const lastCaption = captions[captions.length - 1];
  if (!lastCaption) return null;

  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 z-30 flex w-full max-w-2xl -translate-x-1/2 flex-col items-center gap-2 px-4">
      <div className="flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
        <Captions size={14} className="shrink-0 text-accent-400" />
        <span>
          <b className="font-semibold">{lastCaption.speaker}:</b> {lastCaption.text}
        </span>
      </div>
    </div>
  );
};

export default CaptionsOverlay;
