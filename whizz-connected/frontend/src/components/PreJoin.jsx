import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Video as VideoIcon, Link2, Check } from 'lucide-react';

const PreJoin = ({ meetingTitle, meetingLink, onJoin }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handedOffRef = useRef(false);
  const [stream, setStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        streamRef.current = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {});
    return () => {
      // Only stop the tracks if they weren't handed off to the meeting room —
      // otherwise we'd kill the camera/mic the moment the call is about to start.
      if (!handedOffRef.current) streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    setMuted(!muted);
  };
  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !videoOff));
    setVideoOff(!videoOff);
  };

  const handleJoinClick = () => {
    handedOffRef.current = true;
    onJoin({ stream: streamRef.current, muted, videoOff });
  };

  const copyLink = () => {
    if (!meetingLink) return;
    navigator.clipboard.writeText(meetingLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-4 py-10 lg:flex-row lg:gap-16">
      <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
        {stream && !videoOff ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <VideoIcon size={40} className="text-slate-600" />
          </div>
        )}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-3">
          <button onClick={toggleMute} className={`icon-btn ${muted ? 'bg-red-500' : 'bg-slate-700/80'} text-white`}>
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={toggleVideo} className={`icon-btn ${videoOff ? 'bg-red-500' : 'bg-slate-700/80'} text-white`}>
            {videoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm text-center lg:text-left">
        <h2 className="text-2xl font-extrabold text-white">{meetingTitle || 'Ready to join?'}</h2>
        <p className="mt-2 text-sm text-slate-400">Check your camera and mic before joining the meeting.</p>

        {meetingLink && (
          <button
            onClick={copyLink}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-primary-500 hover:text-white lg:justify-start"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Link2 size={16} />}
            {copied ? 'Link copied!' : 'Copy invite link'}
          </button>
        )}

        <button onClick={handleJoinClick} className="btn-primary mt-4 w-full">
          Join Now
        </button>
      </div>
    </div>
  );
};

export default PreJoin;
