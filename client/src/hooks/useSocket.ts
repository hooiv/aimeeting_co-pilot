import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from './redux';

interface UseSocketReturn {
  socket: Socket | null;
  isSocketConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

export const useSocket = (namespace?: string): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const { user, token } = useAppSelector((state) => state.auth);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const socketUrl = namespace ? `${serverUrl}/${namespace}` : serverUrl;

    // Create socket connection
    const newSocket = io(socketUrl, {
      auth: {
        token: token,
        userId: user.id,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsSocketConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsSocketConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsSocketConnected(false);
    };
  }, [user, token, namespace]);

  const emit = (event: string, data?: any) => {
    if (socket && isSocketConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  };

  return {
    socket,
    isSocketConnected,
    emit,
    on,
    off,
  };
};

export default useSocket;
