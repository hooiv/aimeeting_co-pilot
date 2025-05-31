import { io, Socket } from 'socket.io-client';
import { store } from '../store';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
  meetingId?: string;
}

export interface MeetingUpdate {
  meetingId: string;
  type: 'participant_joined' | 'participant_left' | 'status_changed' | 'recording_started' | 'recording_stopped';
  data: any;
}

export interface NotificationUpdate {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  connect() {
    const token = store.getState().auth.token;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Meeting-related events
    this.socket.on('meeting_update', (data: MeetingUpdate) => {
      this.emit('meeting_update', data);
      this.updateMeetingInStore(data);
    });

    this.socket.on('participant_update', (data) => {
      this.emit('participant_update', data);
    });

    this.socket.on('transcript_update', (data) => {
      this.emit('transcript_update', data);
    });

    this.socket.on('ai_insight', (data) => {
      this.emit('ai_insight', data);
    });

    // Notification events
    this.socket.on('notification', (data: NotificationUpdate) => {
      this.emit('notification', data);
      this.showNotification(data);
    });

    // System events
    this.socket.on('system_update', (data) => {
      this.emit('system_update', data);
    });

    // Recording events
    this.socket.on('recording_status', (data) => {
      this.emit('recording_status', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed', { attempts: this.reconnectAttempts });
    }
  }

  private updateMeetingInStore(update: MeetingUpdate) {
    // Update Redux store with meeting changes
    store.dispatch({
      type: 'api/updateQueryData',
      payload: {
        endpointName: 'getMeetings',
        args: {},
        updateRecipe: (draft: any) => {
          const meeting = draft.find((m: any) => m.id === update.meetingId);
          if (meeting) {
            switch (update.type) {
              case 'status_changed':
                meeting.status = update.data.status;
                break;
              case 'participant_joined':
                meeting.participants = update.data.participants;
                break;
              case 'participant_left':
                meeting.participants = update.data.participants;
                break;
              case 'recording_started':
                meeting.isRecording = true;
                break;
              case 'recording_stopped':
                meeting.isRecording = false;
                break;
            }
          }
        },
      },
    });
  }

  private showNotification(notification: NotificationUpdate) {
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }

  // Public methods
  joinMeeting(meetingId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_meeting', { meetingId });
    }
  }

  leaveMeeting(meetingId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_meeting', { meetingId });
    }
  }

  sendMessage(type: string, payload: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(type, payload);
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();



export default webSocketService;
