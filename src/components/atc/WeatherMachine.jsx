import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Wind, Eye, Thermometer, Droplets, AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAirportWeather, computeWeatherEffects, WEATHER_PRESETS } from "../../lib/weatherEngine";

export default function WeatherMachine({ airport, weatherIntensity, onIntensityChange, onWeatherUpdate }) {
  const [liveWx, setLiveWx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState("clear");
  const [effects, setEffects] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    const wx = await fetchAirportWeather(airport.lat, airport.lng);
    setLiveWx(wx);
    const fx = computeWeatherEffects(wx, airport, weatherIntensity);
    setEffects(fx);
    onWeatherUpdate(fx);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, [airport.id]);

  useEffect(() => {
    if (liveWx) {
      const fx = computeWeatherEffects(liveWx, airport, weatherIntensity);
      setEffects(fx);
      onWeatherUpdate(fx);
    }
  }, [weatherIntensity, airport]);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    onIntensityChange(preset.intensity);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          <h3 className="font-mono text-xs font-semibold text-foreground/80 tracking-wider">WEATHER MACHINE</h3>
        </div>
        <Button onClick={fetchWeather} disabled={loading} size="sm" variant="ghost" className="h-7 gap-1 text-[10px]">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Fetching..." : "Live Wx"}
        </Button>
      </div>

      {/* Live METAR */}
      {effects?.metar && (
        <div className="bg-black/40 rounded-lg px-3 py-2 font-mono text-[9px] text-cyan-300 leading-relaxed tracking-wider break-all">
          {effects.metar}
        </div>
      )}

      {/* Live Stats */}
      {liveWx && (
        <div className="grid grid-cols-3 gap-2">
          <StatChip icon={Wind}        label="Wind"  value={`${liveWx.windSpeed}kt ${liveWx.windDir}°`} />
          <StatChip icon={Eye}         label="Vis"   value={`${effects?.visibility?.toFixed(1) || "?"}nm`} warn={effects?.lowVis} />
          <StatChip icon={Thermometer} label="Temp"  value={`${liveWx.temp}°F`} />
          <StatChip icon={Droplets}    label="Hum"   value={`${liveWx.humidity}%`} />
          <StatChip icon={Zap}         label="Turb"  value={turbLabel(effects?.turbulence)} warn={effects?.turbulence > 0.8} />
          <StatChip icon={Wind}        label="Xwind" value={`${effects?.crosswind || 0}kt`} warn={effects?.crosswind > 15} />
        </div>
      )}

      {/* Alerts */}
      <AnimatePresence>
        {effects?.windshear && <Alert key="ws" msg="⚠ WINDSHEAR ALERT — exercise caution on approach" />}
        {effects?.icing && <Alert key="ice" msg="⚠ ICING CONDITIONS — verify anti-ice ON" />}
        {effects?.lowVis && <Alert key="vis" msg="⚠ LOW VISIBILITY — CAT II/III ops in effect" />}
      </AnimatePresence>

      {/* Intensity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">STORM INTENSITY</span>
          <span className="text-[10px] font-mono text-primary">{Math.round(weatherIntensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={weatherIntensity}
          onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) ${weatherIntensity * 100}%, hsl(var(--muted)) ${weatherIntensity * 100}%)`,
          }}
        />
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">QUICK PRESETS</span>
        <div className="grid grid-cols-2 gap-1.5">
          {WEATHER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all border ${
                activePreset === preset.id
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-secondary/50 border-border hover:border-primary/30 text-muted-foreground"
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value, warn }) {
  return (
    <div className={`rounded-lg p-2 border ${warn ? "bg-red-900/20 border-red-500/30" : "bg-secondary/50 border-border"}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`w-2.5 h-2.5 ${warn ? "text-red-400" : "text-muted-foreground"}`} />
        <span className={`text-[9px] font-mono ${warn ? "text-red-400" : "text-muted-foreground"}`}>{label}</span>
      </div>
      <div className={`text-[11px] font-mono font-bold ${warn ? "text-red-300" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Alert({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-1.5"
    >
      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
      <span className="text-[10px] font-mono text-red-300">{msg}</span>
    </motion.div>
  );
}

function turbLabel(t) {
  if (!t || t < 0.2) return "SMOOTH";
  if (t < 0.5) return "LIGHT";
  if (t < 1.0) return "MOD";
  if (t < 1.5) return "SEVERE";
  return "EXTREME";
}