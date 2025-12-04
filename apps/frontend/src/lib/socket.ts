import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getGameSocket(): Socket {
  if (!socket) {
    socket = io(`${API_URL}/games`, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectGameSocket(): Promise<void> {
  const gameSocket = getGameSocket();

  return new Promise((resolve, reject) => {
    if (gameSocket.connected) {
      resolve();
      return;
    }

    gameSocket.connect();

    gameSocket.once('connect', () => {
      console.log('Connected to game server');
      resolve();
    });

    gameSocket.once('connect_error', (error) => {
      console.error('Connection error:', error);
      reject(error);
    });
  });
}

export function disconnectGameSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
