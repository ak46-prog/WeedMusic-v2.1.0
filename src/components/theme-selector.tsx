'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_THEMES, applyColorTheme, getColorTheme, type ColorTheme } from '@/lib/color-themes';
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
    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
    } catch { /* */ }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
        <Palette className="size-[18px]" />
      </Button>
    );
  }

  const activeTheme = themePresetId ? getColorTheme(themePresetId) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 transition-all duration-200"
          aria-label="Color theme"
          title={activeTheme ? `${activeTheme.name} theme` : 'Choose theme'}
        >
          <div
            className="size-[18px] rounded-full border-2 border-current transition-colors"
            style={{
              background: activeTheme
                ? `linear-gradient(135deg, ${activeTheme.icon}, ${activeTheme.bannerEnd})`
                : 'linear-gradient(135deg, #a293ff, #00f0ff)',
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-xs font-semibold mb-2 text-foreground">Color Theme</p>
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
      </PopoverContent>
    </Popover>
  );
}
