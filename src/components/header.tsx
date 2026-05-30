'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Search, Baby, Car, Menu, Clock, Sun, Moon, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMusicStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { QualitySettings } from '@/components/quality-settings';
import { VoiceSearchButton } from '@/components/voice-search';
import { AuthButton } from '@/components/auth-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Hydration-safe mount detection
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-9 text-muted-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="size-[18px]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Moon className="size-[18px] text-orange-500" />
          ) : theme === 'light' ? (
            <Sun className="size-[18px] text-orange-500" />
          ) : (
            <Monitor className="size-[18px] text-orange-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-accent text-orange-500 font-medium' : ''}
        >
          <Sun className="size-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-accent text-orange-500 font-medium' : ''}
        >
          <Moon className="size-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-accent text-orange-500 font-medium' : ''}
        >
          <Monitor className="size-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { childMode, toggleChildMode, sidebarOpen, setSidebarOpen } = useMusicStore();
  const [searchInput, setSearchInput] = useState('');
  const [dateTime, setDateTime] = useState('');

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      setDateTime(`${date} · ${time}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchInput.trim()) {
      useMusicStore.setState({ searchQuery: searchInput.trim(), view: 'search' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleVoiceSearch = (text: string) => {
    setSearchInput(text);
    useMusicStore.setState({ searchQuery: text, view: 'search' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 h-14 sm:h-16">

        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="size-5" />
          </Button>

          <button
            onClick={() => useMusicStore.setState({ view: 'home' })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative size-8 sm:size-9 rounded-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/weedmusic-logo.png"
                alt="WeedMusic"
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-green-500 via-emerald-500 to-orange-500 bg-clip-text text-transparent hidden sm:inline select-none">
              weedmusic
            </span>
          </button>

          {/* Date & Time */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
            <Clock className="size-3" />
            <span className="tabular-nums whitespace-nowrap">{dateTime}</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center max-w-2xl mx-auto">
          <div className="flex w-full group">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={childMode ? 'Search kid-safe music...' : 'Search songs, albums, artists, podcasts'}
                className="h-9 sm:h-10 pl-9 pr-10 rounded-l-full rounded-r-none border-r-0 bg-muted/40 border-muted-foreground/15 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 transition-all duration-200 text-sm placeholder:text-muted-foreground/50"
              />
              {/* Voice Search Button inside input */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <VoiceSearchButton onTranscript={handleVoiceSearch} size="sm" />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              className="rounded-r-full rounded-l-none bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 sm:px-5 h-9 sm:h-10 shadow-sm hover:shadow transition-all duration-200"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
          </div>
        </div>

        {/* Right: Action Icons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {childMode && (
            <Badge className="bg-green-500/90 hover:bg-green-500 text-white border-0 text-[10px] font-semibold tracking-wide mr-1 sm:mr-2 px-2 py-0.5 h-6 shadow-sm animate-in fade-in slide-in-from-right-2 duration-200">
              KIDS MODE
            </Badge>
            )}

          {/* Mobile Date/Time */}
          <div className="md:hidden flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums mr-1">
            <Clock className="size-3" />
            <span>{dateTime.split(' · ')[1]}</span>
          </div>

          <QualitySettings />

          {/* Enhanced Theme Toggle with dropdown */}
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleChildMode}
            className={`size-9 transition-all duration-200 ${
              childMode
                ? 'text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            aria-label="Toggle kids mode"
          >
            <Baby className="size-[18px]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => useMusicStore.setState({ view: 'car' })}
            className="size-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            aria-label="Car mode"
          >
            <Car className="size-[18px]" />
          </Button>

          {/* Auth / Cloud Sync */}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
