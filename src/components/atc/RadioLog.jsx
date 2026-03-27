import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

export default function RadioLog({ entries }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-full">
      <h3 className="font-mono text-xs font-semibold text-foreground/80 mb-3">RADIO LOG</h3>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {entries.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground">Awaiting transmissions...</p>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[10px] font-mono ${
                  entry.type === "pilot"
                    ? "text-cyan-400"
                    : "text-green-400"
                }`}
              >
                <span className="text-muted-foreground">[{entry.timestamp}]</span> {entry.pilot}: {entry.message}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}