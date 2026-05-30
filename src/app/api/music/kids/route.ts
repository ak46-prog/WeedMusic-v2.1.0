import { NextRequest, NextResponse } from 'next/server';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
];

const KIDS_SEARCH_TERMS = [
  'nursery rhymes', 'kids songs', 'children music', 'baby songs',
  'educational songs for kids', 'kids bedtime music', 'lullaby',
  'disney songs for kids', 'cartoon songs', 'kids dance music'
];

// Category-specific search terms
const CATEGORY_TERMS: Record<string, string[]> = {
  nursery: ['nursery rhymes', 'classic nursery songs', 'rhymes for kids'],
  lullaby: ['lullaby songs kids', 'bedtime music kids', 'sleep songs children'],
  action: ['action songs kids dance', 'movement songs children', 'dance along kids'],
  animal: ['animal songs kids', 'animal sounds songs', 'zoo songs children'],
  abc: ['abc songs kids learning', 'numbers songs children', 'educational songs preschool'],
  fun: ['fun kids songs play', 'party songs children', 'happy kids music'],
};

// Explicit content filter keywords
const BLOCKED_WORDS = [
  'explicit', 'nsfw', '18+', 'adult', 'xxx', 'sexy', 'naked', 'nude',
  'violence', 'drug', 'alcohol', 'smoke', 'gun', 'kill',
  'fight', 'blood', 'death', 'murder', 'curse', 'swear', 'damn',
  'hell', 'crap', 'ass', 'bad word', 'inappropriate', 'mature'
];

let cachedKids: any[] = [];
let cacheTimestamp = 0;
let cachedCategory = '';
const CACHE_TTL = 10 * 60 * 1000; // 10 min cache

function isKidSafe(title: string, artist: string): boolean {
  const combined = (title + ' ' + artist).toLowerCase();
  return !BLOCKED_WORDS.some(word => combined.includes(word));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customQuery = searchParams.get('q');
  const category = searchParams.get('category') || '';

  // Check cache for this category
  if (cachedKids.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL && cachedCategory === category) {
    return NextResponse.json({ items: cachedKids });
  }

  const allItems: any[] = [];

  // Determine search terms
  let searchTerms: string[];
  if (customQuery) {
    searchTerms = [customQuery];
  } else if (category && CATEGORY_TERMS[category]) {
    searchTerms = CATEGORY_TERMS[category];
  } else {
    searchTerms = KIDS_SEARCH_TERMS.slice(0, 4);
  }

  for (const term of searchTerms) {
    for (const instance of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${instance}/search?q=${encodeURIComponent(term)}&filter=music_songs`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items) {
            allItems.push(...data.items.map((item: any) => ({
              videoId: item.url?.replace('/watch?v=', '') || '',
              title: item.title || 'Unknown',
              artist: item.uploaderName || item.uploader?.name || 'Unknown',
              thumbnail: item.thumbnail || '',
              duration: item.duration || 0,
              isPaid: false,
              source: 'youtube',
              kidSafe: true,
            })));
          }
          break; // Success with this instance, move to next term
        }
      } catch {
        continue;
      }
    }
  }

  // Filter for kid safety and deduplicate
  const seen = new Set<string>();
  const items = allItems
    .filter(item => item.videoId && isKidSafe(item.title, item.artist))
    .filter(item => {
      if (seen.has(item.videoId)) return false;
      seen.add(item.videoId);
      return true;
    })
    .slice(0, 30);

  cachedKids = items;
  cacheTimestamp = Date.now();
  cachedCategory = category;

  return NextResponse.json({ items });
}
