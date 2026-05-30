'use client';

import { useState, useEffect, useCallback, useSyncExternalStore, useMemo } from 'react';
import { Check, Sparkles, Globe, ChevronRight } from 'lucide-react';
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
  getUpcomingFestivals,
  applyFestivalTheme,
  getAvailableCountries,
  type FestivalTheme,
} from '@/lib/festival-themes';
import { useMusicStore } from '@/lib/store';

// Hydration-safe
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const STORAGE_KEY = 'weedmusic-color-theme';
const FESTIVAL_STORAGE_KEY = 'weedmusic-festival-mode';
const COUNTRY_STORAGE_KEY = 'weedmusic-festival-country';

type Tab = 'palette' | 'festival';

export function ThemeSelector() {
  const mounted = useHasMounted();
  const themePresetId = useMusicStore((s) => s.themePresetId);
  const setThemePresetId = useMusicStore((s) => s.setThemePresetId);
  const autoFestivalEnabled = useMusicStore((s) => s.autoFestivalEnabled);
  const setAutoFestivalEnabled = useMusicStore((s) => s.setAutoFestivalEnabled);
  const festivalCountry = useMusicStore((s) => s.festivalCountry);
  const setFestivalCountry = useMusicStore((s) => s.setFestivalCountry);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('palette');
  const [activeFestival, setActiveFestival] = useState<FestivalTheme | null>(null);

  // Detect country and active festival on mount
  useEffect(() => {
    if (!mounted) return;

    // Load saved country preference
    try {
      const savedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY);
      if (savedCountry) {
        setFestivalCountry(savedCountry);
      } else {
        const detected = detectCountry();
        setFestivalCountry(detected);
      }

      const savedFestivalMode = localStorage.getItem(FESTIVAL_STORAGE_KEY);
      if (savedFestivalMode !== null) {
        setAutoFestivalEnabled(savedFestivalMode === 'true');
      }
    } catch { /* */ }
  }, [mounted]);

  // Check for active festival
  useEffect(() => {
    if (!mounted || !autoFestivalEnabled) return;
    const country = festivalCountry === 'auto' ? detectCountry() : festivalCountry;
    const festival = getActiveFestival(country);
    setActiveFestival(festival);

    // Auto-apply festival theme if active
    if (festival) {
      document.documentElement.classList.add('theme-transitioning');
      applyFestivalTheme(festival);
      setThemePresetId(festival.id);
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);
    }
  }, [mounted, autoFestivalEnabled, festivalCountry]);

  // Load saved theme on mount
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const theme = getColorTheme(saved);
        if (theme) {
          applyColorTheme(theme);
          setThemePresetId(theme.id);
        }
      }
    } catch { /* */ }
  }, [mounted]);

  const handleSelect = useCallback((theme: ColorTheme) => {
    document.documentElement.classList.add('theme-transitioning');
    applyColorTheme(theme);
    setThemePresetId(theme.id);
    setAutoFestivalEnabled(false);
    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
      localStorage.setItem(FESTIVAL_STORAGE_KEY, 'false');
    } catch { /* */ }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId, setAutoFestivalEnabled]);

  const handleFestivalSelect = useCallback((festival: FestivalTheme) => {
    document.documentElement.classList.add('theme-transitioning');
    applyFestivalTheme(festival);
    setThemePresetId(festival.id);
    setAutoFestivalEnabled(false);
    try {
      localStorage.setItem(STORAGE_KEY, festival.id);
      localStorage.setItem(FESTIVAL_STORAGE_KEY, 'false');
    } catch { /* */ }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId, setAutoFestivalEnabled]);

  const handleAutoFestivalToggle = useCallback(() => {
    const newVal = !autoFestivalEnabled;
    setAutoFestivalEnabled(newVal);
    try {
      localStorage.setItem(FESTIVAL_STORAGE_KEY, String(newVal));
    } catch { /* */ }
    if (newVal) {
      // Apply active festival immediately
      const country = festivalCountry === 'auto' ? detectCountry() : festivalCountry;
      const festival = getActiveFestival(country);
      if (festival) {
        document.documentElement.classList.add('theme-transitioning');
        applyFestivalTheme(festival);
        setThemePresetId(festival.id);
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 500);
      }
    }
  }, [autoFestivalEnabled, setAutoFestivalEnabled, festivalCountry, setThemePresetId]);

  const handleCountryChange = useCallback((country: string) => {
    setFestivalCountry(country);
    try {
      localStorage.setItem(COUNTRY_STORAGE_KEY, country);
    } catch { /* */ }
    // Re-check for active festival with new country
    if (autoFestivalEnabled) {
      const festival = getActiveFestival(country === 'auto' ? detectCountry() : country);
      setActiveFestival(festival);
      if (festival) {
        document.documentElement.classList.add('theme-transitioning');
        applyFestivalTheme(festival);
        setThemePresetId(festival.id);
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 500);
      }
    }
  }, [setFestivalCountry, autoFestivalEnabled, setThemePresetId]);

  const upcomingFestivals = useMemo(() => {
    const country = festivalCountry === 'auto' ? detectCountry() : festivalCountry;
    return getUpcomingFestivals(country, 90);
  }, [festivalCountry]);

  const countries = useMemo(() => getAvailableCountries(), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
        <Sparkles className="size-[18px]" />
      </Button>
    );
  }

  const activeTheme = themePresetId ? getColorTheme(themePresetId) : null;
  const isFestivalActive = activeFestival !== null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 transition-all duration-200"
          aria-label="Color palette"
          title={isFestivalActive ? `${activeFestival.emoji} ${activeFestival.name}` : (activeTheme ? `${activeTheme.name}` : 'Choose color')}
        >
          <div
            className="size-[18px] rounded-full border-2 border-current transition-colors"
            style={{
              background: isFestivalActive
                ? `linear-gradient(135deg, ${activeFestival.icon}, ${activeFestival.bannerEnd})`
                : activeTheme
                ? `linear-gradient(135deg, ${activeTheme.icon}, ${activeTheme.bannerEnd})`
                : 'linear-gradient(135deg, #a293ff, #00f0ff)',
              boxShadow: isFestivalActive ? `0 0 6px ${activeFestival.icon}60` : undefined,
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden" align="end">
        {/* Tab Bar — NO "Themes" word */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('palette')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              tab === 'palette'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="size-3.5" />
            Palette
          </button>
          <button
            onClick={() => setTab('festival')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              tab === 'festival'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="size-3.5" />
            Festival
            {isFestivalActive && (
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
          </button>
        </div>

        <div className="p-3">
          {tab === 'palette' && (
            <>
              {/* 8 Color Palette Swatches — 3-part visual */}
              <div className="grid grid-cols-4 gap-2">
                {COLOR_THEMES.map((theme) => {
                  const isActive = themePresetId === theme.id && !autoFestivalEnabled;
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
                        {/* Background (Part 2) */}
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: theme.bg }}
                        />
                        {/* Banner gradient (Part 3) — diagonal half */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${theme.bannerOverlay}, transparent 60%), linear-gradient(135deg, ${theme.bannerStart}40, ${theme.bannerEnd}40)`,
                          }}
                        />
                        {/* Icon dot (Part 1) */}
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
            </>
          )}

          {tab === 'festival' && (
            <>
              {/* Active Festival Banner */}
              {isFestivalActive && autoFestivalEnabled && (
                <div
                  className="rounded-xl p-3 mb-3 border"
                  style={{
                    background: `linear-gradient(135deg, ${activeFestival.bg}, ${activeFestival.surface})`,
                    borderColor: activeFestival.icon + '30',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeFestival.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: activeFestival.text }}>
                        {activeFestival.name}
                      </p>
                      <p className="text-[10px]" style={{ color: activeFestival.mutedText }}>
                        {activeFestival.description}
                      </p>
                    </div>
                  </div>
                  {/* 3-part color preview */}
                  <div className="flex gap-1 mt-2">
                    <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: activeFestival.icon }} title="Icon" />
                    <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: activeFestival.bg }} title="Background" />
                    <div className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${activeFestival.bannerStart}, ${activeFestival.bannerEnd})` }} title="Banner" />
                  </div>
                </div>
              )}

              {/* Auto Festival Toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-xs font-medium">Auto-detect</span>
                </div>
                <button
                  onClick={handleAutoFestivalToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    autoFestivalEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  aria-label="Toggle auto festival"
                >
                  <div
                    className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      autoFestivalEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Country Selector */}
              <div className="mb-3">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Country</label>
                <select
                  value={festivalCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full h-8 rounded-lg bg-muted/50 border border-border text-xs px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="auto">Auto-detect</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upcoming Festivals List */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Upcoming</p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {upcomingFestivals.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">No upcoming festivals found</p>
                  ) : (
                    upcomingFestivals.map((festival) => {
                      const isActive = themePresetId === festival.id;
                      return (
                        <button
                          key={festival.id}
                          onClick={() => handleFestivalSelect(festival)}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-150 text-left group ${
                            isActive
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          {/* 3-part mini swatch */}
                          <div
                            className="size-8 rounded-lg shrink-0 overflow-hidden"
                            style={{ backgroundColor: festival.bg }}
                          >
                            <div className="w-full h-full relative">
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(135deg, ${festival.bannerStart}50, ${festival.bannerEnd}30)`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                  className="size-3 rounded-full"
                                  style={{ backgroundColor: festival.icon }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium truncate">{festival.emoji} {festival.name}</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {festival.country} · {festival.description}
                            </p>
                          </div>
                          <ChevronRight className="size-3 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* All Festival Palettes — browse by country */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">All Palettes</p>
                <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                  {FESTIVAL_THEMES.map((festival) => {
                    const isActive = themePresetId === festival.id;
                    return (
                      <button
                        key={festival.id}
                        onClick={() => handleFestivalSelect(festival)}
                        className={`flex flex-col items-center gap-0.5 group`}
                        title={`${festival.name} (${festival.country})`}
                      >
                        <div
                          className={`size-8 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            isActive
                              ? 'border-primary scale-110'
                              : 'border-transparent group-hover:border-primary/30'
                          }`}
                          style={{ backgroundColor: festival.bg }}
                        >
                          <div className="w-full h-full relative">
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(135deg, ${festival.bannerStart}50, ${festival.bannerEnd}30)`,
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: festival.icon }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-[7px] leading-tight text-center truncate w-full text-muted-foreground">
                          {festival.emoji}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
