'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Volume1, VolumeX, Shield, Car, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useMusicStore } from '@/lib/store';
import { formatTime } from '@/lib/utils-music';

interface VehiclePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  { id: 'generic', name: 'Generic', icon: '🚗', description: 'All Android Auto / CarPlay' },
  { id: 'bmw', name: 'BMW', icon: '🏎️', description: 'iDrive 6/7/8' },
  { id: 'mercedes', name: 'Mercedes', icon: '🌟', description: 'MBUX / COMAND' },
  { id: 'audi', name: 'Audi', icon: '💎', description: 'MMI Plus / MIB3' },
  { id: 'jeep', name: 'Jeep', icon: '🚙', description: 'Uconnect 4/5' },
  { id: 'vw', name: 'VW', icon: '🔧', description: 'Discover Pro / MIB' },
];

export function CarMode() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    currentTime,
    duration,
    setCurrentTime,
    setView,
    carAudioMode,
    setCarAudioMode,
    audioQuality,
  } = useMusicStore();

  const [showVehicleSelect, setShowVehicleSelect] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('generic');
  const [bypassActive, setBypassActive] = useState(false);
  const [bypassStatus, setBypassStatus] = useState('');

  const handleSeek = (value: number[]) => {
    const audio = document.querySelector('audio');
    if (audio && isFinite(value[0])) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const activateBypass = async () => {
    if (!currentTrack) return;
    setBypassStatus('Activating...');
    try {
      const res = await fetch(
        `/api/music/car-bypass?id=${currentTrack.videoId}&quality=${audioQuality}&vehicle=${selectedVehicle}`
      );
      const data = await res.json();
      if (data.streamUrl) {
        setBypassActive(true);
        setCarAudioMode(true);
        setBypassStatus(`Bypass active for ${VEHICLE_PRESETS.find(v => v.id === selectedVehicle)?.name || 'your vehicle'}`);
      } else {
        setBypassStatus('Bypass unavailable - using standard mode');
      }
    } catch {
      setBypassStatus('Bypass failed - using standard mode');
    }
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${bypassActive ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`} />
          <span className="text-sm text-white/50 uppercase tracking-wider">Car Mode</span>
          {bypassActive && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5">
              <Shield className="size-3 mr-0.5" />
              BYPASS
            </Badge>
          )}
        </div>
        <Button
          onClick={() => setView('home')}
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 size-12"
        >
          <X className="size-6" />
        </Button>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-95'}`}>
          {currentTrack ? (
            <Image
              src={currentTrack.thumbnail || '/weedmusic-logo.png'}
              alt={currentTrack.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <Play className="size-16 text-zinc-600" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 ring-2 ring-orange-500/30 rounded-2xl" />
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center px-8 mb-4">
        <h2 className="text-2xl md:text-3xl font-bold truncate">
          {currentTrack?.title || 'No track playing'}
        </h2>
        <p className="text-lg text-white/60 truncate mt-1">
          {currentTrack?.artist || 'Select a song to play'}
        </p>
      </div>

      {/* Progress */}
      <div className="px-8 mb-6">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-sm text-white/50 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <Button
          onClick={prevTrack}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 size-16"
        >
          <SkipBack className="size-8" />
        </Button>
        <Button
          onClick={togglePlay}
          className="size-20 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"
        >
          {isPlaying ? (
            <Pause className="size-10" />
          ) : (
            <Play className="size-10 ml-1" />
          )}
        </Button>
        <Button
          onClick={nextTrack}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 size-16"
        >
          <SkipForward className="size-8" />
        </Button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-8 pb-3">
        <VolumeIcon className="size-6 text-white/60 shrink-0" />
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="cursor-pointer"
        />
      </div>

      {/* Android Auto / Car Audio Mode Toggle */}
      <div className="px-8 pb-2">
        <button
          onClick={() => setCarAudioMode(!carAudioMode)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
            carAudioMode ? 'bg-green-900/50 text-green-400' : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Car className="size-5" />
            <div className="text-left">
              <p className="text-sm font-medium">Android Auto Mode</p>
              <p className="text-[10px] text-white/40">Audio only from video streams</p>
            </div>
          </div>
          <div className={`size-8 rounded-full flex items-center justify-center ${carAudioMode ? 'bg-green-500' : 'bg-white/10'}`}>
            <span className="text-xs font-bold">{carAudioMode ? 'ON' : 'OFF'}</span>
          </div>
        </button>
      </div>

      {/* Vehicle Bypass Section */}
      <div className="px-8 pb-4">
        <button
          onClick={() => setShowVehicleSelect(!showVehicleSelect)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="size-5" />
            <div className="text-left">
              <p className="text-sm font-medium">Video Bypass for Car Players</p>
              <p className="text-[10px] text-white/40">
                {bypassActive ? bypassStatus : 'Bypass video lockout while driving'}
              </p>
            </div>
          </div>
          <ChevronDown className={`size-5 transition-transform ${showVehicleSelect ? 'rotate-180' : ''}`} />
        </button>

        {showVehicleSelect && (
          <div className="mt-2 rounded-xl bg-white/5 p-3 space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Select your vehicle</p>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_PRESETS.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-2 rounded-lg text-center transition-colors ${
                    selectedVehicle === vehicle.id
                      ? 'bg-orange-500/30 text-orange-400 ring-1 ring-orange-500/50'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg block">{vehicle.icon}</span>
                  <span className="text-[10px] font-medium">{vehicle.name}</span>
                </button>
              ))}
            </div>
            <Button
              onClick={activateBypass}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white gap-2"
              size="sm"
            >
              <Shield className="size-4" />
              Activate Bypass
            </Button>
            <p className="text-[9px] text-white/30 text-center leading-relaxed">
              Bypasses stock media player video restrictions for BMW, Mercedes, Audi,
              Jeep Compass &amp; other vehicles. Uses audio extraction to play content
              through Android Auto media session protocol.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
