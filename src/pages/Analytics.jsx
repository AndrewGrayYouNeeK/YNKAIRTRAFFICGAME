import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { TrendingUp, Clock, AlertTriangle, Radio, Activity, Zap } from "lucide-react";

const detectionTimeline = [
  { time: "00:00", detections: 1, threats: 0 },
  { time: "02:00", detections: 0, threats: 0 },
  { time: "04:00", detections: 2, threats: 1 },
  { time: "06:00", detections: 4, threats: 1 },
  { time: "08:00", detections: 7, threats: 2 },
  { time: "10:00", detections: 5, threats: 1 },
  { time: "12:00", detections: 9, threats: 3 },
  { time: "14:00", detections: 11, threats: 4 },
  { time: "16:00", detections: 8, threats: 2 },
  { time: "18:00", detections: 13, threats: 5 },
  { time: "20:00", detections: 6, threats: 2 },
  { time: "22:00", detections: 3, threats: 1 },
];

const categoryData = [
  { name: "Consumer", value: 42, color: "#0ea5e9" },
  { name: "Commercial", value: 23, color: "#22c55e" },
  { name: "Unidentified", value: 18, color: "#ef4444" },
  { name: "Enterprise", value: 12, color: "#eab308" },
  { name: "Professional", value: 5, color: "#a855f7" },
];

const threatByDay = [
  { day: "Mon", none: 12, low: 5, medium: 3, high: 1, critical: 0 },
  { day: "Tue", none: 8, low: 6, medium: 4, high: 2, critical: 1 },
  { day: "Wed", none: 15, low: 4, medium: 2, high: 1, critical: 0 },
  { day: "Thu", none: 10, low: 7, medium: 5, high: 3, critical: 1 },
  { day: "Fri", none: 14, low: 8, medium: 6, high: 2, critical: 2 },
  { day: "Sat", none: 20, low: 10, medium: 4, high: 1, critical: 0 },
  { day: "Sun", none: 18, low: 9, medium: 3, high: 0, critical: 0 },
];

const directionData = [
  { direction: "N", value: 15 },
  { direction: "NE", value: 22 },
  { direction: "E", value: 18 },
  { direction: "SE", value: 30 },
  { direction: "S", value: 12 },
  { direction: "SW", value: 8 },
  { direction: "W", value: 10 },
  { direction: "NW", value: 14 },
];

const kpiData = [
  { label: "Total Detections (24h)", value: 69, change: "+12%", icon: Activity, color: "text-primary" },
  { label: "Threat Events", value: 19, change: "+4%", icon: AlertTriangle, color: "text-orange-400" },
  { label: "Avg Detection Range", value: "847m", change: "-3%", icon: Radio, color: "text-green-400" },
  { label: "Mean Response Time", value: "1.4s", change: "-18%", icon: Zap, color: "text-yellow-400" },
];

const tooltipStyle = {
  backgroundColor: "hsl(222, 44%, 8%)",
  border: "1px solid hsl(215, 25%, 16%)",
  borderRadius: "8px",
  color: "hsl(210, 40%, 92%)",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
};

export default function Analytics() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Analytics</h2>
        <p className="text-xs font-mono text-muted-foreground">Threat intelligence & detection patterns</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className={`text-[10px] font-mono ${kpi.change.startsWith("+") && kpi.label !== "Threat Events" ? "text-green-400" : kpi.label === "Threat Events" && kpi.change.startsWith("+") ? "text-orange-400" : "text-green-400"}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-xl font-bold font-mono">{kpi.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Detection Timeline */}
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

        {/* Drone Categories */}
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

        {/* Approach Direction */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 mb-4">APPROACH VECTORS</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={directionData}>
              <PolarGrid stroke="hsl(215, 25%, 16%)" />
              <PolarAngleAxis dataKey="direction" tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} />
              <Radar dataKey="value" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%)" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Threat by Day */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 mb-4">THREAT BREAKDOWN BY DAY</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={threatByDay} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 16%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="none" stackId="a" fill="#22c55e" opacity={0.6} radius={[0, 0, 0, 0]} name="None" />
              <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low" />
              <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
              <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}