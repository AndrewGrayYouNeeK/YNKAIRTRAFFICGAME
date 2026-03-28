import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radio, Eye, AlertTriangle, LogOut } from "lucide-react";

const eventIcons = {
  detected: { icon: Eye, color: "text-primary" },
  alert: { icon: AlertTriangle, color: "text-orange-400" },
  lost: { icon: LogOut, color: "text-muted-foreground" },
  signal: { icon: Radio, color: "text-green-400" },
};

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function ActivityLog({ events }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">
          ACTIVITY LOG
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {events.length} events
        </span>
      </div>
      <ScrollArea className="h-48">
        <div className="p-2 space-y-0.5">
          {events.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6 font-mono">
              No contacts on scope
            </div>
          ) : (
            events.map((event, i) => {
              const config = eventIcons[event.type] || eventIcons.signal;
              const EventIcon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/30 transition-colors"
                >
                  <EventIcon className={`w-3 h-3 ${config.color} shrink-0`} />
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                  <span className="text-[11px] text-foreground/70 truncate">{event.message}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}