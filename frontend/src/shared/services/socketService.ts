import { io, Socket } from 'socket.io-client';
import { authService } from '@/domains/auth/services/authService';

const env = import.meta.env as Record<string, string | undefined>;
const socketUrlFromApiBase = env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '');
const SOCKET_URL = env.VITE_SOCKET_URL || socketUrlFromApiBase || 'http://127.0.0.1:5000';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect() {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✓ Socket connected:', this.socket?.id);
      this.connected = true;
      
      // Join user-specific room
      const user = authService.getCurrentUser();
      if (user) {
        this.socket?.emit('join_room', {
          userId: user.id, // Use the User ID, not profile ID
          role: user.role
        });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error(`Socket server unreachable at ${SOCKET_URL}. Ensure backend is running.`);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Emit events
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
