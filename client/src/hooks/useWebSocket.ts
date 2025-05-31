import { useState, useEffect, useCallback } from 'react';
import { webSocketService, MeetingUpdate, NotificationUpdate } from '../services/websocket';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(webSocketService.isSocketConnected());

  useEffect(() => {
    const handleConnectionStatus = (status: { connected: boolean }) => {
      setIsConnected(status.connected);
    };

    webSocketService.on('connection_status', handleConnectionStatus);

    return () => {
      webSocketService.off('connection_status', handleConnectionStatus);
    };
  }, []);

  return {
    isConnected,
    joinMeeting: webSocketService.joinMeeting.bind(webSocketService),
    leaveMeeting: webSocketService.leaveMeeting.bind(webSocketService),
    sendMessage: webSocketService.sendMessage.bind(webSocketService),
    on: webSocketService.on.bind(webSocketService),
    off: webSocketService.off.bind(webSocketService),
  };
};

export const useMeetingUpdates = (meetingId?: string) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [meetingStatus, setMeetingStatus] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!meetingId) return;

    const handleMeetingUpdate = (update: MeetingUpdate) => {
      if (update.meetingId === meetingId) {
        switch (update.type) {
          case 'participant_joined':
          case 'participant_left':
            setParticipants(update.data.participants);
            break;
          case 'status_changed':
            setMeetingStatus(update.data.status);
            break;
          case 'recording_started':
            setIsRecording(true);
            break;
          case 'recording_stopped':
            setIsRecording(false);
            break;
        }
      }
    };

    webSocketService.on('meeting_update', handleMeetingUpdate);

    // Join the meeting room for real-time updates
    webSocketService.joinMeeting(meetingId);

    return () => {
      webSocketService.off('meeting_update', handleMeetingUpdate);
      webSocketService.leaveMeeting(meetingId);
    };
  }, [meetingId]);

  return {
    participants,
    meetingStatus,
    isRecording,
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationUpdate[]>([]);

  useEffect(() => {
    const handleNotification = (notification: NotificationUpdate) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    };

    webSocketService.on('notification', handleNotification);

    return () => {
      webSocketService.off('notification', handleNotification);
    };
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotification,
    clearAllNotifications,
  };
};

export const useTranscriptUpdates = (meetingId?: string) => {
  const [transcript, setTranscript] = useState<any[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (!meetingId) return;

    const handleTranscriptUpdate = (data: any) => {
      if (data.meetingId === meetingId) {
        setTranscript(prev => [...prev, data.segment]);
        setIsTranscribing(data.isActive);
      }
    };

    webSocketService.on('transcript_update', handleTranscriptUpdate);

    return () => {
      webSocketService.off('transcript_update', handleTranscriptUpdate);
    };
  }, [meetingId]);

  return {
    transcript,
    isTranscribing,
  };
};

export const useAIInsights = (meetingId?: string) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!meetingId) return;

    const handleAIInsight = (data: any) => {
      if (data.meetingId === meetingId) {
        setInsights(prev => [...prev, data.insight]);
        setIsProcessing(data.isProcessing || false);
      }
    };

    webSocketService.on('ai_insight', handleAIInsight);

    return () => {
      webSocketService.off('ai_insight', handleAIInsight);
    };
  }, [meetingId]);

  return {
    insights,
    isProcessing,
  };
};

export const useSystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    healthy: true,
    services: {},
    lastUpdate: new Date(),
  });

  useEffect(() => {
    const handleSystemUpdate = (data: any) => {
      setSystemStatus({
        healthy: data.healthy,
        services: data.services,
        lastUpdate: new Date(data.timestamp),
      });
    };

    webSocketService.on('system_update', handleSystemUpdate);

    return () => {
      webSocketService.off('system_update', handleSystemUpdate);
    };
  }, []);

  return systemStatus;
};
