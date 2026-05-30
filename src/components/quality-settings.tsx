'use client';

import { Settings, Wifi, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMusicStore, type AudioQuality, type VideoQuality } from '@/lib/store';

const AUDIO_QUALITIES: { value: AudioQuality; label: string; desc: string }[] = [
  { value: '128', label: '128 kbps', desc: 'Low • Saves data' },
  { value: '192', label: '192 kbps', desc: 'Medium • Balanced' },
  { value: '256', label: '256 kbps', desc: 'High • Recommended' },
  { value: '320', label: '320 kbps', desc: 'Very High • Best quality' },
];

const VIDEO_QUALITIES: { value: VideoQuality; label: string; desc: string }[] = [
  { value: '240', label: '240p', desc: 'Very Low • Fastest' },
  { value: '360', label: '360p', desc: 'Low • Saves data' },
  { value: '480', label: '480p', desc: 'Medium • Recommended' },
  { value: '720', label: '720p HD', desc: 'High' },
  { value: '1080', label: '1080p Full HD', desc: 'Very High • Best quality' },
];

export function QualitySettings() {
  const { audioQuality, setAudioQuality, videoQuality, setVideoQuality, carAudioMode, setCarAudioMode } = useMusicStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
          <Settings className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        {/* Audio Quality */}
        <div className="mb-3">
          <Label className="text-xs font-medium flex items-center gap-1 mb-2">
            <Wifi className="size-3" />
            Audio Quality
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {AUDIO_QUALITIES.map((q) => (
              <button
                key={q.value}
                onClick={() => setAudioQuality(q.value)}
                className={`text-left p-2 rounded-md text-xs transition-colors ${
                  audioQuality === q.value
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                    : 'hover:bg-accent border border-transparent'
                }`}
              >
                <span className="font-medium">{q.label}</span>
                <span className="block text-[10px] text-muted-foreground">{q.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Video Quality */}
        <div className="mb-3">
          <Label className="text-xs font-medium flex items-center gap-1 mb-2">
            <MonitorSmartphone className="size-3" />
            Video Quality
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {VIDEO_QUALITIES.map((q) => (
              <button
                key={q.value}
                onClick={() => setVideoQuality(q.value)}
                className={`text-left p-2 rounded-md text-xs transition-colors ${
                  videoQuality === q.value
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                    : 'hover:bg-accent border border-transparent'
                }`}
              >
                <span className="font-medium">{q.label}</span>
                <span className="block text-[10px] text-muted-foreground">{q.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Android Auto / Car Audio Mode */}
        <div className="pt-2 border-t">
          <button
            onClick={() => setCarAudioMode(!carAudioMode)}
            className={`w-full flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
              carAudioMode
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'hover:bg-accent'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🚗</span>
              <div>
                <p className="font-medium">Car Audio Mode</p>
                <p className="text-[10px] text-muted-foreground">Stream audio only from video (Android Auto)</p>
              </div>
            </div>
            <Badge className={carAudioMode ? 'bg-green-500 text-white border-0 text-[9px]' : 'bg-muted text-muted-foreground text-[9px]'}>
              {carAudioMode ? 'ON' : 'OFF'}
            </Badge>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
