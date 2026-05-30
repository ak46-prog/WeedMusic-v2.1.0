'use client';

import { useEffect, useState, useRef } from 'react';
import { Radio, Search, Play, Pause, Globe, Volume2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';

interface RadioStation {
  id: string;
  name: string;
  url: string;
  favicon: string;
  country: string;
  countryCode: string;
  state: string;
  tags: string;
  genre: string;
  codec: string;
  bitrate: number;
  isLive: boolean;
  votes: number;
  clickCount: number;
  geoLat: number;
  geoLon: number;
}

const POPULAR_COUNTRIES = ['India', 'United States of America', 'United Kingdom', 'Germany', 'France', 'Japan', 'Brazil', 'Australia'];
const GENRES = ['pop', 'rock', 'jazz', 'classical', 'news', 'talk', 'electronic', 'latin', 'hip hop', 'country', 'folk', 'blues'];

export function RadioView() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'country' | 'genre'>('popular');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async (params?: { q?: string; country?: string; genre?: string }) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.country) searchParams.set('country', params.country);
      if (params?.genre) searchParams.set('genre', params.genre);
      searchParams.set('limit', '30');

      const res = await fetch(`/api/music/radio?${searchParams.toString()}`);
      const data = await res.json();
      setStations(data.stations || []);
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchStations({ q: searchQuery.trim() });
    }
  };

  const handleCountryClick = (country: string) => {
    fetchStations({ country });
    setActiveTab('country');
  };

  const handleGenreClick = (genre: string) => {
    fetchStations({ genre });
    setActiveTab('genre');
  };

  const playStation = (station: RadioStation) => {
    if (playing === station.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = station.url;
        audioRef.current.play().catch(() => {});
      }
      setPlaying(station.id);
    }
  };

  return (
    <div className="px-4 md:px-6 py-6">
      <audio ref={audioRef} />

      <div className="flex items-center gap-2 mb-4">
        <Radio className="size-5 text-orange-500" />
        <h2 className="text-xl font-bold">Radio Garden</h2>
        <Badge variant="secondary" className="text-[10px]">FM & AM</Badge>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search radio stations..."
          className="h-9"
        />
        <Button onClick={handleSearch} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
          <Search className="size-4" />
        </Button>
        <Button onClick={() => fetchStations()} size="sm" variant="outline">
          <Globe className="size-4 mr-1" />
          Popular
        </Button>
      </div>

      {/* Country Quick Access */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2 flex items-center gap-1">
          <MapPin className="size-3.5 text-orange-500" />
          Browse by Country
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {POPULAR_COUNTRIES.map((country) => (
            <Button
              key={country}
              onClick={() => handleCountryClick(country)}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
            >
              {country}
            </Button>
          ))}
        </div>
      </div>

      {/* Genre Quick Access */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Browse by Genre</p>
        <div className="flex gap-2 flex-wrap">
          {GENRES.map((genre) => (
            <Button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              variant="outline"
              size="sm"
              className="text-xs capitalize"
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>

      {/* Station List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : stations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Radio className="size-10 mx-auto mb-3 opacity-30" />
          <p>No stations found</p>
          <p className="text-sm mt-1">Try a different search</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {stations.map((station) => (
            <div
              key={station.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                playing === station.id
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'hover:bg-accent'
              }`}
            >
              <button
                onClick={() => playStation(station)}
                className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                  playing === station.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-orange-500 hover:text-white'
                } transition-colors`}
              >
                {playing === station.id ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{station.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {station.country && <span>{station.country}</span>}
                  {station.genre && station.genre !== 'General' && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">{station.genre}</Badge>
                  )}
                  {station.bitrate > 0 && <span>{station.bitrate}kbps</span>}
                  {station.codec && <span>{station.codec}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {station.isLive && (
                  <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 border-0">LIVE</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
