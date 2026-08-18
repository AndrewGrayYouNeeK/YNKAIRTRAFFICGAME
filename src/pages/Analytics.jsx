import React from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import { TrendingUp, AlertTriangle, Radio, Activity, Zap } from "lucide-react";
import { format, subHours, startOfHour } from "date-fns";

const tooltipStyle = {
  backgroundColor: "hsl(222, 44%, 8%)",
  border: "1px solid hsl(215, 25%, 16%)",
  borderRadius: "8px",
  color: "hsl(210, 40%, 92%)",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
};

const categoryColors = {
  Consumer: "#0ea5e9",
  Commercial: "#22c55e",
  Unidentified: "#ef4444",
  Enterprise: "#eab308",
  Professional: "#a855f7",
};

export default function Analytics() {
  const { data: detections = [], isLoading } = useQuery({
    queryKey: ["drone-detections-analytics"],
    queryFn: () => api.entities.DroneDetection.list("-created_date", 500),
  });

  // 24h detection timeline (by 2-hour buckets)
  const detectionTimeline = Array.from({ length: 12 }, (_, i) => {
    const hour = subHours(new Date(), (11 - i) * 2);
    const label = format(startOfHour(hour), "HH:mm");
    const bucketStart = subHours(startOfHour(hour), 0).getTime();
    const bucketEnd = bucketStart + 2 * 60 * 60 * 1000;
    const bucket = detections.filter((d) => {
      const t = new Date(d.created_date).getTime();
      return t >= bucketStart && t < bucketEnd;
    });
    const threats = bucket.filter((d) => ["medium", "high", "critical"].includes(d.threat_level)).length;
    return { time: label, detections: bucket.length, threats };
  });

  // Category breakdown
  const categoryCounts = detections.reduce((acc, d) => {
    const cat = d.category || "Unidentified";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const total = detections.length || 1;
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value: Math.round((value / total) * 100),
    color: categoryColors[name] || "#64748b",
  }));

  // Threat breakdown (last 7 days by day)
  const threatByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = format(d, "EEE");
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    const dayDets = detections.filter((det) => {
      const t = new Date(det.created_date).getTime();
      return t >= dayStart && t < dayEnd;
    });
    return {
      day: dayLabel,
      none: dayDets.filter((d) => d.threat_level === "none" || !d.threat_level).length,
      low: dayDets.filter((d) => d.threat_level === "low").length,
      medium: dayDets.filter((d) => d.threat_level === "medium").length,
      high: dayDets.filter((d) => d.threat_level === "high").length,
      critical: dayDets.filter((d) => d.threat_level === "critical").length,
    };
  });

  // KPIs
  const last24h = detections.filter((d) => Date.now() - new Date(d.created_date).getTime() < 86400000);
  const threatEvents = last24h.filter((d) => ["medium", "high", "critical"].includes(d.threat_level)).length;
  const avgRange = last24h.length > 0
    ? Math.round(last24h.reduce((s, d) => s + (d.max_distance || 0), 0) / last24h.length)
    : 0;

  const kpiData = [
    { label: "Total Detections (24h)", value: last24h.length, icon: Activity, color: "text-primary" },
    { label: "Threat Events", value: threatEvents, icon: AlertTriangle, color: "text-orange-400" },
    { label: "Avg Detection Range", value: avgRange ? `${avgRange}m` : "—", icon: Radio, color: "text-green-400" },
    { label: "Total Records", value: detections.length, icon: Zap, color: "text-yellow-400" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Analytics</h2>
        <p className="text-xs font-mono text-muted-foreground">Threat intelligence & detection patterns</p>
      </div>

      {detections.length === 0 ? (
        <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center h-64 text-center">
          <Activity className="w-10 h-10 text-primary/20 mb-3" />
          <p className="text-sm text-muted-foreground font-mono">No detection data yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Analytics will populate as drones are detected and saved</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpiData.map((kpi) => (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className="text-xl font-bold font-mono">{kpi.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> 24H DETECTION TIMELINE
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={detectionTimeline}>
                  <defs>
                    <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="thrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 16%)" />
                  <XAxis dataKey="time" tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="detections" stroke="hsl(199, 89%, 48%)" strokeWidth={2} fill="url(#detGrad)" name="Detections" />
                  <Area type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} fill="url(#thrGrad)" name="Threats" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {categoryData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 mb-4">DRONE CATEGORIES</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-[11px] text-muted-foreground">{cat.name}</span>
                        </div>
                        <span className="text-[11px] font-mono font-semibold">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 mb-4">THREAT BREAKDOWN BY DAY</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={threatByDay} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 16%)" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="none" stackId="a" fill="#22c55e" opacity={0.6} name="None" />
                  <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low" />
                  <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
                  <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
                  <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}