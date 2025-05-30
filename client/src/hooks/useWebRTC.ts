import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from './redux';
import { addParticipant, removeParticipant, updateParticipant } from '../store/slices/meetingSlice';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isConnected: boolean;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendData: (data: any) => void;
}

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-credential',
    },
  ],
};

export const useWebRTC = (
  meetingId: string,
  config: WebRTCConfig = defaultConfig
): UseWebRTCReturn => {
  const dispatch = useAppDispatch();

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>(
    'good'
  );

  // Refs
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const dataChannels = useRef<Record<string, RTCDataChannel>>({});
  const socket = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    socket.current = new WebSocket(`${wsUrl}/meeting/${meetingId}`);

    socket.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    socket.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await handleSignalingMessage(message);
    };

    socket.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      socket.current?.close();
    };
  }, [meetingId]);

  // Handle signaling messages
  const handleSignalingMessage = async (message: any) => {
    const { type, from, data } = message;

    switch (type) {
      case 'user-joined':
        await createPeerConnection(from);
        break;
      case 'user-left':
        removePeerConnection(from);
        break;
      case 'offer':
        await handleOffer(from, data);
        break;
      case 'answer':
        await handleAnswer(from, data);
        break;
      case 'ice-candidate':
        await handleIceCandidate(from, data);
        break;
      case 'data':
        handleDataMessage(from, data);
        break;
    }
  };

  // Create peer connection
  const createPeerConnection = async (userId: string) => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections.current[userId] = peerConnection;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => ({
        ...prev,
        [userId]: remoteStream,
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage('ice-candidate', userId, event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
      updateNetworkQuality(peerConnection);
    };

    // Create data channel
    const dataChannel = peerConnection.createDataChannel('data', {
      ordered: true,
    });
    dataChannels.current[userId] = dataChannel;

    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${userId}`);
    };

    dataChannel.onmessage = (event) => {
      handleDataMessage(userId, JSON.parse(event.data));
    };

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        handleDataMessage(userId, JSON.parse(event.data));
      };
    };

    return peerConnection;
  };

  // Remove peer connection
  const removePeerConnection = (userId: string) => {
    const peerConnection = peerConnections.current[userId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnections.current[userId];
    }

    const dataChannel = dataChannels.current[userId];
    if (dataChannel) {
      dataChannel.close();
      delete dataChannels.current[userId];
    }

    setRemoteStreams((prev) => {
      const newStreams = { ...prev };
      delete newStreams[userId];
      return newStreams;
    });

    dispatch(removeParticipant(userId));
  };

  // Handle offer
  const handleOffer = async (userId: string, offer: RTCSessionDescriptionInit) => {
    let peerConnection = peerConnections.current[userId];
    if (!peerConnection) {
      peerConnection = await createPeerConnection(userId);
    }

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    sendSignalingMessage('answer', userId, answer);
  };

  // Handle answer
  const handleAnswer = async (userId: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peerConnections.current[userId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (userId: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peerConnections.current[userId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  };

  // Handle data messages
  const handleDataMessage = (userId: string, data: any) => {
    console.log('Received data from', userId, data);
    // Handle different types of data messages (chat, reactions, etc.)
  };

  // Send signaling message
  const sendSignalingMessage = (type: string, to: string, data: any) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          type,
          to,
          data,
          meetingId,
        })
      );
    }
  };

  // Update network quality based on connection stats
  const updateNetworkQuality = async (peerConnection: RTCPeerConnection) => {
    try {
      const stats = await peerConnection.getStats();
      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const packetsLost = report.packetsLost || 0;
          const packetsReceived = report.packetsReceived || 0;
          const lossRate = packetsLost / (packetsLost + packetsReceived);

          if (lossRate < 0.02) quality = 'excellent';
          else if (lossRate < 0.05) quality = 'good';
          else if (lossRate < 0.1) quality = 'fair';
          else quality = 'poor';
        }
      });

      setNetworkQuality(quality);
    } catch (error) {
      console.error('Error getting connection stats:', error);
    }
  };

  // Start call
  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      // Join the meeting room
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(
          JSON.stringify({
            type: 'join-meeting',
            meetingId,
          })
        );
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [meetingId]);

  // End call
  const endCall = useCallback(() => {
    // Close all peer connections
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    // Close all data channels
    Object.values(dataChannels.current).forEach((dc) => dc.close());
    dataChannels.current = {};

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Clear remote streams
    setRemoteStreams({});

    // Leave the meeting room
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          type: 'leave-meeting',
          meetingId,
        })
      );
    }
  }, [meetingId]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    try {
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const videoTrack = cameraStream.getVideoTracks()[0];

      // Replace screen share track with camera track
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Update local stream
      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, []);

  // Send data to all peers
  const sendData = useCallback((data: any) => {
    const message = JSON.stringify(data);
    Object.values(dataChannels.current).forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }, []);

  return {
    localStream,
    remoteStreams,
    isConnected,
    networkQuality,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendData,
  };
};
