import { NextRequest, NextResponse } from 'next/server';

/**
 * Stream Info Endpoint — Resolves audio/video stream URLs
 *
 * PARALLEL resolution: ALL layers run simultaneously using Promise.any.
 * First successful result wins — typical load time 1-4 seconds.
 *
 * Layers (all run in parallel):
 *   Layer 1  — ytdl-core (3.5s timeout)
 *   Layer 2a — InnerTube ANDROID_MUSIC (4s timeout)
 *   Layer 2b — InnerTube TVHTML5 (4s timeout)
 *   Layer 3  — Invidious (3 instances × 4s timeout)
 *
 * Query params:
 *   id       — YouTube video ID (required)
 *   type     — "audio" (default) | "video" | "info"
 *   format   — "mp4" (default) | "webm"
 */

/* ====================================================================
   TYPES
   ==================================================================== */

interface StreamInfo {
  audioUrl: string;
  mimeType: string;
  contentLength?: string;
  duration: number;
  title: string;
  artist: string;
  thumbnail: string;
  source: string;
  itag?: number;
  videoUrl?: string;
  videoQuality?: number;
}

/* ====================================================================
   CACHING
   ==================================================================== */

const streamCache = new Map<string, { info: StreamInfo; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes — longer cache = fewer re-fetches
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

function getCached(videoId: string): StreamInfo | null {
  const entry = streamCache.get(videoId);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.info;
  if (entry) streamCache.delete(videoId);
  return null;
}

function setCache(videoId: string, info: StreamInfo): void {
  streamCache.set(videoId, { info, timestamp: Date.now() });
  // Evict oldest entries if cache is too large
  if (streamCache.size > MAX_CACHE_SIZE) {
    const entries = [...streamCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 20 && i < entries.length; i++) {
      streamCache.delete(entries[i][0]);
    }
  }
}

/* ====================================================================
   CONTENT-TYPE HELPERS
   ==================================================================== */

function normalizeContentType(raw: string, itag?: number): string {
  let ct = raw;
  if (ct.includes(';')) ct = ct.split(';')[0].trim();

  if (itag === 18 && ct.startsWith('video/mp4')) return 'audio/mp4';
  if (ct.startsWith('video/mp4') || ct.includes('mp4a')) return 'audio/mp4';
  if (ct.includes('mp4') && !ct.startsWith('audio/')) return 'audio/mp4';
  if (ct.includes('webm') || ct.includes('opus')) return 'audio/webm';
  if (ct.includes('ogg')) return 'audio/ogg';
  if (ct.includes('mpeg') || ct.includes('mp3')) return 'audio/mpeg';
  if (ct.startsWith('audio/')) return ct;
  return 'audio/mp4';
}

/* ====================================================================
   TIMEOUT HELPER — wraps a promise with a race against a deadline
   ==================================================================== */

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.log(`[${label}] ⏱ Timed out after ${ms}ms`);
        resolve(null);
      }, ms),
    ),
  ]);
}

/* ====================================================================
   LAYER 1: ytdl-core (PRIMARY)
   ==================================================================== */

async function resolveFromLayer1(
  videoId: string,
  streamType: 'audio' | 'video',
): Promise<StreamInfo | null> {
  try {
    const ytdl = await import('@distube/ytdl-core');
    const info = await ytdl.default.getInfo(videoId);

    if (!info?.videoDetails) {
      console.error('[L1] No video details');
      return null;
    }

    const videoDetails = info.videoDetails;
    const formats = info.formats || [];

    // --- AUDIO SELECTION ---
    // Prefer itag 140 (128kbps m4a — small and fast to buffer)
    const itag140 = formats.find((f: any) => f.itag === 140 && f.url);
    const mp4AudioOnly = formats
      .filter((f: any) => f.hasAudio && !f.hasVideo && f.mimeType?.includes('mp4') && f.url)
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    const webmAudioOnly = formats
      .filter((f: any) => f.hasAudio && !f.hasVideo && f.mimeType?.includes('webm') && f.url)
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    const combinedAudio = formats
      .filter((f: any) => f.hasAudio && f.hasVideo && f.mimeType?.includes('mp4') && f.url)
      .sort((a: any, b: any) => (a.itag === 18 ? -1 : a.itag === 22 ? -1 : 0));

    const bestAudio =
      itag140 ||
      mp4AudioOnly[0] ||
      webmAudioOnly[0] ||
      combinedAudio[0] ||
      formats.find((f: any) => f.hasAudio && f.url);

    if (!bestAudio) {
      console.error('[L1] No audio formats with URL');
      return null;
    }

    // --- VIDEO SELECTION (only for type=video) ---
    let videoUrl: string | undefined;
    let videoQuality: number | undefined;

    if (streamType === 'video') {
      // Prefer combined formats: itag 22 (720p) > itag 18 (360p)
      const itag22 = formats.find((f: any) => f.itag === 22 && f.url);
      const itag18 = formats.find((f: any) => f.itag === 18 && f.url);

      // Adaptive video-only formats sorted by quality (descending)
      const adaptiveVideo = formats
        .filter((f: any) => f.hasVideo && !f.hasAudio && f.url)
        .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

      // Pick best video source
      // Combined itag 22 (720p) is ideal — no need for separate audio
      // Combined itag 18 (360p) is good fallback
      // Otherwise use highest quality adaptive video
      const bestVideo = itag22 || itag18 || adaptiveVideo[0];

      if (bestVideo) {
        videoUrl = bestVideo.url;
        videoQuality = bestVideo.height || (bestVideo.itag === 22 ? 720 : bestVideo.itag === 18 ? 360 : 0);
      }
    }

    console.log(
      `[L1] ✅ audio itag=${bestAudio.itag} mime=${(bestAudio.mimeType || '').slice(0, 30)}${videoUrl ? ` video=${videoQuality}p` : ''}`,
    );

    return {
      audioUrl: bestAudio.url,
      mimeType: normalizeContentType(bestAudio.mimeType || 'audio/mp4', bestAudio.itag),
      contentLength: bestAudio.contentLength?.toString(),
      duration: parseInt(videoDetails.lengthSeconds || '0', 10),
      title: videoDetails.title || '',
      artist: typeof videoDetails.author === 'string' ? videoDetails.author : (videoDetails.author?.name || ''),
      thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
      source: `a${bestAudio.itag}`,
      itag: bestAudio.itag,
      videoUrl,
      videoQuality,
    };
  } catch (err) {
    console.error('[L1] Error:', (err as Error).message);
    return null;
  }
}

/* ====================================================================
   LAYER 2: InnerTube Player API
   ==================================================================== */

const INNER_TUBE_CLIENTS = {
  ANDROID_MUSIC: {
    context: {
      client: {
        clientName: 'ANDROID_MUSIC',
        clientVersion: '7.11.50',
        androidSdkVersion: 30,
        hl: 'en',
        gl: 'US',
      },
    },
    apiKey: 'AIzaSyAOghZGza2MQSZkY_zfZ370N-PUdXEo8AI',
    endpoint: 'https://music.youtube.com/youtubei/v1/player',
    userAgent:
      'com.google.android.apps.youtube.music/7.11.50 (Linux; U; Android 14; GB) gzip',
  },
  TVHTML5: {
    context: {
      client: {
        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        clientVersion: '2.0',
        hl: 'en',
        gl: 'US',
        thirdParty: { embedUrl: 'https://www.google.com' },
      },
    },
    apiKey: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
    endpoint: 'https://www.youtube.com/youtubei/v1/player',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G981B) AppleWebKit/537.36',
  },
};

type ClientKey = keyof typeof INNER_TUBE_CLIENTS;

async function resolveFromInnerTube(
  videoId: string,
  clientKey: ClientKey,
  streamType: 'audio' | 'video',
): Promise<StreamInfo | null> {
  const client = INNER_TUBE_CLIENTS[clientKey];
  const label = `L2-${clientKey === 'ANDROID_MUSIC' ? 'AM' : 'TV'}`;

  try {
    const body: Record<string, unknown> = {
      context: client.context,
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    };

    const res = await fetch(`${client.endpoint}?key=${client.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': client.userAgent,
        Origin: clientKey === 'ANDROID_MUSIC' ? 'https://music.youtube.com' : 'https://www.youtube.com',
        Referer: clientKey === 'ANDROID_MUSIC' ? 'https://music.youtube.com/' : 'https://www.youtube.com/',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const playability = data.playabilityStatus;
    if (!playability || playability.status !== 'OK') return null;
    if (!data.streamingData) return null;

    const videoDetails = data.videoDetails || {};
    const adaptiveFormats: any[] = data.streamingData.adaptiveFormats || [];
    const formats: any[] = data.streamingData.formats || [];

    // --- AUDIO: prefer itag 140, then best m4a, then webm ---
    const itag140 = adaptiveFormats.find((f: any) => f.itag === 140 && f.url);
    const mp4Audio = adaptiveFormats
      .filter((f: any) => f.mimeType?.startsWith('audio/') && f.url && f.mimeType?.includes('mp4'))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    const webmAudio = adaptiveFormats
      .filter((f: any) => f.mimeType?.startsWith('audio/') && f.url && f.mimeType?.includes('webm'))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    const combinedAudio = formats.filter((f: any) => f.url);

    const bestAudio = itag140 || mp4Audio[0] || webmAudio[0] || combinedAudio[0];
    if (!bestAudio) return null;

    // --- VIDEO ---
    let videoUrl: string | undefined;
    let videoQuality: number | undefined;

    if (streamType === 'video') {
      // Combined formats first (itag 22=720p, itag 18=360p)
      const itag22 = formats.find((f: any) => f.itag === 22 && f.url);
      const itag18 = formats.find((f: any) => f.itag === 18 && f.url);

      // Adaptive video-only formats
      const adaptiveVideo = adaptiveFormats
        .filter((f: any) => f.mimeType?.startsWith('video/') && f.url)
        .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

      const bestVideo = itag22 || itag18 || adaptiveVideo[0];
      if (bestVideo) {
        videoUrl = bestVideo.url;
        videoQuality = bestVideo.height || (bestVideo.itag === 22 ? 720 : bestVideo.itag === 18 ? 360 : 0);
      }
    }

    const sourceCode = clientKey === 'ANDROID_MUSIC' ? 'b' : 'c';
    console.log(`[${label}] ✅ audio itag=${bestAudio.itag}${videoUrl ? ` video=${videoQuality}p` : ''}`);

    return {
      audioUrl: bestAudio.url,
      mimeType: normalizeContentType(bestAudio.mimeType || 'audio/mp4', bestAudio.itag),
      contentLength: bestAudio.contentLength?.toString(),
      duration: parseInt(videoDetails.lengthSeconds || '0', 10),
      title: videoDetails.title || '',
      artist: typeof videoDetails.author === 'string' ? videoDetails.author : '',
      thumbnail: videoDetails.thumbnail?.thumbnails?.[0]?.url || '',
      source: `${sourceCode}${bestAudio.itag}`,
      itag: bestAudio.itag,
      videoUrl,
      videoQuality,
    };
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
    return null;
  }
}

/* ====================================================================
   LAYER 3: Invidious API
   ==================================================================== */

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.fdn.fr',
  'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de',
  'https://inv.nadeko.net',
  'https://invidious.protokolla.fi',
  'https://invidious.perennialte.ch',
  'https://invidious.privacydelegation.de',
  'https://yt.cdaut.de',
  'https://invidious.jing.rocks',
  'https://iv.ggtyler.dev',
  'https://yewtu.be',
  'https://invidious.lunar.icu',
  'https://invidious.privacyredirect.com',
];

async function resolveFromInvidious(
  videoId: string,
  streamType: 'audio' | 'video',
): Promise<StreamInfo | null> {
  const tryInstance = async (instance: string): Promise<StreamInfo | null> => {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}?local=true`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;

      const data = await res.json();
      const adaptiveFormats = data.adaptiveFormats || [];
      const formatStreams = data.formatStreams || [];

      // --- AUDIO: prefer itag 140 ---
      const itag140 = adaptiveFormats.find(
        (f: any) => f.itag === 140 && f.url,
      );
      const mp4Audio = adaptiveFormats
        .filter((f: any) => f.type?.includes('audio/mp4') && f.url)
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      const bestAudio =
        itag140 ||
        mp4Audio[0] ||
        adaptiveFormats.find((f: any) => f.type?.startsWith('audio/') && f.url);

      if (!bestAudio?.url) return null;

      const audioUrl = bestAudio.url.startsWith('http')
        ? bestAudio.url
        : `${instance}${bestAudio.url}`;

      // --- VIDEO ---
      let videoUrl: string | undefined;
      let videoQuality: number | undefined;

      if (streamType === 'video') {
        // Combined formatStreams — itag 22 (720p), itag 18 (360p)
        const itag22 = formatStreams.find((f: any) => f.itag === 22 && f.url);
        const itag18 = formatStreams.find((f: any) => f.itag === 18 && f.url);

        // Adaptive video from adaptiveFormats
        const adaptiveVideo = adaptiveFormats
          .filter((f: any) => f.type?.startsWith('video/') && f.url)
          .sort((a: any, b: any) => (b.resolution || '').localeCompare(a.resolution || ''));

        const bestVideo = itag22 || itag18 || adaptiveVideo[0];
        if (bestVideo?.url) {
          videoUrl = bestVideo.url.startsWith('http')
            ? bestVideo.url
            : `${instance}${bestVideo.url}`;
          // Parse resolution string like "720p" or use itag
          const resMatch = (bestVideo.resolution || '').match(/(\d+)/);
          videoQuality = resMatch ? parseInt(resMatch[1], 10) : (bestVideo.itag === 22 ? 720 : bestVideo.itag === 18 ? 360 : 0);
        }
      }

      return {
        audioUrl,
        mimeType: normalizeContentType(bestAudio.type || 'audio/mp4'),
        duration: data.lengthSeconds || 0,
        title: data.title || '',
        artist: data.author || '',
        thumbnail: data.videoThumbnails?.[0]?.url || '',
        source: 'd',
        videoUrl,
        videoQuality,
      };
    } catch {
      return null;
    }
  };

  try {
    // Try 6 instances in parallel for better success rate
    const results = await Promise.allSettled(
      INVIDIOUS_INSTANCES.slice(0, 6).map(tryInstance),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) return r.value;
    }
    return null;
  } catch {
    return null;
  }
}

/* ====================================================================
   LAYER 4: Piped API (audio stream resolution)
   ==================================================================== */

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi-libre.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.r4fo.com',
  'https://pipedapi.moomoo.me',
];

async function resolveFromPiped(
  videoId: string,
  streamType: 'audio' | 'video',
): Promise<StreamInfo | null> {
  const tryInstance = async (instance: string): Promise<StreamInfo | null> => {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.audioStreams && !data.videoStreams) return null;

      const audioStreams: any[] = data.audioStreams || [];
      const videoStreams: any[] = data.videoStreams || [];

      // --- AUDIO: prefer m4a/mp4, then best bitrate ---
      const mp4Audio = audioStreams
        .filter((s: any) => s.url && (s.mimeType?.includes('mp4') || s.mimeType?.includes('m4a')))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      const webmAudio = audioStreams
        .filter((s: any) => s.url && s.mimeType?.includes('webm'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      const bestAudio = mp4Audio[0] || webmAudio[0] || audioStreams.find((s: any) => s.url);
      if (!bestAudio?.url) return null;

      // --- VIDEO ---
      let videoUrl: string | undefined;
      let videoQuality: number | undefined;

      if (streamType === 'video') {
        // Piped provides proxied video URLs
        const combinedVideo = videoStreams
          .filter((s: any) => s.url && s.videoOnly === false)
          .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
        const adaptiveVideo = videoStreams
          .filter((s: any) => s.url && s.videoOnly === true)
          .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

        const bestVideo = combinedVideo[0] || adaptiveVideo[0];
        if (bestVideo) {
          videoUrl = bestVideo.url;
          videoQuality = bestVideo.height || 0;
        }
      }

      return {
        audioUrl: bestAudio.url,
        mimeType: normalizeContentType(bestAudio.mimeType || 'audio/mp4'),
        duration: data.duration || 0,
        title: data.title || '',
        artist: data.uploader || '',
        thumbnail: data.thumbnailUrl || data.uploaderAvatar || '',
        source: 'e',
        videoUrl,
        videoQuality,
      };
    } catch {
      return null;
    }
  };

  try {
    // Try 3 Piped instances in parallel
    const results = await Promise.allSettled(
      PIPED_INSTANCES.slice(0, 3).map(tryInstance),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) return r.value;
    }
    return null;
  } catch {
    return null;
  }
}

/* ====================================================================
   PARALLEL RESOLVER — Promise.any: first success wins
   ==================================================================== */

async function resolveStreamInfo(
  videoId: string,
  streamType: 'audio' | 'video' = 'audio',
): Promise<StreamInfo | null> {
  // CACHE FIRST — return immediately if available
  const cached = getCached(videoId);
  if (cached) {
    console.log(`[proxy] Cache hit for ${videoId} (${cached.source})`);
    return cached;
  }

  console.log(`[proxy] Resolving stream for ${videoId} (type=${streamType})...`);

  // Create ALL resolver promises with individual timeouts
  const resolvers: Promise<StreamInfo>[] = [
    // Layer 1: ytdl-core — 5s timeout (primary resolver)
    withTimeout(resolveFromLayer1(videoId, streamType), 5000, 'L1').then(
      (r) => r ?? Promise.reject(new Error('L1 failed')),
    ),

    // Layer 2a: InnerTube ANDROID_MUSIC — 4s timeout (usually fastest)
    withTimeout(resolveFromInnerTube(videoId, 'ANDROID_MUSIC', streamType), 4000, 'L2-AM').then(
      (r) => r ?? Promise.reject(new Error('L2-AM failed')),
    ),

    // Layer 2b: InnerTube TVHTML5 — 5s timeout
    withTimeout(resolveFromInnerTube(videoId, 'TVHTML5', streamType), 5000, 'L2-TV').then(
      (r) => r ?? Promise.reject(new Error('L2-TV failed')),
    ),

    // Layer 3: Invidious (internally tries 6 instances) — 6s timeout
    withTimeout(resolveFromInvidious(videoId, streamType), 6000, 'L3').then(
      (r) => r ?? Promise.reject(new Error('L3 failed')),
    ),

    // Layer 4: Piped (internally tries 3 instances) — 6s timeout
    withTimeout(resolveFromPiped(videoId, streamType), 6000, 'L4').then(
      (r) => r ?? Promise.reject(new Error('L4 failed')),
    ),
  ];

  try {
    // Promise.any: returns as soon as the FIRST resolver succeeds
    const result = await Promise.any(resolvers);
    console.log(`[proxy] ✅ First success: ${result.source} (type=${streamType})`);
    setCache(videoId, result);
    return result;
  } catch {
    console.error(`[proxy] ❌ All layers failed for ${videoId}`);
    return null;
  }
}

/* ====================================================================
   MAIN HANDLER
   ==================================================================== */

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('id');
  const rawType = request.nextUrl.searchParams.get('type') || 'audio';

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 },
    );
  }

  // type=info: return lightweight metadata without stream URLs
  if (rawType === 'info') {
    const cached = getCached(videoId);
    if (cached) {
      return NextResponse.json({
        videoId,
        title: cached.title,
        artist: cached.artist,
        duration: cached.duration,
        thumbnail: cached.thumbnail,
        source: cached.source,
      });
    }
    // No cached info — resolve fully then return just metadata
    const info = await resolveStreamInfo(videoId, 'audio');
    if (!info) {
      return NextResponse.json(
        { error: 'Info unavailable' },
        { status: 503 },
      );
    }
    return NextResponse.json({
      videoId,
      title: info.title,
      artist: info.artist,
      duration: info.duration,
      thumbnail: info.thumbnail,
      source: info.source,
    });
  }

  // Determine stream type
  const streamType: 'audio' | 'video' = rawType === 'video' ? 'video' : 'audio';

  const info = await resolveStreamInfo(videoId, streamType);
  if (!info) {
    return NextResponse.json(
      { error: 'Stream unavailable', fallback: 'youtube' },
      { status: 503 },
    );
  }

  // Build Invidious fallback URLs for client-side playback
  const clientFallbacks = INVIDIOUS_INSTANCES.slice(0, 3).map(
    (inst) => ({
      url: `${inst}/latest_version?id=${videoId}&itag=140&local=true`,
      mimeType: 'audio/mp4',
    }),
  );

  // Base response (works for both audio and video)
  const response: Record<string, unknown> = {
    videoId,
    directUrl: info.audioUrl,
    mimeType: info.mimeType,
    duration: info.duration,
    title: info.title,
    artist: info.artist,
    thumbnail: info.thumbnail,
    source: info.source,
    itag: info.itag,
    invidiousFallbacks: clientFallbacks,
  };

  // Add video fields when type=video
  if (streamType === 'video' && info.videoUrl) {
    response.videoUrl = info.videoUrl;
    response.videoQuality = info.videoQuality || 0;
    response.audioUrl = info.audioUrl;
  }

  return NextResponse.json(response);
}
