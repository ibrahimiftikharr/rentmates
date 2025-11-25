import { io, Socket } from 'socket.io-client';
import { authService } from '@/domains/auth/services/authService';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect() {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io('http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✓ Socket connected:', this.socket?.id);
      this.connected = true;
      
      // Join user-specific room
      const user = authService.getCurrentUser();
      if (user) {
        this.socket?.emit('join_room', {
          userId: user.role === 'student' ? user.studentId : user.id,
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
