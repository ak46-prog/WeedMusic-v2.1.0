'use client';

import React, { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X, Volume2, Cloud, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setupPitchDetection, type PitchResult } from '@/lib/pitch-detect';

/**
 * VoiceSearchButton — Enterprise Voice Search with 3-Tier Fallback
 *
 * Tier 1: Web Speech API (Browser Native)
 * - Built into modern browsers, zero server cost
 * - Supports ANY language via navigator.language auto-detection
 * - Real-time interim results for instant feedback
 *
 * Tier 2: MediaRecorder + Cloud API
 * - If Web Speech API fails (not supported, error, or no-speech)
 * - Uses MediaRecorder to capture audio as webm/opus
 * - Sends to /api/speech-to-text for cloud transcription
 * - Supports Deepgram, AssemblyAI, Google Cloud fallback chain
 *
 * Tier 3: Pitch Detection (Web Audio API Autocorrelation)
 * - If both Tier 1 and Tier 2 fail
 * - Detects vocal pitch/frequency via AnalyserNode
 * - Shows audio feedback even without transcription
 *
 * Wispr Flow-like Animation:
 * - Minimal floating overlay, not a full-screen takeover
 * - Flowing waveform bars driven by Web Audio API AnalyserNode
 * - Expanding ring pulses (GPU-only scale + opacity)
 * - Smooth slide-up content transitions
 *
 * XSS Defense: textContent for all transcript display
 * Performance: GPU-only animations (transform, opacity, will-change)
 * React Portal: z-[9999] for guaranteed overlay stacking
 */

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// Hydration-safe check
const emptySubscribe = () => () => {};
function useIsSpeechRecognitionSupported() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    () => false,
  );
}

// Hydration-safe portal target
function usePortalReady() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof document !== 'undefined',
    () => false,
  );
}

// Fallback tier type
type FallbackTier = 'native' | 'cloud' | 'pitch';

// Overlay state type
type OverlayState = 'listening' | 'processing' | 'error';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Number of waveform bars
const WAVE_BAR_COUNT = 24;

// Max recording duration for cloud tier (ms)
const CLOUD_MAX_RECORDING_MS = 15_000;

export function VoiceSearchButton({ onTranscript, className = '', size = 'md' }: VoiceSearchButtonProps) {
  const isSupported = useIsSpeechRecognitionSupported();
  const portalReady = usePortalReady();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(WAVE_BAR_COUNT).fill(0.1));
  const [fallbackTier, setFallbackTier] = useState<FallbackTier>('native');
  const [overlayState, setOverlayState] = useState<OverlayState>('listening');
  const [pitchInfo, setPitchInfo] = useState<PitchResult | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cloudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pitchCleanupRef = useRef<(() => void) | null>(null);

  // Refs to avoid stale closure issues
  const interimTextRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  const isListeningRef = useRef(false);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { interimTextRef.current = interimText; }, [interimText]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      cleanupCloud();
      cleanupPitch();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  // --- AnalyserNode: Real-time mic level visualization ---
  const setupAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Small FFT for fast response
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualization loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevels = () => {
        analyser.getByteFrequencyData(dataArray);
        const levels: number[] = [];
        // Map frequency bins to wave bars
        const binsPerBar = Math.max(1, Math.floor(dataArray.length / WAVE_BAR_COUNT));
        for (let i = 0; i < WAVE_BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < binsPerBar; j++) {
            const idx = i * binsPerBar + j;
            sum += idx < dataArray.length ? dataArray[idx] : 0;
          }
          const avg = sum / binsPerBar / 255;
          // Apply non-linear scaling for visual impact (minimum 0.08 so bars are visible)
          levels.push(Math.max(0.08, avg * 1.8));
        }
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      animFrameRef.current = requestAnimationFrame(updateLevels);
    } catch (err) {
      console.warn('[VoiceSearch] AnalyserNode setup failed, using state-based levels:', err);
      // Fallback: use simple state-based levels from speech events
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* */ }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevels(new Array(WAVE_BAR_COUNT).fill(0.1));
  }, []);

  const cleanupCloud = useCallback(() => {
    if (cloudTimeoutRef.current) {
      clearTimeout(cloudTimeoutRef.current);
      cloudTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* */ }
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
  }, []);

  const cleanupPitch = useCallback(() => {
    if (pitchCleanupRef.current) {
      pitchCleanupRef.current();
      pitchCleanupRef.current = null;
    }
    setPitchInfo(null);
  }, []);

  // --- Auto-detect language from browser ---
  const getLanguage = useCallback(() => {
    if (typeof navigator === 'undefined') return 'en-US';
    // Use the browser's language setting — supports ANY language/country
    return navigator.language || 'en-US';
  }, []);

  // ─── Tier 3: Pitch Detection Setup ─────────────────────────────────────────
  const startPitchDetection = useCallback(() => {
    setFallbackTier('pitch');
    setOverlayState('listening');

    // If we already have an analyser, use it; otherwise set one up
    const startPitch = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const cleanup = setupPitchDetection(analyser, (result: PitchResult) => {
        setPitchInfo(result);
      }, 100);
      pitchCleanupRef.current = cleanup;
    };

    if (analyserRef.current) {
      startPitch();
    } else {
      // Need to set up analyser first
      setupAnalyser().then(() => {
        // Small delay to let analyser initialize
        setTimeout(startPitch, 100);
      });
    }
  }, [setupAnalyser]);

  // ─── Tier 2: Cloud API Transcription ────────────────────────────────────────
  const startCloudRecording = useCallback(async () => {
    setFallbackTier('cloud');
    setOverlayState('listening');

    try {
      // Start AnalyserNode for visualization
      await setupAnalyser();

      const stream = streamRef.current;
      if (!stream) {
        throw new Error('No media stream available');
      }

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (!isListeningRef.current) return; // Cancelled

        setOverlayState('processing');

        const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        recordedChunksRef.current = [];

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob);

          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.transcript) {
            // Success — use the cloud transcript
            setTimeout(() => {
              onTranscriptRef.current(data.transcript.trim());
              setIsListening(false);
              cleanupAudio();
              cleanupCloud();
            }, 0);
            return;
          }

          // Cloud API failed — fall back to pitch detection (Tier 3)
          console.warn('[VoiceSearch] Cloud API failed:', data.error, data.detail);
          startPitchDetection();
        } catch (err) {
          console.warn('[VoiceSearch] Cloud API request failed:', err);
          // Fall back to pitch detection (Tier 3)
          startPitchDetection();
        }
      };

      recorder.onerror = () => {
        console.warn('[VoiceSearch] MediaRecorder error, falling back to pitch detection');
        startPitchDetection();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect data every 250ms

      // Auto-stop after max recording time
      cloudTimeoutRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          try { recorder.stop(); } catch { /* */ }
        }
      }, CLOUD_MAX_RECORDING_MS);

    } catch (err) {
      console.warn('[VoiceSearch] Cloud recording setup failed, falling back to pitch detection:', err);
      startPitchDetection();
    }
  }, [setupAnalyser, cleanupAudio, cleanupCloud, startPitchDetection]);

  // --- Stop cloud recording and process ---
  const stopCloudRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      try { recorder.stop(); } catch { /* */ }
      // The onstop handler will process the audio
    } else {
      // No active recorder, just clean up
      setIsListening(false);
      cleanupAudio();
      cleanupCloud();
    }
  }, [cleanupAudio, cleanupCloud]);

  // --- Start listening ---
  const startListening = useCallback(async () => {
    // Reset state
    setInterimText('');
    interimTextRef.current = '';
    setErrorMsg('');
    setPitchInfo(null);
    setFallbackTier('native');
    setOverlayState('listening');

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* */ }
    }
    cleanupCloud();
    cleanupPitch();

    // If Web Speech API is not supported, go straight to cloud tier
    if (!isSupported) {
      setIsListening(true);
      setTimeout(() => { startCloudRecording(); }, 0);
      return;
    }

    // Start AnalyserNode for visualization (in parallel, non-blocking)
    setTimeout(() => { setupAnalyser(); }, 0);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLanguage(); // Auto-detect from browser
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setFallbackTier('native');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
        interimTextRef.current = interimTranscript;
      }

      if (finalTranscript) {
        setInterimText('');
        interimTextRef.current = '';
        // Use ref for latest callback — XSS safe via textContent in overlay
        setTimeout(() => {
          onTranscriptRef.current(finalTranscript.trim());
        }, 0);
        try { recognition.stop(); } catch { /* */ }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const shouldFallback = ['not-allowed', 'service-not-allowed', 'network', 'no-speech', 'audio-capture'].includes(event.error);

      if (shouldFallback) {
        // Don't show error — fall back to cloud tier instead
        console.warn(`[VoiceSearch] Native speech error "${event.error}", falling back to cloud API`);
        try { recognition.abort(); } catch { /* */ }
        recognitionRef.current = null;
        // Fall back to Tier 2 (cloud)
        setTimeout(() => { startCloudRecording(); }, 0);
        return;
      }

      // Non-fallible errors (aborted, etc.)
      if (event.error === 'aborted') return;

      let message = `Voice search error: ${event.error}. Please try again.`;
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 5000);
      setIsListening(false);
      cleanupAudio();
    };

    recognition.onend = () => {
      // If there's interim text when recognition ends, use it
      const latestInterim = interimTextRef.current;
      if (latestInterim && latestInterim.trim()) {
        setInterimText('');
        interimTextRef.current = '';
        setTimeout(() => {
          onTranscriptRef.current(latestInterim.trim());
        }, 0);
      } else {
        // Clean end with no transcript — just close
        setIsListening(false);
        cleanupAudio();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      // Native speech failed to start — fall back to cloud
      console.warn('[VoiceSearch] Native speech start failed, falling back to cloud API:', err);
      setIsListening(true);
      setTimeout(() => { startCloudRecording(); }, 0);
    }
  }, [isSupported, getLanguage, setupAnalyser, cleanupAudio, cleanupCloud, cleanupPitch, startCloudRecording]);

  const stopListening = useCallback(() => {
    setTimeout(() => {
      if (fallbackTier === 'cloud') {
        stopCloudRecording();
        return;
      }

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* */ }
      }
      setIsListening(false);
      cleanupAudio();
      cleanupPitch();
      const latestInterim = interimTextRef.current;
      if (latestInterim && latestInterim.trim()) {
        setInterimText('');
        interimTextRef.current = '';
        onTranscriptRef.current(latestInterim.trim());
      }
    }, 0);
  }, [fallbackTier, stopCloudRecording, cleanupAudio, cleanupPitch]);

  const cancelListening = useCallback(() => {
    setTimeout(() => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* */ }
        recognitionRef.current = null;
      }
      cleanupCloud();
      cleanupPitch();
      setIsListening(false);
      setInterimText('');
      interimTextRef.current = '';
      cleanupAudio();
    }, 0);
  }, [cleanupAudio, cleanupCloud, cleanupPitch]);

  const sizeClasses = { sm: 'size-8', md: 'size-9', lg: 'size-11' };
  const iconSizeClasses = { sm: 'size-4', md: 'size-[18px]', lg: 'size-5' };

  // Detect if analyser is active (has real levels)
  const hasRealAudio = audioLevels.some(l => l > 0.15);

  // Tier badge colors and labels
  const tierConfig: Record<FallbackTier, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    native: {
      label: 'Browser',
      color: 'oklch(0.72 0.19 142)',
      bgColor: 'oklch(0.72 0.19 142 / 0.15)',
      icon: <Mic className="size-3" />,
    },
    cloud: {
      label: 'Cloud AI',
      color: 'oklch(0.72 0.15 65)',
      bgColor: 'oklch(0.72 0.15 65 / 0.15)',
      icon: <Cloud className="size-3" />,
    },
    pitch: {
      label: 'Audio',
      color: 'oklch(0.75 0.15 55)',
      bgColor: 'oklch(0.75 0.15 55 / 0.15)',
      icon: <Radio className="size-3" />,
    },
  };

  // Status text based on tier and state
  const getStatusText = () => {
    if (overlayState === 'processing') {
      return 'Processing with cloud AI...';
    }
    if (overlayState === 'error') {
      return 'Something went wrong';
    }
    if (fallbackTier === 'pitch') {
      return pitchInfo?.frequency ? 'Voice detected' : 'Listening...';
    }
    return hasRealAudio ? 'Listening...' : 'Say something...';
  };

  // Subtitle text
  const getSubtitleText = () => {
    if (overlayState === 'processing') {
      return 'Transcribing your audio...';
    }
    if (fallbackTier === 'pitch') {
      return pitchInfo?.frequency
        ? 'Voice detected. Cloud transcription unavailable.'
        : 'Speak clearly — detecting audio input';
    }
    if (fallbackTier === 'cloud') {
      return 'Recording for cloud transcription';
    }
    return 'Speak in any language — auto-detected from your browser';
  };

  // Orb color based on tier
  const getOrbColor = () => {
    if (overlayState === 'processing') return 'oklch(0.72 0.15 65)'; // Amber for processing
    if (fallbackTier === 'native') return 'oklch(0.65 0.2 55)';     // Original orange
    if (fallbackTier === 'cloud') return 'oklch(0.72 0.15 65)';      // Amber for cloud
    if (fallbackTier === 'pitch') {
      return pitchInfo?.frequency ? 'oklch(0.75 0.15 55)' : 'oklch(0.65 0.2 55 / 0.6)';
    }
    return 'oklch(0.65 0.2 55)';
  };

  const getOrbColorFaded = () => {
    if (overlayState === 'processing') return 'oklch(0.72 0.15 65 / 0.6)';
    if (fallbackTier === 'native') return 'oklch(0.65 0.2 55 / 0.6)';
    if (fallbackTier === 'cloud') return 'oklch(0.72 0.15 65 / 0.6)';
    if (fallbackTier === 'pitch') return 'oklch(0.75 0.15 55 / 0.6)';
    return 'oklch(0.65 0.2 55 / 0.6)';
  };

  // The active tier config
  const currentTier = tierConfig[fallbackTier];

  // The overlay content
  const overlayContent = isListening ? (
    <div
      className="flow-overlay fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'oklch(0.145 0 0 / 0.92)' }}
      data-tier={fallbackTier}
      data-state={overlayState}
    >
      <div className="flow-content flex flex-col items-center gap-6 max-w-lg mx-auto px-6">
        {/* Close button */}
        <button
          onClick={cancelListening}
          className="absolute top-4 right-4 size-10 rounded-full flex items-center justify-center transition-colors duration-200"
          style={{ backgroundColor: 'oklch(1 0 0 / 8%)' }}
          aria-label="Cancel voice search"
        >
          <X className="size-5" style={{ color: 'oklch(0.708 0 0)' }} />
        </button>

        {/* Tier indicator badge */}
        <div
          className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: currentTier.bgColor,
            color: currentTier.color,
          }}
        >
          {currentTier.icon}
          {currentTier.label}
        </div>

        {/* Flow Orb with expanding rings */}
        <div className="relative flex items-center justify-center" style={{ width: '120px', height: '120px' }}>
          {/* Expanding rings (GPU-only) */}
          <div className="flow-ring" style={{ inset: '-20px' }} />
          <div className="flow-ring" style={{ inset: '-20px' }} />
          <div className="flow-ring" style={{ inset: '-20px' }} />

          {/* Glow backdrop */}
          <div
            className="absolute rounded-full"
            style={{
              width: '80px',
              height: '80px',
              background: hasRealAudio
                ? `radial-gradient(circle, ${getOrbColor().replace(')', ' / 0.2)')} 0%, transparent 70%)`
                : `radial-gradient(circle, ${getOrbColor().replace(')', ' / 0.1)')} 0%, transparent 70%)`,
              filter: 'blur(5px)',
            }}
          />

          {/* Main orb */}
          <div
            className={`flow-orb relative rounded-full flex items-center justify-center flow-glow ${
              hasRealAudio ? '' : ''
            }`}
            style={{
              width: hasRealAudio ? '88px' : '80px',
              height: hasRealAudio ? '88px' : '80px',
              backgroundColor: hasRealAudio ? getOrbColor() : getOrbColorFaded(),
              transition: 'width 0.2s, height 0.2s, background-color 0.2s',
            }}
          >
            {overlayState === 'processing' ? (
              // Spinning indicator for processing state
              <div className="size-9 relative">
                <div
                  className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </div>
            ) : hasRealAudio ? (
              <Volume2 className="size-9 text-white" />
            ) : (
              <Mic className="size-9 text-white" />
            )}
          </div>
        </div>

        {/* Wispr Flow Waveform Bars — driven by AnalyserNode */}
        <div className="flex items-center justify-center gap-[3px]" style={{ height: '40px' }}>
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className={hasRealAudio ? 'flow-wave-bar active' : 'flow-wave-bar'}
              style={{
                height: `${Math.max(8, level * 36)}px`,
                animationDelay: hasRealAudio ? `${i * 0.04}s` : undefined,
                animationDuration: hasRealAudio ? `${0.4 + Math.random() * 0.4}s` : undefined,
                backgroundColor: hasRealAudio
                  ? `${getOrbColor().replace(')', ` / ${0.5 + level * 0.5})`)}`
                  : `${getOrbColor().replace(')', ' / 0.3)')}`,
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: 'oklch(0.985 0 0)' }}>
            {getStatusText()}
          </p>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.708 0 0)' }}>
            {getSubtitleText()}
          </p>
          {/* Pitch info display for Tier 3 */}
          {fallbackTier === 'pitch' && pitchInfo?.frequency > 0 && pitchInfo.note && (
            <p className="text-xs mt-2 font-mono" style={{ color: currentTier.color }}>
              {pitchInfo.note} · {Math.round(pitchInfo.frequency)}Hz · clarity {Math.round(pitchInfo.clarity * 100)}%
            </p>
          )}
        </div>

        {/* Interim transcript display — XSS safe via textContent pattern */}
        {interimText && (
          <div className="flow-transcript w-full text-center">
            <div
              className="rounded-xl px-5 py-4"
              style={{
                backgroundColor: 'oklch(0.65 0.2 55 / 0.08)',
                border: '1px solid oklch(0.65 0.2 55 / 0.2)',
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'oklch(0.708 0 0)' }}>Heard:</p>
              <p className="text-lg font-medium leading-tight" style={{ color: 'oklch(0.985 0 0)' }}>
                &ldquo;{interimText}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Action buttons — hide Done button during processing */}
        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cancelListening}
            className="rounded-full px-6 gap-2"
            style={{ borderColor: 'oklch(1 0 0 / 15%)', color: 'oklch(0.708 0 0)' }}
          >
            <X className="size-4" />
            Cancel
          </Button>
          {overlayState !== 'processing' && (
            <Button
              size="sm"
              onClick={stopListening}
              className="rounded-full px-6 gap-2 text-white"
              style={{ backgroundColor: getOrbColor() }}
            >
              <MicOff className="size-4" />
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  // Always render the button — if native speech not supported, clicking will go to cloud tier
  return (
    <>
      {/* The mic button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={isListening ? stopListening : startListening}
          className={`${sizeClasses[size]} transition-all duration-200 ${
            isListening
              ? 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 voice-pulse'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          } ${className}`}
          aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
        >
          {isListening ? (
            <MicOff className={iconSizeClasses[size]} />
          ) : (
            <Mic className={iconSizeClasses[size]} />
          )}
        </Button>

        {/* Error message popup */}
        {errorMsg && !isListening && (
          <div className="absolute top-full mt-2 right-0 z-50 bg-destructive/90 text-destructive-foreground border rounded-lg shadow-xl p-3 min-w-[200px] max-w-[280px] text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Voice overlay via React Portal — z-[9999] guaranteed stacking */}
      {portalReady && overlayContent && createPortal(overlayContent, document.body)}
    </>
  );
}
