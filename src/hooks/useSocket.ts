import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });
        }

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket?.off('connect', onConnect);
            socket?.off('disconnect', onDisconnect);
        };
    }, []);

    return { socket, isConnected };
};
