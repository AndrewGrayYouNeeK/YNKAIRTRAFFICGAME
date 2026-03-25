import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Plus, Search, AlertTriangle, CheckCircle2, 
  Clock, MapPin, Radio, User, ChevronRight, ShieldAlert
} from "lucide-react";

const INCIDENTS = [
  {
    id: "INC-2244",
    title: "Unauthorized Overflight – VIP Residence",
    severity: "critical",
    status: "open",
    droneId: "UAV-B3M2R7",
    model: "DJI Mavic 3 Pro",
    date: "2026-03-23 19:42",
    location: "Sector 4 – North Perimeter",
    bearing: "NW",
    distance: 85,
    altitude: 42,
    duration: "14 min",
    responder: "Team Alpha",
    description: "Drone approached VIP residence from NW at low altitude. Remote ID traced to repeat offender added to watchlist. Operator believed to be within 400m of perimeter. Authorities notified.",
    actions: ["Remote ID captured and logged", "Watchlist entry created", "Law enforcement notified", "Perimeter camera tasked to track"],
  },
  {
    id: "INC-2243",
    title: "High-Speed Intrusion – Restricted Zone",
    severity: "high",
    status: "resolved",
    droneId: "UAV-T6L4H8",
    model: "FPV Racing Drone",
    date: "2026-03-22 23:15",
    location: "Sector 7 – East Gate",
    bearing: "E",
    distance: 150,
    altitude: 35,
    duration: "3 min",
    responder: "Night Watch",
    description: "High-speed unidentified FPV drone entered restricted airspace at 78 km/h. No Remote ID broadcast. Drone exited before interception could be coordinated. Classified as hostile intrusion.",
    actions: ["RF signature logged", "No Remote ID — flagged as non-compliant", "Incident escalated to command", "Watchlist entry created"],
  },
  {
    id: "INC-2240",
    title: "Prolonged Surveillance Activity",
    severity: "medium",
    status: "investigating",
    droneId: "UAV-K7R3M2",
    model: "DJI Mavic 3",
    date: "2026-03-20 14:30",
    location: "Sector 1 – Main Campus",
    bearing: "S",
    distance: 320,
    altitude: 85,
    duration: "34 min",
    responder: "Team Bravo",
    description: "Consumer drone conducted extended overflight of main campus for 34 minutes. Remote ID captured. Operator tracking in progress. Drone returned to same position twice — suspected systematic surveillance.",
    actions: ["Remote ID logged", "Operator location estimated via triangulation", "Security footage reviewed", "Investigation ongoing"],
  },
  {
    id: "INC-2235",
    title: "False Alarm – Authorized Operator",
    severity: "low",
    status: "resolved",
    droneId: "UAV-A2B8N6",
    model: "Skydio X10",
    date: "2026-03-18 09:10",
    location: "Sector 2 – West Zone",
    bearing: "W",
    distance: 890,
    altitude: 200,
    duration: "22 min",
    responder: "Team Alpha",
    description: "Detection triggered alert for enterprise drone in airspace. Subsequent investigation confirmed authorized infrastructure inspection operator. Remote ID matched registered permit.",
    actions: ["Remote ID verified against permit database", "Cleared as authorized", "Alert threshold adjusted for sector"],
  },
];

const severityStyles = {
  critical: { badge: "bg-red-500/10 text-red-400 border-red-500/30", dot: "bg-red-400", icon: ShieldAlert },
  high: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/30", dot: "bg-orange-400", icon: AlertTriangle },
  medium: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400", icon: AlertTriangle },
  low: { badge: "bg-green-500/10 text-green-400 border-green-500/30", dot: "bg-green-400", icon: CheckCircle2 },
};

const statusStyles = {
  open: "bg-red-500/10 text-red-400 border-red-500/30",
  investigating: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function Incidents() {
  const [incidents, setIncidents] = useState(INCIDENTS);
  const [selected, setSelected] = useState(INCIDENTS[0]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = incidents.filter((inc) => {
    const matchSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.droneId.toLowerCase().includes(search.toLowerCase()) ||
      inc.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Incident Log</h2>
          <p className="text-xs font-mono text-muted-foreground">Security events, investigations & resolutions</p>
        </div>
        <Button size="sm" className="font-mono text-xs gap-2">
          <Plus className="w-3.5 h-3.5" /> NEW INCIDENT
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search incidents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono text-xs bg-card border-border" />
        </div>
        <div className="flex gap-1">
          {["all", "open", "investigating", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono transition-all ${filterStatus === s ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* List */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-mono text-xs font-semibold tracking-wider">{filtered.length} INCIDENTS</h3>
          </div>
          <ScrollArea className="h-[560px]">
            <div className="p-2 space-y-1.5">
              {filtered.map((inc) => {
                const SevIcon = severityStyles[inc.severity]?.icon;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelected(inc)}
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${selected?.id === inc.id ? "border-primary/40 bg-primary/5" : "border-border hover:bg-secondary/20"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${severityStyles[inc.severity]?.dot}`} />
                        <div>
                          <span className="text-[10px] font-mono text-muted-foreground">{inc.id}</span>
                          <p className="text-xs font-medium text-foreground leading-snug mt-0.5">{inc.title}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-3.5">
                      <Badge variant="outline" className={`text-[9px] ${statusStyles[inc.status]}`}>{inc.status}</Badge>
                      <Badge variant="outline" className={`text-[9px] ${severityStyles[inc.severity]?.badge}`}>{inc.severity}</Badge>
                      <span className="text-[9px] font-mono text-muted-foreground ml-auto">{inc.date.split(" ")[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Detail */}
        <div className="lg:col-span-7">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-5 space-y-4 h-full"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground">{selected.id}</span>
                    <h3 className="text-sm font-bold mt-0.5">{selected.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[selected.status]}`}>{selected.status.toUpperCase()}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${severityStyles[selected.severity]?.badge}`}>{selected.severity.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Drone ID", value: selected.droneId, icon: Radio },
                  { label: "Date/Time", value: selected.date, icon: Clock },
                  { label: "Location", value: selected.location, icon: MapPin },
                  { label: "Duration", value: selected.duration, icon: Clock },
                  { label: "Distance", value: `${selected.distance}m`, icon: AlertTriangle },
                  { label: "Responder", value: selected.responder, icon: User },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/30 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{item.label}</span>
                    </div>
                    <span className="text-xs font-mono font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/20 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-mono font-semibold">INCIDENT REPORT</span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">{selected.description}</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-mono font-semibold">ACTIONS TAKEN</span>
                </div>
                <div className="space-y-1.5">
                  {selected.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p className="text-xs text-foreground/60">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}