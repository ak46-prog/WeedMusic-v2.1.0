/**
 * WeedMusic Festival Color Themes — Country-Based Auto-Switching
 *
 * Automatically detects the user's country (via timezone) and applies
 * color palettes matching local festivals. Each festival has a 3-part
 * color system: icon, background, banner.
 *
 * Festival colors are applied for ~3 days around each festival date
 * (1 day before, day of, 1 day after).
 */

export interface FestivalTheme {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  /** Month (1-12) and day of festival */
  month: number;
  day: number;
  /** How many days before/after to activate (default 1) */
  windowDays: number;
  /** Part 1: Icon & accent color */
  icon: string;
  iconHover: string;
  /** Part 2: Background & surfaces */
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  mutedText: string;
  /** Part 3: Banner gradient */
  bannerStart: string;
  bannerEnd: string;
  bannerOverlay: string;
  /** Emoji for display */
  emoji: string;
  /** Short description */
  description: string;
  mode: 'dark' | 'light';
}

/**
 * Festival calendar — 30+ festivals across 15+ countries
 * Each with carefully curated 3-part color palettes
 */
export const FESTIVAL_THEMES: FestivalTheme[] = [
  // ==========================================================================
  // INDIA
  // ==========================================================================
  {
    id: 'diwali',
    name: 'Diwali',
    country: 'India',
    countryCode: 'IN',
    month: 10,
    day: 20,
    windowDays: 3,
    icon: '#FFD700',
    iconHover: '#FFE44D',
    bg: '#1A0E00',
    surface: '#2A1A08',
    surfaceHover: '#3A2810',
    border: '#5A4020',
    text: '#FFF8E1',
    mutedText: '#C8A060',
    bannerStart: '#FFD700',
    bannerEnd: '#FF6B00',
    bannerOverlay: 'rgba(255,215,0,0.15)',
    emoji: '🪔',
    description: 'Festival of Lights — golden lamps, warm glow',
    mode: 'dark',
  },
  {
    id: 'holi',
    name: 'Holi',
    country: 'India',
    countryCode: 'IN',
    month: 3,
    day: 14,
    windowDays: 2,
    icon: '#FF1493',
    iconHover: '#FF69B4',
    bg: '#0E0A14',
    surface: '#1A1028',
    surfaceHover: '#2A1838',
    border: '#3A2858',
    text: '#FFF0F5',
    mutedText: '#C898B8',
    bannerStart: '#FF1493',
    bannerEnd: '#00CED1',
    bannerOverlay: 'rgba(255,20,147,0.12)',
    emoji: '🎨',
    description: 'Festival of Colors — vibrant pinks, blues, greens',
    mode: 'dark',
  },
  {
    id: 'navratri',
    name: 'Navratri',
    country: 'India',
    countryCode: 'IN',
    month: 10,
    day: 3,
    windowDays: 5,
    icon: '#E53935',
    iconHover: '#EF5350',
    bg: '#140A08',
    surface: '#221410',
    surfaceHover: '#321E18',
    border: '#4A3028',
    text: '#FFF3E0',
    mutedText: '#C09080',
    bannerStart: '#E53935',
    bannerEnd: '#FFB300',
    bannerOverlay: 'rgba(229,57,53,0.15)',
    emoji: '🪘',
    description: 'Nine Nights — red, gold, divine energy',
    mode: 'dark',
  },
  {
    id: 'eid-india',
    name: 'Eid',
    country: 'India',
    countryCode: 'IN',
    month: 3,
    day: 30,
    windowDays: 2,
    icon: '#2E7D32',
    iconHover: '#43A047',
    bg: '#080E08',
    surface: '#101E10',
    surfaceHover: '#182E18',
    border: '#284028',
    text: '#F0FFF0',
    mutedText: '#80B880',
    bannerStart: '#2E7D32',
    bannerEnd: '#FFD700',
    bannerOverlay: 'rgba(46,125,50,0.12)',
    emoji: '🌙',
    description: 'Eid Mubarak — green, gold, moonlight',
    mode: 'dark',
  },
  {
    id: 'pongal',
    name: 'Pongal',
    country: 'India',
    countryCode: 'IN',
    month: 1,
    day: 14,
    windowDays: 2,
    icon: '#FF8F00',
    iconHover: '#FFA726',
    bg: '#141008',
    surface: '#201A10',
    surfaceHover: '#302818',
    border: '#483828',
    text: '#FFF8E1',
    mutedText: '#B8A070',
    bannerStart: '#FF8F00',
    bannerEnd: '#4CAF50',
    bannerOverlay: 'rgba(255,143,0,0.12)',
    emoji: '🌾',
    description: 'Harvest Festival — golden sun, green fields',
    mode: 'dark',
  },
  {
    id: 'onam',
    name: 'Onam',
    country: 'India',
    countryCode: 'IN',
    month: 8,
    day: 28,
    windowDays: 2,
    icon: '#FFB300',
    iconHover: '#FFCA28',
    bg: '#0E0A04',
    surface: '#1A1408',
    surfaceHover: '#282010',
    border: '#403020',
    text: '#FFFDE7',
    mutedText: '#B8A870',
    bannerStart: '#FFB300',
    bannerEnd: '#E53935',
    bannerOverlay: 'rgba(255,179,0,0.12)',
    emoji: '🌺',
    description: 'Kerala Harvest — gold, red, floral rangoli',
    mode: 'dark',
  },

  // ==========================================================================
  // USA
  // ==========================================================================
  {
    id: 'christmas-us',
    name: 'Christmas',
    country: 'USA',
    countryCode: 'US',
    month: 12,
    day: 25,
    windowDays: 3,
    icon: '#C62828',
    iconHover: '#E53935',
    bg: '#0A0E0A',
    surface: '#141E14',
    surfaceHover: '#1E2E1E',
    border: '#2E4030',
    text: '#F0FFF0',
    mutedText: '#80A880',
    bannerStart: '#C62828',
    bannerEnd: '#2E7D32',
    bannerOverlay: 'rgba(198,40,40,0.15)',
    emoji: '🎄',
    description: 'Merry Christmas — red, green, snow glow',
    mode: 'dark',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    country: 'USA',
    countryCode: 'US',
    month: 10,
    day: 31,
    windowDays: 2,
    icon: '#FF6D00',
    iconHover: '#FF9100',
    bg: '#0E080A',
    surface: '#1A1018',
    surfaceHover: '#2A1828',
    border: '#3A2848',
    text: '#FFF3E0',
    mutedText: '#B890A0',
    bannerStart: '#FF6D00',
    bannerEnd: '#7B1FA2',
    bannerOverlay: 'rgba(255,109,0,0.15)',
    emoji: '🎃',
    description: 'Trick or Treat — orange, purple, spooky',
    mode: 'dark',
  },
  {
    id: 'independence-us',
    name: 'Independence Day',
    country: 'USA',
    countryCode: 'US',
    month: 7,
    day: 4,
    windowDays: 1,
    icon: '#B71C1C',
    iconHover: '#D32F2F',
    bg: '#080A14',
    surface: '#101428',
    surfaceHover: '#182038',
    border: '#283050',
    text: '#F0F4FF',
    mutedText: '#8898C0',
    bannerStart: '#B71C1C',
    bannerEnd: '#1565C0',
    bannerOverlay: 'rgba(183,28,28,0.15)',
    emoji: '🎆',
    description: '4th of July — red, white, blue fireworks',
    mode: 'dark',
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    country: 'USA',
    countryCode: 'US',
    month: 11,
    day: 27,
    windowDays: 2,
    icon: '#BF360C',
    iconHover: '#E64A19',
    bg: '#120E08',
    surface: '#201A10',
    surfaceHover: '#302818',
    border: '#483828',
    text: '#FFF8E1',
    mutedText: '#B8A070',
    bannerStart: '#BF360C',
    bannerEnd: '#F9A825',
    bannerOverlay: 'rgba(191,54,12,0.12)',
    emoji: '🦃',
    description: 'Thanksgiving — burnt orange, harvest gold',
    mode: 'dark',
  },
  {
    id: 'valentines-us',
    name: "Valentine's Day",
    country: 'USA',
    countryCode: 'US',
    month: 2,
    day: 14,
    windowDays: 1,
    icon: '#E91E63',
    iconHover: '#F06292',
    bg: '#140810',
    surface: '#221420',
    surfaceHover: '#321C30',
    border: '#4A2850',
    text: '#FFF0F5',
    mutedText: '#C890A8',
    bannerStart: '#E91E63',
    bannerEnd: '#F48FB1',
    bannerOverlay: 'rgba(233,30,99,0.12)',
    emoji: '💝',
    description: 'Love & Romance — pink, rose, hearts',
    mode: 'dark',
  },
  {
    id: 'st-patricks',
    name: "St. Patrick's Day",
    country: 'USA',
    countryCode: 'US',
    month: 3,
    day: 17,
    windowDays: 1,
    icon: '#2E7D32',
    iconHover: '#43A047',
    bg: '#060E06',
    surface: '#0E1E0E',
    surfaceHover: '#162E16',
    border: '#204020',
    text: '#E8F5E9',
    mutedText: '#78A878',
    bannerStart: '#2E7D32',
    bannerEnd: '#FFD600',
    bannerOverlay: 'rgba(46,125,50,0.12)',
    emoji: '☘️',
    description: 'Luck of the Irish — emerald green, gold',
    mode: 'dark',
  },

  // ==========================================================================
  // CHINA
  // ==========================================================================
  {
    id: 'chinese-new-year',
    name: 'Chinese New Year',
    country: 'China',
    countryCode: 'CN',
    month: 1,
    day: 29,
    windowDays: 5,
    icon: '#D32F2F',
    iconHover: '#F44336',
    bg: '#140808',
    surface: '#221010',
    surfaceHover: '#321818',
    border: '#4A2828',
    text: '#FFF5F5',
    mutedText: '#C09090',
    bannerStart: '#D32F2F',
    bannerEnd: '#FFD700',
    bannerOverlay: 'rgba(211,47,47,0.15)',
    emoji: '🧧',
    description: 'Spring Festival — red, gold, lanterns',
    mode: 'dark',
  },
  {
    id: 'mid-autumn',
    name: 'Mid-Autumn Festival',
    country: 'China',
    countryCode: 'CN',
    month: 9,
    day: 17,
    windowDays: 2,
    icon: '#8E24AA',
    iconHover: '#AB47BC',
    bg: '#0E0814',
    surface: '#1A1028',
    surfaceHover: '#281838',
    border: '#382850',
    text: '#F5F0FF',
    mutedText: '#A890C0',
    bannerStart: '#8E24AA',
    bannerEnd: '#FFD54F',
    bannerOverlay: 'rgba(142,36,170,0.12)',
    emoji: '🌕',
    description: 'Moon Festival — purple night, golden moon',
    mode: 'dark',
  },
  {
    id: 'dragon-boat',
    name: 'Dragon Boat Festival',
    country: 'China',
    countryCode: 'CN',
    month: 6,
    day: 10,
    windowDays: 1,
    icon: '#00838F',
    iconHover: '#00ACC1',
    bg: '#060E10',
    surface: '#0E1E22',
    surfaceHover: '#162E34',
    border: '#204050',
    text: '#E0F7FA',
    mutedText: '#78A8B8',
    bannerStart: '#00838F',
    bannerEnd: '#D32F2F',
    bannerOverlay: 'rgba(0,131,143,0.12)',
    emoji: '🐉',
    description: 'Dragon Boats — teal water, red dragon fire',
    mode: 'dark',
  },

  // ==========================================================================
  // JAPAN
  // ==========================================================================
  {
    id: 'sakura',
    name: 'Cherry Blossom',
    country: 'Japan',
    countryCode: 'JP',
    month: 3,
    day: 25,
    windowDays: 10,
    icon: '#F48FB1',
    iconHover: '#F8BBD0',
    bg: '#140E12',
    surface: '#221820',
    surfaceHover: '#322430',
    border: '#4A3848',
    text: '#FFF0F5',
    mutedText: '#C090A8',
    bannerStart: '#F48FB1',
    bannerEnd: '#CE93D8',
    bannerOverlay: 'rgba(244,143,177,0.12)',
    emoji: '🌸',
    description: 'Hanami — cherry pink, soft lavender',
    mode: 'dark',
  },
  {
    id: 'obon',
    name: 'Obon',
    country: 'Japan',
    countryCode: 'JP',
    month: 8,
    day: 13,
    windowDays: 3,
    icon: '#FF6F00',
    iconHover: '#FFA000',
    bg: '#0E0808',
    surface: '#1A1010',
    surfaceHover: '#2A1818',
    border: '#3A2828',
    text: '#FFF3E0',
    mutedText: '#B89080',
    bannerStart: '#FF6F00',
    bannerEnd: '#E040FB',
    bannerOverlay: 'rgba(255,111,0,0.12)',
    emoji: '🏮',
    description: 'Festival of Souls — lantern orange, spirit purple',
    mode: 'dark',
  },

  // ==========================================================================
  // BRAZIL
  // ==========================================================================
  {
    id: 'carnival',
    name: 'Carnival',
    country: 'Brazil',
    countryCode: 'BR',
    month: 2,
    day: 28,
    windowDays: 5,
    icon: '#FFD600',
    iconHover: '#FFEA00',
    bg: '#0A0A08',
    surface: '#161610',
    surfaceHover: '#24241C',
    border: '#383828',
    text: '#FFFFF0',
    mutedText: '#B0B088',
    bannerStart: '#FFD600',
    bannerEnd: '#00C853',
    bannerOverlay: 'rgba(255,214,0,0.12)',
    emoji: '🎭',
    description: 'Carnival — gold, green, samba energy',
    mode: 'dark',
  },

  // ==========================================================================
  // MEXICO
  // ==========================================================================
  {
    id: 'dia-muertos',
    name: 'Dia de los Muertos',
    country: 'Mexico',
    countryCode: 'MX',
    month: 11,
    day: 1,
    windowDays: 2,
    icon: '#FF6D00',
    iconHover: '#FF9100',
    bg: '#0E080E',
    surface: '#1A101A',
    surfaceHover: '#2A182A',
    border: '#3A2848',
    text: '#FFF3E0',
    mutedText: '#B890B0',
    bannerStart: '#FF6D00',
    bannerEnd: '#7B1FA2',
    bannerOverlay: 'rgba(255,109,0,0.15)',
    emoji: '💀',
    description: 'Day of the Dead — marigold orange, spirit purple',
    mode: 'dark',
  },
  {
    id: 'cinco-mayo',
    name: 'Cinco de Mayo',
    country: 'Mexico',
    countryCode: 'MX',
    month: 5,
    day: 5,
    windowDays: 1,
    icon: '#2E7D32',
    iconHover: '#43A047',
    bg: '#080E08',
    surface: '#101E10',
    surfaceHover: '#182E18',
    border: '#284028',
    text: '#F0FFF0',
    mutedText: '#80B880',
    bannerStart: '#2E7D32',
    bannerEnd: '#C62828',
    bannerOverlay: 'rgba(46,125,50,0.12)',
    emoji: '🇲🇽',
    description: 'Cinco de Mayo — green, white, red',
    mode: 'dark',
  },

  // ==========================================================================
  // UK
  // ==========================================================================
  {
    id: 'bonfire-night',
    name: 'Bonfire Night',
    country: 'UK',
    countryCode: 'GB',
    month: 11,
    day: 5,
    windowDays: 1,
    icon: '#FF6D00',
    iconHover: '#FF9100',
    bg: '#0E0A08',
    surface: '#1A1410',
    surfaceHover: '#2A2018',
    border: '#3A3028',
    text: '#FFF8E1',
    mutedText: '#B8A080',
    bannerStart: '#FF6D00',
    bannerEnd: '#D32F2F',
    bannerOverlay: 'rgba(255,109,0,0.15)',
    emoji: '🔥',
    description: 'Guy Fawkes — fire orange, night red',
    mode: 'dark',
  },

  // ==========================================================================
  // SOUTH KOREA
  // ==========================================================================
  {
    id: 'chuseok',
    name: 'Chuseok',
    country: 'South Korea',
    countryCode: 'KR',
    month: 9,
    day: 16,
    windowDays: 2,
    icon: '#1565C0',
    iconHover: '#1E88E5',
    bg: '#080A14',
    surface: '#101428',
    surfaceHover: '#182038',
    border: '#283050',
    text: '#F0F4FF',
    mutedText: '#8898C0',
    bannerStart: '#1565C0',
    bannerEnd: '#FFD600',
    bannerOverlay: 'rgba(21,101,192,0.12)',
    emoji: '🎑',
    description: 'Korean Thanksgiving — blue moon, golden harvest',
    mode: 'dark',
  },

  // ==========================================================================
  // THAILAND
  // ==========================================================================
  {
    id: 'songkran',
    name: 'Songkran',
    country: 'Thailand',
    countryCode: 'TH',
    month: 4,
    day: 13,
    windowDays: 3,
    icon: '#00BCD4',
    iconHover: '#26C6DA',
    bg: '#060E10',
    surface: '#0E1E22',
    surfaceHover: '#162E34',
    border: '#204050',
    text: '#E0F7FA',
    mutedText: '#78A8B8',
    bannerStart: '#00BCD4',
    bannerEnd: '#FFD600',
    bannerOverlay: 'rgba(0,188,212,0.12)',
    emoji: '💧',
    description: 'Water Festival — aqua splash, golden temples',
    mode: 'dark',
  },
  {
    id: 'loy-krathong',
    name: 'Loy Krathong',
    country: 'Thailand',
    countryCode: 'TH',
    month: 11,
    day: 15,
    windowDays: 2,
    icon: '#FFB300',
    iconHover: '#FFCA28',
    bg: '#0E0A04',
    surface: '#1A1408',
    surfaceHover: '#282010',
    border: '#403020',
    text: '#FFFDE7',
    mutedText: '#B8A870',
    bannerStart: '#FFB300',
    bannerEnd: '#7B1FA2',
    bannerOverlay: 'rgba(255,179,0,0.12)',
    emoji: '🪷',
    description: 'Floating Lanterns — golden glow, purple night',
    mode: 'dark',
  },

  // ==========================================================================
  // GERMANY
  // ==========================================================================
  {
    id: 'oktoberfest',
    name: 'Oktoberfest',
    country: 'Germany',
    countryCode: 'DE',
    month: 9,
    day: 21,
    windowDays: 10,
    icon: '#F9A825',
    iconHover: '#FDD835',
    bg: '#120E04',
    surface: '#201A0C',
    surfaceHover: '#302814',
    border: '#483820',
    text: '#FFF9C4',
    mutedText: '#B8A868',
    bannerStart: '#F9A825',
    bannerEnd: '#4E342E',
    bannerOverlay: 'rgba(249,168,37,0.12)',
    emoji: '🍻',
    description: 'Oktoberfest — golden beer, warm brown',
    mode: 'dark',
  },

  // ==========================================================================
  // NIGERIA
  // ==========================================================================
  {
    id: 'lagos-carnival',
    name: 'Lagos Carnival',
    country: 'Nigeria',
    countryCode: 'NG',
    month: 4,
    day: 1,
    windowDays: 3,
    icon: '#2E7D32',
    iconHover: '#43A047',
    bg: '#080E08',
    surface: '#101E10',
    surfaceHover: '#182E18',
    border: '#284028',
    text: '#F0FFF0',
    mutedText: '#80B880',
    bannerStart: '#2E7D32',
    bannerEnd: '#FFFFFF',
    bannerOverlay: 'rgba(46,125,50,0.12)',
    emoji: '🟢',
    description: 'Naija Carnival — green, white, afrobeats',
    mode: 'dark',
  },

  // ==========================================================================
  // SAUDI ARABIA / MIDDLE EAST
  // ==========================================================================
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    month: 3,
    day: 30,
    windowDays: 3,
    icon: '#2E7D32',
    iconHover: '#43A047',
    bg: '#080E08',
    surface: '#101E10',
    surfaceHover: '#182E18',
    border: '#284028',
    text: '#F0FFF0',
    mutedText: '#80B880',
    bannerStart: '#2E7D32',
    bannerEnd: '#FFD700',
    bannerOverlay: 'rgba(46,125,50,0.12)',
    emoji: '🌙',
    description: 'Eid Mubarak — green, gold, crescent moon',
    mode: 'dark',
  },
  {
    id: 'ramadan',
    name: 'Ramadan',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    month: 3,
    day: 1,
    windowDays: 30,
    icon: '#1565C0',
    iconHover: '#1E88E5',
    bg: '#080A14',
    surface: '#101428',
    surfaceHover: '#182038',
    border: '#283050',
    text: '#F0F4FF',
    mutedText: '#8898C0',
    bannerStart: '#1565C0',
    bannerEnd: '#FFD700',
    bannerOverlay: 'rgba(21,101,192,0.12)',
    emoji: '☪️',
    description: 'Ramadan Kareem — deep blue, starlight gold',
    mode: 'dark',
  },

  // ==========================================================================
  // AUSTRALIA
  // ==========================================================================
  {
    id: 'australia-day',
    name: 'Australia Day',
    country: 'Australia',
    countryCode: 'AU',
    month: 1,
    day: 26,
    windowDays: 1,
    icon: '#1565C0',
    iconHover: '#1E88E5',
    bg: '#080A14',
    surface: '#101428',
    surfaceHover: '#182038',
    border: '#283050',
    text: '#F0F4FF',
    mutedText: '#8898C0',
    bannerStart: '#1565C0',
    bannerEnd: '#FFD600',
    bannerOverlay: 'rgba(21,101,192,0.12)',
    emoji: '🦘',
    description: 'Australia Day — ocean blue, golden outback',
    mode: 'dark',
  },

  // ==========================================================================
  // FRANCE
  // ==========================================================================
  {
    id: 'bastille-day',
    name: 'Bastille Day',
    country: 'France',
    countryCode: 'FR',
    month: 7,
    day: 14,
    windowDays: 1,
    icon: '#0D47A1',
    iconHover: '#1565C0',
    bg: '#060A14',
    surface: '#0E1428',
    surfaceHover: '#162038',
    border: '#203050',
    text: '#F0F4FF',
    mutedText: '#8898C0',
    bannerStart: '#0D47A1',
    bannerEnd: '#D32F2F',
    bannerOverlay: 'rgba(13,71,161,0.12)',
    emoji: '🇫🇷',
    description: 'Liberte — blue, white, red tricolor',
    mode: 'dark',
  },

  // ==========================================================================
  // CANADA
  // ==========================================================================
  {
    id: 'canada-day',
    name: 'Canada Day',
    country: 'Canada',
    countryCode: 'CA',
    month: 7,
    day: 1,
    windowDays: 1,
    icon: '#C62828',
    iconHover: '#D32F2F',
    bg: '#0E0808',
    surface: '#1A1010',
    surfaceHover: '#2A1818',
    border: '#3A2828',
    text: '#FFF5F5',
    mutedText: '#C09090',
    bannerStart: '#C62828',
    bannerEnd: '#FFFFFF',
    bannerOverlay: 'rgba(198,40,40,0.12)',
    emoji: '🍁',
    description: 'Canada Day — maple red, winter white',
    mode: 'dark',
  },

  // ==========================================================================
  // RUSSIA
  // ==========================================================================
  {
    id: 'maslenitsa',
    name: 'Maslenitsa',
    country: 'Russia',
    countryCode: 'RU',
    month: 2,
    day: 24,
    windowDays: 5,
    icon: '#FFA000',
    iconHover: '#FFB300',
    bg: '#120E04',
    surface: '#201A0C',
    surfaceHover: '#302814',
    border: '#483820',
    text: '#FFF9C4',
    mutedText: '#B8A868',
    bannerStart: '#FFA000',
    bannerEnd: '#D32F2F',
    bannerOverlay: 'rgba(255,160,0,0.12)',
    emoji: '🥞',
    description: 'Sun Festival — golden blini, fire red',
    mode: 'dark',
  },

  // ==========================================================================
  // SPAIN
  // ==========================================================================
  {
    id: 'la-tomatina',
    name: 'La Tomatina',
    country: 'Spain',
    countryCode: 'ES',
    month: 8,
    day: 27,
    windowDays: 1,
    icon: '#D32F2F',
    iconHover: '#E53935',
    bg: '#0E0808',
    surface: '#1A1010',
    surfaceHover: '#2A1818',
    border: '#3A2828',
    text: '#FFF5F5',
    mutedText: '#C09090',
    bannerStart: '#D32F2F',
    bannerEnd: '#FF6D00',
    bannerOverlay: 'rgba(211,47,47,0.15)',
    emoji: '🍅',
    description: 'Tomato Festival — vivid red, sun orange',
    mode: 'dark',
  },
  {
    id: 'san-fermin',
    name: 'San Fermin',
    country: 'Spain',
    countryCode: 'ES',
    month: 7,
    day: 7,
    windowDays: 5,
    icon: '#C62828',
    iconHover: '#D32F2F',
    bg: '#0E0808',
    surface: '#1A1010',
    surfaceHover: '#2A1818',
    border: '#3A2828',
    text: '#FFF5F5',
    mutedText: '#C09090',
    bannerStart: '#C62828',
    bannerEnd: '#FFD600',
    bannerOverlay: 'rgba(198,40,40,0.15)',
    emoji: '🐂',
    description: 'Running of the Bulls — crimson, gold',
    mode: 'dark',
  },

  // ==========================================================================
  // GLOBAL / UNIVERSAL
  // ==========================================================================
  {
    id: 'new-year',
    name: 'New Year',
    country: 'Global',
    countryCode: 'GLOBAL',
    month: 1,
    day: 1,
    windowDays: 2,
    icon: '#FFD700',
    iconHover: '#FFE44D',
    bg: '#0E0A08',
    surface: '#1A1410',
    surfaceHover: '#2A2018',
    border: '#3A3028',
    text: '#FFF8E1',
    mutedText: '#B8A070',
    bannerStart: '#FFD700',
    bannerEnd: '#7B1FA2',
    bannerOverlay: 'rgba(255,215,0,0.15)',
    emoji: '🎆',
    description: 'Happy New Year — gold fireworks, midnight purple',
    mode: 'dark',
  },
  {
    id: 'earth-day',
    name: 'Earth Day',
    country: 'Global',
    countryCode: 'GLOBAL',
    month: 4,
    day: 22,
    windowDays: 1,
    icon: '#2E7D32',
    iconHover: '#43A047',
    bg: '#060E06',
    surface: '#0E1E0E',
    surfaceHover: '#162E16',
    border: '#204020',
    text: '#E8F5E9',
    mutedText: '#78A878',
    bannerStart: '#2E7D32',
    bannerEnd: '#1565C0',
    bannerOverlay: 'rgba(46,125,50,0.12)',
    emoji: '🌍',
    description: 'Earth Day — nature green, ocean blue',
    mode: 'dark',
  },
  {
    id: 'pride-month',
    name: 'Pride Month',
    country: 'Global',
    countryCode: 'GLOBAL',
    month: 6,
    day: 1,
    windowDays: 30,
    icon: '#E91E63',
    iconHover: '#FF4081',
    bg: '#0A0A14',
    surface: '#141428',
    surfaceHover: '#20203E',
    border: '#30305A',
    text: '#FFF0F5',
    mutedText: '#B090D0',
    bannerStart: '#E91E63',
    bannerEnd: '#00BCD4',
    bannerOverlay: 'rgba(233,30,99,0.12)',
    emoji: '🌈',
    description: 'Pride — rainbow spectrum, love is love',
    mode: 'dark',
  },
  {
    id: 'world-music-day',
    name: 'World Music Day',
    country: 'Global',
    countryCode: 'GLOBAL',
    month: 6,
    day: 21,
    windowDays: 2,
    icon: '#7B1FA2',
    iconHover: '#9C27B0',
    bg: '#0E0814',
    surface: '#1A1028',
    surfaceHover: '#2A1838',
    border: '#3A2858',
    text: '#F5F0FF',
    mutedText: '#A890C0',
    bannerStart: '#7B1FA2',
    bannerEnd: '#FFD600',
    bannerOverlay: 'rgba(123,31,162,0.12)',
    emoji: '🎵',
    description: 'Make Music — purple passion, golden rhythm',
    mode: 'dark',
  },
];

/**
 * Timezone to country code mapping
 * Maps Intl timezone IDs to country codes for festival detection
 */
const TIMEZONE_COUNTRY: Record<string, string> = {
  // India
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  // USA
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  // China
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Hong_Kong': 'CN',
  // Japan
  'Asia/Tokyo': 'JP',
  // South Korea
  'Asia/Seoul': 'KR',
  // Brazil
  'America/Sao_Paulo': 'BR',
  'America/Rio_Branco': 'BR',
  'America/Manaus': 'BR',
  'America/Fortaleza': 'BR',
  'America/Recife': 'BR',
  'America/Salvador': 'BR',
  // Mexico
  'America/Mexico_City': 'MX',
  'America/Tijuana': 'MX',
  'America/Cancun': 'MX',
  // UK
  'Europe/London': 'GB',
  'Europe/Belfast': 'GB',
  // Germany
  'Europe/Berlin': 'DE',
  'Europe/Munich': 'DE',
  // Thailand
  'Asia/Bangkok': 'TH',
  // Nigeria
  'Africa/Lagos': 'NG',
  // Saudi Arabia
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'SA',
  // Australia
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Brisbane': 'AU',
  // France
  'Europe/Paris': 'FR',
  // Canada
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  // Russia
  'Europe/Moscow': 'RU',
  'Asia/Yekaterinburg': 'RU',
  'Asia/Novosibirsk': 'RU',
  'Asia/Vladivostok': 'RU',
  // Spain
  'Europe/Madrid': 'ES',
  // Pakistan
  'Asia/Karachi': 'PK',
  // Bangladesh
  'Asia/Dhaka': 'BD',
  // Indonesia
  'Asia/Jakarta': 'ID',
  // Philippines
  'Asia/Manila': 'PH',
  // Vietnam
  'Asia/Ho_Chi_Minh': 'VN',
  // Italy
  'Europe/Rome': 'IT',
  // Netherlands
  'Europe/Amsterdam': 'NL',
  // Sweden
  'Europe/Stockholm': 'SE',
  // Turkey
  'Europe/Istanbul': 'TR',
  // Argentina
  'America/Argentina/Buenos_Aires': 'AR',
  // Colombia
  'America/Bogota': 'CO',
  // Peru
  'America/Lima': 'PE',
  // Egypt
  'Africa/Cairo': 'EG',
  // South Africa
  'Africa/Johannesburg': 'ZA',
  // Kenya
  'Africa/Nairobi': 'KE',
  // Israel
  'Asia/Jerusalem': 'IL',
  // Nepal
  'Asia/Kathmandu': 'NP',
  // Sri Lanka
  'Asia/Colombo': 'LK',
  // Malaysia
  'Asia/Kuala_Lumpur': 'MY',
  // Singapore
  'Asia/Singapore': 'SG',
};

/**
 * Detect user's country from browser timezone
 */
export function detectCountry(): string {
  if (typeof window === 'undefined') return 'GLOBAL';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_COUNTRY[tz] || 'GLOBAL';
  } catch {
    return 'GLOBAL';
  }
}

/**
 * Get active festivals for a given country and date
 * Returns festivals whose date window overlaps with today
 */
export function getActiveFestivals(countryCode?: string): FestivalTheme[] {
  const country = countryCode || detectCountry();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();

  return FESTIVAL_THEMES.filter((festival) => {
    // Match country (or global)
    if (festival.countryCode !== country && festival.countryCode !== 'GLOBAL') {
      return false;
    }
    // Check if today is within the festival window
    const windowStart = festival.day - festival.windowDays;
    const windowEnd = festival.day + festival.windowDays;
    return festival.month === currentMonth && currentDay >= windowStart && currentDay <= windowEnd;
  });
}

/**
 * Get the primary active festival for the user's country
 * Returns the first matching festival, or null
 */
export function getActiveFestival(countryCode?: string): FestivalTheme | null {
  const active = getActiveFestivals(countryCode);
  return active.length > 0 ? active[0] : null;
}

/**
 * Get all festivals for a specific country
 */
export function getFestivalsByCountry(countryCode: string): FestivalTheme[] {
  return FESTIVAL_THEMES.filter(
    (f) => f.countryCode === countryCode || f.countryCode === 'GLOBAL'
  );
}

/**
 * Get upcoming festivals for a country (next 60 days)
 */
export function getUpcomingFestivals(countryCode?: string, daysAhead: number = 60): FestivalTheme[] {
  const country = countryCode || detectCountry();
  const now = new Date();
  const results: FestivalTheme[] = [];

  for (let d = 0; d <= daysAhead; d++) {
    const future = new Date(now);
    future.setDate(future.getDate() + d);
    const month = future.getMonth() + 1;
    const day = future.getDate();

    const matching = FESTIVAL_THEMES.filter((f) => {
      if (f.countryCode !== country && f.countryCode !== 'GLOBAL') return false;
      return f.month === month && day >= f.day - f.windowDays && day <= f.day + f.windowDays;
    });

    for (const f of matching) {
      if (!results.find((r) => r.id === f.id)) {
        results.push(f);
      }
    }
  }

  return results;
}

/**
 * Apply a festival theme to the document root CSS vars
 * (same pattern as applyColorTheme in color-themes.ts)
 */
export function applyFestivalTheme(festival: FestivalTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Set dark/light class
  root.classList.toggle('dark', festival.mode === 'dark');

  // Part 1: Icon colors
  root.style.setProperty('--primary', festival.icon);
  root.style.setProperty('--secondary', festival.iconHover);
  root.style.setProperty('--ring', festival.icon);

  // Part 2: Background & surfaces
  root.style.setProperty('--background', festival.bg);
  root.style.setProperty('--card', festival.surface);
  root.style.setProperty('--accent', festival.surfaceHover);
  root.style.setProperty('--border', festival.border);
  root.style.setProperty('--foreground', festival.text);
  root.style.setProperty('--muted-foreground', festival.mutedText);
  root.style.setProperty('--muted', festival.surfaceHover);
  root.style.setProperty('--popover', festival.surface);
  root.style.setProperty('--popover-foreground', festival.text);
  root.style.setProperty('--input', festival.border);
  root.style.setProperty('--primary-foreground', festival.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--secondary-foreground', festival.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--accent-foreground', festival.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--card-foreground', festival.text);
  root.style.setProperty('--destructive', festival.mode === 'dark' ? '#F87171' : '#EF4444');
  root.style.setProperty('--sidebar', festival.surface);
  root.style.setProperty('--sidebar-foreground', festival.text);
  root.style.setProperty('--sidebar-primary', festival.icon);
  root.style.setProperty('--sidebar-primary-foreground', festival.mode === 'dark' ? '#FFFFFF' : '#0F172A');
  root.style.setProperty('--sidebar-accent', festival.surfaceHover);
  root.style.setProperty('--sidebar-accent-foreground', festival.text);
  root.style.setProperty('--sidebar-border', festival.border);
  root.style.setProperty('--sidebar-ring', festival.icon);

  // Part 3: Banner gradient CSS vars
  root.style.setProperty('--banner-gradient-start', festival.bannerStart);
  root.style.setProperty('--banner-gradient-end', festival.bannerEnd);
  root.style.setProperty('--banner-overlay', festival.bannerOverlay);
}

/**
 * Convert a FestivalTheme to a ColorTheme-compatible format
 * so it works with the existing ThemeSelector
 */
export function festivalToColorTheme(festival: FestivalTheme) {
  return {
    id: festival.id,
    name: festival.name,
    icon: festival.icon,
    iconHover: festival.iconHover,
    bg: festival.bg,
    surface: festival.surface,
    surfaceHover: festival.surfaceHover,
    border: festival.border,
    text: festival.text,
    mutedText: festival.mutedText,
    bannerStart: festival.bannerStart,
    bannerEnd: festival.bannerEnd,
    bannerOverlay: festival.bannerOverlay,
    emoji: festival.emoji,
    mode: festival.mode,
  };
}

/**
 * Get a list of all unique countries that have festivals
 */
export function getAvailableCountries(): { code: string; name: string; flag: string }[] {
  const countryMap: Record<string, { code: string; name: string; flag: string }> = {};

  for (const f of FESTIVAL_THEMES) {
    if (!countryMap[f.countryCode]) {
      const flags: Record<string, string> = {
        IN: '🇮🇳', US: '🇺🇸', CN: '🇨🇳', JP: '🇯🇵', BR: '🇧🇷',
        MX: '🇲🇽', GB: '🇬🇧', KR: '🇰🇷', TH: '🇹🇭', DE: '🇩🇪',
        NG: '🇳🇬', SA: '🇸🇦', AU: '🇦🇺', FR: '🇫🇷', CA: '🇨🇦',
        RU: '🇷🇺', ES: '🇪🇸', GLOBAL: '🌍',
      };
      countryMap[f.countryCode] = {
        code: f.countryCode,
        name: f.country,
        flag: flags[f.countryCode] || '🏳️',
      };
    }
  }

  // GLOBAL first, then alphabetical
  const sorted = Object.values(countryMap).sort((a, b) => {
    if (a.code === 'GLOBAL') return -1;
    if (b.code === 'GLOBAL') return 1;
    return a.name.localeCompare(b.name);
  });

  return sorted;
}
