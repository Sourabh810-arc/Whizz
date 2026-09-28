import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) return;

    // Use relative path so it goes through Vite proxy (works on LAN IP too)
    // Vite proxy forwards /socket.io -> http://localhost:5000 with WebSocket support
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';

    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token, user]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
