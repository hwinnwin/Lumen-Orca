import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize the Socket.io client connection.
 */
export function initSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    // Join the authenticated user's room
    const userJson = localStorage.getItem('scc-user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        socket?.emit('join-user', user.id);
      } catch {
        // ignore parse errors
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  return socket;
}

/**
 * Get the current socket instance.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
