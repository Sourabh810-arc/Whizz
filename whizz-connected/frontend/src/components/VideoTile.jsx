import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, Hand, Crown } from 'lucide-react';

const VideoTile = ({ stream, name, isLocal, muted, videoOff, handRaised, isHost, speaking }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoOff]);

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-900 shadow-card transition-all ${
        speaking ? 'ring-2 ring-accent-400' : ''
      }`}
    >
      {stream && !videoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-500 text-lg font-bold text-white">
            {initials || '?'}
          </div>
        </div>
      )}

      {handRaised && (
        <div className="absolute right-3 top-3 flex h-8 w-8 animate-pulseSoft items-center justify-center rounded-full bg-amber-400 text-white shadow">
          <Hand size={16} />
        </div>
      )}

      <div className="absolute bottom-0 left-0 flex w-full items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white">
          {isHost && <Crown size={12} className="text-amber-400" />}
          <span className="max-w-[120px] truncate">{name} {isLocal && '(You)'}</span>
        </div>
        {muted && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90">
            <MicOff size={12} className="text-white" />
          </div>
        )}
      </div>

      {videoOff && stream && (
        <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700/80">
          <VideoOff size={12} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default VideoTile;
