import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioAnalyzerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  updateInterval?: number;
}

interface UseAudioAnalyzerReturn {
  audioLevel: number;
  frequency: number[];
  isAnalyzing: boolean;
  isSpeaking: boolean;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  getAudioFeatures: () => AudioFeatures;
}

interface AudioFeatures {
  volume: number;
  pitch: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[];
  energy: number;
}

const defaultConfig: AudioAnalyzerConfig = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  updateInterval: 100,
};

export const useAudioAnalyzer = (
  stream: MediaStream | null,
  config: AudioAnalyzerConfig = defaultConfig
): UseAudioAnalyzerReturn => {
  // State
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequency, setFrequency] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio processing buffers
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);

  // Speech detection parameters
  const speechThreshold = 0.1;
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context and analyzer
  const initializeAudioAnalysis = useCallback(() => {
    if (!stream) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create analyzer node
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = config.fftSize || 2048;
      analyzerRef.current.smoothingTimeConstant = config.smoothingTimeConstant || 0.8;
      analyzerRef.current.minDecibels = config.minDecibels || -90;
      analyzerRef.current.maxDecibels = config.maxDecibels || -10;

      // Create source from stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyzerRef.current);

      // Initialize data arrays
      const bufferLength = analyzerRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      frequencyDataRef.current = new Uint8Array(bufferLength);

      console.log('Audio analysis initialized');
    } catch (error) {
      console.error('Error initializing audio analysis:', error);
    }
  }, [stream, config]);

  // Calculate audio level (RMS)
  const calculateAudioLevel = useCallback((): number => {
    if (!analyzerRef.current || !dataArrayRef.current) return 0;

    analyzerRef.current.getByteTimeDomainData(dataArrayRef.current);

    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const sample = (dataArrayRef.current[i] - 128) / 128;
      sum += sample * sample;
    }

    return Math.sqrt(sum / dataArrayRef.current.length);
  }, []);

  // Calculate frequency spectrum
  const calculateFrequencySpectrum = useCallback((): number[] => {
    if (!analyzerRef.current || !frequencyDataRef.current) return [];

    analyzerRef.current.getByteFrequencyData(frequencyDataRef.current);
    return Array.from(frequencyDataRef.current);
  }, []);

  // Calculate advanced audio features
  const getAudioFeatures = useCallback((): AudioFeatures => {
    if (!analyzerRef.current || !dataArrayRef.current || !frequencyDataRef.current) {
      return {
        volume: 0,
        pitch: 0,
        spectralCentroid: 0,
        zeroCrossingRate: 0,
        mfcc: [],
        energy: 0,
      };
    }

    // Get time domain data
    analyzerRef.current.getByteTimeDomainData(dataArrayRef.current);

    // Get frequency domain data
    analyzerRef.current.getByteFrequencyData(frequencyDataRef.current);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const sample = (dataArrayRef.current[i] - 128) / 128;
      sum += sample * sample;
    }
    const volume = Math.sqrt(sum / dataArrayRef.current.length);

    // Calculate zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < dataArrayRef.current.length; i++) {
      const prev = dataArrayRef.current[i - 1] - 128;
      const curr = dataArrayRef.current[i] - 128;
      if (prev >= 0 !== curr >= 0) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / dataArrayRef.current.length;

    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < frequencyDataRef.current.length; i++) {
      const magnitude = frequencyDataRef.current[i];
      const frequency =
        (i * audioContextRef.current!.sampleRate) / (2 * frequencyDataRef.current.length);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate energy
    let energy = 0;
    for (let i = 0; i < frequencyDataRef.current.length; i++) {
      energy += frequencyDataRef.current[i] * frequencyDataRef.current[i];
    }
    energy = Math.sqrt(energy / frequencyDataRef.current.length);

    // Estimate pitch using autocorrelation
    const pitch = estimatePitch(dataArrayRef.current, audioContextRef.current!.sampleRate);

    // Calculate simplified MFCC (Mel-frequency cepstral coefficients)
    const mfcc = calculateMFCC(frequencyDataRef.current);

    return {
      volume,
      pitch,
      spectralCentroid,
      zeroCrossingRate,
      mfcc,
      energy,
    };
  }, []);

  // Estimate pitch using autocorrelation
  const estimatePitch = (buffer: Uint8Array, sampleRate: number): number => {
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80); // 80 Hz min

    let bestCorrelation = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += Math.abs((buffer[i] - 128) * (buffer[i + period] - 128));
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  };

  // Calculate simplified MFCC
  const calculateMFCC = (frequencyData: Uint8Array): number[] => {
    const numCoefficients = 13;
    const mfcc: number[] = [];

    // Apply mel filter bank (simplified)
    const melFilters = createMelFilterBank(frequencyData.length, numCoefficients);

    for (let i = 0; i < numCoefficients; i++) {
      let sum = 0;
      for (let j = 0; j < frequencyData.length; j++) {
        sum += frequencyData[j] * melFilters[i][j];
      }
      mfcc.push(Math.log(sum + 1e-10)); // Add small value to avoid log(0)
    }

    // Apply DCT (simplified)
    const dctCoeffs: number[] = [];
    for (let i = 0; i < numCoefficients; i++) {
      let sum = 0;
      for (let j = 0; j < numCoefficients; j++) {
        sum += mfcc[j] * Math.cos((Math.PI * i * (j + 0.5)) / numCoefficients);
      }
      dctCoeffs.push(sum);
    }

    return dctCoeffs;
  };

  // Create mel filter bank (simplified)
  const createMelFilterBank = (fftSize: number, numFilters: number): number[][] => {
    const filters: number[][] = [];

    for (let i = 0; i < numFilters; i++) {
      const filter: number[] = new Array(fftSize).fill(0);

      // Simplified triangular filter
      const center = (i + 1) * (fftSize / (numFilters + 1));
      const width = fftSize / (numFilters + 1);

      for (let j = 0; j < fftSize; j++) {
        const distance = Math.abs(j - center);
        if (distance < width) {
          filter[j] = 1 - distance / width;
        }
      }

      filters.push(filter);
    }

    return filters;
  };

  // Update audio analysis
  const updateAnalysis = useCallback(() => {
    if (!isAnalyzing) return;

    const level = calculateAudioLevel();
    const spectrum = calculateFrequencySpectrum();

    setAudioLevel(level);
    setFrequency(spectrum);

    // Detect speech
    const speaking = level > speechThreshold;
    if (speaking !== isSpeaking) {
      if (speaking) {
        setIsSpeaking(true);
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
      } else {
        // Add delay before marking as not speaking
        speechTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(false);
        }, 500);
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAnalysis);
  }, [isAnalyzing, calculateAudioLevel, calculateFrequencySpectrum, isSpeaking]);

  // Start analysis
  const startAnalysis = useCallback(() => {
    if (isAnalyzing) return;

    initializeAudioAnalysis();
    setIsAnalyzing(true);

    // Start update loop
    intervalRef.current = setInterval(() => {
      updateAnalysis();
    }, config.updateInterval || 100);
  }, [isAnalyzing, initializeAudioAnalysis, updateAnalysis, config.updateInterval]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    // Cleanup audio context
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyzerRef.current = null;
    dataArrayRef.current = null;
    frequencyDataRef.current = null;
  }, []);

  // Auto-start analysis when stream is available
  useEffect(() => {
    if (stream && !isAnalyzing) {
      startAnalysis();
    } else if (!stream && isAnalyzing) {
      stopAnalysis();
    }

    return () => {
      stopAnalysis();
    };
  }, [stream, startAnalysis, stopAnalysis]);

  return {
    audioLevel,
    frequency,
    isAnalyzing,
    isSpeaking,
    startAnalysis,
    stopAnalysis,
    getAudioFeatures,
  };
};
