import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { addTranscriptEntry } from '../store/slices/meetingSlice';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TranscriptEntry {
  id: string;
  content: string;
  confidence: number;
  timestamp: string;
  speakerId: string;
  speakerName: string;
  isFinal: boolean;
}

interface TranscriptionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  chunkDuration?: number;
  apiEndpoint?: string;
}

interface UseTranscriptionReturn {
  transcript: TranscriptEntry[];
  isTranscribing: boolean;
  currentText: string;
  confidence: number;
  startTranscription: () => void;
  stopTranscription: () => void;
  pauseTranscription: () => void;
  resumeTranscription: () => void;
  setLanguage: (language: string) => void;
}

const defaultConfig: TranscriptionConfig = {
  language: 'en-US',
  continuous: true,
  interimResults: true,
  maxAlternatives: 1,
  chunkDuration: 5000, // 5 seconds
  apiEndpoint: '/api/transcribe',
};

export const useTranscription = (
  config: TranscriptionConfig = defaultConfig
): UseTranscriptionReturn => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // State
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  const isBrowserSupported = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);

  // Initialize Web Speech API
  const initializeWebSpeechAPI = useCallback(() => {
    if (!isBrowserSupported()) {
      console.warn('Web Speech API not supported, falling back to server-side transcription');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = config.continuous ?? true;
    recognition.interimResults = config.interimResults ?? true;
    recognition.lang = config.language ?? 'en-US';
    recognition.maxAlternatives = config.maxAlternatives ?? 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsTranscribing(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;

          // Add to transcript history
          const transcriptEntry: TranscriptEntry = {
            id: Date.now().toString(),
            content: transcript,
            confidence: confidence || 0,
            timestamp: new Date().toISOString(),
            speakerId: user?.id || 'unknown',
            speakerName: user?.displayName || 'Unknown',
            isFinal: true,
          };

          setTranscript((prev) => [...prev, transcriptEntry]);
          dispatch(addTranscriptEntry(transcriptEntry));
          setCurrentText('');
          setConfidence(confidence || 0);
        } else {
          interimTranscript += transcript;
          setCurrentText(interimTranscript);
          setConfidence(confidence || 0);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart recognition if no speech detected
        setTimeout(() => {
          if (isTranscribing && !isPaused) {
            recognition.start();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      if (isTranscribing && !isPaused) {
        // Restart recognition to keep it continuous
        setTimeout(() => {
          recognition.start();
        }, 100);
      } else {
        setIsTranscribing(false);
      }
    };

    return true;
  }, [config, user, isTranscribing, isPaused, dispatch]);

  // Initialize server-side transcription
  const initializeServerTranscription = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await sendAudioToServer(audioBlob);
          audioChunksRef.current = [];
        }
      };

      return true;
    } catch (error) {
      console.error('Error initializing server transcription:', error);
      return false;
    }
  }, []);

  // Send audio to server for transcription
  const sendAudioToServer = useCallback(
    async (audioBlob: Blob) => {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('language', config.language || 'en-US');
        formData.append('userId', user?.id || 'unknown');

        const response = await fetch(config.apiEndpoint || '/api/transcribe', {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data.text) {
            const transcriptEntry: TranscriptEntry = {
              id: Date.now().toString(),
              content: result.data.text,
              confidence: result.data.confidence || 0,
              timestamp: new Date().toISOString(),
              speakerId: user?.id || 'unknown',
              speakerName: user?.displayName || 'Unknown',
              isFinal: true,
            };

            setTranscript((prev) => [...prev, transcriptEntry]);
            dispatch(addTranscriptEntry(transcriptEntry));
            setConfidence(result.data.confidence || 0);
          }
        }
      } catch (error) {
        console.error('Error sending audio to server:', error);
      }
    },
    [config, user, dispatch]
  );

  // Start chunk recording for server transcription
  const startChunkRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    const recordChunk = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      setTimeout(() => {
        if (mediaRecorderRef.current && isTranscribing && !isPaused) {
          mediaRecorderRef.current.start();
          chunkIntervalRef.current = setTimeout(recordChunk, config.chunkDuration || 5000);
        }
      }, 100);
    };

    mediaRecorderRef.current.start();
    chunkIntervalRef.current = setTimeout(recordChunk, config.chunkDuration || 5000);
  }, [config.chunkDuration, isTranscribing, isPaused]);

  // Start transcription
  const startTranscription = useCallback(async () => {
    if (isTranscribing) return;

    setIsPaused(false);

    // Try Web Speech API first
    if (initializeWebSpeechAPI() && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (error) {
        console.error('Error starting Web Speech API:', error);
      }
    }

    // Fall back to server-side transcription
    const serverInitialized = await initializeServerTranscription();
    if (serverInitialized) {
      setIsTranscribing(true);
      startChunkRecording();
    } else {
      console.error('Failed to initialize transcription');
    }
  }, [isTranscribing, initializeWebSpeechAPI, initializeServerTranscription, startChunkRecording]);

  // Stop transcription
  const stopTranscription = useCallback(() => {
    setIsTranscribing(false);
    setIsPaused(false);
    setCurrentText('');

    // Stop Web Speech API
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop server transcription
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (chunkIntervalRef.current) {
      clearTimeout(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  // Pause transcription
  const pauseTranscription = useCallback(() => {
    setIsPaused(true);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }

    if (chunkIntervalRef.current) {
      clearTimeout(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
  }, []);

  // Resume transcription
  const resumeTranscription = useCallback(() => {
    if (!isTranscribing) return;

    setIsPaused(false);

    if (recognitionRef.current) {
      recognitionRef.current.start();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startChunkRecording();
    }
  }, [isTranscribing, startChunkRecording]);

  // Set language
  const setLanguage = useCallback(
    (language: string) => {
      config.language = language;

      if (recognitionRef.current) {
        recognitionRef.current.lang = language;
      }
    },
    [config]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    transcript,
    isTranscribing,
    currentText,
    confidence,
    startTranscription,
    stopTranscription,
    pauseTranscription,
    resumeTranscription,
    setLanguage,
  };
};
