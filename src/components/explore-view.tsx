'use client';

import { useEffect, useState } from 'react';
import {
  Compass,
  TrendingUp,
  Sparkles,
  Music,
  Mic2,
  Guitar,
  Headphones,
  Radio,
  Disc3,
  Globe2,
  Flower2,
  Dumbbell,
  PartyPopper,
  Heart,
  Target,
  Zap,
  CloudRain,
  Smile,
  Coffee,
  Music2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackCard } from '@/components/track-card';
import { useMusicStore, type Track } from '@/lib/store';

/* ───────────────────── Data ───────────────────── */

const moods = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-300' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡', color: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-300' },
  { id: 'chill', label: 'Chill', emoji: '😌', color: 'bg-teal-100 dark:bg-teal-900/30', textColor: 'text-teal-700 dark:text-teal-300' },
  { id: 'romantic', label: 'Romantic', emoji: '❤️', color: 'bg-rose-100 dark:bg-rose-900/30', textColor: 'text-rose-700 dark:text-rose-300' },
  { id: 'focus', label: 'Focus', emoji: '🎯', color: 'bg-indigo-100 dark:bg-indigo-900/30', textColor: 'text-indigo-700 dark:text-indigo-300' },
  { id: 'party', label: 'Party', emoji: '🎉', color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', textColor: 'text-fuchsia-700 dark:text-fuchsia-300' },
  { id: 'workout', label: 'Workout', emoji: '💪', color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-300' },
];

const genres = [
  { id: 'pop', label: 'Pop', icon: Mic2, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
  { id: 'rock', label: 'Rock', icon: Guitar, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  { id: 'hip-hop', label: 'Hip Hop', icon: Music, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { id: 'electronic', label: 'Electronic', icon: Headphones, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
  { id: 'rnb', label: 'R&B', icon: Radio, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  { id: 'jazz', label: 'Jazz', icon: Disc3, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  { id: 'classical', label: 'Classical', icon: Music2, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  { id: 'country', label: 'Country', icon: Guitar, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  { id: 'latin', label: 'Latin', icon: Flower2, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
  { id: 'bollywood', label: 'Bollywood', icon: Sparkles, color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400' },
  { id: 'regional-indian', label: 'Regional Indian', icon: Globe2, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
  { id: 'devotional', label: 'Devotional', icon: Flower2, color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
];

const charts = [
  { id: 'top-10-week', label: 'Top 10 This Week', icon: TrendingUp, query: 'Top 10 songs this week' },
  { id: 'trending-hindi', label: 'Trending Hindi', icon: Globe2, query: 'Trending Hindi songs' },
  { id: 'trending-english', label: 'Trending English', icon: Globe2, query: 'Trending English songs' },
  { id: 'trending-punjabi', label: 'Trending Punjabi', icon: Globe2, query: 'Trending Punjabi songs' },
  { id: 'trending-global', label: 'Trending Global', icon: Compass, query: 'Trending Global songs' },
];

const quickPicks = [
  { id: 'workout-hits', label: 'Workout Hits', icon: Dumbbell, query: 'Workout hits music' },
  { id: 'road-trip', label: 'Road Trip', icon: Compass, query: 'Road trip music' },
  { id: 'study-music', label: 'Study Music', icon: Target, query: 'Study music concentration' },
  { id: 'sleep-relax', label: 'Sleep & Relax', icon: CloudRain, query: 'Sleep relax music' },
  { id: 'throwback-90s', label: 'Throwback 90s', icon: Smile, query: '90s throwback hits' },
  { id: '2000s-hits', label: '2000s Hits', icon: Coffee, query: '2000s hit songs' },
  { id: 'love-songs', label: 'Love Songs', icon: Heart, query: 'Love songs romantic' },
  { id: 'dance-party', label: 'Dance Party', icon: PartyPopper, query: 'Dance party music' },
];

/* ───────────────────── Helpers ───────────────────── */

function navigateToSearch(query: string) {
  useMusicStore.setState({
    searchQuery: query,
    view: 'search',
  });
}

/* ───────────────────── Section: Mood ───────────────────── */

function MoodSection() {
  return (
    <section className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <Smile className="size-5 text-[#FF6B00]" />
        <h2 className="text-xl font-bold">Mood</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => navigateToSearch(`${mood.label} music`)}
            className={`flex flex-col items-center justify-center gap-1.5 shrink-0 w-24 h-24 rounded-2xl transition-all hover:scale-105 hover:shadow-md ${mood.color}`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className={`text-xs font-semibold ${mood.textColor}`}>{mood.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Section: Genre ───────────────────── */

function GenreSection() {
  return (
    <section className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <Disc3 className="size-5 text-[#FF6B00]" />
        <h2 className="text-xl font-bold">Genres</h2>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => navigateToSearch(`${genre.label} music`)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all hover:scale-105 hover:shadow-md ${genre.color}`}
          >
            <genre.icon className="size-6" />
            <span className="text-xs font-medium">{genre.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Section: New Releases ───────────────────── */

function NewReleasesSection() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/music/trending');
        const data = await res.json();
        setTracks(data.items || []);
      } catch {
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <section className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-[#FF6B00]" />
        <h2 className="text-xl font-bold">New Releases</h2>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-40 md:w-48">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No new releases available right now.</p>
          <p className="text-sm mt-1">Check back later!</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {tracks.map((track) => (
            <div key={track.videoId} className="shrink-0 w-40 md:w-48">
              <TrackCard track={track} variant="grid" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ───────────────────── Section: Charts ───────────────────── */

function ChartsSection() {
  return (
    <section className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="size-5 text-[#FF6B00]" />
        <h2 className="text-xl font-bold">Charts</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {charts.map((chart) => (
          <Button
            key={chart.id}
            variant="outline"
            onClick={() => navigateToSearch(chart.query)}
            className="gap-2 rounded-full border-[#FF6B00]/30 hover:bg-[#FF6B00]/10 hover:border-[#FF6B00]/50 text-foreground transition-all"
          >
            <chart.icon className="size-4 text-[#FF6B00]" />
            {chart.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Section: Quick Picks ───────────────────── */

function QuickPicksSection() {
  return (
    <section className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="size-5 text-[#FF6B00]" />
        <h2 className="text-xl font-bold">Quick Picks</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {quickPicks.map((pick) => (
          <button
            key={pick.id}
            onClick={() => navigateToSearch(pick.query)}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border shadow-sm transition-all hover:shadow-md hover:scale-[1.02] hover:border-[#FF6B00]/30"
          >
            <div className="size-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
              <pick.icon className="size-5 text-[#FF6B00]" />
            </div>
            <span className="text-sm font-medium text-left leading-tight">{pick.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Main Component ───────────────────── */

export function ExploreView() {
  return (
    <div className="px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-2">
        <div className="size-10 rounded-xl bg-[#FF6B00] flex items-center justify-center">
          <Compass className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
          <p className="text-sm text-muted-foreground">Discover new music by mood, genre & more</p>
        </div>
      </div>

      {/* Sections */}
      <MoodSection />
      <GenreSection />
      <NewReleasesSection />
      <ChartsSection />
      <QuickPicksSection />
    </div>
  );
}
