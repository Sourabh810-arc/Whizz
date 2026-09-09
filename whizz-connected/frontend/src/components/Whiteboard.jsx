import { useEffect, useRef, useState } from 'react';
import { PenTool, Eraser, Trash2, X } from 'lucide-react';

const COLORS = ['#1e293b', '#4f46e5', '#0ea5e9', '#ef4444', '#f59e0b', '#22c55e', '#ffffff'];

const Whiteboard = ({ socket, meetingId, onClose }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState('#4f46e5');
  const [size, setSize] = useState(3);
  const [tool, setTool] = useState('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const parent = canvas.parentElement;
      const prevImage = canvas.width ? canvas.toDataURL() : null;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctxRef.current = ctx;
      if (prevImage) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = prevImage;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleDraw = ({ stroke }) => drawStroke(stroke, false);
    const handleClear = () => clearCanvas(false);
    socket.on('whiteboard-draw', handleDraw);
    socket.on('whiteboard-clear', handleClear);
    return () => {
      socket.off('whiteboard-draw', handleDraw);
      socket.off('whiteboard-clear', handleClear);
    };
  }, [socket]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawStroke = (stroke, emit = true) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.lineWidth = stroke.tool === 'eraser' ? stroke.size * 6 : stroke.size;
    ctx.beginPath();
    ctx.moveTo(stroke.x0, stroke.y0);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.stroke();
    if (emit) socket?.emit('whiteboard-draw', { meetingId, stroke });
  };

  const lastPos = useRef(null);

  const startDraw = (e) => {
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const move = (e) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    const stroke = { x0: lastPos.current.x, y0: lastPos.current.y, x1: pos.x, y1: pos.y, color, size, tool };
    drawStroke(stroke);
    lastPos.current = pos;
  };

  const endDraw = () => (drawing.current = false);

  const clearCanvas = (emit = true) => {
    const ctx = ctxRef.current;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (emit) socket?.emit('whiteboard-clear', { meetingId });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 p-4 animate-fadeIn">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <PenTool size={18} />
          <h4 className="font-semibold">Collaborative Whiteboard</h4>
        </div>
        <button onClick={onClose} className="icon-btn bg-slate-800 text-white hover:bg-slate-700">
          <X size={18} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-900 p-2.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setTool('pen');
            }}
            className={`h-6 w-6 rounded-full border-2 ${color === c && tool === 'pen' ? 'border-primary-400' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input type="range" min={1} max={12} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24" />
        <button
          onClick={() => setTool('eraser')}
          className={`icon-btn h-9 w-9 ${tool === 'eraser' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}
        >
          <Eraser size={16} />
        </button>
        <button onClick={() => clearCanvas(true)} className="icon-btn h-9 w-9 bg-red-500/90 text-white hover:bg-red-600">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={move}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={move}
          onTouchEnd={endDraw}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
