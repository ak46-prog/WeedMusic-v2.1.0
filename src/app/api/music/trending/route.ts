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
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20241210.00.00', hl: 'en' } },
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

/* ---------- Main Handler ---------- */

export async function GET() {
  // Return cached data if fresh
  if (cachedItems.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ items: cachedItems });
  }

  let items: any[] = [];

  // 1. Try Piped trending endpoint
  let pipedData: any = null;
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/trending?region=US`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        pipedData = await res.json();
        if (Array.isArray(pipedData) && pipedData.length > 0) break;
        pipedData = null;
      }
    } catch {
      continue;
    }
  }

  if (pipedData && Array.isArray(pipedData) && pipedData.length > 0) {
    items = pipedData.slice(0, 20).map((item: any) => ({
      videoId: item.url?.replace('/watch?v=', '') || '',
      title: item.title || 'Unknown',
      artist: item.uploaderName || item.uploader?.name || 'Unknown',
      thumbnail: item.thumbnail || '',
      duration: item.duration || 0,
      isPaid: false,
    })).filter((item: any) => item.videoId);
  }

  // 2. Fallback: use InnerTube search for trending music
  if (items.length === 0) {
    console.log('[trending] Piped returned empty, using InnerTube search fallback...');
    const TRENDING_QUERIES = ['trending music 2025', 'top hits this week', 'popular songs right now'];

    for (const query of TRENDING_QUERIES) {
      const searchResults = await searchInnerTube(query);
      if (searchResults.length > 0) {
        items = searchResults;
        console.log(`[trending] InnerTube search "${query}" returned ${items.length} items`);
        break;
      }
    }
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
