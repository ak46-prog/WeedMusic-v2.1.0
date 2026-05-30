'use client';

import { Trash2, X, Music } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMusicStore } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

interface QueueDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueueDrawer({ open, onOpenChange }: QueueDrawerProps) {
  const { queue, queueIndex, currentTrack, removeFromQueue, isPlaying } = useMusicStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Music className="size-5 text-orange-500" />
            Play Queue
          </SheetTitle>
          <SheetDescription>
            {queue.length} track{queue.length !== 1 ? 's' : ''} in queue
          </SheetDescription>
        </SheetHeader>

        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              // Clear queue except current
              if (currentTrack) {
                useMusicStore.getState().playQueue([currentTrack], 0);
              }
            }}
          >
            <Trash2 className="size-4 mr-1" />
            Clear Queue
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4 mt-2">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="size-10 mx-auto mb-3 opacity-30" />
              <p>No tracks in queue</p>
              <p className="text-sm mt-1">Add songs to play next</p>
            </div>
          ) : (
            <div className="space-y-1">
              {queue.map((track, index) => (
                <div
                  key={`${track.videoId}-${index}`}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    index === queueIndex
                      ? 'bg-orange-50 dark:bg-orange-950/20'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="size-5 text-center shrink-0">
                    {index === queueIndex && isPlaying ? (
                      <div className="flex gap-0.5 items-center justify-center h-5">
                        <div className="w-0.5 bg-orange-500 animate-pulse h-3" />
                        <div className="w-0.5 bg-orange-500 animate-pulse h-4" style={{ animationDelay: '0.2s' }} />
                        <div className="w-0.5 bg-orange-500 animate-pulse h-2" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${index === queueIndex ? 'text-orange-500 font-medium' : ''}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromQueue(index)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
