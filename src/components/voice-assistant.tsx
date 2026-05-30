'use client';

import React, { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Mic, X, Volume2, VolumeX, MessageSquare, Sparkles, Send, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * VoiceAssistant — AI Voice Assistant for WeedMusic
 *
 * Adapted from kaymen99/AI-Voice-assistant conversation loop pattern:
 *   Listen (STT) → Process (AI) → Speak (TTS) → Repeat
 *
 * But fully browser-based (NO login, NO Python, NO Deepgram API key required):
 *   - STT: Web Speech API (Chrome/Edge) + MediaRecorder cloud fallback (ALL browsers)
 *   - AI: /api/voice-assistant (z-ai-web-dev-sdk backend)
 *   - TTS: SpeechSynthesis API (browser native, no API key)
 *
 * FIXED: Microphone now works on ALL browsers (not just Chrome)
 * FIXED: Stale closure bugs — all state reads use refs
 * FIXED: Explicit mic permission request before SpeechRecognition
 *
 * Conversation loop (inspired by AI-Voice-assistant/src/speech_processing/conversation_manager.py):
 *   while conversationActive:
 *     1. Listen for speech → get transcript
 *     2. Send transcript + history to AI → get response
 *     3. Speak AI response via TTS
 *     4. If user says "goodbye"/"stop" → exit loop
 *
 * Features:
 *   - Continuous conversation mode (like the original)
 *   - Visual waveform during listening
 *   - AI response displayed in chat bubbles
 *   - TTS auto-reads AI responses
 *   - Can also type messages (fallback)
 *   - No login required
 *
 * Enterprise patterns:
 *   - setTimeout(0) macrotask offloading for INP
 *   - textContent for XSS (React JSX handles this)
 *   - GPU-only animations (transform, opacity)
 *   - React Portal for z-[9999] stacking
 *   - Event delegation on wrapper
 */

// ─── Types for Web Speech API ─────────────────────────────────────────────────
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
}

// ─── Chat Message Type ────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ─── Voice State ──────────────────────────────────────────────────────────────
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

// ─── Hydration-safe hooks ─────────────────────────────────────────────────────
const emptySubscribe = () => () => {};
function usePortalReady() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof document !== 'undefined',
    () => false,
  );
}

function useIsSpeechSupported() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    () => false,
  );
}

function useIsTTSSupported() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    () => false,
  );
}

// ─── Exit keywords (from AI-Voice-assistant conversation_manager.py) ──────────
const EXIT_KEYWORDS = ['goodbye', 'bye', 'stop', 'exit', 'quit', 'that\'s all', 'never mind', 'nevermind'];

// ─── Number of waveform bars ──────────────────────────────────────────────────
const WAVE_BAR_COUNT = 20;

// ─── Component ────────────────────────────────────────────────────────────────
export function VoiceAssistant() {
  const portalReady = usePortalReady();
  const isSpeechSupported = useIsSpeechSupported();
  const isTTSSupported = useIsTTSSupported();

  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(WAVE_BAR_COUNT).fill(0.08));
  const [error, setError] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationActiveRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const ttsEnabledRef = useRef(true);

  // ─── CRITICAL FIX: Refs to avoid stale closure issues ────────────────
  const interimTextRef = useRef('');
  const voiceStateRef = useRef<VoiceState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cloudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { interimTextRef.current = interimText; }, [interimText]);
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);

  // Auto-scroll chat
  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, [messages, interimText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      stopTTS();
      cleanupCloud();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* */ }
      }
    };
  }, []);

  // ─── Audio Analyser Setup ────────────────────────────────────────────────
  const setupAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevels = () => {
        analyser.getByteFrequencyData(dataArray);
        const levels: number[] = [];
        const binsPerBar = Math.max(1, Math.floor(dataArray.length / WAVE_BAR_COUNT));
        for (let i = 0; i < WAVE_BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < binsPerBar; j++) {
            const idx = i * binsPerBar + j;
            sum += idx < dataArray.length ? dataArray[idx] : 0;
          }
          levels.push(Math.max(0.06, (sum / binsPerBar / 255) * 1.8));
        }
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      animFrameRef.current = requestAnimationFrame(updateLevels);
    } catch (err) {
      console.warn('[VoiceAssistant] AnalyserNode setup failed:', err);
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
    setAudioLevels(new Array(WAVE_BAR_COUNT).fill(0.08));
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

  // ─── TTS (Text-to-Speech) ───────────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isTTSSupported || !ttsEnabledRef.current) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      // Auto-detect language from browser
      const lang = navigator.language || 'en-US';
      utterance.lang = lang;

      // Try to find a voice for the language
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }, [isTTSSupported]);

  const stopTTS = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // ─── AI Chat ────────────────────────────────────────────────────────────
  const getAIResponse = useCallback(async (userMessage: string, history: ChatMessage[]): Promise<string> => {
    try {
      const response = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.message || 'Sorry, I couldn\'t generate a response. Please try again.';
    } catch (err) {
      console.error('[VoiceAssistant] AI error:', err);
      return 'I\'m having trouble connecting right now. Please try again in a moment.';
    }
  }, []);

  // ─── Send Message (used by both voice and text input) ───────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInterimText('');
    interimTextRef.current = '';
    setVoiceState('processing');
    voiceStateRef.current = 'processing';

    // Macrotask offload for INP
    setTimeout(async () => {
      try {
        const currentMessages = [...messagesRef.current];
        const aiText = await getAIResponse(text.trim(), currentMessages);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiText,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, aiMsg]);

        // Check for exit keywords
        const lowerText = text.trim().toLowerCase();
        const shouldExit = EXIT_KEYWORDS.some(kw => lowerText.includes(kw));

        if (shouldExit) {
          conversationActiveRef.current = false;
          if (ttsEnabledRef.current) {
            setVoiceState('speaking');
            voiceStateRef.current = 'speaking';
            await speak(aiText);
          }
          setVoiceState('idle');
          voiceStateRef.current = 'idle';
          return;
        }

        // Speak the AI response
        if (ttsEnabledRef.current) {
          setVoiceState('speaking');
          voiceStateRef.current = 'speaking';
          await speak(aiText);
        }

        // If continuous conversation mode is active, listen again
        if (conversationActiveRef.current) {
          startListening();
        } else {
          setVoiceState('idle');
          voiceStateRef.current = 'idle';
        }
      } catch (err) {
        console.error('[VoiceAssistant] Send error:', err);
        setVoiceState('idle');
        voiceStateRef.current = 'idle';
        setError('Something went wrong. Please try again.');
        setTimeout(() => setError(''), 5000);
      }
    }, 0);
  }, [getAIResponse, speak]);

  // ─── STT (Speech-to-Text) with cloud fallback ────────────────────────────
  const startListening = useCallback(() => {
    setInterimText('');
    interimTextRef.current = '';
    setError('');
    setVoiceState('listening');
    voiceStateRef.current = 'listening';

    // Setup audio analyser in parallel (non-blocking)
    setTimeout(() => { setupAnalyser(); }, 0);

    // ─── If Web Speech API is supported, use it ────────────────────────────
    if (isSpeechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
        voiceStateRef.current = 'listening';
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
          try { recognition.stop(); } catch { /* */ }
          cleanupAudio();
          sendMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('[VoiceAssistant] STT error:', event.error);
        if (event.error === 'aborted') return;

        if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
          // Try cloud fallback if mic permission was denied for native API
          console.warn('[VoiceAssistant] Native STT failed, trying cloud fallback');
          try { recognition.abort(); } catch { /* */ }
          recognitionRef.current = null;
          setTimeout(() => { startCloudListening(); }, 0);
          return;
        }

        setError('Voice input had an issue. You can type your message instead.');
        setTimeout(() => setError(''), 5000);
        setVoiceState('idle');
        voiceStateRef.current = 'idle';
        cleanupAudio();
        conversationActiveRef.current = false;
      };

      recognition.onend = () => {
        // FIX: Use REF to avoid stale closure
        const latestInterim = interimTextRef.current;
        if (latestInterim && latestInterim.trim()) {
          setInterimText('');
          interimTextRef.current = '';
          cleanupAudio();
          sendMessage(latestInterim.trim());
        } else if (voiceStateRef.current === 'listening') {
          // Restart if still in conversation mode but recognition ended unexpectedly
          if (conversationActiveRef.current) {
            try { recognition.start(); } catch { /* */ }
          } else {
            setVoiceState('idle');
            voiceStateRef.current = 'idle';
            cleanupAudio();
          }
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {
        console.warn('[VoiceAssistant] STT start failed, trying cloud fallback:', err);
        // Fall through to cloud fallback
        setTimeout(() => { startCloudListening(); }, 0);
      }

      return;
    }

    // ─── No Web Speech API — use MediaRecorder + cloud fallback ────────────
    setTimeout(() => { startCloudListening(); }, 0);
  }, [isSpeechSupported, setupAnalyser, cleanupAudio, sendMessage]);

  // ─── Cloud STT fallback (works on ALL browsers) ────────────────────────
  const startCloudListening = useCallback(async () => {
    setVoiceState('listening');
    voiceStateRef.current = 'listening';

    try {
      await setupAnalyser();

      const stream = streamRef.current;
      if (!stream) {
        throw new Error('No media stream available');
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, recorderOptions);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (voiceStateRef.current !== 'listening') return;

        setVoiceState('processing');
        voiceStateRef.current = 'processing';

        const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType || 'audio/webm' });
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
            cleanupAudio();
            cleanupCloud();
            sendMessage(data.transcript.trim());
            return;
          }

          setError('Could not transcribe audio. Please type your message.');
          setTimeout(() => setError(''), 5000);
          setVoiceState('idle');
          voiceStateRef.current = 'idle';
          cleanupAudio();
        } catch (err) {
          console.warn('[VoiceAssistant] Cloud STT failed:', err);
          setError('Voice transcription failed. Please type your message.');
          setTimeout(() => setError(''), 5000);
          setVoiceState('idle');
          voiceStateRef.current = 'idle';
          cleanupAudio();
        }
      };

      recorder.onerror = () => {
        setError('Recording failed. Please try again or type your message.');
        setTimeout(() => setError(''), 5000);
        setVoiceState('idle');
        voiceStateRef.current = 'idle';
        cleanupAudio();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);

      cloudTimeoutRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          try { recorder.stop(); } catch { /* */ }
        }
      }, 15_000);

    } catch (err) {
      console.warn('[VoiceAssistant] Cloud STT setup failed:', err);
      setError('Could not access microphone. Please type your message instead.');
      setTimeout(() => setError(''), 5000);
      setVoiceState('idle');
      voiceStateRef.current = 'idle';
    }
  }, [setupAnalyser, cleanupAudio, cleanupCloud, sendMessage]);

  const stopListening = useCallback(() => {
    conversationActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* */ }
    }
    // Also stop cloud recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { /* */ }
    }
    cleanupCloud();
    stopTTS();
    cleanupAudio();
    setVoiceState('idle');
    voiceStateRef.current = 'idle';
    setInterimText('');
    interimTextRef.current = '';
  }, [cleanupAudio, cleanupCloud, stopTTS]);

  // ─── Toggle Conversation Mode ───────────────────────────────────────────
  const toggleConversation = useCallback(() => {
    if (voiceStateRef.current === 'idle') {
      conversationActiveRef.current = true;
      startListening();
    } else {
      stopListening();
    }
  }, [startListening, stopListening]);

  // ─── Handle Text Input Submit ───────────────────────────────────────────
  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    const text = textInput;
    setTextInput('');
    stopTTS();
    if (voiceStateRef.current === 'listening') {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* */ }
      }
      cleanupAudio();
      cleanupCloud();
    }
    setVoiceState('idle');
    voiceStateRef.current = 'idle';
    sendMessage(text);
  }, [textInput, cleanupAudio, cleanupCloud, sendMessage, stopTTS]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  // ─── Open/Close Panel ───────────────────────────────────────────────────
  const openAssistant = useCallback(() => {
    setIsOpen(true);
    // Welcome message if first time
    if (messagesRef.current.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hey! I\'m your WeedMusic AI assistant. Ask me anything about music — I can help you discover songs, learn about artists, or find the perfect playlist for your mood. Tap the mic to start talking, or type below!',
        timestamp: Date.now(),
      }]);
    }
  }, []);

  const closeAssistant = useCallback(() => {
    stopListening();
    setIsOpen(false);
  }, [stopListening]);

  // ─── Detect if audio is active ──────────────────────────────────────────
  const hasRealAudio = audioLevels.some(l => l > 0.12);

  // ─── Voice state label ──────────────────────────────────────────────────
  const getStateLabel = () => {
    switch (voiceState) {
      case 'listening': return hasRealAudio ? 'Listening...' : 'Say something...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Tap mic to talk';
    }
  };

  // ─── Voice state color ──────────────────────────────────────────────────
  const getStateColor = () => {
    switch (voiceState) {
      case 'listening': return 'oklch(0.65 0.2 55)';
      case 'processing': return 'oklch(0.6 0.15 250)';
      case 'speaking': return 'oklch(0.7 0.18 140)';
      default: return 'oklch(0.5 0 0)';
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  const assistantPanel = isOpen ? (
    <div className="va-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTimeout(() => closeAssistant(), 0); }}>
      <div className="va-panel">
        {/* Header */}
        <div className="va-header">
          <div className="flex items-center gap-3">
            <div className="va-orb-header" style={{ background: getStateColor() }}>
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <h3 className="va-title">WeedMusic AI</h3>
              <p className="va-state-label" style={{ color: getStateColor() }}>
                {getStateLabel()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* TTS Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="size-8 text-muted-foreground hover:text-foreground"
              aria-label={ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
            >
              {ttsEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTimeout(() => closeAssistant(), 0)}
              className="size-8 text-muted-foreground hover:text-foreground"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="va-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`va-bubble va-bubble--${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="va-bubble-avatar">
                  <Sparkles className="size-3" style={{ color: getStateColor() }} />
                </div>
              )}
              <div className="va-bubble-content">
                {msg.content}
              </div>
            </div>
          ))}

          {/* Interim transcript */}
          {interimText && voiceState === 'listening' && (
            <div className="va-bubble va-bubble--user va-bubble--interim">
              <div className="va-bubble-content">
                {interimText}
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {voiceState === 'processing' && (
            <div className="va-bubble va-bubble--assistant">
              <div className="va-bubble-avatar">
                <Sparkles className="size-3" style={{ color: getStateColor() }} />
              </div>
              <div className="va-bubble-content va-typing">
                <span className="va-dot" />
                <span className="va-dot" />
                <span className="va-dot" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Waveform Visualizer */}
        {(voiceState === 'listening' || voiceState === 'speaking') && (
          <div className="va-waveform">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className={`va-wave-bar ${hasRealAudio ? 'active' : ''}`}
                style={{
                  height: `${Math.max(3, level * 24)}px`,
                  backgroundColor: getStateColor(),
                  opacity: hasRealAudio ? 0.4 + level * 0.6 : 0.2,
                  animationDelay: hasRealAudio ? `${i * 0.02}s` : undefined,
                  animationDuration: hasRealAudio ? `${0.25 + Math.random() * 0.3}s` : undefined,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="va-error">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="va-input-area">
          <div className="va-input-row">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder="Type a message..."
              className="va-text-input"
              disabled={voiceState === 'processing'}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || voiceState === 'processing'}
              size="icon"
              className="va-send-btn"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
            <Button
              onClick={toggleConversation}
              className={`va-mic-btn ${voiceState !== 'idle' ? 'va-mic-btn--active' : ''}`}
              size="icon"
              aria-label={voiceState !== 'idle' ? 'Stop voice input' : 'Start voice input'}
            >
              {voiceState !== 'idle' ? (
                voiceState === 'listening' ? <Mic className="size-5" /> : <StopCircle className="size-5" />
              ) : (
                <Mic className="size-5" />
              )}
            </Button>
          </div>
          <p className="va-hint">
            {isSpeechSupported ? 'Mic + Type' : 'Type only'} · No login required
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setTimeout(() => { isOpen ? closeAssistant() : openAssistant(); }, 0)}
        className={`va-trigger ${isOpen ? 'va-trigger--active' : ''}`}
        size="icon"
        aria-label="Open voice assistant"
      >
        <MessageSquare className="size-5" />
      </Button>

      {/* Assistant panel via React Portal */}
      {portalReady && assistantPanel && createPortal(assistantPanel, document.body)}
    </>
  );
}
