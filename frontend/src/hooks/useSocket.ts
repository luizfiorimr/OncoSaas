'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';

export const useSocket = (namespace: string = '/') => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const socketInstance = io(`${WS_URL}${namespace}`, {
      auth: {
        token,
        tenantId: user.tenantId,
      },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log(`Socket connected to ${namespace}`);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log(`Socket disconnected from ${namespace}`);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, [token, user, namespace]);

  return { socket, isConnected };
};

