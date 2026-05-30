/**
 * Minimal Pitch Detection via Autocorrelation
 * No external dependencies — uses Web Audio API AnalyserNode
 * Inspired by Pitchfinder.js algorithm but ~2KB instead of ~5KB
 */

export interface PitchResult {
  frequency: number;    // Hz, 0 if no pitch detected
  clarity: number;      // 0-1, how clear the pitch is
  note: string | null;  // Musical note name like "A4"
  midi: number | null;  // MIDI note number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(freq: number): { note: string; midi: number } | null {
  if (freq <= 0) return null;
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  if (midi < 0 || midi > 127) return null;
  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { note: `${noteName}${octave}`, midi };
}

/**
 * Detect pitch from AnalyserNode time-domain data using autocorrelation.
 * Returns frequency in Hz, or 0 if no pitch detected.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  minFrequency = 60,   // Min detectable frequency (Hz)
  maxFrequency = 1200  // Max detectable frequency (Hz)
): PitchResult {
  const SIZE = buffer.length;

  // Check if signal has enough energy
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.01) {
    return { frequency: 0, clarity: 0, note: null, midi: null };
  }

  // Autocorrelation
  const minPeriod = Math.floor(sampleRate / maxFrequency);
  const maxPeriod = Math.ceil(sampleRate / minFrequency);

  let bestCorrelation = 0;
  let bestPeriod = 0;

  for (let period = minPeriod; period <= Math.min(maxPeriod, SIZE / 2); period++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < SIZE - period; i++) {
      correlation += buffer[i] * buffer[i + period];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + period] * buffer[i + period];
    }

    // Normalized correlation
    const norm = Math.sqrt(norm1 * norm2);
    if (norm > 0) {
      correlation /= norm;
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestCorrelation < 0.3 || bestPeriod === 0) {
    return { frequency: 0, clarity: bestCorrelation, note: null, midi: null };
  }

  // Parabolic interpolation for sub-sample accuracy
  if (bestPeriod > 1 && bestPeriod < SIZE / 2 - 1) {
    // Compute correlations at neighboring periods for interpolation
    let prevCorr = 0;
    let nextCorr = 0;
    let prevNorm1 = 0, prevNorm2 = 0;
    let nextNorm1 = 0, nextNorm2 = 0;

    for (let i = 0; i < SIZE - (bestPeriod - 1); i++) {
      prevCorr += buffer[i] * buffer[i + bestPeriod - 1];
      prevNorm1 += buffer[i] * buffer[i];
      prevNorm2 += buffer[i + bestPeriod - 1] * buffer[i + bestPeriod - 1];
    }
    const prevNorm = Math.sqrt(prevNorm1 * prevNorm2);
    if (prevNorm > 0) prevCorr /= prevNorm;

    for (let i = 0; i < SIZE - (bestPeriod + 1); i++) {
      nextCorr += buffer[i] * buffer[i + bestPeriod + 1];
      nextNorm1 += buffer[i] * buffer[i];
      nextNorm2 += buffer[i + bestPeriod + 1] * buffer[i + bestPeriod + 1];
    }
    const nextNorm = Math.sqrt(nextNorm1 * nextNorm2);
    if (nextNorm > 0) nextCorr /= nextNorm;

    // Parabolic interpolation
    const shift = (prevCorr - nextCorr) / (2 * (prevCorr - 2 * bestCorrelation + nextCorr));
    if (Math.abs(shift) < 1) {
      bestPeriod = bestPeriod + shift;
    }
  }

  const frequency = sampleRate / bestPeriod;
  const noteInfo = frequencyToNote(frequency);

  return {
    frequency,
    clarity: bestCorrelation,
    note: noteInfo?.note || null,
    midi: noteInfo?.midi || null,
  };
}

/**
 * Setup pitch detection on an existing AnalyserNode.
 * Returns a cleanup function.
 */
export function setupPitchDetection(
  analyser: AnalyserNode,
  onPitch: (result: PitchResult) => void,
  intervalMs = 100
): () => void {
  const bufferLength = analyser.fftSize;
  const buffer = new Float32Array(bufferLength);
  const sampleRate = analyser.context.sampleRate;

  let running = true;

  const detect = () => {
    if (!running) return;
    analyser.getFloatTimeDomainData(buffer);
    const result = detectPitch(buffer, sampleRate);
    onPitch(result);
    if (running) setTimeout(detect, intervalMs);
  };

  detect();

  return () => { running = false; };
}
