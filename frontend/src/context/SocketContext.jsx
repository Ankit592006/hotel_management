import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Remember desired rooms so initial mount & reconnects always re-join reliably
  const socketRef = useRef(null);
  const desiredAdminRef = useRef(false);
  const desiredOrderRef = useRef(null);
  const desiredTableRef = useRef(null);

  const syncRooms = useCallback((sock) => {
    if (!sock || !sock.connected) return;
    if (desiredAdminRef.current) {
      const token = localStorage.getItem('smartserve_token');
      if (token) sock.emit('join_admin', token);
    }
    if (desiredOrderRef.current) {
      sock.emit('join_order', desiredOrderRef.current);
    }
    if (desiredTableRef.current) {
      sock.emit('join_table', desiredTableRef.current);
    }
  }, []);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: (cb) => {
        cb({ token: localStorage.getItem('smartserve_token') || '' });
      }
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socketInstance.id);
      setIsConnected(true);
      syncRooms(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ Socket.IO disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [syncRooms]);

  const joinAdmin = useCallback(() => {
    desiredAdminRef.current = true;
    const sock = socketRef.current;
    if (sock && sock.connected) {
      const token = localStorage.getItem('smartserve_token');
      if (token) sock.emit('join_admin', token);
    }
  }, []);

  const joinOrder = useCallback((orderId) => {
    desiredOrderRef.current = orderId || null;
    const sock = socketRef.current;
    if (sock && sock.connected && orderId) {
      sock.emit('join_order', orderId);
    }
  }, []);

  const joinTable = useCallback((tableNumber) => {
    desiredTableRef.current = tableNumber || null;
    const sock = socketRef.current;
    if (sock && sock.connected && tableNumber) {
      sock.emit('join_table', tableNumber);
    }
  }, []);

  const playChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio chime context not allowed yet by user gesture');
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinAdmin,
        joinOrder,
        joinTable,
        playChime
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
