import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, WebSocketMessage } from '@/types';
import config from '@/config';
import { aiService } from './aiService';

interface ConnectedUser {
  id: string;
  socketId: string;
  meetingId: string;
  name: string;
  role: string;
  joinedAt: Date;
}

interface MeetingRoom {
  id: string;
  participants: Map<string, ConnectedUser>;
  isRecording: boolean;
  transcriptionEnabled: boolean;
  createdAt: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private meetingRooms: Map<string, MeetingRoom> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.user.userId}`);

      // Join meeting room
      socket.on('join-meeting', (data: { meetingId: string }) => {
        this.handleJoinMeeting(socket, data.meetingId);
      });

      // Leave meeting room
      socket.on('leave-meeting', (data: { meetingId: string }) => {
        this.handleLeaveMeeting(socket, data.meetingId);
      });

      // WebRTC signaling
      socket.on('webrtc-offer', (data: { to: string; offer: RTCSessionDescriptionInit; meetingId: string }) => {
        this.handleWebRTCSignaling(socket, 'webrtc-offer', data);
      });

      socket.on('webrtc-answer', (data: { to: string; answer: RTCSessionDescriptionInit; meetingId: string }) => {
        this.handleWebRTCSignaling(socket, 'webrtc-answer', data);
      });

      socket.on('webrtc-ice-candidate', (data: { to: string; candidate: RTCIceCandidateInit; meetingId: string }) => {
        this.handleWebRTCSignaling(socket, 'webrtc-ice-candidate', data);
      });

      // Chat messages
      socket.on('chat-message', (data: { meetingId: string; message: string; type?: string }) => {
        this.handleChatMessage(socket, data);
      });

      // Audio data for transcription
      socket.on('audio-data', (data: { meetingId: string; audioData: ArrayBuffer; format: string }) => {
        this.handleAudioData(socket, data);
      });

      // Participant status updates
      socket.on('participant-update', (data: { meetingId: string; updates: any }) => {
        this.handleParticipantUpdate(socket, data);
      });

      // Screen sharing
      socket.on('screen-share-start', (data: { meetingId: string }) => {
        this.handleScreenShareStart(socket, data);
      });

      socket.on('screen-share-stop', (data: { meetingId: string }) => {
        this.handleScreenShareStop(socket, data);
      });

      // Recording controls
      socket.on('recording-start', (data: { meetingId: string }) => {
        this.handleRecordingStart(socket, data);
      });

      socket.on('recording-stop', (data: { meetingId: string }) => {
        this.handleRecordingStop(socket, data);
      });

      // Reactions and interactions
      socket.on('reaction', (data: { meetingId: string; reaction: string; targetUserId?: string }) => {
        this.handleReaction(socket, data);
      });

      // Whiteboard events
      socket.on('whiteboard-draw', (data: { meetingId: string; drawData: any }) => {
        this.handleWhiteboardDraw(socket, data);
      });

      // Polls and voting
      socket.on('poll-create', (data: { meetingId: string; poll: any }) => {
        this.handlePollCreate(socket, data);
      });

      socket.on('poll-vote', (data: { meetingId: string; pollId: string; option: string }) => {
        this.handlePollVote(socket, data);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.data.user.userId}:`, error);
      });
    });
  }

  private handleJoinMeeting(socket: any, meetingId: string) {
    const user = socket.data.user;
    
    // Create meeting room if it doesn't exist
    if (!this.meetingRooms.has(meetingId)) {
      this.meetingRooms.set(meetingId, {
        id: meetingId,
        participants: new Map(),
        isRecording: false,
        transcriptionEnabled: true,
        createdAt: new Date(),
      });
    }

    const meetingRoom = this.meetingRooms.get(meetingId)!;
    const connectedUser: ConnectedUser = {
      id: user.userId,
      socketId: socket.id,
      meetingId,
      name: user.email, // You might want to get the actual name from the database
      role: user.role,
      joinedAt: new Date(),
    };

    // Add user to meeting room
    meetingRoom.participants.set(user.userId, connectedUser);
    this.connectedUsers.set(socket.id, connectedUser);

    // Join socket room
    socket.join(meetingId);

    // Notify other participants
    socket.to(meetingId).emit('participant-joined', {
      userId: user.userId,
      name: connectedUser.name,
      role: connectedUser.role,
      joinedAt: connectedUser.joinedAt,
    });

    // Send current participants list to the new user
    const participants = Array.from(meetingRoom.participants.values()).map(p => ({
      userId: p.id,
      name: p.name,
      role: p.role,
      joinedAt: p.joinedAt,
    }));

    socket.emit('meeting-joined', {
      meetingId,
      participants,
      isRecording: meetingRoom.isRecording,
      transcriptionEnabled: meetingRoom.transcriptionEnabled,
    });

    console.log(`User ${user.userId} joined meeting ${meetingId}`);
  }

  private handleLeaveMeeting(socket: any, meetingId: string) {
    const user = socket.data.user;
    const meetingRoom = this.meetingRooms.get(meetingId);

    if (meetingRoom && meetingRoom.participants.has(user.userId)) {
      // Remove user from meeting room
      meetingRoom.participants.delete(user.userId);
      this.connectedUsers.delete(socket.id);

      // Leave socket room
      socket.leave(meetingId);

      // Notify other participants
      socket.to(meetingId).emit('participant-left', {
        userId: user.userId,
        leftAt: new Date(),
      });

      // Clean up empty meeting rooms
      if (meetingRoom.participants.size === 0) {
        this.meetingRooms.delete(meetingId);
      }

      console.log(`User ${user.userId} left meeting ${meetingId}`);
    }
  }

  private handleWebRTCSignaling(socket: any, eventType: string, data: any) {
    const targetSocket = this.findSocketByUserId(data.to);
    if (targetSocket) {
      targetSocket.emit(eventType, {
        from: socket.data.user.userId,
        ...data,
      });
    }
  }

  private handleChatMessage(socket: any, data: { meetingId: string; message: string; type?: string }) {
    const user = socket.data.user;
    const meetingRoom = this.meetingRooms.get(data.meetingId);

    if (meetingRoom && meetingRoom.participants.has(user.userId)) {
      const messageData = {
        id: Date.now().toString(),
        senderId: user.userId,
        senderName: meetingRoom.participants.get(user.userId)!.name,
        content: data.message,
        type: data.type || 'text',
        timestamp: new Date().toISOString(),
        meetingId: data.meetingId,
      };

      // Broadcast to all participants in the meeting
      this.io.to(data.meetingId).emit('chat-message', messageData);

      // Process message for AI insights if it's a regular text message
      if (data.type === 'text' || !data.type) {
        this.processMessageForAI(data.meetingId, data.message);
      }
    }
  }

  private async handleAudioData(socket: any, data: { meetingId: string; audioData: ArrayBuffer; format: string }) {
    const user = socket.data.user;
    const meetingRoom = this.meetingRooms.get(data.meetingId);

    if (meetingRoom && meetingRoom.transcriptionEnabled && meetingRoom.participants.has(user.userId)) {
      try {
        // Convert ArrayBuffer to Buffer
        const audioBuffer = Buffer.from(data.audioData);

        // Transcribe audio using AI service
        const transcriptionResult = await aiService.transcribeAudio(audioBuffer);

        if (transcriptionResult.text.trim()) {
          const transcriptData = {
            id: Date.now().toString(),
            text: transcriptionResult.text,
            confidence: transcriptionResult.confidence,
            speakerId: user.userId,
            speakerName: meetingRoom.participants.get(user.userId)!.name,
            timestamp: new Date().toISOString(),
            meetingId: data.meetingId,
          };

          // Broadcast transcription to all participants
          this.io.to(data.meetingId).emit('transcription', transcriptData);

          // Process for AI insights
          this.processTranscriptionForAI(data.meetingId, transcriptionResult.text);
        }
      } catch (error) {
        console.error('Error processing audio data:', error);
        socket.emit('transcription-error', { error: 'Failed to process audio' });
      }
    }
  }

  private handleParticipantUpdate(socket: any, data: { meetingId: string; updates: any }) {
    const user = socket.data.user;
    
    // Broadcast participant updates to other users in the meeting
    socket.to(data.meetingId).emit('participant-updated', {
      userId: user.userId,
      updates: data.updates,
      timestamp: new Date().toISOString(),
    });
  }

  private handleScreenShareStart(socket: any, data: { meetingId: string }) {
    const user = socket.data.user;
    
    // Notify all participants that screen sharing started
    this.io.to(data.meetingId).emit('screen-share-started', {
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });
  }

  private handleScreenShareStop(socket: any, data: { meetingId: string }) {
    const user = socket.data.user;
    
    // Notify all participants that screen sharing stopped
    this.io.to(data.meetingId).emit('screen-share-stopped', {
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });
  }

  private handleRecordingStart(socket: any, data: { meetingId: string }) {
    const meetingRoom = this.meetingRooms.get(data.meetingId);
    
    if (meetingRoom) {
      meetingRoom.isRecording = true;
      
      // Notify all participants that recording started
      this.io.to(data.meetingId).emit('recording-started', {
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleRecordingStop(socket: any, data: { meetingId: string }) {
    const meetingRoom = this.meetingRooms.get(data.meetingId);
    
    if (meetingRoom) {
      meetingRoom.isRecording = false;
      
      // Notify all participants that recording stopped
      this.io.to(data.meetingId).emit('recording-stopped', {
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleReaction(socket: any, data: { meetingId: string; reaction: string; targetUserId?: string }) {
    const user = socket.data.user;
    
    const reactionData = {
      userId: user.userId,
      reaction: data.reaction,
      targetUserId: data.targetUserId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast reaction to all participants
    this.io.to(data.meetingId).emit('reaction', reactionData);
  }

  private handleWhiteboardDraw(socket: any, data: { meetingId: string; drawData: any }) {
    // Broadcast whiteboard drawing data to other participants
    socket.to(data.meetingId).emit('whiteboard-draw', data.drawData);
  }

  private handlePollCreate(socket: any, data: { meetingId: string; poll: any }) {
    const user = socket.data.user;
    
    const pollData = {
      ...data.poll,
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
    };

    // Broadcast poll to all participants
    this.io.to(data.meetingId).emit('poll-created', pollData);
  }

  private handlePollVote(socket: any, data: { meetingId: string; pollId: string; option: string }) {
    const user = socket.data.user;
    
    const voteData = {
      pollId: data.pollId,
      userId: user.userId,
      option: data.option,
      timestamp: new Date().toISOString(),
    };

    // Broadcast vote to all participants
    this.io.to(data.meetingId).emit('poll-vote', voteData);
  }

  private handleDisconnect(socket: any) {
    const connectedUser = this.connectedUsers.get(socket.id);
    
    if (connectedUser) {
      this.handleLeaveMeeting(socket, connectedUser.meetingId);
    }

    console.log(`User disconnected: ${socket.data.user?.userId || 'unknown'}`);
  }

  private findSocketByUserId(userId: string): any {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.id === userId) {
        return this.io.sockets.sockets.get(socketId);
      }
    }
    return null;
  }

  private async processMessageForAI(meetingId: string, message: string) {
    try {
      // Analyze sentiment of the message
      const sentiment = await aiService.analyzeSentiment(message);
      
      // Broadcast AI insight
      this.io.to(meetingId).emit('ai-insight', {
        type: 'sentiment',
        data: sentiment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing message for AI:', error);
    }
  }

  private async processTranscriptionForAI(meetingId: string, text: string) {
    try {
      // Detect topics in the transcription
      const topics = await aiService.detectTopics(text);
      
      if (topics.topics.length > 0) {
        this.io.to(meetingId).emit('ai-insight', {
          type: 'topics',
          data: topics,
          timestamp: new Date().toISOString(),
        });
      }

      // Extract action items
      const actionItems = await aiService.extractActionItems(text);
      
      if (actionItems.actionItems.length > 0) {
        this.io.to(meetingId).emit('ai-insight', {
          type: 'action_items',
          data: actionItems,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error processing transcription for AI:', error);
    }
  }

  // Public methods for external use
  public sendToMeeting(meetingId: string, event: string, data: any) {
    this.io.to(meetingId).emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any) {
    const socket = this.findSocketByUserId(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public getMeetingParticipants(meetingId: string): ConnectedUser[] {
    const meetingRoom = this.meetingRooms.get(meetingId);
    return meetingRoom ? Array.from(meetingRoom.participants.values()) : [];
  }

  public getMeetingRooms(): MeetingRoom[] {
    return Array.from(this.meetingRooms.values());
  }
}

export let websocketService: WebSocketService;
