import { NextRequest, NextResponse } from 'next/server';

/* ---------- Category → search query mapping ---------- */

const CATEGORY_MAP: Record<string, string> = {
  nursery: 'nursery rhymes for kids',
  lullabies: 'lullabies for babies',
  action: 'action songs for kids',
  animal: 'animal songs for children',
  learning: 'ABC learning songs for kids',
  fun: 'fun play songs for kids',
};

/* ---------- YouTube InnerTube API (Primary) ---------- */

const INNERTUBE_FILTER_PARAMS: Record<string, string> = {
  songs: 'EgWKAQIIAWoKEAkQCRADEAoQDQ==',
  videos: 'EgWKAQIQAWoKEAkQCRADEAoQDQ==',
};

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt', 'https://pipedapi-libre.kavin.rocks',
  'https://api.piped.yt', 'https://pipedapi.r4fo.com', 'https://pipedapi.moomoo.me',
  'https://pipedapi.leptons.xyz', 'https://pipedapi.darkness.services',
  'https://pipedapi.drgns.space', 'https://pipedapi.ducks.party',
  'https://pipedapi.ngn.tf', 'https://pipedapi.freedback.eu',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza', 'https://invidious.fdn.fr', 'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de', 'https://inv.nadeko.net',
  'https://invidious.protokolla.fi', 'https://invidious.perennialte.ch',
  'https://iv.ggtyler.dev', 'https://invidious.privacydelegation.de',
  'https://yt.cdaut.de', 'https://invidious.jing.rocks',
];

// Explicit content filter keywords
const BLOCKED_WORDS = [
  'explicit', 'nsfw', '18+', 'adult', 'xxx', 'sexy', 'naked', 'nude',
  'violence', 'drug', 'alcohol', 'weed', 'smoke', 'gun', 'kill',
  'fight', 'blood', 'death', 'murder', 'curse', 'swear', 'damn',
  'hell', 'crap', 'ass', 'bad word', 'inappropriate', 'mature',
];

function isKidSafe(title: string, artist: string): boolean {
  const combined = (title + ' ' + artist).toLowerCase();
  return !BLOCKED_WORDS.some(word => combined.includes(word));
}

/* ---------- Caching ---------- */

const cacheMap = new Map<string, { items: any[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

/* ====================================================================
   InnerTube Search
   ==================================================================== */

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
      let videoId = '', title = '', artist = '', duration = 0, thumbnail = '';
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
      const fixedCols = renderer.fixedColumns || [];
      for (const col of fixedCols) {
        const textRuns = col?.musicResponsiveListItemFixedColumnRenderer?.text?.runs || [];
        duration = parseDurationText(textRuns.map((r: any) => r.text || '').join('').trim());
      }
      if (renderer.title) title = renderer.title.runs?.map((r: any) => r.text).join('') || renderer.title.simpleText || title;
      if (renderer.subtitle) artist = renderer.subtitle.runs?.map((r: any) => r.text).join('') || renderer.subtitle.simpleText || artist;
      if (videoId && title) items.push({ videoId, title, artist: artist || 'Unknown', thumbnail, duration, source: 'youtube' });
    } catch { /* skip */ }
  }
  return items;
}

function parseDurationText(text: string): number {
  if (!text) return 0;
  const parts = text.trim().split(':');
  try {
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    if (parts.length === 3) return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  } catch { /* */ }
  return 0;
}

async function searchInnerTube(query: string): Promise<any[]> {
  const body: any = {
    context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20241210.00.00', hl: 'en' } },
    query,
    params: INNERTUBE_FILTER_PARAMS.songs,
  };
  try {
    const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Origin: 'https://music.youtube.com',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items: any[] = [];
    const shelves = findValuesByKey(data, 'musicShelfRenderer');
    for (const shelf of shelves) items.push(...parseMusicShelfItems(shelf));
    const tabs = findValuesByKey(data, 'tabRenderer');
    for (const tab of tabs) {
      const tabShelves = findValuesByKey(tab, 'musicShelfRenderer');
      for (const shelf of tabShelves) items.push(...parseMusicShelfItems(shelf));
    }
    return items;
  } catch { return []; }
}

/* ====================================================================
   Piped Search
   ==================================================================== */

async function searchPipedParallel(query: string): Promise<any[]> {
  const promises = PIPED_INSTANCES.map(async (inst): Promise<any[] | null> => {
    try {
      const res = await fetch(`${inst}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.items?.length) return null;
      return data.items
        .filter((item: any) => item.url && item.type !== 'channel' && item.type !== 'playlist')
        .map((item: any) => ({
          videoId: item.url?.replace('/watch?v=', '') || '',
          title: item.title || 'Unknown',
          artist: item.uploaderName || item.uploader?.name || item.creator || 'Unknown',
          thumbnail: item.thumbnail || '',
          duration: item.duration || 0,
          isPaid: false,
          source: 'youtube',
        }))
        .filter((item: any) => item.videoId);
    } catch { return null; }
  });

  try {
    const result = await Promise.any(
      promises.map(async (p) => {
        const r = await p;
        if (r === null || r.length === 0) throw new Error('No results');
        return r;
      }),
    );
    return result;
  } catch { return []; }
}

/* ====================================================================
   Invidious Search
   ==================================================================== */

async function searchInvidiousParallel(query: string): Promise<any[]> {
  const promises = INVIDIOUS_INSTANCES.map(async (inst): Promise<any[] | null> => {
    try {
      const res = await fetch(`${inst}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return data
        .filter((item: any) => item.type === 'video')
        .map((item: any) => ({
          videoId: item.videoId || '',
          title: item.title || 'Unknown',
          artist: item.author || 'Unknown',
          thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || '',
          duration: item.lengthSeconds || 0,
          isPaid: false,
          source: 'invidious',
        }))
        .filter((item: any) => item.videoId);
    } catch { return null; }
  });

  try {
    const result = await Promise.any(
      promises.map(async (p) => {
        const r = await p;
        if (r === null || r.length === 0) throw new Error('No results');
        return r;
      }),
    );
    return result;
  } catch { return []; }
}

/* ====================================================================
   Main Handler
   ==================================================================== */

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const category = request.nextUrl.searchParams.get('category');

  // Determine the search query
  let searchQuery: string;
  if (category && CATEGORY_MAP[category]) {
    searchQuery = CATEGORY_MAP[category];
  } else if (q) {
    searchQuery = q;
  } else {
    searchQuery = 'kids music nursery rhymes';
  }

  // Check cache per query
  const cacheKey = searchQuery;
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ items: cached.items, query: searchQuery });
  }

  let items: any[] = [];

  // 1. Try InnerTube first (fast, ~1s)
  items = await searchInnerTube(searchQuery);

  // 2. If InnerTube succeeded, use it
  if (items.length > 0) {
    console.log(`[kids] InnerTube returned ${items.length} results for "${searchQuery}"`);
  } else {
    // 3. InnerTube failed — race Piped and Invidious, take first success
    console.log(`[kids] InnerTube empty, trying Piped + Invidious for "${searchQuery}"`);

    try {
      items = await Promise.any([
        searchPipedParallel(searchQuery).then(r => { if (r.length === 0) throw new Error('empty'); return r; }),
        searchInvidiousParallel(searchQuery).then(r => { if (r.length === 0) throw new Error('empty'); return r; }),
      ]);
    } catch {
      // Both failed — try InnerTube with "videos" filter as last resort
      const body: any = {
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20241210.00.00', hl: 'en' } },
        query: searchQuery,
        params: INNERTUBE_FILTER_PARAMS.videos,
      };
      try {
        const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Origin: 'https://music.youtube.com',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          const shelves = findValuesByKey(data, 'musicShelfRenderer');
          for (const shelf of shelves) items.push(...parseMusicShelfItems(shelf));
        }
      } catch { /* give up */ }
    }
  }

  // Filter out livestreams and very short/long content
  if (items.length > 0) {
    items = items.filter((item: any) => {
      if (item.duration === -1) return false;
      if (item.duration > 0 && item.duration < 30) return false;
      if (item.duration > 10800) return false;
      return true;
    });
  }

  // Filter for kid safety and deduplicate
  const seen = new Set<string>();
  items = items
    .filter(item => item.videoId && isKidSafe(item.title, item.artist))
    .filter(item => {
      if (seen.has(item.videoId)) return false;
      seen.add(item.videoId);
      return true;
    })
    .map(item => ({ ...item, kidSafe: true }))
    .slice(0, 30);

  // Update cache
  cacheMap.set(cacheKey, { items, timestamp: Date.now() });

  return NextResponse.json({ items, query: searchQuery });
}
