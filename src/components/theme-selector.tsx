'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Palette, Sun, Moon, Sunrise, Sunset, Zap, Timer, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  themePresets,
  getPresetsByCategory,
  getPresetById,
  applyThemePreset,
  resetThemePreset,
  categoryMeta,
  getTimeCategory,
  getAutoThemePreset,
  getTemporalThemeDescription,
  type ThemeCategory,
  type ThemePreset,
} from '@/lib/theme-presets';
import { useMusicStore } from '@/lib/store';

// Hydration-safe
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/* ------------------------------------------------------------------ */
/*  Auto Time-Based Theme Switching (imported from theme-presets.ts)   */
/* ------------------------------------------------------------------ */

const categoryIcons: Record<ThemeCategory, React.ReactNode> = {
  dark: <Moon className="size-3.5" />,
  warm: <Sunset className="size-3.5" />,
  cool: <Sun className="size-3.5" />,
  vibrant: <Zap className="size-3.5" />,
  light: <Sunrise className="size-3.5" />,
};

const categories: ThemeCategory[] = ['dark', 'warm', 'cool', 'vibrant', 'light'];

/* ------------------------------------------------------------------ */
/*  ThemeSelector Component                                            */
/* ------------------------------------------------------------------ */

export function ThemeSelector() {
  const mounted = useHasMounted();
  const themePresetId = useMusicStore((s) => s.themePresetId);
  const autoThemeEnabled = useMusicStore((s) => s.autoThemeEnabled);
  const setThemePresetId = useMusicStore((s) => s.setThemePresetId);
  const setAutoThemeEnabled = useMusicStore((s) => s.setAutoThemeEnabled);

  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('dark');
  const [open, setOpen] = useState(false);

  // Apply auto theme on mount and when autoThemeEnabled changes
  useEffect(() => {
    if (!mounted || !autoThemeEnabled) return;
    // Only apply if no preset is manually set
    if (!themePresetId) {
      const preset = getAutoThemePreset();
      applyThemePreset(preset);
      setThemePresetId(preset.id);
    }
  }, [mounted, autoThemeEnabled]);

  // Auto-switch theme based on time every 30 minutes
  useEffect(() => {
    if (!mounted || !autoThemeEnabled) return;
    const interval = setInterval(() => {
      if (autoThemeEnabled) {
        const preset = getAutoThemePreset();
        applyThemePreset(preset);
        setThemePresetId(preset.id);
      }
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [mounted, autoThemeEnabled]);

  const handleSelectPreset = useCallback((preset: ThemePreset) => {
    // Enable smooth transition
    document.documentElement.classList.add('theme-transitioning');

    // Apply theme
    applyThemePreset(preset);
    setThemePresetId(preset.id);

    // Save to localStorage
    try {
      localStorage.setItem('weedmusic-theme-preset', preset.id);
    } catch { /* */ }

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId]);

  const handleAutoToggle = useCallback(() => {
    const newValue = !autoThemeEnabled;
    setAutoThemeEnabled(newValue);
    try {
      localStorage.setItem('weedmusic-auto-theme', String(newValue));
    } catch { /* */ }
    if (newValue) {
      const preset = getAutoThemePreset();
      handleSelectPreset(preset);
    }
  }, [autoThemeEnabled, setAutoThemeEnabled, handleSelectPreset]);

  const handleReset = useCallback(() => {
    document.documentElement.classList.add('theme-transitioning');
    resetThemePreset();
    setThemePresetId(null);
    try {
      localStorage.removeItem('weedmusic-theme-preset');
    } catch { /* */ }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }, [setThemePresetId]);

  // Load saved preset on mount
  useEffect(() => {
    if (!mounted) return;
    try {
      const savedPreset = localStorage.getItem('weedmusic-theme-preset');
      const savedAutoTheme = localStorage.getItem('weedmusic-auto-theme');
      if (savedAutoTheme !== null) {
        setAutoThemeEnabled(savedAutoTheme === 'true');
      }
      if (savedPreset) {
        const preset = getPresetById(savedPreset);
        if (preset) {
          applyThemePreset(preset);
          setThemePresetId(preset.id);
        }
      }
    } catch { /* */ }
  }, [mounted]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
        <Palette className="size-[18px]" />
      </Button>
    );
  }

  const currentPresets = getPresetsByCategory(activeCategory);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label="Theme selector"
          title={`${themePresetId ? getPresetById(themePresetId)?.name || 'Custom' : 'Default'} theme`}
        >
          <Palette className="size-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">Themes</SheetTitle>
            <div className="flex items-center gap-2">
              {/* Auto theme toggle */}
              <Button
                variant={autoThemeEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleAutoToggle}
                className="h-7 text-xs gap-1.5 rounded-full"
              >
                <Timer className="size-3" />
                {autoThemeEnabled ? 'Auto ON' : 'Auto'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs rounded-full"
              >
                Reset
              </Button>
            </div>
          </div>
          {autoThemeEnabled && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-switches based on time: Morning (6-10), Focus (10-16), Evening (16-20), Night (20-6)
            </p>
          )}
        </SheetHeader>

        {/* Category Tabs */}
        <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide border-b">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`theme-category-tab flex items-center gap-1.5 ${
                activeCategory === cat ? 'active' : ''
              }`}
            >
              {categoryIcons[cat]}
              <span>{categoryMeta[cat].label}</span>
              <span className="text-[10px] opacity-60">({getPresetsByCategory(cat).length})</span>
            </button>
          ))}
        </div>

        {/* Theme Grid */}
        <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-3">
              {categoryMeta[activeCategory].description}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {currentPresets.map((preset) => {
                const isActive = themePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="flex flex-col items-center gap-1.5 group"
                    title={preset.description}
                  >
                    {/* Color swatch */}
                    <div
                      className={`theme-swatch ${isActive ? 'active' : ''}`}
                      style={{
                        background: `linear-gradient(135deg, ${preset.colors.primary} 0%, ${preset.colors.background} 50%, ${preset.colors.surface} 100%)`,
                      }}
                    >
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="size-5 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    {/* Name */}
                    <span
                      className={`text-[10px] leading-tight text-center truncate w-full ${
                        isActive ? 'font-semibold text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
