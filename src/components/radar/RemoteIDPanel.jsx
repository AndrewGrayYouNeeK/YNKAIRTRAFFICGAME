import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RemoteIDPanel({ drones }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-3.5 h-3.5 text-primary" />
          <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">
            REMOTE ID BROADCAST
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{drones.filter(d => d.category !== "Unidentified").length} verified</span>
      </div>
      <ScrollArea className="h-48">
        <div className="p-2 space-y-1">
          <AnimatePresence>
            {drones.map((drone) => {
              const hasRID = drone.category !== "Unidentified";
              return (
                <motion.div
                  key={drone.id}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {hasRID ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 blip-animate" />
                    )}
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-semibold block">{drone.id}</span>
                      <span className="text-[9px] text-muted-foreground truncate block">{drone.model}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] font-mono text-muted-foreground">{drone.frequency}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono ${hasRID ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}
                    >
                      {hasRID ? "RID OK" : "NO RID"}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {drones.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6 font-mono">No signals detected</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}