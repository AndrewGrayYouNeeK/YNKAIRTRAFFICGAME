import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, Plus, Search, AlertTriangle, CheckCircle2,
  Clock, MapPin, Radio, User, ChevronRight, ShieldAlert
} from "lucide-react";

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
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "", severity: "medium", status: "open",
    drone_id: "", location: "", responder: "", description: ""
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => base44.entities.Incident.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setShowAdd(false);
      setNewIncident({ title: "", severity: "medium", status: "open", drone_id: "", location: "", responder: "", description: "" });
      setSelected(created);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setSelected(updated);
    },
  });

  const filtered = incidents.filter((inc) => {
    const matchSearch =
      inc.title?.toLowerCase().includes(search.toLowerCase()) ||
      inc.drone_id?.toLowerCase().includes(search.toLowerCase());
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
        <Button size="sm" className="font-mono text-xs gap-2" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5" /> NEW INCIDENT
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-primary/20 rounded-xl p-4 space-y-3"
          >
            <h3 className="font-mono text-xs font-semibold tracking-wider text-primary">NEW INCIDENT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Incident title..." value={newIncident.title} onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })} className="font-mono text-xs bg-secondary/40 border-border" />
              <Input placeholder="Drone ID (optional)" value={newIncident.drone_id} onChange={(e) => setNewIncident({ ...newIncident, drone_id: e.target.value })} className="font-mono text-xs bg-secondary/40 border-border" />
              <Input placeholder="Location / Sector" value={newIncident.location} onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })} className="font-mono text-xs bg-secondary/40 border-border" />
              <Input placeholder="Responder (optional)" value={newIncident.responder} onChange={(e) => setNewIncident({ ...newIncident, responder: e.target.value })} className="font-mono text-xs bg-secondary/40 border-border" />
              <select value={newIncident.severity} onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })} className="px-3 py-2 rounded-md bg-secondary/40 border border-border text-xs font-mono text-foreground">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={newIncident.status} onChange={(e) => setNewIncident({ ...newIncident, status: e.target.value })} className="px-3 py-2 rounded-md bg-secondary/40 border border-border text-xs font-mono text-foreground">
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <Input placeholder="Description..." value={newIncident.description} onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })} className="font-mono text-xs bg-secondary/40 border-border" />
            <div className="flex gap-2">
              <Button size="sm" disabled={!newIncident.title || createMutation.isPending} onClick={() => createMutation.mutate({ ...newIncident, date: new Date().toISOString() })} className="font-mono text-xs">
                {createMutation.isPending ? "Saving..." : "Create Incident"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="font-mono text-xs">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="lg:col-span-5 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-mono text-xs font-semibold tracking-wider">{filtered.length} INCIDENTS</h3>
          </div>
          <ScrollArea className="h-[560px]">
            <div className="p-2 space-y-1.5">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <FileText className="w-8 h-8 text-primary/20 mb-2" />
                  <p className="text-xs text-muted-foreground font-mono">No incidents logged</p>
                </div>
              ) : filtered.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelected(inc)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${selected?.id === inc.id ? "border-primary/40 bg-primary/5" : "border-border hover:bg-secondary/20"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${severityStyles[inc.severity]?.dot}`} />
                      <div>
                        <p className="text-xs font-medium text-foreground leading-snug">{inc.title}</p>
                        {inc.drone_id && <span className="text-[10px] font-mono text-muted-foreground">{inc.drone_id}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-3.5">
                    <Badge variant="outline" className={`text-[9px] ${statusStyles[inc.status]}`}>{inc.status}</Badge>
                    <Badge variant="outline" className={`text-[9px] ${severityStyles[inc.severity]?.badge}`}>{inc.severity}</Badge>
                    <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                      {inc.created_date ? new Date(inc.created_date).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="lg:col-span-7">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold mt-0.5">{selected.title}</h3>
                  {selected.drone_id && <span className="text-[10px] font-mono text-muted-foreground">{selected.drone_id}</span>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={selected.status}
                    onChange={(e) => updateMutation.mutate({ id: selected.id, data: { status: e.target.value } })}
                    className="px-2 py-1 rounded bg-secondary/40 border border-border text-[10px] font-mono text-foreground"
                  >
                    <option value="open">OPEN</option>
                    <option value="investigating">INVESTIGATING</option>
                    <option value="resolved">RESOLVED</option>
                  </select>
                  <Badge variant="outline" className={`text-[10px] ${severityStyles[selected.severity]?.badge}`}>{selected.severity?.toUpperCase()}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Date/Time", value: selected.date ? new Date(selected.date).toLocaleString() : new Date(selected.created_date).toLocaleString(), icon: Clock },
                  { label: "Location", value: selected.location || "—", icon: MapPin },
                  { label: "Distance", value: selected.distance ? `${selected.distance}m` : "—", icon: AlertTriangle },
                  { label: "Responder", value: selected.responder || "—", icon: User },
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

              {selected.description && (
                <div className="bg-secondary/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono font-semibold">INCIDENT REPORT</span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.actions?.length > 0 && (
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
              )}
            </motion.div>
          ) : (
            <div className="bg-card border border-border rounded-xl h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground font-mono">Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}