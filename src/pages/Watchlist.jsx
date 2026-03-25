import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, Plus, Trash2, Search, ShieldAlert, Radio, 
  AlertTriangle, CheckCircle, Clock, Fingerprint
} from "lucide-react";

const INITIAL_WATCHLIST = [
  {
    id: "wl-1",
    droneId: "UAV-X9F1P4",
    model: "Unknown UAV",
    brand: "Unknown",
    category: "Unidentified",
    reason: "Non-Remote ID compliant, erratic flight pattern near restricted airspace",
    priority: "critical",
    addedDate: "2026-03-20",
    lastSeen: "2026-03-25",
    sightings: 4,
    frequency: "5.8 GHz",
    notes: "Suspected surveillance drone — approach from SW sector",
  },
  {
    id: "wl-2",
    droneId: "UAV-T6L4H8",
    model: "FPV Racing Drone",
    brand: "Custom Build",
    category: "Unidentified",
    reason: "High-speed unauthorized intrusion, exceeded 80 km/h in restricted zone",
    priority: "high",
    addedDate: "2026-03-21",
    lastSeen: "2026-03-24",
    sightings: 2,
    frequency: "5.8 GHz",
    notes: "Night-time incursion, likely operator within 500m",
  },
  {
    id: "wl-3",
    droneId: "UAV-B3M2R7",
    model: "DJI Mavic 3 Pro",
    brand: "DJI",
    category: "Consumer",
    reason: "Repeated overflights of VIP residence — Remote ID linked to repeat offender",
    priority: "medium",
    addedDate: "2026-03-22",
    lastSeen: "2026-03-23",
    sightings: 6,
    frequency: "2.4 GHz",
    notes: "Operator likely local. Cross-reference with incident report #2244.",
  },
];

const priorityStyles = {
  critical: { badge: "bg-red-500/10 text-red-400 border-red-500/30", dot: "bg-red-400" },
  high: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
  medium: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
  low: { badge: "bg-green-500/10 text-green-400 border-green-500/30", dot: "bg-green-400" },
};

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(INITIAL_WATCHLIST);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newEntry, setNewEntry] = useState({ droneId: "", model: "", reason: "", priority: "high", notes: "" });

  const filtered = watchlist.filter(
    (w) =>
      w.droneId.toLowerCase().includes(search.toLowerCase()) ||
      w.model.toLowerCase().includes(search.toLowerCase()) ||
      w.reason.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newEntry.droneId) return;
    setWatchlist((prev) => [
      {
        ...newEntry,
        id: `wl-${Date.now()}`,
        brand: "Unknown",
        category: "Unidentified",
        addedDate: new Date().toISOString().split("T")[0],
        lastSeen: "Never",
        sightings: 0,
        frequency: "Unknown",
      },
      ...prev,
    ]);
    setNewEntry({ droneId: "", model: "", reason: "", priority: "high", notes: "" });
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Watchlist</h2>
          <p className="text-xs font-mono text-muted-foreground">Track flagged & suspect drone IDs</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="font-mono text-xs gap-2">
          <Plus className="w-3.5 h-3.5" /> ADD ENTRY
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-primary/20 rounded-xl p-4 space-y-3"
          >
            <h3 className="font-mono text-xs font-semibold tracking-wider text-primary">NEW WATCHLIST ENTRY</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Drone ID (e.g. UAV-X9F1P4)"
                value={newEntry.droneId}
                onChange={(e) => setNewEntry({ ...newEntry, droneId: e.target.value })}
                className="font-mono text-xs bg-secondary/40 border-border"
              />
              <Input
                placeholder="Model (optional)"
                value={newEntry.model}
                onChange={(e) => setNewEntry({ ...newEntry, model: e.target.value })}
                className="font-mono text-xs bg-secondary/40 border-border"
              />
              <select
                value={newEntry.priority}
                onChange={(e) => setNewEntry({ ...newEntry, priority: e.target.value })}
                className="px-3 py-2 rounded-md bg-secondary/40 border border-border text-xs font-mono text-foreground"
              >
                <option value="critical">Critical Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <Input
              placeholder="Reason for flagging..."
              value={newEntry.reason}
              onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
              className="font-mono text-xs bg-secondary/40 border-border"
            />
            <Input
              placeholder="Notes (optional)..."
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              className="font-mono text-xs bg-secondary/40 border-border"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="font-mono text-xs">Confirm Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="font-mono text-xs">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by ID, model, or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 font-mono text-xs bg-card border-border"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* List */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold tracking-wider">FLAGGED CONTACTS</h3>
            <span className="text-[10px] font-mono text-muted-foreground">{filtered.length} entries</span>
          </div>
          <ScrollArea className="h-[520px]">
            <div className="p-2 space-y-1.5">
              <AnimatePresence>
                {filtered.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${
                      selected?.id === entry.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-secondary/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full mt-0.5 ${priorityStyles[entry.priority]?.dot}`} />
                        <div>
                          <span className="font-mono text-xs font-bold">{entry.droneId}</span>
                          <div className="text-[10px] text-muted-foreground">{entry.model}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className={`text-[9px] ${priorityStyles[entry.priority]?.badge}`}>
                          {entry.priority.toUpperCase()}
                        </Badge>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{entry.reason}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" /> {entry.sightings} sightings
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {entry.lastSeen}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Detail */}
        <div className="lg:col-span-7">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-5 space-y-4 h-full"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className={`w-4 h-4 ${selected.priority === "critical" ? "text-red-400" : selected.priority === "high" ? "text-orange-400" : "text-yellow-400"}`} />
                    <h3 className="font-mono text-sm font-bold">{selected.droneId}</h3>
                    <Badge variant="outline" className={`text-[10px] ${priorityStyles[selected.priority]?.badge}`}>{selected.priority.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-foreground/80">{selected.model}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selected.brand} · {selected.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sightings", value: selected.sightings, icon: Eye },
                  { label: "Last Seen", value: selected.lastSeen, icon: Clock },
                  { label: "Frequency", value: selected.frequency, icon: Radio },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/40 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.label}</span>
                    </div>
                    <div className="text-xs font-mono font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-mono font-semibold text-foreground/80">REASON FLAGGED</span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">{selected.reason}</p>
              </div>

              {selected.notes && (
                <div className="bg-secondary/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Fingerprint className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono font-semibold text-foreground/80">INTEL NOTES</span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground pt-2 border-t border-border">
                <CheckCircle className="w-3 h-3" />
                <span>Added to watchlist: {selected.addedDate}</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-card border border-border rounded-xl h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                <Eye className="w-5 h-5 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground font-mono">Select an entry to view details</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Flagged contacts and intel notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}