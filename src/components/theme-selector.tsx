'use client';

import { useState, useEffect, useCallback, useSyncExternalStore, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_THEMES, applyColorTheme, getColorTheme, type ColorTheme } from '@/lib/color-themes';
import {
  FESTIVAL_THEMES,
  detectCountry,
  getActiveFestival,
  applyFestivalTheme,
  type FestivalTheme,
} from '@/lib/festival-themes';
import { useMusicStore } from '@/lib/store';

// Hydration-safe
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const STORAGE_KEY = 'weedmusic-color-theme';

export function ThemeSelector() {
  const mounted = useHasMounted();
  const themePresetId = useMusicStore((s) => s.themePresetId);
  const setThemePresetId = useMusicStore((s) => s.setThemePresetId);
  const [open, setOpen] = useState(false);
  const [activeFestival, setActiveFestival] = useState<FestivalTheme | null>(null);

  // Auto-detect country & apply festival on mount — always on, no toggle needed
  useEffect(() => {
    if (!mounted) return;

    // Check for active festival and auto-apply
    const country = detectCountry();
    const festival = getActiveFestival(country);
    setActiveFestival(festival);

    // If festival is active, apply it immediately
    if (festival) {
      document.documentElement.classList.add('theme-transitioning');
      applyFestivalTheme(festival);
      setThemePresetId(festival.id);
      try { localStorage.setItem(STORAGE_KEY, festival.id); } catch { /* */ }
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);
    } else {
      // No active festival — load saved palette or apply default
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          // Check if it's a saved festival that's no longer active
          const isFestival = FESTIVAL_THEMES.find(f => f.id === saved);
          if (isFestival) {
            // Festival expired, clear it and apply default
            const defaultTheme = COLOR_THEMES[2]; // Cannabis Gold
            applyColorTheme(defaultTheme);
            setThemePresetId(defaultTheme.id);
            localStorage.setItem(STORAGE_KEY, defaultTheme.id);
          } else {
            const theme = getColorTheme(saved);
            if (theme) {
              applyColorTheme(theme);
              setThemePresetId(theme.id);
            }
          }
        } else {
          // No saved preference — apply Cannabis Gold as default
          const defaultTheme = COLOR_THEMES[2];
          applyColorTheme(defaultTheme);
          setThemePresetId(defaultTheme.id);
        }
      } catch {
        // Fallback
        const defaultTheme = COLOR_THEMES[2];
        applyColorTheme(defaultTheme);
        setThemePresetId(defaultTheme.id);
      }
    }
  }, [mounted]);

  // Re-check festival on focus (user might have changed timezones)
  useEffect(() => {
    if (!mounted) return;
    const handleFocus = () => {
      const country = detectCountry();
      const festival = getActiveFestival(country);
      setActiveFestival(festival);
      // Only auto-apply if no manual override was saved
      if (festival) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved || FESTIVAL_THEMES.find(f => f.id === saved)) {
          document.documentElement.classList.add('theme-transitioning');
          applyFestivalTheme(festival);
          setThemePresetId(festival.id);
          setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
          }, 500);
        }
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [mounted, setThemePresetId]);

  const handleSelect = useCallback((theme: ColorTheme) => {
    document.documentElement.classList.add('theme-transitioning');
    applyColorTheme(theme);
    setThemePresetId(theme.id);
    try { localStorage.setItem(STORAGE_KEY, theme.id); } catch { /* */ }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId]);

  const handleFestivalSelect = useCallback((festival: FestivalTheme) => {
    document.documentElement.classList.add('theme-transitioning');
    applyFestivalTheme(festival);
    setThemePresetId(festival.id);
    try { localStorage.setItem(STORAGE_KEY, festival.id); } catch { /* */ }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId]);

  // Get upcoming festivals for current country
  const upcomingFestivals = useMemo(() => {
    if (!mounted) return [];
    const country = detectCountry();
    return FESTIVAL_THEMES.filter(
      f => f.countryCode === country || f.countryCode === 'GLOBAL'
    ).slice(0, 6);
  }, [mounted]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
        <div className="size-[18px] rounded-full bg-muted-foreground/30" />
      </Button>
    );
  }

  const activeTheme = themePresetId ? getColorTheme(themePresetId) : null;
  const isFestivalActive = activeFestival !== null;

  // Current gradient for the header dot
  const currentGradient = isFestivalActive
    ? `linear-gradient(135deg, ${activeFestival.icon}, ${activeFestival.bannerEnd})`
    : activeTheme
    ? `linear-gradient(135deg, ${activeTheme.icon}, ${activeTheme.bannerEnd})`
    : `linear-gradient(135deg, #22C55E, #F59E0B)`;

  const currentGlow = isFestivalActive
    ? `0 0 8px ${activeFestival.icon}50`
    : activeTheme
    ? `0 0 8px ${activeTheme.icon}50`
    : '0 0 8px #22C55E50';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 transition-all duration-200"
          aria-label="Color palette"
          title={isFestivalActive ? `${activeFestival.emoji} ${activeFestival.name}` : (activeTheme ? activeTheme.name : 'Choose color')}
        >
          <div
            className="size-[18px] rounded-full border-2 border-current transition-all duration-300"
            style={{
              background: currentGradient,
              boxShadow: currentGlow,
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 overflow-hidden" align="end">

        {/* Active Festival Badge — auto-detected, no "theme" word */}
        {isFestivalActive && (
          <div
            className="px-3 py-2.5 flex items-center gap-2 border-b border-border"
            style={{
              background: `linear-gradient(135deg, ${activeFestival.bg}, ${activeFestival.surface})`,
            }}
          >
            <span className="text-xl">{activeFestival.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: activeFestival.text }}>
                {activeFestival.name}
              </p>
              <p className="text-[9px] truncate" style={{ color: activeFestival.mutedText }}>
                {activeFestival.country} &middot; {activeFestival.description}
              </p>
            </div>
            {/* 3-part color strip */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: activeFestival.icon }} />
              <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: activeFestival.bg }} />
              <div className="w-4 h-1.5 rounded-full" style={{ background: `linear-gradient(to right, ${activeFestival.bannerStart}, ${activeFestival.bannerEnd})` }} />
            </div>
          </div>
        )}

        <div className="p-3">
          {/* 8 Core Color Palettes — 3-part swatches */}
          <div className="grid grid-cols-4 gap-2">
            {COLOR_THEMES.map((theme) => {
              const isActive = themePresetId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme)}
                  className="flex flex-col items-center gap-1 group"
                  title={theme.name}
                >
                  {/* 3-part color swatch: icon | background | banner */}
                  <div
                    className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-primary scale-110 shadow-lg'
                        : 'border-transparent group-hover:border-primary/40 group-hover:scale-105'
                    }`}
                  >
                    {/* Part 2: Background */}
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: theme.bg }}
                    />
                    {/* Part 3: Banner gradient — diagonal half */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${theme.bannerOverlay}, transparent 60%), linear-gradient(135deg, ${theme.bannerStart}40, ${theme.bannerEnd}40)`,
                      }}
                    />
                    {/* Part 1: Icon dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="size-4 rounded-full shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${theme.icon}, ${theme.iconHover})`,
                        }}
                      />
                    </div>
                    {/* Active check */}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check className="size-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] leading-tight text-center truncate w-full text-muted-foreground group-hover:text-foreground transition-colors">
                    {theme.emoji} {theme.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Festival Palettes — auto country-based, compact row */}
          {upcomingFestivals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">
                {detectCountry() !== 'GLOBAL' ? `${getCountryFlag(detectCountry())} Festival Colors` : 'Festival Colors'}
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {upcomingFestivals.map((festival) => {
                  const isActive = themePresetId === festival.id;
                  return (
                    <button
                      key={festival.id}
                      onClick={() => handleFestivalSelect(festival)}
                      className="flex flex-col items-center gap-0.5 group"
                      title={`${festival.name} — ${festival.description}`}
                    >
                      <div
                        className={`size-8 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          isActive
                            ? 'border-primary scale-110 shadow-md'
                            : 'border-transparent group-hover:border-primary/30 group-hover:scale-105'
                        }`}
                        style={{ backgroundColor: festival.bg }}
                      >
                        <div className="w-full h-full relative">
                          {/* Part 3: Banner gradient */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(135deg, ${festival.bannerStart}50, ${festival.bannerEnd}30)`,
                            }}
                          />
                          {/* Part 1: Icon dot */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: festival.icon }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="text-[7px] leading-tight text-center w-full text-muted-foreground truncate">
                        {festival.emoji}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Get country flag emoji from country code */
function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    IN: '🇮🇳', US: '🇺🇸', CN: '🇨🇳', JP: '🇯🇵', BR: '🇧🇷',
    MX: '🇲🇽', GB: '🇬🇧', KR: '🇰🇷', TH: '🇹🇭', DE: '🇩🇪',
    NG: '🇳🇬', SA: '🇸🇦', AU: '🇦🇺', FR: '🇫🇷', CA: '🇨🇦',
    RU: '🇷🇺', ES: '🇪🇸', GLOBAL: '🌍',
  };
  return flags[code] || '🏳️';
}
