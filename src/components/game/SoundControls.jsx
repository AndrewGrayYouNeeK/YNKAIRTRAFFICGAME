import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setMusicVolume } from "@/lib/gameConfig";

export default function SoundControls() {
  const [volume, setVolume] = useState(0.3);
  const [muted, setMuted] = useState(false);

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (muted) setMuted(false);
    setMusicVolume(newVolume);
  };

  const toggleMute = () => {
    if (muted) {
      setMusicVolume(volume);
      setMuted(false);
    } else {
      setMusicVolume(0);
      setMuted(true);
    }
    setMuted(!muted);
  };

  return (
    <div className="absolute top-4 right-4 z-30 bg-black/50 border border-primary/50 rounded-lg p-3 backdrop-blur-sm flex items-center gap-3">
      <button
        onClick={toggleMute}
        className="p-1.5 hover:bg-primary/20 rounded transition-colors"
      >
        {muted ? (
          <VolumeX className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Volume2 className="w-4 h-4 text-primary" />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={muted ? 0 : volume * 100}
        onChange={(e) => handleVolumeChange(e.target.value / 100)}
        className="w-24 h-2 bg-secondary rounded-full cursor-pointer accent-primary"
      />
      <span className="text-xs font-mono text-muted-foreground w-6 text-right">
        {Math.round((muted ? 0 : volume) * 100)}%
      </span>
    </div>
  );
}