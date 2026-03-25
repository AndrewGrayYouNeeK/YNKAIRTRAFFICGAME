import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, AlertTriangle, Gauge, ArrowUp, Radio, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const threatBadgeStyles = {
  none: "bg-green-500/10 text-green-400 border-green-500/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function History() {
  const { data: detections = [], isLoading } = useQuery({
    queryKey: ["drone-detections"],
    queryFn: () => base44.entities.DroneDetection.list("-created_date", 50),
    initialData: [],
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Detection History</h2>
        <p className="text-xs font-mono text-muted-foreground">
          Past drone detections & encounters
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : detections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground">No detection history yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
              Drone encounters will be logged here automatically
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-180px)]">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] tracking-wider">DRONE ID</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider">MODEL</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider">THREAT</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider">DISTANCE</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider">ALTITUDE</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider">SPEED</TableHead>
                  <TableHead className="font-mono text-[10px] tracking-wider">DETECTED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detections.map((d) => (
                  <TableRow key={d.id} className="border-border">
                    <TableCell className="font-mono text-xs font-semibold">{d.drone_id}</TableCell>
                    <TableCell>
                      <div className="text-xs">{d.model}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{d.brand}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-mono ${threatBadgeStyles[d.threat_level || "none"]}`}>
                        {(d.threat_level || "none").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.max_distance}m</TableCell>
                    <TableCell className="font-mono text-xs">{d.max_altitude}m</TableCell>
                    <TableCell className="font-mono text-xs">{d.max_speed} km/h</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {format(new Date(d.created_date), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}