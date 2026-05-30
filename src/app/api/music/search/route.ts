import { NextRequest, NextResponse } from 'next/server';

/* ---------- YouTube InnerTube API (Primary) ---------- */

const INNERTUBE_FILTER_PARAMS: Record<string, string> = {
  songs: 'EgWKAQIIAWoKEAkQCRADEAoQDQ==',
  videos: 'EgWKAQIQAWoKEAkQCRADEAoQDQ==',
  albums: 'EgWKAQIYAWoKEAkQCRADEAoQDQ==',
  artists: 'EgWKAQIgAWoKEAkQCRADEAoQDQ==',
  podcasts: 'EgWKAQJYAWoKEAkQCRADEAoQDQ==',
  playlists: 'EgWKAQoYAWoKEAkQCRADEAoQDQ==',
};

const FILTER_MAP: Record<string, string> = {
  songs: 'songs', videos: 'videos', albums: 'albums', artists: 'artists',
  podcasts: 'podcasts', music_songs: 'songs', music_videos: 'videos',
  music_albums: 'albums', music_playlists: 'playlists', channels: 'artists',
  playlists: 'playlists', all: 'all',
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
      let videoId = '', title = '', artist = '', views = 0, duration = 0, thumbnail = '', channelUrl = '';
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
      for (const col of flexCols) {
        const textRuns = col?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        for (const r of textRuns) {
          const t = (r.text || '').toLowerCase();
          if (t.includes('play') || t.includes('view')) views = parseViewText(r.text);
        }
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
      if (videoId && title) items.push({ videoId, title, artist: artist || 'Unknown', thumbnail, duration, views, source: 'youtube', channelUrl });
    } catch { /* skip */ }
  }
  return items;
}

function parseViewText(text: string): number {
  if (!text) return 0;
  const lower = text.toLowerCase().replace(/,/g, '');
  const bm = lower.match(/([\d.]+)\s*b/); if (bm) return Math.round(parseFloat(bm[1]) * 1e9);
  const mm = lower.match(/([\d.]+)\s*m/); if (mm) return Math.round(parseFloat(mm[1]) * 1e6);
  const km = lower.match(/([\d.]+)\s*k/); if (km) return Math.round(parseFloat(km[1]) * 1e3);
  const nm = lower.match(/([\d]+)/); if (nm) return parseInt(nm[1], 10);
  return 0;
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

async function searchInnerTube(query: string, filter: string): Promise<any[]> {
  const params = filter !== 'all' ? INNERTUBE_FILTER_PARAMS[filter] : undefined;
  const body: any = {
    context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20250525.00.00', hl: 'en' } },
    query,
  };
  if (params) body.params = params;
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
   Piped Search — Uses Promise.any for fast resolution
   ==================================================================== */

const PIPED_FILTER_MAP: Record<string, string> = {
  songs: 'music_songs', videos: 'videos', albums: 'music_albums',
  artists: 'channels', podcasts: 'all', all: 'all',
};

async function searchPipedParallel(query: string, filter: string): Promise<any[]> {
  const pipedFilter = PIPED_FILTER_MAP[filter] || 'music_songs';
  const promises = PIPED_INSTANCES.map(async (inst): Promise<any[] | null> => {
    try {
      const res = await fetch(`${inst}/search?q=${encodeURIComponent(query)}&filter=${pipedFilter}`, {
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
          views: item.views || 0,
          isPaid: false,
          source: 'youtube',
          channelUrl: item.uploaderUrl || '',
        }))
        .filter((item: any) => item.videoId);
    } catch { return null; }
  });

  // Use Promise.any — return as soon as ONE instance returns results
  try {
    const result = await Promise.any(
      promises.map(async (p) => {
        const r = await p;
        if (r === null || r.length === 0) throw new Error('No results');
        return r;
      }),
    );
    return result;
  } catch {
    // All failed in parallel, return empty
    return [];
  }
}

/* ====================================================================
   Invidious Search — Uses Promise.any for fast resolution
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
          views: item.viewCount || 0,
          isPaid: false,
          source: 'invidious',
          channelUrl: item.authorUrl || '',
        }))
        .filter((item: any) => item.videoId);
    } catch { return null; }
  });

  // Use Promise.any — return as soon as ONE instance returns results
  try {
    const result = await Promise.any(
      promises.map(async (p) => {
        const r = await p;
        if (r === null || r.length === 0) throw new Error('No results');
        return r;
      }),
    );
    return result;
  } catch {
    return [];
  }
}

/* ====================================================================
   Main Handler — Fast-first strategy
   ==================================================================== */

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const source = request.nextUrl.searchParams.get('source') || 'youtube';
  const safeSearch = request.nextUrl.searchParams.get('safe') === 'true';
  const rawFilter = request.nextUrl.searchParams.get('filter') || '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required', items: [] }, { status: 400 });
  }

  let mappedFilter = 'all';
  if (rawFilter && rawFilter !== 'all') {
    mappedFilter = FILTER_MAP[rawFilter] || 'all';
  }

  let items: any[] = [];

  if (source === 'invidious') {
    items = await searchInvidiousParallel(query);
  } else {
    // STRATEGY: InnerTube first (fast, ~1s), then fallback to Piped/Invidious in parallel
    // This avoids waiting for slow Piped/Invidious timeouts when InnerTube succeeds

    // 1. Try InnerTube first (usually returns in <2s)
    items = await searchInnerTube(query, mappedFilter);

    // 2. If InnerTube succeeded, return immediately
    if (items.length > 0) {
      console.log(`[search] InnerTube returned ${items.length} results for "${query}"`);
    } else {
      // 3. InnerTube failed — race Piped and Invidious, take first success
      const pipedFilter = mappedFilter === 'all' ? 'songs' : mappedFilter;
      console.log(`[search] InnerTube empty, trying Piped + Invidious for "${query}"`);

      try {
        items = await Promise.any([
          searchPipedParallel(query, pipedFilter).then(r => { if (r.length === 0) throw new Error('empty'); return r; }),
          searchInvidiousParallel(query).then(r => { if (r.length === 0) throw new Error('empty'); return r; }),
        ]);
      } catch {
        // Both failed — try InnerTube with "songs" filter as last resort
        if (mappedFilter !== 'songs') {
          items = await searchInnerTube(query, 'songs');
        }
      }
    }
  }

  // Filter out livestreams and very short/long content (likely not songs)
  if (items.length > 0) {
    items = items.filter((item: any) => {
      // Remove livestreams (duration=-1 means live)
      if (item.duration === -1) return false;
      // Remove very short content (< 30s, likely not songs)
      if (item.duration > 0 && item.duration < 30) return false;
      // Remove very long content (> 3 hours, likely podcasts/livestreams)
      if (item.duration > 10800) return false;
      return true;
    });
  }

  // Child mode: filter out explicit content
  if (safeSearch && items.length > 0) {
    const explicitWords = ['explicit', 'nsfw', '18+', 'adult', 'xxx', 'sexy', 'naked'];
    items = items.filter(
      (item) => !explicitWords.some(
        (word) => item.title.toLowerCase().includes(word) || item.artist.toLowerCase().includes(word),
      ),
    );
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: 'Search temporarily unavailable. Please try again in a moment.', items: [] },
      { status: 503 },
    );
  }

  return NextResponse.json({ items });
}
