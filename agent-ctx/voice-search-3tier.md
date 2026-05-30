# Task: Implement 3-Tier Voice Search with Cloud API Fallback

## Files Created/Modified

### 1. `/home/z/my-project/src/lib/pitch-detect.ts` (NEW)
- Minimal pitch detection utility via autocorrelation
- No external dependencies — uses Web Audio API AnalyserNode
- Exports: `detectPitch()`, `setupPitchDetection()`, `PitchResult` interface
- Autocorrelation algorithm with normalized correlation
- Parabolic interpolation for sub-sample accuracy
- Frequency-to-musical-note conversion
- `setupPitchDetection()` attaches to existing AnalyserNode, returns cleanup function

### 2. `/home/z/my-project/src/app/api/speech-to-text/route.ts` (NEW)
- Server-side speech-to-text API route
- Accepts POST with FormData containing `audio` Blob
- 3-tier cloud API fallback:
  1. Deepgram (nova-2 model, smart_format)
  2. AssemblyAI (upload → transcribe → poll)
  3. Google Cloud Speech-to-Text (WEBM_OPUS, base64)
- 10-second timeout per API attempt
- Returns `{ transcript, provider }` on success
- Returns `{ error, detail }` on failure
- CORS preflight support via OPTIONS handler
- No API keys configured → 503 with helpful message

### 3. `/home/z/my-project/src/components/voice-search.tsx` (UPDATED)
- Added 3-tier fallback strategy:
  - Tier 1: Web Speech API (native) — existing behavior preserved
  - Tier 2: MediaRecorder + Cloud API — fallback on native failure
  - Tier 3: Pitch Detection — fallback when cloud also fails
- New state: `fallbackTier` ('native'|'cloud'|'pitch'), `overlayState` ('listening'|'processing'|'error'), `pitchInfo`
- New refs: `mediaRecorderRef`, `recordedChunksRef`, `cloudTimeoutRef`, `pitchCleanupRef`, `isListeningRef`
- New cleanup functions: `cleanupCloud()`, `cleanupPitch()`
- `startCloudRecording()`: sets up MediaRecorder, auto-stop at 15s, sends to /api/speech-to-text
- `startPitchDetection()`: uses AnalyserNode autocorrelation for pitch detection
- Overlay shows tier indicator badge (top-left) with icon + label
- Color scheme changes per tier: green=Browser, amber=Cloud AI, amber=Audio
- Processing state shows spinner, hides Done button
- Pitch tier shows frequency/note/clarity info
- `data-tier` and `data-state` attributes on overlay for accessibility
- `setTimeout(0)` for all state updates in click handlers (INP fix)
- All existing Wispr Flow animations preserved
- React Portal z-[9999] pattern preserved
- XSS defense (textContent) preserved
- GPU-only animations preserved

## Lint Status
- All 3 files pass ESLint with no errors
