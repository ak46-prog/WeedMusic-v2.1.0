'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { ref, set, get, push, remove, onValue, off } from 'firebase/database';
import { auth, database, isFirebaseEnabled } from '@/lib/firebase';
import type { Track } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Auth Hook                                                          */
/* ------------------------------------------------------------------ */

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !isFirebaseEnabled) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) return null;
    const { googleProvider } = await import('@/lib/firebase');
    if (!googleProvider) return null;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return null;
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut: handleSignOut,
    isFirebaseEnabled,
  };
}

/* ------------------------------------------------------------------ */
/*  Playlist Sync Hook                                                 */
/* ------------------------------------------------------------------ */

interface SyncedPlaylist {
  id: string;
  name: string;
  description: string;
  items: { track: Track; position: number }[];
  createdAt: string;
}

export function useFirebasePlaylistSync(user: User | null) {
  const [playlists, setPlaylists] = useState<SyncedPlaylist[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Listen for real-time playlist changes
  useEffect(() => {
    if (!user || !database) return;

    const playlistsRef = ref(database, `users/${user.uid}/playlists`);

    const unsubscribe = onValue(playlistsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playlistList: SyncedPlaylist[] = Object.entries(data).map(
          ([key, value]: [string, any]) => ({
            id: key,
            name: value.name || '',
            description: value.description || '',
            items: value.items
              ? Object.entries(value.items).map(([, item]: [string, any]) => ({
                  track: item.track as Track,
                  position: item.position || 0,
                }))
              : [],
            createdAt: value.createdAt || new Date().toISOString(),
          })
        );
        setPlaylists(playlistList);
      } else {
        setPlaylists([]);
      }
    });

    return () => off(playlistsRef);
  }, [user]);

  const syncPlaylist = useCallback(
    async (playlist: { id?: string; name: string; description?: string; items?: { track: Track; position: number }[] }) => {
      if (!user || !database) return;
      setSyncing(true);
      try {
        if (playlist.id) {
          const playlistRef = ref(database, `users/${user.uid}/playlists/${playlist.id}`);
          await set(playlistRef, {
            name: playlist.name,
            description: playlist.description || '',
            items: playlist.items || [],
            createdAt: new Date().toISOString(),
          });
        } else {
          const playlistsRef = ref(database, `users/${user.uid}/playlists`);
          await push(playlistsRef, {
            name: playlist.name,
            description: playlist.description || '',
            items: playlist.items || [],
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Playlist sync failed:', error);
      } finally {
        setSyncing(false);
      }
    },
    [user]
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      if (!user || !database) return;
      try {
        const playlistRef = ref(database, `users/${user.uid}/playlists/${playlistId}`);
        await remove(playlistRef);
      } catch (error) {
        console.error('Playlist delete failed:', error);
      }
    },
    [user]
  );

  const syncFavorites = useCallback(
    async (favorites: Track[]) => {
      if (!user || !database) return;
      try {
        const favsRef = ref(database, `users/${user.uid}/favorites`);
        await set(favsRef, favorites);
      } catch (error) {
        console.error('Favorites sync failed:', error);
      }
    },
    [user]
  );

  const getFavorites = useCallback(
    async (): Promise<Track[]> => {
      if (!user || !database) return [];
      try {
        const favsRef = ref(database, `users/${user.uid}/favorites`);
        const snapshot = await get(favsRef);
        return snapshot.val() ? Object.values(snapshot.val()) : [];
      } catch {
        return [];
      }
    },
    [user]
  );

  return {
    playlists,
    syncing,
    syncPlaylist,
    deletePlaylist,
    syncFavorites,
    getFavorites,
  };
}
