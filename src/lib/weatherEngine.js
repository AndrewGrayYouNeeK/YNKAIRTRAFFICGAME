// Open-Meteo weather engine — no API key required
// https://open-meteo.com/

const WEATHER_CODES = {
  0:  { label: "Clear",            icon: "☀️",  visibility: 30, turbulence: 0   },
  1:  { label: "Mainly Clear",     icon: "🌤️", visibility: 25, turbulence: 0   },
  2:  { label: "Partly Cloudy",    icon: "⛅",  visibility: 20, turbulence: 0.1 },
  3:  { label: "Overcast",         icon: "☁️", visibility: 10, turbulence: 0.2 },
  45: { label: "Foggy",            icon: "🌫️", visibility: 1,  turbulence: 0.1 },
  48: { label: "Rime Fog",         icon: "🌫️", visibility: 0.5,turbulence: 0.2 },
  51: { label: "Light Drizzle",    icon: "🌦️", visibility: 8,  turbulence: 0.2 },
  55: { label: "Heavy Drizzle",    icon: "🌧️", visibility: 4,  turbulence: 0.4 },
  61: { label: "Light Rain",       icon: "🌧️", visibility: 6,  turbulence: 0.3 },
  65: { label: "Heavy Rain",       icon: "🌧️", visibility: 2,  turbulence: 0.6 },
  71: { label: "Light Snow",       icon: "🌨️", visibility: 4,  turbulence: 0.3 },
  75: { label: "Heavy Snow",       icon: "❄️", visibility: 1,  turbulence: 0.5 },
  80: { label: "Rain Showers",     icon: "🌦️", visibility: 5,  turbulence: 0.5 },
  85: { label: "Snow Showers",     icon: "🌨️", visibility: 2,  turbulence: 0.6 },
  95: { label: "Thunderstorm",     icon: "⛈️", visibility: 1,  turbulence: 1.0 },
  99: { label: "Severe Tstorm",    icon: "🌪️", visibility: 0.5,turbulence: 1.5 },
};

export function getWeatherMeta(code) {
  return WEATHER_CODES[code] || WEATHER_CODES[0];
}

export async function fetchAirportWeather(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weathercode,precipitation` +
    `&wind_speed_unit=kn` +
    `&temperature_unit=fahrenheit` +
    `&forecast_days=1`;

  const res = await fetch(url);
  const json = await res.json();
  const c = json.current;

  const meta = getWeatherMeta(c.weathercode);

  return {
    temp: Math.round(c.temperature_2m),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),           // knots
    windDir: Math.round(c.wind_direction_10m),          // degrees
    precipitation: c.precipitation,
    weatherCode: c.weathercode,
    label: meta.label,
    icon: meta.icon,
    visibility: meta.visibility,                        // nm
    turbulenceIndex: meta.turbulence,
    time: c.time,
  };
}

// Convert wx data into gameplay effects
export function computeWeatherEffects(wx, airport, weatherMachineIntensity = 0) {
  const base = wx || { windSpeed: 5, windDir: 270, visibility: 30, turbulenceIndex: 0 };

  // Weather machine can crank things up (0–1 slider)
  const intensityBoost = weatherMachineIntensity * airport.weatherMultiplier;

  const windSpeed    = Math.round(base.windSpeed + intensityBoost * 40);
  const turbulence   = Math.min(3, base.turbulenceIndex + intensityBoost * 2);
  const visibility   = Math.max(0.1, base.visibility - intensityBoost * 20);
  const crosswind    = Math.round(windSpeed * Math.abs(Math.sin((base.windDir * Math.PI) / 180)));
  const icing        = base.temp < 32 && base.humidity > 80;
  const windshear    = turbulence > 0.8;
  const lowVis       = visibility < 1;

  // METAR-style string
  const metar = buildMetar(base, windSpeed, visibility, airport);

  return { windSpeed, windDir: base.windDir, turbulence, visibility, crosswind, icing, windshear, lowVis, metar };
}

function buildMetar(wx, windSpeed, visibility, airport) {
  const dir = String(wx.windDir || 0).padStart(3, "0");
  const spd = String(windSpeed).padStart(2, "0");
  const vis = visibility >= 10 ? "9999" : `${Math.round(visibility * 1000)}M`;
  const conds = wx.weatherCode >= 95 ? "TSRA" : wx.weatherCode >= 80 ? "SHRA" : wx.weatherCode >= 71 ? "SN" : wx.weatherCode >= 61 ? "RA" : wx.weatherCode >= 45 ? "FG" : "";
  return `${airport.id} ${dir}${spd}KT ${vis} ${conds} TEMP${wx.temp || "??"}F QNH2992INS`.trim();
}

// Weather machine presets
export const WEATHER_PRESETS = [
  { id: "clear",    label: "Clear CAVOK",   icon: "☀️", intensity: 0,    code: 0  },
  { id: "overcast", label: "Overcast",      icon: "☁️", intensity: 0.2,  code: 3  },
  { id: "fog",      label: "Dense Fog",     icon: "🌫️", intensity: 0.5,  code: 45 },
  { id: "rain",     label: "Heavy Rain",    icon: "🌧️", intensity: 0.5,  code: 65 },
  { id: "snow",     label: "Blizzard",      icon: "❄️", intensity: 0.7,  code: 75 },
  { id: "storm",    label: "Thunderstorm",  icon: "⛈️", intensity: 0.85, code: 95 },
  { id: "extreme",  label: "Extreme Storm", icon: "🌪️", intensity: 1.0,  code: 99 },
];