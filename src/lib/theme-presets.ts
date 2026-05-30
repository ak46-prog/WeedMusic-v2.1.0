/**
 * WeedMusic Theme Presets — 50 Professional Color Schemes
 * 
 * Organized by mood/time-of-day categories:
 *   • 15 Dark themes    (nighttime / night mode)
 *   • 10 Warm themes    (evening / sunset)
 *   • 10 Cool themes    (daytime / focus)
 *   • 10 Vibrant themes (party / energy)
 *   •  5 Light themes   (morning / bright)
 *
 * Sources:
 *   - Visme "50 Gorgeous Color Schemes From Award-Winning Websites"
 *   - Colorhero "Dark Mode Color Palettes 2025"
 *   - Vev "6 Dark Mode Website Color Palette Ideas"
 *   - Octet Design Labs "33 Dark UI Design Color Palettes"
 *   - Coolors "Music Color Palettes"
 *   - Professional UI/UX research (Spotify, Apple Music, Tidal palettes)
 *
 * Each preset maps directly to CSS custom properties:
 *   --background, --card, --card-hover, --border,
 *   --foreground, --muted-foreground, --primary, --secondary
 */

export type ThemeCategory =
  | "dark"
  | "warm"
  | "cool"
  | "vibrant"
  | "light";

export interface ThemePreset {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  colors: {
    background: string;       // primary background
    surface: string;          // card / surface
    surfaceHover: string;     // card hover / active
    border: string;           // borders, dividers
    foreground: string;       // primary text
    mutedForeground: string;  // secondary / muted text
    primary: string;          // accent primary (CTA, links, brand)
    secondary: string;        // accent secondary (optional highlights)
  };
}

export const themePresets: ThemePreset[] = [

  /* ==========================================================================
     DARK THEMES (15) — Nighttime / Night Mode
     ========================================================================== */

  {
    id: "midnight-obsidian",
    name: "Midnight Obsidian",
    category: "dark",
    description: "Deep charcoal with neon green — the quintessential tech dark mode. Inspired by terminal & developer interfaces.",
    colors: {
      background: "#0E0E0E",
      surface: "#18181B",
      surfaceHover: "#27272A",
      border: "#2E2E32",
      foreground: "#FAFAFA",
      mutedForeground: "#A1A1AA",
      primary: "#22C55E",
      secondary: "#4ADE80",
    },
  },
  {
    id: "deep-navy-electric",
    name: "Deep Navy Electric",
    category: "dark",
    description: "Refined deep navy with electric blue — calm, trustworthy, professional. Ideal for SaaS & analytics dashboards.",
    colors: {
      background: "#0C1120",
      surface: "#111827",
      surfaceHover: "#1E293B",
      border: "#1E3A5F",
      foreground: "#F8FAFC",
      mutedForeground: "#8895A7",
      primary: "#3A82FF",
      secondary: "#60A5FA",
    },
  },
  {
    id: "void-black",
    name: "Void Black",
    category: "dark",
    description: "Pure black with stark white — ultimate minimalist dark mode. Editorial, luxury, photography portfolios.",
    colors: {
      background: "#000000",
      surface: "#0A0A0A",
      surfaceHover: "#1A1A1A",
      border: "#262626",
      foreground: "#FFFFFF",
      mutedForeground: "#A1A1AA",
      primary: "#FFFFFF",
      secondary: "#E5E7EB",
    },
  },
  {
    id: "warm-charcoal-gold",
    name: "Warm Charcoal Gold",
    category: "dark",
    description: "Warm charcoal with soft gold accents — luxurious, inviting, expensive feel. Premium services & luxury e-commerce.",
    colors: {
      background: "#1C1917",
      surface: "#292524",
      surfaceHover: "#3B3530",
      border: "#44403C",
      foreground: "#FAFAF9",
      mutedForeground: "#A8A29E",
      primary: "#D4A574",
      secondary: "#F59E0B",
    },
  },
  {
    id: "cosmic-artistry",
    name: "Cosmic Artistry",
    category: "dark",
    description: "Space-blue gradients with slate gray — inspired by Jeff Koons Moon Phases. True cosmic mood for creative portfolios.",
    colors: {
      background: "#0B0F1A",
      surface: "#131A2E",
      surfaceHover: "#1B2540",
      border: "#2A3A5C",
      foreground: "#E8ECF4",
      mutedForeground: "#7B8BA8",
      primary: "#8B9FD4",
      secondary: "#B4C6E7",
    },
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    category: "dark",
    description: "Almost-black with vivid neon green, electric blue & hot pink. High-energy futuristic aesthetic for gaming & creative tech.",
    colors: {
      background: "#0D0D0D",
      surface: "#171717",
      surfaceHover: "#262626",
      border: "#333333",
      foreground: "#FFFFFF",
      mutedForeground: "#A3A3A3",
      primary: "#00FF85",
      secondary: "#1E90FF",
    },
  },
  {
    id: "hackers-night",
    name: "Hacker's Night",
    category: "dark",
    description: "Dark teal-blue with burnt orange accent — inspired by late-night coding sessions. Mysterious yet focused.",
    colors: {
      background: "#0A181E",
      surface: "#122230",
      surfaceHover: "#1A3040",
      border: "#2A4050",
      foreground: "#E0E0E1",
      mutedForeground: "#A6A5A2",
      primary: "#D26E41",
      secondary: "#E89B6E",
    },
  },
  {
    id: "deep-vintage-mood",
    name: "Deep Vintage Mood",
    category: "dark",
    description: "Earthy terracotta with deep blue gradient — vintage warmth meeting futuristic metallic. Inspired by Prometheus.",
    colors: {
      background: "#14100E",
      surface: "#1E1A16",
      surfaceHover: "#2A2520",
      border: "#3D3630",
      foreground: "#F0EBE3",
      mutedForeground: "#9E958A",
      primary: "#C4654A",
      secondary: "#1B3A5C",
    },
  },
  {
    id: "mystic-noir-fire",
    name: "Mystic Noir Fire",
    category: "dark",
    description: "Near-black with deep crimson flame — inspired by underground music venues. Intense, passionate, dramatic.",
    colors: {
      background: "#060010",
      surface: "#0E001E",
      surfaceHover: "#1A0030",
      border: "#2E0050",
      foreground: "#F4F0FF",
      mutedForeground: "#8A7AA8",
      primary: "#BB0218",
      secondary: "#F92D44",
    },
  },
  {
    id: "soft-neon-dreams",
    name: "Soft Neon Dreams",
    category: "dark",
    description: "Deep indigo with soft purple neon highlights — dreamy, ethereal, music-streamer aesthetic.",
    colors: {
      background: "#000001",
      surface: "#0D0A1A",
      surfaceHover: "#1A1430",
      border: "#2D2244",
      foreground: "#F0EDFF",
      mutedForeground: "#9B8EC4",
      primary: "#7F30E4",
      secondary: "#AE70F1",
    },
  },
  {
    id: "dark-login-violet",
    name: "Dark Login Violet",
    category: "dark",
    description: "Deep plum-violet surfaces with amethyst accents — sophisticated dark mode for auth screens & premium apps.",
    colors: {
      background: "#261F32",
      surface: "#322A40",
      surfaceHover: "#41394F",
      border: "#594BA0",
      foreground: "#FBFAFB",
      mutedForeground: "#86819E",
      primary: "#8B5CF6",
      secondary: "#A78BFA",
    },
  },
  {
    id: "night-mode-earth",
    name: "Night Mode Earth",
    category: "dark",
    description: "Warm brown-black with burnt umber accents — organic, grounded, cozy dark mode. Inspired by nighttime nature.",
    colors: {
      background: "#0D0C0C",
      surface: "#1D1511",
      surfaceHover: "#2E221C",
      border: "#503628",
      foreground: "#F5EDE6",
      mutedForeground: "#9E8E7E",
      primary: "#C17D53",
      secondary: "#D4A07A",
    },
  },
  {
    id: "moody-tech-workspace",
    name: "Moody Tech Workspace",
    category: "dark",
    description: "Deep ocean-dark with teal-cyan accents — moody tech workspace feel. Dashboard & data visualization ideal.",
    colors: {
      background: "#030A0A",
      surface: "#0B3F43",
      surfaceHover: "#125858",
      border: "#1A7070",
      foreground: "#CEDADB",
      mutedForeground: "#6DADBE",
      primary: "#12768A",
      secondary: "#2CB5C8",
    },
  },
  {
    id: "stock-market-dark",
    name: "Stock Market Dark",
    category: "dark",
    description: "Near-black navy with muted rose & blue accents — financial & trading interface inspired. Data-dense, focused.",
    colors: {
      background: "#061313",
      surface: "#0E2236",
      surfaceHover: "#153050",
      border: "#1E4060",
      foreground: "#E8EEF4",
      mutedForeground: "#7B8FA5",
      primary: "#9E6976",
      secondary: "#0F53BC",
    },
  },
  {
    id: "glowing-buttons",
    name: "Glowing Buttons",
    category: "dark",
    description: "Deep midnight-purple with vivid violet accents — glowing, interactive, attention-grabbing UI elements.",
    colors: {
      background: "#101220",
      surface: "#1A1A30",
      surfaceHover: "#231D40",
      border: "#3D296A",
      foreground: "#EDE8FF",
      mutedForeground: "#9B8FD4",
      primary: "#8459BB",
      secondary: "#B485D9",
    },
  },

  /* ==========================================================================
     WARM THEMES (10) — Evening / Sunset
     ========================================================================== */

  {
    id: "sunset-ember",
    name: "Sunset Ember",
    category: "warm",
    description: "Dark warm black with coral & golden accents — inspired by evening sunsets. Cozy, inviting, intimate.",
    colors: {
      background: "#1C1C1C",
      surface: "#2A2520",
      surfaceHover: "#3A332A",
      border: "#4D4235",
      foreground: "#F5E8D8",
      mutedForeground: "#B8A08A",
      primary: "#FF6F61",
      secondary: "#DAA520",
    },
  },
  {
    id: "terracotta-dusk",
    name: "Terracotta Dusk",
    category: "warm",
    description: "Warm sandy earth tones with terracotta highlights — grounded, stable, Mediterranean warmth.",
    colors: {
      background: "#1A1512",
      surface: "#2D241C",
      surfaceHover: "#3F3428",
      border: "#5A4A3A",
      foreground: "#F0E6D8",
      mutedForeground: "#A89480",
      primary: "#C4654A",
      secondary: "#E8976B",
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    category: "warm",
    description: "Soft dark with warm amber & gold — the magical hour before sunset. Luxurious, warm, optimistic.",
    colors: {
      background: "#1C1917",
      surface: "#292524",
      surfaceHover: "#3B3530",
      border: "#57534E",
      foreground: "#FEF3C7",
      mutedForeground: "#D4A574",
      primary: "#F59E0B",
      secondary: "#FBBF24",
    },
  },
  {
    id: "rosewood-evening",
    name: "Rosewood Evening",
    category: "warm",
    description: "Deep rosewood with blush pink accents — elegant, romantic evening mood. Fashion & lifestyle brands.",
    colors: {
      background: "#1A1015",
      surface: "#2A1C24",
      surfaceHover: "#3D2A34",
      border: "#5A3E4C",
      foreground: "#F8E8EE",
      mutedForeground: "#C49AAE",
      primary: "#E8758A",
      secondary: "#F0A0B0",
    },
  },
  {
    id: "cinnamon-latte",
    name: "Cinnamon Latte",
    category: "warm",
    description: "Coffee brown with cinnamon spice accents — comforting, familiar, your favorite coffee shop vibe.",
    colors: {
      background: "#1C1610",
      surface: "#2E2418",
      surfaceHover: "#40321E",
      border: "#5E4A30",
      foreground: "#F5E6D0",
      mutedForeground: "#B8A080",
      primary: "#C87840",
      secondary: "#E09860",
    },
  },
  {
    id: "autumn-harvest",
    name: "Autumn Harvest",
    category: "warm",
    description: "Deep earth tones with burnt orange — harvest season warmth, nostalgia, organic richness.",
    colors: {
      background: "#1A1510",
      surface: "#28201A",
      surfaceHover: "#3A2E24",
      border: "#50402E",
      foreground: "#F5ECDA",
      mutedForeground: "#A89A80",
      primary: "#FF4500",
      secondary: "#E87040",
    },
  },
  {
    id: "spiced-rum",
    name: "Spiced Rum",
    category: "warm",
    description: "Dark amber with rum-gold highlights — rich, indulgent, sophisticated warmth. Bar & lounge aesthetic.",
    colors: {
      background: "#181210",
      surface: "#281E16",
      surfaceHover: "#3A2C1E",
      border: "#554028",
      foreground: "#F5E0C8",
      mutedForeground: "#B89870",
      primary: "#D4883C",
      secondary: "#E8A858",
    },
  },
  {
    id: "mahogany-study",
    name: "Mahogany Study",
    category: "warm",
    description: "Deep mahogany brown with burgundy accents — scholarly, traditional, refined. Library & study room aesthetic.",
    colors: {
      background: "#161210",
      surface: "#241C18",
      surfaceHover: "#342820",
      border: "#4A3828",
      foreground: "#EDE0D0",
      mutedForeground: "#A09080",
      primary: "#8B3A3A",
      secondary: "#B05050",
    },
  },
  {
    id: "desert-night",
    name: "Desert Night",
    category: "warm",
    description: "Dark sand with copper accents — desert after dark, warm and mysterious. Adventure & exploration vibe.",
    colors: {
      background: "#1A1714",
      surface: "#282420",
      surfaceHover: "#3A342C",
      border: "#504840",
      foreground: "#F0E8DC",
      mutedForeground: "#A89880",
      primary: "#B87333",
      secondary: "#D49050",
    },
  },
  {
    id: "cherry-blossom-night",
    name: "Cherry Blossom Night",
    category: "warm",
    description: "Dark charcoal with soft cherry pink — Japanese spring evening, delicate warmth meets night.",
    colors: {
      background: "#1A1518",
      surface: "#282024",
      surfaceHover: "#382C32",
      border: "#504048",
      foreground: "#F8ECF0",
      mutedForeground: "#C0A0AC",
      primary: "#E87898",
      secondary: "#F0A0B8",
    },
  },

  /* ==========================================================================
     COOL THEMES (10) — Daytime / Focus
     ========================================================================== */

  {
    id: "arctic-frost",
    name: "Arctic Frost",
    category: "cool",
    description: "Near-white background with icy blue accents — crisp, clean, focused. Maximum readability & calm productivity.",
    colors: {
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surfaceHover: "#F1F5F9",
      border: "#E2E8F0",
      foreground: "#0F172A",
      mutedForeground: "#64748B",
      primary: "#3B82F6",
      secondary: "#60A5FA",
    },
  },
  {
    id: "ocean-depth",
    name: "Ocean Depth",
    category: "cool",
    description: "Deep navy surfaces with aquamarine accents — ocean-inspired, stable, trustworthy. Enterprise & finance.",
    colors: {
      background: "#0F172A",
      surface: "#1E293B",
      surfaceHover: "#334155",
      border: "#475569",
      foreground: "#F1F5F9",
      mutedForeground: "#94A3B8",
      primary: "#06B6D4",
      secondary: "#22D3EE",
    },
  },
  {
    id: "nordic-fjord",
    name: "Nordic Fjord",
    category: "cool",
    description: "Soft blue-gray with teal accents — Scandinavian calm, understated elegance. Productivity & wellness apps.",
    colors: {
      background: "#F0F4F8",
      surface: "#FFFFFF",
      surfaceHover: "#E8EEF4",
      border: "#CBD5E1",
      foreground: "#1E293B",
      mutedForeground: "#64748B",
      primary: "#0D9488",
      secondary: "#14B8A6",
    },
  },
  {
    id: "blueberry-mist",
    name: "Blueberry Mist",
    category: "cool",
    description: "Cool blue-purple with berry accents — refreshing yet peaceful. Creative focus & design tools.",
    colors: {
      background: "#0F0B1E",
      surface: "#1A1530",
      surfaceHover: "#261F42",
      border: "#3A3058",
      foreground: "#EDE8FF",
      mutedForeground: "#9B8FC8",
      primary: "#6366F1",
      secondary: "#818CF8",
    },
  },
  {
    id: "glacier-stream",
    name: "Glacier Stream",
    category: "cool",
    description: "Cool whites with teal-blue running through — fresh, flowing, clarity. Data visualization & analytics.",
    colors: {
      background: "#F0FDFA",
      surface: "#FFFFFF",
      surfaceHover: "#E6FAF5",
      border: "#B2DFDB",
      foreground: "#0D3B36",
      mutedForeground: "#5E8A84",
      primary: "#009688",
      secondary: "#26A69A",
    },
  },
  {
    id: "steel-horizon",
    name: "Steel Horizon",
    category: "cool",
    description: "Steel gray with slate-blue accents — corporate, professional, no-nonsense. Enterprise dashboards.",
    colors: {
      background: "#1E2428",
      surface: "#283038",
      surfaceHover: "#354048",
      border: "#4A5568",
      foreground: "#E8ECF0",
      mutedForeground: "#8898A8",
      primary: "#5C8EB0",
      secondary: "#78A8C8",
    },
  },
  {
    id: "cool-mint",
    name: "Cool Mint",
    category: "cool",
    description: "Fresh mint green with cool gray — clean, refreshing, modern. Health & wellness, productivity.",
    colors: {
      background: "#F0FDF4",
      surface: "#FFFFFF",
      surfaceHover: "#E8F8EC",
      border: "#BBF7D0",
      foreground: "#14532D",
      mutedForeground: "#4D7C5E",
      primary: "#22C55E",
      secondary: "#4ADE80",
    },
  },
  {
    id: "slate-calm",
    name: "Slate Calm",
    category: "cool",
    description: "Balanced slate with cool lavender — neutral, composed, focused. Meditation & mindfulness apps.",
    colors: {
      background: "#1A1A2E",
      surface: "#242440",
      surfaceHover: "#303050",
      border: "#404068",
      foreground: "#E8E8F0",
      mutedForeground: "#9090B0",
      primary: "#7C7CC8",
      secondary: "#9898D8",
    },
  },
  {
    id: "rainy-portland",
    name: "Rainy Portland",
    category: "cool",
    description: "Muted blue-gray with forest green — overcast Pacific Northwest. Contemplative, grounded, focused.",
    colors: {
      background: "#1C2428",
      surface: "#283238",
      surfaceHover: "#344048",
      border: "#4A5860",
      foreground: "#E0E8EC",
      mutedForeground: "#8898A0",
      primary: "#3E8E5E",
      secondary: "#5AB078",
    },
  },
  {
    id: "polar-breeze",
    name: "Polar Breeze",
    category: "cool",
    description: "Light cool gray with cyan accents — airy, breathable, clarity of thought. Clean minimal interfaces.",
    colors: {
      background: "#F1F5F9",
      surface: "#FFFFFF",
      surfaceHover: "#E8F0F8",
      border: "#D0DCE8",
      foreground: "#1E293B",
      mutedForeground: "#64748B",
      primary: "#0891B2",
      secondary: "#22D3EE",
    },
  },

  /* ==========================================================================
     VIBRANT / NEON THEMES (10) — Party / Energy Mode
     ========================================================================== */

  {
    id: "electric-sunset",
    name: "Electric Sunset",
    category: "vibrant",
    description: "Vivid orange & magenta over dark — sunset energy meets neon nightlife. Party mode, DJ sets, high-energy streaming.",
    colors: {
      background: "#0F0A14",
      surface: "#1A1020",
      surfaceHover: "#2A1830",
      border: "#3A2448",
      foreground: "#FFF0F5",
      mutedForeground: "#C888A8",
      primary: "#FF0096",
      secondary: "#FF6B35",
    },
  },
  {
    id: "bubblegum-rocket",
    name: "Bubblegum Rocket",
    category: "vibrant",
    description: "Hot pink, cyan & electric yellow — playful, explosive, unapologetic fun. Youth-oriented & creative.",
    colors: {
      background: "#0A0A14",
      surface: "#14142A",
      surfaceHover: "#20203E",
      border: "#30305A",
      foreground: "#FEFFFA",
      mutedForeground: "#B0B0D8",
      primary: "#F51476",
      secondary: "#1FD6FF",
    },
  },
  {
    id: "tropical-rush",
    name: "Tropical Rush",
    category: "vibrant",
    description: "Vibrant orange, hot pink & deep blue — tropical energy explosion. Summer playlists & beach party vibes.",
    colors: {
      background: "#0A0E18",
      surface: "#141A28",
      surfaceHover: "#1E2638",
      border: "#2E3A50",
      foreground: "#FFF8F0",
      mutedForeground: "#A8A0B8",
      primary: "#FE592C",
      secondary: "#F7647E",
    },
  },
  {
    id: "neon-jungle",
    name: "Neon Jungle",
    category: "vibrant",
    description: "Bright lime green on deep jungle dark — nature amplified with electricity. EDM & festival aesthetics.",
    colors: {
      background: "#0A0F08",
      surface: "#141E10",
      surfaceHover: "#1E2E18",
      border: "#2E4028",
      foreground: "#F0FFE8",
      mutedForeground: "#88B078",
      primary: "#80ED99",
      secondary: "#C7F9CC",
    },
  },
  {
    id: "synthwave-retro",
    name: "Synthwave Retro",
    category: "vibrant",
    description: "Retro purple & hot pink on deep dark — 80s synthwave, retrowave aesthetic. Vaporwave & nostalgia.",
    colors: {
      background: "#0D0221",
      surface: "#160835",
      surfaceHover: "#220E4A",
      border: "#3A1868",
      foreground: "#F0E0FF",
      mutedForeground: "#A080D0",
      primary: "#FF2975",
      secondary: "#F222FF",
    },
  },
  {
    id: "unicorn-disco",
    name: "Unicorn Disco",
    category: "vibrant",
    description: "Purple, pink & lavender sparkle on deep violet — disco ball energy. Party playlists & celebration mode.",
    colors: {
      background: "#110A1E",
      surface: "#1A1030",
      surfaceHover: "#261842",
      border: "#38245A",
      foreground: "#FBF8FE",
      mutedForeground: "#B0A0D0",
      primary: "#8126FF",
      secondary: "#EA6779",
    },
  },
  {
    id: "citrus-sunrise",
    name: "Citrus Sunrise",
    category: "vibrant",
    description: "Vivid orange & yellow on dark warm — citrus explosion, fresh morning energy. Upbeat playlists & workout mode.",
    colors: {
      background: "#140010",
      surface: "#20081A",
      surfaceHover: "#301024",
      border: "#481830",
      foreground: "#FFFEF0",
      mutedForeground: "#D0A088",
      primary: "#EF9206",
      secondary: "#F57617",
    },
  },
  {
    id: "laser-show",
    name: "Laser Show",
    category: "vibrant",
    description: "Electric cyan & magenta on pure black — laser-cut precision energy. Live concert & performance mode.",
    colors: {
      background: "#050508",
      surface: "#0E0E14",
      surfaceHover: "#1A1A24",
      border: "#2A2A38",
      foreground: "#F0F0FF",
      mutedForeground: "#8888B0",
      primary: "#00FFFF",
      secondary: "#FF00FF",
    },
  },
  {
    id: "fire-walk",
    name: "Fire Walk",
    category: "vibrant",
    description: "Intense red & amber on deep black — flames of passion, high-intensity. Workout & adrenaline mode.",
    colors: {
      background: "#0A0505",
      surface: "#160A0A",
      surfaceHover: "#241010",
      border: "#3A1818",
      foreground: "#FFF0F0",
      mutedForeground: "#C08888",
      primary: "#EF4444",
      secondary: "#F59E0B",
    },
  },
  {
    id: "acid-pop",
    name: "Acid Pop",
    category: "vibrant",
    description: "Acid yellow-green & bubblegum pink on dark — maximalist pop art energy. Creative expression & fun-first design.",
    colors: {
      background: "#0A0A08",
      surface: "#161612",
      surfaceHover: "#24241C",
      border: "#383828",
      foreground: "#FFFFF0",
      mutedForeground: "#B0B088",
      primary: "#CAFF04",
      secondary: "#FF69B4",
    },
  },

  /* ==========================================================================
     LIGHT / PASTEL THEMES (5) — Morning / Bright Mode
     ========================================================================== */

  {
    id: "morning-dew",
    name: "Morning Dew",
    category: "light",
    description: "Soft white with gentle mint & rose — fresh morning light, new beginnings. Clean, bright, optimistic.",
    colors: {
      background: "#FAFFFE",
      surface: "#FFFFFF",
      surfaceHover: "#F0FAF5",
      border: "#D8EDE0",
      foreground: "#1A2E24",
      mutedForeground: "#5E8A72",
      primary: "#57CC99",
      secondary: "#80ED99",
    },
  },
  {
    id: "rose-petal",
    name: "Rose Petal",
    category: "light",
    description: "Creamy white with soft pink & mauve — delicate, feminine, elegant. Beauty & lifestyle brands.",
    colors: {
      background: "#FDF6F8",
      surface: "#FFFFFF",
      surfaceHover: "#FBF0F3",
      border: "#E8C8D0",
      foreground: "#3A1A24",
      mutedForeground: "#8A5A68",
      primary: "#D282A6",
      secondary: "#E8B4BC",
    },
  },
  {
    id: "dreamy-lavender",
    name: "Dreamy Lavender",
    category: "light",
    description: "Soft lavender with muted purple accents — calm, dreamy, creative. Wellness & meditation apps.",
    colors: {
      background: "#F8F6FF",
      surface: "#FFFFFF",
      surfaceHover: "#F0ECFF",
      border: "#D8D0F0",
      foreground: "#1E1830",
      mutedForeground: "#6A5E8A",
      primary: "#72727E",
      secondary: "#9893DA",
    },
  },
  {
    id: "warm-cotton",
    name: "Warm Cotton",
    category: "light",
    description: "Warm off-white with peach & honey accents — soft, comforting, lived-in. Home & lifestyle, cozy morning.",
    colors: {
      background: "#FFF8F0",
      surface: "#FFFFFF",
      surfaceHover: "#FFF0E0",
      border: "#E8D8C8",
      foreground: "#2A2018",
      mutedForeground: "#8A7A68",
      primary: "#E8976B",
      secondary: "#F5C28A",
    },
  },
  {
    id: "cloud-nine",
    name: "Cloud Nine",
    category: "light",
    description: "Pure cloud-white with sky-blue accents — limitless, airy, uplifting. Maximum brightness & minimal cognitive load.",
    colors: {
      background: "#F8FAFF",
      surface: "#FFFFFF",
      surfaceHover: "#EEF4FF",
      border: "#D0DEFF",
      foreground: "#0F1A30",
      mutedForeground: "#5A6E8A",
      primary: "#4285F4",
      secondary: "#70B3FF",
    },
  },
];

/* ---- Helpers ---- */

/** Get all presets for a given category */
export function getPresetsByCategory(category: ThemeCategory): ThemePreset[] {
  return themePresets.filter((p) => p.category === category);
}

/** Get a preset by its id */
export function getPresetById(id: string): ThemePreset | undefined {
  return themePresets.find((p) => p.id === id);
}

/** Convert a ThemePreset into CSS custom-property declarations (for :root or .theme-xxx) */
export function presetToCSSVars(preset: ThemePreset): Record<string, string> {
  const isLight = isLightBackground(preset.colors.background);
  return {
    "--background": preset.colors.background,
    "--card": preset.colors.surface,
    "--accent": preset.colors.surfaceHover,
    "--border": preset.colors.border,
    "--foreground": preset.colors.foreground,
    "--muted-foreground": preset.colors.mutedForeground,
    "--primary": preset.colors.primary,
    "--secondary": preset.colors.secondary,
    "--primary-foreground": isLight ? "#0F172A" : "#FFFFFF",
    "--card-foreground": preset.colors.foreground,
    "--muted": preset.colors.surfaceHover,
    "--popover": preset.colors.surface,
    "--popover-foreground": preset.colors.foreground,
    "--input": preset.colors.border,
    "--ring": preset.colors.primary,
    "--accent-foreground": isLight ? "#0F172A" : "#FFFFFF",
    "--secondary-foreground": isLight ? "#0F172A" : "#FFFFFF",
    "--destructive": isLight ? "#EF4444" : "#F87171",
    "--sidebar": preset.colors.surface,
    "--sidebar-foreground": preset.colors.foreground,
    "--sidebar-primary": preset.colors.primary,
    "--sidebar-primary-foreground": isLight ? "#0F172A" : "#FFFFFF",
    "--sidebar-accent": preset.colors.surfaceHover,
    "--sidebar-accent-foreground": preset.colors.foreground,
    "--sidebar-border": preset.colors.border,
    "--sidebar-ring": preset.colors.primary,
  };
}

/** Apply a theme preset to the document root */
export function applyThemePreset(preset: ThemePreset): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = presetToCSSVars(preset);

  // Set dark/light class
  root.classList.toggle("dark", !isLightBackground(preset.colors.background));

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/** Remove all theme custom properties, reverting to defaults */
export function resetThemePreset(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = presetToCSSVars(themePresets[0]); // just to get keys
  for (const key of Object.keys(vars)) {
    root.style.removeProperty(key);
  }
}

/** Rough heuristic: is this background color "light"? */
function isLightBackground(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/** Category metadata for UI display */
export const categoryMeta: Record<ThemeCategory, { label: string; icon: string; description: string }> = {
  dark: {
    label: "Night",
    icon: "🌙",
    description: "Dark themes for nighttime & low-light environments",
  },
  warm: {
    label: "Evening",
    icon: "🌅",
    description: "Warm sunset tones for cozy evening vibes",
  },
  cool: {
    label: "Focus",
    icon: "❄️",
    description: "Cool tones for daytime concentration & clarity",
  },
  vibrant: {
    label: "Energy",
    icon: "⚡",
    description: "Vibrant neon palettes for party & workout mode",
  },
  light: {
    label: "Morning",
    icon: "☀️",
    description: "Bright, light themes for daytime & well-lit spaces",
  },
};

/** Get the theme category based on current time of day */
export function getTimeCategory(): ThemeCategory {
  if (typeof window === "undefined") return "dark";
  const hour = new Date().getHours();
  // 6-10: Morning (light), 10-16: Focus (cool), 16-20: Evening (warm), 20-6: Night (dark)
  if (hour >= 6 && hour < 10) return "light";
  if (hour >= 10 && hour < 16) return "cool";
  if (hour >= 16 && hour < 20) return "warm";
  return "dark";
}

/** Get a recommended theme preset based on current time of day */
export function getAutoThemePreset(): ThemePreset {
  const category = getTimeCategory();
  const presets = getPresetsByCategory(category);
  // Pick the first preset from the appropriate category (stable choice)
  return presets[0];
}
