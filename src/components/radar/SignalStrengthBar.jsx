import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Signal } from "lucide-react";

export default function SignalStrengthBar({ drones }) {
  const data = drones
    .map((d) => ({
      id: d.id.replace("UAV-", ""),
      signal: Math.abs(d.signal),
      raw: d.signal,
      threat: d.threatLevel,
    }))
    .sort((a, b) => a.signal - b.signal);

  const threatColors = {
    none: "#22c55e",
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    critical: "#ef4444",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Signal className="w-3.5 h-3.5 text-primary" />
        <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">RF SIGNAL STRENGTH</h3>
      </div>
      {drones.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6 font-mono">No signals</div>
      ) : (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} barSize={16} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 16%)" vertical={false} />
            <XAxis
              dataKey="id"
              tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(215, 20%, 50%)", fontFamily: "var(--font-mono)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 44%, 8%)",
                border: "1px solid hsl(215, 25%, 16%)",
                borderRadius: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "hsl(210, 40%, 92%)",
              }}
              formatter={(val, name, props) => [`${props.payload.raw} dBm`, "Signal"]}
            />
            <Bar dataKey="signal" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={threatColors[entry.threat]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}