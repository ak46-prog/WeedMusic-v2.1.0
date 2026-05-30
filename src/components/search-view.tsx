'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { SmartThumbnail } from '@/components/music-icon-fallback';
import {
  Search,
  Music,
  Mic2,
  Guitar,
  Headphones,
  Radio,
  Disc3,
  Flower2,
  Dumbbell,
  CloudRain,
  Play,
  RefreshCw,
  Eye,
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VoiceSearchButton } from '@/components/voice-search';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

/* ---------- category data for "Browse all" ---------- */

const CATEGORIES = [
  { name: 'Pop', icon: Music, color: 'bg-rose-500' },
  { name: 'Rock', icon: Guitar, color: 'bg-red-600' },
  { name: 'Hip Hop', icon: Mic2, color: 'bg-amber-500' },
  { name: 'Electronic', icon: Headphones, color: 'bg-teal-500' },
  { name: 'R&B', icon: Radio, color: 'bg-purple-500' },
  { name: 'Jazz', icon: Disc3, color: 'bg-orange-500' },
  { name: 'Classical', icon: Flower2, color: 'bg-emerald-600' },
  { name: 'Bollywood', icon: Music, color: 'bg-pink-500' },
  { name: 'Regional', icon: Radio, color: 'bg-teal-600' },
  { name: 'Devotional', icon: Flower2, color: 'bg-yellow-600' },
  { name: 'Workout', icon: Dumbbell, color: 'bg-red-500' },
  { name: 'Chill', icon: CloudRain, color: 'bg-slate-500' },
] as const;

const TAB_LIST = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'videos', label: 'Videos' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
  { value: 'podcasts', label: 'Podcasts' },
] as const;

const TRENDING_SEARCHES = [
  'Top Hits 2025',
  'Lo-fi beats',
  'Workout mix',
  'Chill vibes',
  'Bollywood hits',
  'K-pop playlist',
  '90s nostalgia',
  'Acoustic covers',
];

/* ---------- helpers ---------- */

function formatViews(views?: number): string {
  if (!views) return '';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return `${views}`;
}

const STORAGE_KEY = 'weedmusic-recent-searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  try {
    const prev = getRecentSearches().filter((q) => q !== query);
    const updated = [query, ...prev].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

/* ====================================================================
   SearchView – Streaming App Style (Enhanced)
   ==================================================================== */

export function SearchView() {
  const { searchQuery, currentTrack, isPlaying } = useMusicStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState('songs');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();

  /* ---- load recent searches on mount ---- */
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  /* ---- search ---- */
  const searchMusic = useCallback(
    async (query: string, tab?: string) => {
      if (!query.trim()) return;
      setLoading(true);
      setError('');
      setSuccessMsg('');
      setHasSearched(true);
      try {
        const filter = tab && tab !== 'all' ? `&filter=${tab}` : '';
        const res = await fetch(
          `/api/music/search?q=${encodeURIComponent(query)}${filter}`,
        );
        const data = await res.json();
        if (data.error && (!data.items || data.items.length === 0)) {
          setError(data.error);
          setResults([]);
        } else {
          const items = data.items || [];
          setResults(items);
          saveRecentSearch(query.trim());
          setRecentSearches(getRecentSearches());
          // Show success indicator
          setSuccessMsg(`${items.length} result${items.length !== 1 ? 's' : ''} found`);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => setSuccessMsg(''), 3000);
        }
      } catch {
        setError('Failed to search. Please check your connection and try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /* sync store searchQuery → local */
  useEffect(() => {
    if (searchQuery) {
      setLocalQuery(searchQuery);
      searchMusic(searchQuery, activeTab);
    }
  }, [searchQuery]);

  /* re-search when tab changes */
  useEffect(() => {
    if (hasSearched && localQuery.trim()) {
      searchMusic(localQuery, activeTab);
    }
  }, [activeTab]);

  /* ---- handlers ---- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      searchMusic(localQuery, activeTab);
    }
  };

  const handleCategoryClick = (name: string) => {
    setLocalQuery(name);
    searchMusic(name, activeTab);
    inputRef.current?.focus();
  };

  const handleVoiceSearch = (text: string) => {
    setLocalQuery(text);
    searchMusic(text, activeTab);
  };

  const handleRetry = () => {
    if (localQuery.trim()) {
      searchMusic(localQuery, activeTab);
    }
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    setResults([]);
    setError('');
    setHasSearched(false);
    setSuccessMsg('');
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (query: string) => {
    setLocalQuery(query);
    searchMusic(query, activeTab);
  };

  const handleTrendingClick = (query: string) => {
    setLocalQuery(query);
    searchMusic(query, activeTab);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  /* ================================================================
     RENDER
     ================================================================ */

  return (
    <div className="flex flex-col h-full">
      {/* ---- Search bar ---- */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 px-4 md:px-6 pt-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search songs, albums, artists, podcasts"
              className="pl-10 pr-10 h-11 rounded-full text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-orange-500/50"
            />
            {/* Clear button (X) */}
            {localQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-11 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
            {/* Voice Search Button */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <VoiceSearchButton onTranscript={handleVoiceSearch} size="sm" />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white shrink-0 px-6"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline ml-2">Search</span>
          </Button>
        </form>

        {/* ---- Tab filters ---- */}
        {hasSearched && (
          <div className="mt-3 -mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto scrollbar-hide">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="bg-transparent h-auto p-0 gap-0 border-b border-border rounded-none w-max min-w-full justify-start">
                {TAB_LIST.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* ---- Success indicator (toast-like) ---- */}
      {successMsg && !loading && (
        <div className="mx-4 md:mx-6 mt-2 flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg px-3 py-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ---- Content area ---- */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
        {/* Loading state */}
        {loading && (
          <div className="space-y-1 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg"
              >
                <Skeleton className="size-12 rounded-md shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-3 w-10 shrink-0" />
                <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error state - enhanced with helpful suggestions */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <WifiOff className="size-7 text-destructive" />
            </div>
            <p className="text-lg font-medium text-foreground">
              Something went wrong
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {error}
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Try these:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                  Use different keywords
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  Check your connection
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  Try &ldquo;Songs&rdquo; tab for best results
                </Badge>
              </div>
            </div>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="mt-4 gap-2 rounded-full"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && hasSearched && results.length > 0 && (
          <div className="mt-4">
            {/* Results count */}
            <p className="text-xs text-muted-foreground mb-3 view-badge">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{localQuery}&rdquo;
            </p>

            <div className="space-y-0.5 stagger-list">
              {results.map((track, idx) => {
                const isCurrent = currentTrack?.videoId === track.videoId;
                const viewsStr = formatViews(track.views);

                return (
                  <div
                    key={`${track.videoId}-${idx}`}
                    className={`track-row flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${
                      isCurrent
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-l-2 border-orange-500'
                        : ''
                    }`}
                    onClick={() => useMusicStore.getState().playTrack(track)}
                  >
                    {/* Index number */}
                    <span className="text-xs text-muted-foreground tabular-nums w-5 text-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden">
                      <SmartThumbnail
                        src={track.thumbnail}
                        alt={track.title}
                        videoId={track.videoId}
                        className="object-cover w-full h-full"
                        size="full"
                      />
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="size-4 text-white fill-white" />
                      </div>
                      {/* Playing indicator */}
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center">
                          <div className="flex gap-0.5 items-end h-3">
                            <span className="w-1 bg-orange-500 animate-eq1" />
                            <span className="w-1 bg-orange-500 animate-eq2" />
                            <span className="w-1 bg-orange-500 animate-eq3" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            isCurrent ? 'text-orange-500' : ''
                          }`}
                        >
                          {track.title}
                        </p>
                        {/* Equalizer bars next to playing track title */}
                        {isCurrent && isPlaying && (
                          <div className="flex gap-[2px] items-end h-3 shrink-0">
                            <span className="w-[2px] bg-orange-500 rounded-full animate-eq1 h-3" />
                            <span className="w-[2px] bg-orange-500 rounded-full animate-eq2 h-2" />
                            <span className="w-[2px] bg-orange-500 rounded-full animate-eq3 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            useMusicStore.getState().openArtistView(track.artist);
                          }}
                          className="hover:text-orange-500 hover:underline transition-colors truncate"
                        >
                          {track.artist}
                        </button>
                        {viewsStr && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="flex items-center gap-0.5 view-badge shrink-0">
                              <Eye className="size-3 text-muted-foreground/60" />
                              {viewsStr}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side: duration + badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDuration(track.duration)}
                      </span>
                      {track.isPaid ? (
                        <Badge className="text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 px-1.5 py-0 h-5">
                          PREMIUM
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0 px-1.5 py-0 h-5">
                          FREE
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try different keywords or check the &ldquo;Songs&rdquo; tab
            </p>
          </div>
        )}

        {/* Empty state – Before any search: Recently Searched + Trending + Browse all */}
        {!hasSearched && (
          <div className="mt-4 space-y-6">
            {/* Recently Searched */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="size-4 text-muted-foreground" />
                    Recently Searched
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearRecent}
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((query) => (
                    <button
                      key={query}
                      onClick={() => handleRecentSearchClick(query)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-sm text-foreground transition-colors"
                    >
                      <Clock className="size-3 text-muted-foreground" />
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <TrendingUp className="size-4 text-orange-500" />
                Trending Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((query) => (
                  <button
                    key={query}
                    onClick={() => handleTrendingClick(query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 text-sm text-orange-700 dark:text-orange-400 transition-colors border border-orange-200 dark:border-orange-800/40"
                  >
                    <TrendingUp className="size-3" />
                    {query}
                  </button>
                ))}
              </div>
            </div>

            {/* Browse all */}
            <div>
              <h2 className="text-xl font-bold mb-4">Browse all</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`card-lift relative overflow-hidden rounded-xl ${cat.color} h-24 sm:h-28 flex flex-col justify-between p-3 text-white shadow-sm hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2`}
                    >
                      <Icon className="absolute -right-2 -bottom-2 size-16 opacity-20 rotate-12" />
                      <span className="text-sm font-bold leading-tight z-10">
                        {cat.name}
                      </span>
                      <Icon className="size-6 z-10 self-end" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
