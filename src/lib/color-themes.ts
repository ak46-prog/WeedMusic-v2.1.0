/**
 * WeedMusic Color Themes — 3-Part Application System
 * 
 * Each theme applies consistently across 3 areas:
 *   Part 1: Icon color (accent for icons, badges, links)
 *   Part 2: Entire background (page bg, cards, surfaces)
 *   Part 3: Banner gradient (hero banner overlay colors)
 *
 * 8 curated multi-color combinations — best-in-class palette design.
 */

export interface ColorTheme {
  id: string;
  name: string;
  /** Part 1: Icon & accent color */
  icon: string;
  /** Part 1: Icon hover / lighter variant */
  iconHover: string;
  /** Part 2: Background color */
  bg: string;
  /** Part 2: Surface / card color */
  surface: string;
  /** Part 2: Surface hover */
  surfaceHover: string;
  /** Part 2: Border color */
  border: string;
  /** Part 2: Text color */
  text: string;
  /** Part 2: Muted text */
  mutedText: string;
  /** Part 3: Banner gradient start */
  bannerStart: string;
  /** Part 3: Banner gradient end */
  bannerEnd: string;
  /** Part 3: Banner overlay opacity */
  bannerOverlay: string;
  /** Emoji for quick identification */
  emoji: string;
  /** Whether this is a light or dark theme */
  mode: 'dark' | 'light';
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'neon-ember',
    name: 'Neon Ember',
    icon: '#FF2A5F',
    iconHover: '#FF7A9C',
    bg: '#0E0E12',
    surface: '#18181F',
    surfaceHover: '#24242E',
    border: '#2E2E38',
    text: '#FAFAFA',
    mutedText: '#A1A1AA',
    bannerStart: '#FF2A5F',
    bannerEnd: '#FF6B35',
    bannerOverlay: 'rgba(255,42,95,0.15)',
    emoji: '🔥',
    mode: 'dark',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    icon: '#00F0FF',
    iconHover: '#66F7FF',
    bg: '#080E14',
    surface: '#0E1820',
    surfaceHover: '#162430',
    border: '#1E3440',
    text: '#E8F4F8',
    mutedText: '#7AACBE',
    bannerStart: '#00F0FF',
    bannerEnd: '#a293ff',
    bannerOverlay: 'rgba(0,240,255,0.12)',
    emoji: '🌌',
    mode: 'dark',
  },
  {
    id: 'cannabis-gold',
    name: 'Cannabis Gold',
    icon: '#22C55E',
    iconHover: '#4ADE80',
    bg: '#0A0E08',
    surface: '#141E10',
    surfaceHover: '#1E2E18',
    border: '#2E4028',
    text: '#F0FFE8',
    mutedText: '#88B078',
    bannerStart: '#22C55E',
    bannerEnd: '#F59E0B',
    bannerOverlay: 'rgba(34,197,94,0.15)',
    emoji: '🌿',
    mode: 'dark',
  },
  {
    id: 'synthwave-purple',
    name: 'Synthwave Purple',
    icon: '#a293ff',
    iconHover: '#c4b5ff',
    bg: '#0B0A14',
    surface: '#141228',
    surfaceHover: '#1E1A38',
    border: '#2E2858',
    text: '#F0EDFF',
    mutedText: '#9B8EC4',
    bannerStart: '#a293ff',
    bannerEnd: '#FF2975',
    bannerOverlay: 'rgba(162,147,255,0.15)',
    emoji: '🔮',
    mode: 'dark',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    icon: '#F59E0B',
    iconHover: '#FBBF24',
    bg: '#12100A',
    surface: '#1E1A12',
    surfaceHover: '#2A2418',
    border: '#3E3628',
    text: '#FEF3C7',
    mutedText: '#B8A080',
    bannerStart: '#F59E0B',
    bannerEnd: '#EF4444',
    bannerOverlay: 'rgba(245,158,11,0.15)',
    emoji: '🌅',
    mode: 'dark',
  },
  {
    id: 'arctic-rose',
    name: 'Arctic Rose',
    icon: '#F472B6',
    iconHover: '#F9A8D4',
    bg: '#0C0814',
    surface: '#161024',
    surfaceHover: '#221838',
    border: '#342850',
    text: '#F8ECF4',
    mutedText: '#B898C0',
    bannerStart: '#F472B6',
    bannerEnd: '#818CF8',
    bannerOverlay: 'rgba(244,114,182,0.12)',
    emoji: '🌸',
    mode: 'dark',
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    icon: '#14B8A6',
    iconHover: '#2DD4BF',
    bg: '#060E0E',
    surface: '#0E1E1E',
    surfaceHover: '#162E2E',
    border: '#1E4444',
    text: '#E0F4F0',
    mutedText: '#6DADBE',
    bannerStart: '#14B8A6',
    bannerEnd: '#3B82F6',
    bannerOverlay: 'rgba(20,184,166,0.12)',
    emoji: '🌊',
    mode: 'dark',
  },
  {
    id: 'morning-dew',
    name: 'Morning Dew',
    icon: '#22C55E',
    iconHover: '#4ADE80',
    bg: '#F8FAF8',
    surface: '#FFFFFF',
    surfaceHover: '#F0FAF0',
    border: '#D8E8D8',
    text: '#1A2E24',
    mutedText: '#5E8A72',
    bannerStart: '#57CC99',
    bannerEnd: '#60A5FA',
    bannerOverlay: 'rgba(87,204,153,0.1)',
    emoji: '☀️',
    mode: 'light',
  },
];

/** Get a theme by ID */
export function getColorTheme(id: string): ColorTheme | undefined {
  return COLOR_THEMES.find(t => t.id === id);
}

/** Apply a color theme to the document root CSS vars */
export function applyColorTheme(theme: ColorTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Set dark/light class
  root.classList.toggle('dark', theme.mode === 'dark');

  // Part 1: Icon colors
  root.style.setProperty('--primary', theme.icon);
  root.style.setProperty('--secondary', theme.iconHover);
  root.style.setProperty('--ring', theme.icon);

  // Part 2: Background & surfaces
  root.style.setProperty('--background', theme.bg);
  root.style.setProperty('--card', theme.surface);
  root.style.setProperty('--accent', theme.surfaceHover);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--foreground', theme.text);
  root.style.setProperty('--muted-foreground', theme.mutedText);
  root.style.setProperty('--muted', theme.surfaceHover);
  root.style.setProperty('--popover', theme.surface);
  root.style.setProperty('--popover-foreground', theme.text);
  root.style.setProperty('--input', theme.border);
  root.style.setProperty('--primary-foreground', theme.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--secondary-foreground', theme.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--accent-foreground', theme.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--card-foreground', theme.text);
  root.style.setProperty('--destructive', theme.mode === 'dark' ? '#F87171' : '#EF4444');
  root.style.setProperty('--sidebar', theme.surface);
  root.style.setProperty('--sidebar-foreground', theme.text);
  root.style.setProperty('--sidebar-primary', theme.icon);
  root.style.setProperty('--sidebar-primary-foreground', theme.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--sidebar-accent', theme.surfaceHover);
  root.style.setProperty('--sidebar-accent-foreground', theme.text);
  root.style.setProperty('--sidebar-border', theme.border);
  root.style.setProperty('--sidebar-ring', theme.icon);

  // Part 3: Banner gradient CSS vars
  root.style.setProperty('--banner-gradient-start', theme.bannerStart);
  root.style.setProperty('--banner-gradient-end', theme.bannerEnd);
  root.style.setProperty('--banner-overlay', theme.bannerOverlay);
}
