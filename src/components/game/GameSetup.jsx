import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, MapPin, AlertCircle } from "lucide-react";

export default function GameSetup({ onStartGame }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          setError("Location access denied. Using default location.");
          setLocation({ lat: 40.7128, lng: -74.006 });
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported. Using default location.");
      setLocation({ lat: 40.7128, lng: -74.006 });
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (location) {
      onStartGame({
        player_lat: location.lat,
        player_lng: location.lng,
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
          <Gamepad2 className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Paranormal Defense</h1>
          <p className="text-sm text-muted-foreground font-mono">Survive waves of paranormal attacks at your location</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            This game uses your real location. Ghosts will approach from your current GPS coordinates.
          </p>

          {error && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-400">{error}</p>
            </div>
          )}

          {location ? (
            <div className="bg-primary/5 border border-primary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono text-primary font-semibold">LOCATION LOCKED</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
          ) : (
            <Button
              onClick={requestLocation}
              disabled={loading}
              className="w-full font-mono text-xs"
            >
              {loading ? "Requesting location..." : "Enable GPS Location"}
            </Button>
          )}
        </div>

        <Button
          onClick={handleStart}
          disabled={!location}
          size="lg"
          className="w-full font-mono text-sm gap-2"
        >
          <Gamepad2 className="w-4 h-4" />
          START GAME
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Wave 1 of 5 • Survive all waves to win • AR mode required to eliminate ghosts
        </p>
      </div>
    </div>
  );
}