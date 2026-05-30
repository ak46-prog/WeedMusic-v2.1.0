'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Home,
  Compass,
  Library,
  Radio,
  Baby,
  Car,
  Plus,
  Heart,
  Wand2,
  Bookmark,
  Sparkles,
  ListMusic,
  Crown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMusicStore, type ViewMode } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AuthButton } from '@/components/auth-button';

interface Playlist {
  id: string;
  name: string;
  description: string;
  items: { track: unknown; position: number }[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Animation class map for nav icons                                  */
/* ------------------------------------------------------------------ */

const navAnimClassMap: Record<string, string> = {
  home: 'animate-icon-home',
  explore: 'animate-icon-explore',
  library: 'animate-icon-library',
  radio: 'animate-icon-radio',
  kids: 'animate-icon-kids',
  car: 'animate-icon-car',
  upgrade: 'animate-icon-crown',
};

/* ------------------------------------------------------------------ */
/*  Now Playing Mini Display                                           */
/* ------------------------------------------------------------------ */

function NowPlayingMini() {
  const { currentTrack, isPlaying } = useMusicStore();

  if (!currentTrack) return null;

  return (
    <div className="border-t bg-background/80 backdrop-blur-sm px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0 w-9 h-9 rounded overflow-hidden">
          <Image
            src={currentTrack.thumbnail || '/weedmusic-logo.png'}
            alt={currentTrack.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-foreground">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {currentTrack.artist}
            </p>
          </div>
          <div className={`now-playing-indicator ${!isPlaying ? 'paused' : ''}`}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sidebar content                                             */
/* ------------------------------------------------------------------ */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView, toggleChildMode, childMode } = useMusicStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/music/playlists');
        const data = await res.json();
        if (!cancelled) setPlaylists(data.playlists || []);
      } catch {
        if (!cancelled) setPlaylists([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refreshPlaylists = () => setRefreshKey((k) => k + 1);

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await fetch('/api/music/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });
      setNewPlaylistName('');
      setShowNewPlaylist(false);
      refreshPlaylists();
    } catch {
      // silently fail
    }
  };

  const handleNavigate = (target: ViewMode) => {
    if (target === 'kids') {
      toggleChildMode();
    }
    setView(target);
    onNavigate?.();
  };

  /* ---- Library items ---- */
  const libraryItems = [
    {
      icon: Heart,
      label: 'Liked Music',
      view: 'library' as ViewMode,
    },
    {
      icon: Wand2,
      label: 'Auto playlist',
      view: 'home' as ViewMode,
    },
    {
      icon: Bookmark,
      label: 'Episodes for Later',
      view: 'library' as ViewMode,
    },
    {
      icon: Sparkles,
      label: 'Auto playlist',
      view: 'home' as ViewMode,
    },
  ];

  /* ---- Quick access items with animation mapping ---- */
  const quickAccessItems = [
    { icon: Home, label: 'Home', view: 'home' as ViewMode },
    { icon: Compass, label: 'Explore', view: 'explore' as ViewMode },
    { icon: Library, label: 'Library', view: 'library' as ViewMode },
    { icon: Radio, label: 'Radio & FM', view: 'radio' as ViewMode },
    { icon: Baby, label: 'Kids Mode', view: 'kids' as ViewMode, isKids: true },
    { icon: Car, label: 'Car Mode', view: 'car' as ViewMode },
  ];

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="px-3 py-4 space-y-6">
          {/* ---- Library Section ---- */}
          <section>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Library
              </h3>
            </div>

            {/* New playlist button */}
            <div className="space-y-0.5">
              <button
                onClick={() => setShowNewPlaylist(!showNewPlaylist)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Plus className="size-4 shrink-0" />
                <span>New playlist</span>
              </button>

              {showNewPlaylist && (
                <div className="flex gap-1.5 px-2 pb-1">
                  <Input
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist name..."
                    onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                    className="h-7 text-xs"
                  />
                  <Button
                    onClick={createPlaylist}
                    size="sm"
                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                  >
                    Add
                  </Button>
                </div>
              )}

              {libraryItems.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={`${item.label}-${idx}`}
                    onClick={() => handleNavigate(item.view)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-200',
                      view === item.view
                        ? 'text-orange-500 bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/10 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <ItemIcon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---- Quick Access Section ---- */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Quick Access
            </h3>
            <div className="space-y-0.5">
              {quickAccessItems.map((item) => {
                const isActive =
                  item.isKids && childMode
                    ? true
                    : !item.isKids && view === item.view;

                const ItemIcon = item.icon;
                const animClass = navAnimClassMap[item.view] || '';

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigate(item.view)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-200',
                      isActive && item.isKids
                        ? 'text-green-500 bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-950/30 dark:to-green-950/10 font-medium'
                        : isActive
                          ? 'text-orange-500 bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/10 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <ItemIcon
                      className={cn(
                        'size-4 shrink-0 transition-transform',
                        isActive ? animClass : '',
                        item.isKids && childMode && 'text-green-500'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---- Playlists Section ---- */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Playlists
            </h3>
            {playlists.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-2">
                No playlists yet
              </p>
            ) : (
              <div className="space-y-0.5">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      setView('library');
                      onNavigate?.();
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <ListMusic className="size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{playlist.name}</span>
                      <span className="text-[11px] text-muted-foreground/70">
                        {playlist.items?.length || 0} tracks
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>

      {/* Auth / Cloud sync */}
      <div className="border-t px-3 py-2">
        <AuthButton />
      </div>

      {/* Now playing indicator at bottom of sidebar */}
      <NowPlayingMini />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop sidebar                                                    */
/* ------------------------------------------------------------------ */

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useMusicStore();

  return (
    <>
      {/* Desktop sidebar - always visible on lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-background border-r z-30 flex-col grass-border-top">
        {/* Logo header */}
        <div className="px-4 pt-4 pb-2 border-b">
          <h2 className="text-base font-bold bg-gradient-to-r from-green-600 via-orange-500 to-green-600 bg-clip-text text-transparent flex items-center gap-1.5">
            🌿 WeedMusic
          </h2>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      <div className="lg:hidden">
        {/* Backdrop overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar panel */}
        <aside
          className={cn(
            'fixed left-0 top-0 bottom-0 w-72 bg-background border-r z-50 flex flex-col grass-border-top transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Close button */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
            <h2 className="text-base font-bold bg-gradient-to-r from-green-600 via-orange-500 to-green-600 bg-clip-text text-transparent flex items-center gap-1.5">
              🌿 WeedMusic
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md hover:bg-accent/50 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile sheet sidebar (kept for backwards compat if needed)         */
/* ------------------------------------------------------------------ */

function MobileSidebarSheet() {
  const { sidebarOpen, setSidebarOpen } = useMusicStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-left text-base font-bold bg-gradient-to-r from-green-600 via-orange-500 to-green-600 bg-clip-text text-transparent">
            🌿 WeedMusic
          </SheetTitle>
        </SheetHeader>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
