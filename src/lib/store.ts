import { create } from 'zustand';

export interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  isPaid?: boolean;
  source?: string;
  kidSafe?: boolean;
  views?: number;
  channelUrl?: string;
  channelSubscribers?: number;
}

export type ViewMode = 'home' | 'search' | 'explore' | 'library' | 'car' | 'video' | 'kids' | 'radio' | 'artist' | 'upgrade' | 'tv';

export type AudioQuality = '128' | '192' | '256' | '320';
export type VideoQuality = '240' | '360' | '480' | '720' | '1080';

export interface ArtistData {
  name: string;
  avatar: string;
  banner: string;
  subscribers: string;
  channelUrl: string;
  description: string;
  tracks: Track[];
  playlists: { id: string; name: string; thumbnail: string; trackCount: number; views: string }[];
}

interface MusicStore {
  // Player state
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  volume: number;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  streamUrl: string | null;
  bufferProgress: number;
  autoPlay: boolean;
  isLoading: boolean;

  // Quality settings
  audioQuality: AudioQuality;
  videoQuality: VideoQuality;

  // UI state
  view: ViewMode;
  searchQuery: string;
  showVideoPlayer: boolean;
  childMode: boolean;
  carAudioMode: boolean;
  sidebarOpen: boolean;
  currentArtist: ArtistData | null;

  // Color state
  themePresetId: string | null;

  // Actions
  setView: (view: ViewMode) => void;
  playTrack: (track: Track) => void;
  playQueue: (tracks: Track[], index?: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setStreamUrl: (url: string | null) => void;
  setBufferProgress: (progress: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setShowVideoPlayer: (show: boolean) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setVideoQuality: (quality: VideoQuality) => void;
  toggleChildMode: () => void;
  setCarAudioMode: (enabled: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentArtist: (artist: ArtistData | null) => void;
  openArtistView: (artistName: string) => void;
  toggleAutoPlay: () => void;
  setIsLoading: (loading: boolean) => void;
  setThemePresetId: (id: string | null) => void;
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  queueIndex: -1,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: 'all',
  streamUrl: null,
  bufferProgress: 0,
  autoPlay: true,
  isLoading: false,
  audioQuality: '256',
  videoQuality: '480',
  view: 'home',
  searchQuery: '',
  showVideoPlayer: false,
  childMode: false,
  carAudioMode: false,
  sidebarOpen: false,
  currentArtist: null,
  themePresetId: null,

  setView: (view) => set({ view }),
  playTrack: (track) => set({
    currentTrack: track,
    isPlaying: true,
    queue: [track],
    queueIndex: 0,
    currentTime: 0,
    duration: 0,
    bufferProgress: 0,
    isLoading: true,
  }),
  playQueue: (tracks, index = 0) => set({
    queue: tracks,
    queueIndex: index,
    currentTrack: tracks[index],
    isPlaying: true,
    currentTime: 0,
    duration: 0,
    bufferProgress: 0,
    isLoading: true,
  }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  nextTrack: () => {
    const { queue, queueIndex, shuffle, repeat, autoPlay } = get();
    if (queue.length === 0) return;
    let nextIndex: number;
    if (shuffle) {
      // Avoid repeating the same track
      if (queue.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === queueIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0;
        else {
          set({ isPlaying: false, isLoading: false });
          return;
        }
      }
    }
    // Immediately reset player state for instant visual feedback
    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      isPlaying: autoPlay,
      currentTime: 0,
      duration: 0,
      bufferProgress: 0,
      isLoading: autoPlay,
    });
  },
  prevTrack: () => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) {
      // Restart current track if >3s played
      set({ currentTime: 0 });
      // Also seek the audio element
      const seekFn = (window as any).__seek;
      if (seekFn) seekFn(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      bufferProgress: 0,
      isLoading: true,
    });
  },
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setStreamUrl: (url) => set({ streamUrl: url }),
  setBufferProgress: (progress) => set({ bufferProgress: progress }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => set((s) => ({ repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none' })),
  setShowVideoPlayer: (show) => set({ showVideoPlayer: show }),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  removeFromQueue: (index) => set((s) => ({ queue: s.queue.filter((_, i) => i !== index) })),
  setAudioQuality: (quality) => set({ audioQuality: quality }),
  setVideoQuality: (quality) => set({ videoQuality: quality }),
  toggleChildMode: () => set((s) => ({ childMode: !s.childMode })),
  setCarAudioMode: (enabled) => set({ carAudioMode: enabled }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentArtist: (artist) => set({ currentArtist: artist }),
  toggleAutoPlay: () => set((s) => ({ autoPlay: !s.autoPlay })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setThemePresetId: (id) => set({ themePresetId: id }),
  openArtistView: (artistName: string) => {
    set({
      currentArtist: {
        name: artistName,
        avatar: '',
        banner: '',
        subscribers: '',
        channelUrl: '',
        description: '',
        tracks: [],
        playlists: [],
      },
      view: 'artist',
    });
  },
}));
