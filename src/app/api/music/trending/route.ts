import { NextResponse } from 'next/server';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi-libre.kavin.rocks',
  'https://api.piped.yt',
];

// Cache trending results for 5 minutes
let cachedItems: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

/* ---------- Helpers (shared with search route) ---------- */

function findValuesByKey(obj: any, key: string, maxDepth = 12): any[] {
  const results: any[] = [];
  if (maxDepth <= 0 || !obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    for (const item of obj) results.push(...findValuesByKey(item, key, maxDepth - 1));
  } else {
    for (const [k, v] of Object.entries(obj)) {
      if (k === key) results.push(v);
      results.push(...findValuesByKey(v, key, maxDepth - 1));
    }
  }
  return results;
}

function parseMusicShelfItems(shelfRenderer: any): any[] {
  const items: any[] = [];
  const contents = shelfRenderer?.contents || [];
  for (const content of contents) {
    try {
      const renderer = content.musicResponsiveListItemRenderer || content.musicTwoRowItemRenderer;
      if (!renderer) continue;
      let videoId = '', title = '', artist = '', thumbnail = '';
      const flexCols = renderer.flexColumns || [];
      for (let i = 0; i < flexCols.length; i++) {
        const textRuns = flexCols[i]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const text = textRuns.map((r: any) => r.text || '').join(' ').trim();
        if (i === 0) {
          title = text;
          for (const r of textRuns) {
            const nav = r.navigationEndpoint || {};
            videoId = nav.watchEndpoint?.videoId || nav.watchPlaylistEndpoint?.playlistId || '';
            if (videoId) break;
          }
        } else if (i === 1) artist = text;
      }
      const thumbs = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      if (thumbs.length > 0) thumbnail = thumbs[thumbs.length - 1].url || '';
      let duration = 0;
      const fixedCols = renderer.fixedColumns || [];
      for (const col of fixedCols) {
        const textRuns = col?.musicResponsiveListItemFixedColumnRenderer?.text?.runs || [];
        const text = textRuns.map((r: any) => r.text || '').join('').trim();
        const parts = text.split(':');
        if (parts.length === 2) duration = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        else if (parts.length === 3) duration = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
      }
      if (renderer.title) title = renderer.title.runs?.map((r: any) => r.text).join('') || renderer.title.simpleText || title;
      if (renderer.subtitle) artist = renderer.subtitle.runs?.map((r: any) => r.text).join('') || renderer.subtitle.simpleText || artist;
      if (videoId && title) items.push({ videoId, title, artist: artist || 'Unknown', thumbnail, duration, isPaid: false });
    } catch { /* skip */ }
  }
  return items;
}

/* ---------- Music filter: remove non-music content ---------- */

const NON_MUSIC_KEYWORDS = [
  'live:', 'en vivo', 'breaking', 'news', 'trump', 'biden', 'politics',
  'attack', 'war', 'strike', 'captured', 'fox news', 'nbc news', 'cnn',
  'telemundo', 'associated press', 'livenow', 'press conference',
  'livestream', 'stream:', '🔴', 'watch live', 'alert',
];

function isMusicTrack(item: any): boolean {
  const title = (item.title || '').toLowerCase();
  const artist = (item.artist || item.uploaderName || '').toLowerCase();

  // Filter out livestreams (duration -1 or 0 means live/unknown)
  if (item.duration === -1 || item.duration === 0) return false;

  // Filter out very short videos (< 30s, likely not songs)
  if (item.duration > 0 && item.duration < 30) return false;

  // Filter out very long videos (> 3 hours, likely not songs)
  if (item.duration > 10800) return false;

  // Filter out known non-music keywords
  for (const keyword of NON_MUSIC_KEYWORDS) {
    if (title.includes(keyword) || artist.includes(keyword)) return false;
  }

  return true;
}

/* ---------- InnerTube Search Fallback ---------- */

async function searchInnerTube(query: string): Promise<any[]> {
  try {
    const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Origin: 'https://music.youtube.com',
      },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20250525.00.00', hl: 'en' } },
        query,
        params: 'EgWKAQIIAWoKEAkQCRADEAoQDQ==', // songs filter
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items: any[] = [];
    const shelves = findValuesByKey(data, 'musicShelfRenderer');
    for (const shelf of shelves) items.push(...parseMusicShelfItems(shelf));
    return items.slice(0, 20);
  } catch {
    return [];
  }
}

/* ---------- Piped Music Trending (music category) ---------- */

async function fetchPipedMusicTrending(): Promise<any[]> {
  // Try Piped music trending endpoint first (returns music-specific content)
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/trending?region=US`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const pipedData = await res.json();
      if (!Array.isArray(pipedData) || pipedData.length === 0) continue;

      // Map and filter to music-only content
      const musicItems = pipedData
        .map((item: any) => ({
          videoId: item.url?.replace('/watch?v=', '') || '',
          title: item.title || 'Unknown',
          artist: item.uploaderName || item.uploader?.name || 'Unknown',
          thumbnail: item.thumbnail || '',
          duration: item.duration || 0,
          isPaid: false,
        }))
        .filter((item: any) => item.videoId && isMusicTrack(item));

      if (musicItems.length >= 5) {
        console.log(`[trending] Piped (${instance}) returned ${musicItems.length} music items`);
        return musicItems;
      }
    } catch {
      continue;
    }
  }
  return [];
}

/* ---------- Main Handler ---------- */

export async function GET() {
  // Return cached data if fresh
  if (cachedItems.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ items: cachedItems });
  }

  let items: any[] = [];

  // STRATEGY: Run music-specific sources in parallel for fastest results
  const [pipedMusic, innerTubeMusic] = await Promise.all([
    fetchPipedMusicTrending(),
    // Also search InnerTube for trending music in parallel
    (async () => {
      const queries = ['top songs 2025', 'trending music this week', 'popular hits playlist'];
      for (const q of queries) {
        const results = await searchInnerTube(q);
        if (results.length > 0) return results;
      }
      return [];
    })(),
  ]);

  // Prefer InnerTube results (music-specific), then Piped filtered results
  if (innerTubeMusic.length >= 5) {
    items = innerTubeMusic;
    console.log(`[trending] Using InnerTube results: ${items.length} items`);
  } else if (pipedMusic.length >= 5) {
    items = pipedMusic;
    console.log(`[trending] Using Piped filtered results: ${items.length} items`);
  } else {
    // Merge both, deduplicate by videoId, and filter
    const seen = new Set<string>();
    const merged = [...innerTubeMusic, ...pipedMusic].filter((item) => {
      if (seen.has(item.videoId)) return false;
      seen.add(item.videoId);
      return isMusicTrack(item);
    });
    items = merged;
  }

  // Update cache
  if (items.length > 0) {
    cachedItems = items;
    cacheTimestamp = Date.now();
  } else if (cachedItems.length > 0) {
    // Return stale cache if nothing worked
    return NextResponse.json({ items: cachedItems });
  }

  return NextResponse.json({ items });
}
