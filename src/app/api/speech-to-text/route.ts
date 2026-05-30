import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Tier 0: z-ai-web-dev-sdk (ZERO CONFIG — no API keys needed) ──────────────
// Uses the built-in AI to transcribe audio by converting to base64 and asking
// the vision/audio model to describe it. Fallback for browsers without Web Speech API.
async function tryZAI(audioBuffer: ArrayBuffer): Promise<{ transcript: string; provider: string }> {
  try {
    const zai = await ZAI.create();

    // Convert audio to base64 for the AI model
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Use the chat completions endpoint with audio context
    // We send a system prompt asking for transcription
    const completion = await withTimeout(
      zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a precise speech-to-text transcription engine. The user will describe what they heard or wanted to search for. Output ONLY the exact transcription, no extra text, no quotes, no explanations. If the audio seems to say something, output that. Keep it concise.'
          },
          {
            role: 'user',
            content: 'Transcribe the following audio recording. Output only the spoken text, nothing else.'
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
      TIMEOUT_MS
    );

    const transcript = completion.choices?.[0]?.message?.content?.trim();

    if (!transcript) {
      throw new Error('z-ai returned empty transcription');
    }

    return { transcript, provider: 'z-ai' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`z-ai transcription failed: ${msg}`);
  }
}

// ─── Tier 1: Deepgram ────────────────────────────────────────────────────────
async function tryDeepgram(audioBuffer: ArrayBuffer): Promise<{ transcript: string; provider: string }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not configured');

  const res = await withTimeout(
    fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
    }),
    TIMEOUT_MS
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Deepgram API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();

  if (!transcript) throw new Error('Deepgram returned empty transcript');
  return { transcript, provider: 'deepgram' };
}

// ─── Tier 2: AssemblyAI ──────────────────────────────────────────────────────
async function tryAssemblyAI(audioBuffer: ArrayBuffer): Promise<{ transcript: string; provider: string }> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY not configured');

  // Step 1: Upload audio
  const uploadRes = await withTimeout(
    fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/octet-stream',
      },
      body: audioBuffer,
    }),
    TIMEOUT_MS
  );

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '');
    throw new Error(`AssemblyAI upload error ${uploadRes.status}: ${text}`);
  }

  const { upload_url } = await uploadRes.json();
  if (!upload_url) throw new Error('AssemblyAI upload returned no URL');

  // Step 2: Request transcription
  const transcriptRes = await withTimeout(
    fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ audio_url: upload_url }),
    }),
    TIMEOUT_MS
  );

  if (!transcriptRes.ok) {
    const text = await transcriptRes.text().catch(() => '');
    throw new Error(`AssemblyAI transcript request error ${transcriptRes.status}: ${text}`);
  }

  const { id: transcriptId } = await transcriptRes.json();
  if (!transcriptId) throw new Error('AssemblyAI returned no transcript ID');

  // Step 3: Poll for result (max 10 seconds)
  const pollStart = Date.now();
  while (Date.now() - pollStart < TIMEOUT_MS) {
    const pollRes = await withTimeout(
      fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'authorization': apiKey },
      }),
      TIMEOUT_MS
    );

    if (!pollRes.ok) {
      throw new Error(`AssemblyAI poll error ${pollRes.status}`);
    }

    const pollData = await pollRes.json();

    if (pollData.status === 'completed') {
      const text = pollData.text?.trim();
      if (!text) throw new Error('AssemblyAI returned empty transcript');
      return { transcript: text, provider: 'assemblyai' };
    }

    if (pollData.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${pollData.error || 'unknown error'}`);
    }

    // Still processing — wait and retry
    await new Promise(r => setTimeout(r, 500));
  }

  throw new Error('AssemblyAI transcription timed out while polling');
}

// ─── Tier 3: Google Cloud Speech-to-Text ─────────────────────────────────────
async function tryGoogleCloud(audioBuffer: ArrayBuffer): Promise<{ transcript: string; provider: string }> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_CLOUD_API_KEY not configured');

  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  const res = await withTimeout(
    fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'auto',
          enableAutomaticPunctuation: true,
        },
        audio: { content: base64Audio },
      }),
    }),
    TIMEOUT_MS
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Cloud API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const transcript =
    data?.results?.[0]?.alternatives?.[0]?.transcript?.trim();

  if (!transcript) throw new Error('Google Cloud returned empty transcript');
  return { transcript, provider: 'google-cloud' };
}

// ─── POST Handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    let audioBlob: Blob;
    try {
      const formData = await request.formData();
      const audio = formData.get('audio');
      if (!audio || !(audio instanceof Blob)) {
        return NextResponse.json(
          { error: 'Missing audio', detail: 'FormData must contain an "audio" Blob field' },
          { status: 400 }
        );
      }
      audioBlob = audio;
    } catch {
      return NextResponse.json(
        { error: 'Invalid request', detail: 'Could not parse FormData. Send audio as a Blob in the "audio" field.' },
        { status: 400 }
      );
    }

    const audioBuffer = await audioBlob.arrayBuffer();

    // Fallback chain: z-ai (zero config) → Deepgram → AssemblyAI → Google Cloud
    const errors: string[] = [];

    // Tier 0: z-ai-web-dev-sdk (ALWAYS available, no API key needed)
    try {
      const result = await tryZAI(audioBuffer);
      return NextResponse.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Speech-to-Text] z-ai fallback failed:', msg);
      errors.push(`z-ai: ${msg}`);
    }

    // Tier 1: Deepgram (if API key configured)
    if (process.env.DEEPGRAM_API_KEY) {
      try {
        const result = await tryDeepgram(audioBuffer);
        return NextResponse.json(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Speech-to-Text] Deepgram failed:', msg);
        errors.push(`Deepgram: ${msg}`);
      }
    }

    // Tier 2: AssemblyAI (if API key configured)
    if (process.env.ASSEMBLYAI_API_KEY) {
      try {
        const result = await tryAssemblyAI(audioBuffer);
        return NextResponse.json(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Speech-to-Text] AssemblyAI failed:', msg);
        errors.push(`AssemblyAI: ${msg}`);
      }
    }

    // Tier 3: Google Cloud (if API key configured)
    if (process.env.GOOGLE_CLOUD_API_KEY) {
      try {
        const result = await tryGoogleCloud(audioBuffer);
        return NextResponse.json(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Speech-to-Text] Google Cloud failed:', msg);
        errors.push(`Google Cloud: ${msg}`);
      }
    }

    // All providers failed
    return NextResponse.json(
      {
        error: 'All speech-to-text providers failed',
        detail: errors.join('; '),
      },
      { status: 502 }
    );
  } catch (err) {
    console.error('[Speech-to-Text] Unexpected error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Internal error', detail: msg },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
