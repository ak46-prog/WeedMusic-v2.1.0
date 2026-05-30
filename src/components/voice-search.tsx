'use client';

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * VoiceSearchButton — Web Speech API integration
 *
 * Uses the browser's native SpeechRecognition API for voice-based search.
 * Falls back gracefully on unsupported browsers with a clear message.
 *
 * Key fixes:
 * - Uses refs to avoid stale closure issues in onresult/onend callbacks
 * - Better error handling with specific error messages
 * - Full-screen voice search overlay for better UX
 * - Robust microphone permission handling
 */

// Types for Web Speech API (not in standard TS lib)
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

// Hydration-safe check using useSyncExternalStore
const emptySubscribe = () => () => {};
function useIsSpeechRecognitionSupported() {
  return useSyncExternalStore(
    emptySubscribe,
    () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    () => false,
  );
}

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceSearchButton({ onTranscript, className = '', size = 'md' }: VoiceSearchButtonProps) {
  const isSupported = useIsSpeechRecognitionSupported();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Use refs to avoid stale closure issues in callbacks
  const interimTextRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);

  // Keep refs in sync
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    interimTextRef.current = interimText;
  }, [interimText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorMsg('Voice search is not supported in this browser. Try Chrome or Edge.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    // Clear previous state
    setInterimText('');
    interimTextRef.current = '';
    setErrorMsg('');

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setAudioLevel(1);
    };

    recognition.onaudiostart = () => {
      setAudioLevel(2);
    };

    recognition.onspeechstart = () => {
      setAudioLevel(3);
    };

    recognition.onsoundstart = () => {
      setAudioLevel(2);
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
        // Use ref to get the latest callback
        onTranscriptRef.current(finalTranscript.trim());
        // Stop after getting a final result
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('Voice search error:', event.error);

      let message = '';
      switch (event.error) {
        case 'not-allowed':
          message = 'Microphone access denied. Please allow microphone permissions.';
          break;
        case 'no-speech':
          message = 'No speech detected. Try again and speak clearly.';
          break;
        case 'audio-capture':
          message = 'No microphone found. Please connect a microphone.';
          break;
        case 'network':
          message = 'Network error. Check your internet connection.';
          break;
        case 'aborted':
          // User cancelled, no error message needed
          break;
        case 'service-not-allowed':
          message = 'Speech service not available. Try using Chrome.';
          break;
        default:
          message = `Voice search error: ${event.error}. Please try again.`;
      }

      if (message) {
        setErrorMsg(message);
        setTimeout(() => setErrorMsg(''), 5000);
      }

      setIsListening(false);
      setAudioLevel(0);
    };

    recognition.onend = () => {
      setIsListening(false);
      setAudioLevel(0);

      // If there's interim text when recognition ends, use that as final result
      const latestInterim = interimTextRef.current;
      if (latestInterim && latestInterim.trim()) {
        setInterimText('');
        interimTextRef.current = '';
        onTranscriptRef.current(latestInterim.trim());
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorMsg('Could not start voice search. Please try again.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setAudioLevel(0);

    // Use interim text if available
    const latestInterim = interimTextRef.current;
    if (latestInterim && latestInterim.trim()) {
      setInterimText('');
      interimTextRef.current = '';
      onTranscriptRef.current(latestInterim.trim());
    }
  }, []);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimText('');
    interimTextRef.current = '';
    setAudioLevel(0);
  }, []);

  const sizeClasses = {
    sm: 'size-8',
    md: 'size-9',
    lg: 'size-11',
  };

  const iconSizeClasses = {
    sm: 'size-4',
    md: 'size-[18px]',
    lg: 'size-5',
  };

  if (!isSupported) {
    // Show a disabled mic button with tooltip
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`${sizeClasses[size]} text-muted-foreground/40 cursor-not-allowed ${className}`}
        disabled
        aria-label="Voice search not supported"
        title="Voice search not supported in this browser"
      >
        <Mic className={iconSizeClasses[size]} />
      </Button>
    );
  }

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

      {/* Full-screen voice search overlay */}
      {isListening && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto px-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Close button */}
            <button
              onClick={cancelListening}
              className="absolute top-4 right-4 size-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Cancel voice search"
            >
              <X className="size-5 text-muted-foreground" />
            </button>

            {/* Voice visualization */}
            <div className="relative">
              {/* Outer ring pulse */}
              <div className="absolute inset-0 -m-6 rounded-full bg-orange-500/10 voice-ring-1" />
              <div className="absolute inset-0 -m-12 rounded-full bg-orange-500/5 voice-ring-2" />

              {/* Main mic circle */}
              <div
                className={`relative size-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  audioLevel >= 3
                    ? 'bg-orange-500 shadow-lg shadow-orange-500/30 scale-110'
                    : audioLevel >= 2
                    ? 'bg-orange-500/80 shadow-md shadow-orange-500/20 scale-105'
                    : 'bg-orange-500/60 shadow-sm'
                }`}
              >
                {audioLevel >= 3 ? (
                  <Volume2 className="size-10 text-white animate-in zoom-in duration-150" />
                ) : (
                  <Mic className="size-10 text-white" />
                )}
              </div>
            </div>

            {/* Voice wave animation */}
            <div className="flex items-center justify-center gap-1.5 h-8">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full bg-orange-500 transition-all duration-150 ${
                    audioLevel >= 3 ? 'voice-bar-active' : 'voice-bar-idle'
                  }`}
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    height: audioLevel >= 3 ? undefined : '6px',
                  }}
                />
              ))}
            </div>

            {/* Status text */}
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {audioLevel >= 3
                  ? 'Listening...'
                  : audioLevel >= 2
                  ? 'Hearing you...'
                  : 'Say something...'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Speak clearly into your microphone
              </p>
            </div>

            {/* Interim transcript display */}
            {interimText && (
              <div className="w-full text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl px-5 py-4 border border-orange-200 dark:border-orange-800/40">
                  <p className="text-sm text-muted-foreground mb-1">Heard:</p>
                  <p className="text-lg font-medium text-foreground leading-tight">
                    &ldquo;{interimText}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelListening}
                className="rounded-full px-6 gap-2"
              >
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={stopListening}
                className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                <MicOff className="size-4" />
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
