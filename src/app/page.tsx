'use client';

import { useState } from 'react';
import { useMusicStore } from '@/lib/store';
import { Header } from '@/components/header';
import { HeroBanner } from '@/components/hero-banner';
import { TrendingSection } from '@/components/trending-section';
import { CategorySection } from '@/components/category-section';
import { Category3DSection } from '@/components/3d-categories';
import { PromoBanner } from '@/components/promo-banner';
import { SearchView } from '@/components/search-view';
import { LibraryView } from '@/components/library-view';
import { CarMode } from '@/components/car-mode';
import { KidsMode } from '@/components/kids-mode';
import { RadioView } from '@/components/radio-view';
import { ExploreView } from '@/components/explore-view';
import { ArtistView } from '@/components/artist-view';
import { UpgradeView } from '@/components/upgrade-view';
import { MusicPlayer } from '@/components/music-player';
import { VideoPlayer } from '@/components/video-player';
import { AudioManager } from '@/components/audio-manager';
import { MobileNav } from '@/components/mobile-nav';
import { AppSidebar } from '@/components/app-sidebar';
import { Github, Play, Globe, ExternalLink, Shield, Menu, Leaf } from 'lucide-react';
import { PWARegister } from '@/components/pwa-register';
import { TvChannels } from '@/components/tv-channels';
import { VoiceAssistant } from '@/components/voice-assistant';
import { Button } from '@/components/ui/button';



export default function Home() {
  const view = useMusicStore((s) => s.view);
  const showVideoPlayer = useMusicStore((s) => s.showVideoPlayer);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Full-screen modes
  if (view === 'car') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AudioManager />
        <CarMode />
        <VoiceAssistant />
      </div>
    );
  }

  if (view === 'kids') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AudioManager />
        <KidsMode />
        <MusicPlayer />
        <VoiceAssistant />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <AudioManager />
      <PWARegister />

      {/* Desktop Sidebar — Collapsible overlay for full-width content */}
      <div className={`sidebar-collapsible ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <AppSidebar />
      </div>

      {/* Sidebar Toggle Button (desktop) */}
      <Button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        variant="ghost"
        size="icon"
        className="hidden lg:flex fixed top-3 left-3 z-50 size-10 rounded-xl bg-background/80 backdrop-blur-lg border border-border/50 shadow-lg hover:bg-accent"
      >
        <Menu className="size-5" />
      </Button>

      {/* Sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-40 bg-black/20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area — Full Width */}
      <div className="flex-1 content-fullscreen">
        <Header />

        <main className="flex-1 pb-36 md:pb-28 px-2 md:px-6 lg:px-8">
          {view === 'home' && (
            <>
              <HeroBanner />
              <PromoBanner />
              <TrendingSection />
              <Category3DSection />
              <CategorySection />
              <TvChannels />
            </>
          )}
          {view === 'search' && <SearchView />}
          {view === 'explore' && <ExploreView />}
          {view === 'library' && <LibraryView />}
          {view === 'artist' && <ArtistView />}
          {view === 'upgrade' && <UpgradeView />}
          {view === 'radio' && <RadioView />}
        </main>
      </div>

      {/* Footer with weed grass decoration */}
      <footer className="mt-auto relative border-t border-border/40 bg-background">
        <div className="flex flex-wrap items-center justify-center gap-3 py-3 px-4 text-xs text-muted-foreground">
          <span className="font-medium">🌿</span>
          <span className="font-semibold bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">WeedMusic</span>
          <span className="text-border">•</span>
          <a
            href="https://ak46-prog.github.io/WEEDMUSIC/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400 font-semibold transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>ak46-prog.github.io</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-green-600 dark:text-green-400 font-medium">
            <Shield className="h-3.5 w-3.5" />
            <span>256-bit TLS</span>
          </span>
          <span className="text-border">•</span>
          <a
            href="https://github.com/ak46-prog/WEEDMUSIC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
          <span className="text-border">•</span>
          <span>© {new Date().getFullYear()}</span>
          <span>🍃</span>
        </div>
      </footer>

      <MobileNav />
      <MusicPlayer />
      {showVideoPlayer && <VideoPlayer />}
      <VoiceAssistant />
    </div>
  );
}
