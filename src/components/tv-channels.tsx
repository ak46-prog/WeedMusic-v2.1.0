'use client';

import { useState } from 'react';
import { Tv, Play, Globe, Film, Newspaper } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  url: string;
  category: 'news' | 'movie' | 'music' | 'entertainment';
  country: string;
  logo?: string;
  language?: string;
}

const CHANNELS: Channel[] = [
  // News Channels
  { id: '1', name: 'ABC News Live', url: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8', category: 'news', country: 'US', language: 'English' },
  { id: '2', name: 'Al Jazeera English', url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', category: 'news', country: 'INT', language: 'English' },
  { id: '3', name: 'France 24 English', url: 'https://stream.france24.com/F24_EN_HI_HLS/live_web.m3u8', category: 'news', country: 'FR', language: 'English' },
  { id: '4', name: 'DW News', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', category: 'news', country: 'DE', language: 'English' },
  { id: '5', name: 'NDTV 24x7', url: 'https://ndtv24x7elemarchana.akamaized.net/hls/live/2003678/ndtv24x7/master.m3u8', category: 'news', country: 'IN', language: 'Hindi' },
  { id: '6', name: 'BBC News', url: 'https://vs-cmaf-pushb-uk.live.fastly.md.bbci.co.uk/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/pc_hd_abr_v2.mpd', category: 'news', country: 'UK', language: 'English' },
  // Movie Channels
  { id: '7', name: 'MovieSphere Free', url: 'https://moviesphere-plex.amagi.tv/playlist.m3u8', category: 'movie', country: 'US', language: 'English' },
  { id: '8', name: 'Grjngo Western', url: 'https://grjngo-western-plex.amagi.tv/playlist.m3u8', category: 'movie', country: 'US', language: 'English' },
  { id: '9', name: 'AsianCrush', url: 'https://asiancrush-plex.amagi.tv/playlist.m3u8', category: 'movie', country: 'US', language: 'Multiple' },
  // Music Channels
  { id: '10', name: 'MTV Live', url: 'https://mtv-live-plex.amagi.tv/playlist.m3u8', category: 'music', country: 'US', language: 'English' },
  { id: '11', name: 'Stingray Hits', url: 'https://stingray-hits-plex.amagi.tv/playlist.m3u8', category: 'music', country: 'US', language: 'English' },
  // Entertainment
  { id: '12', name: 'TWC Live', url: 'https://weather-plex.amagi.tv/playlist.m3u8', category: 'entertainment', country: 'US', language: 'English' },
];

const COUNTRIES = [
  { code: 'ALL', name: '🌍 All' },
  { code: 'US', name: '🇺🇸 USA' },
  { code: 'UK', name: '🇬🇧 UK' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'INT', name: '🌐 International' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'music', label: 'Music', icon: Tv },
  { id: 'entertainment', label: 'More', icon: Play },
] as const;

export function TvChannels() {
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [playingChannel, setPlayingChannel] = useState<string | null>(null);

  const filteredChannels = CHANNELS.filter((ch) => {
    const countryMatch = selectedCountry === 'ALL' || ch.country === selectedCountry;
    const categoryMatch = selectedCategory === 'all' || ch.category === selectedCategory;
    return countryMatch && categoryMatch;
  });

  return (
    <section className="px-4 md:px-6 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Tv className="size-5 text-orange-500" />
        <h2 className="text-xl font-bold">Live TV Channels</h2>
      </div>

      {/* Country Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelectedCountry(c.code)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCountry === c.code
                ? 'bg-orange-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <cat.icon className="size-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Channel Player */}
      {playingChannel && (
        <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video max-h-[300px]">
          <video
            src={playingChannel}
            autoPlay
            controls
            playsInline
            className="w-full h-full object-contain"
            onError={(e) => {
              // HLS fallback not available in native video - show message
              (e.target as HTMLVideoElement).poster = '';
            }}
          />
        </div>
      )}

      {/* Channel Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredChannels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setPlayingChannel(ch.url)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all hover:scale-105 hover:shadow-md ${
              playingChannel === ch.url
                ? 'bg-orange-500/10 ring-2 ring-orange-500/50'
                : 'bg-muted/50 hover:bg-muted'
            }`}
          >
            <div className={`size-10 rounded-full flex items-center justify-center ${
              ch.category === 'news' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
              ch.category === 'movie' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-500' :
              ch.category === 'music' ? 'bg-green-100 dark:bg-green-900/30 text-green-500' :
              'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
            }`}>
              {ch.category === 'news' ? <Newspaper className="size-5" /> :
               ch.category === 'movie' ? <Film className="size-5" /> :
               ch.category === 'music' ? <Tv className="size-5" /> :
               <Play className="size-5" />}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{ch.name}</span>
            <span className="text-[10px] text-muted-foreground">{ch.country}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
