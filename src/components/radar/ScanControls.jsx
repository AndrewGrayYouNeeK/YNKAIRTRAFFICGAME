import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export default function ScanControls({ scanning, onToggleScan, onReset }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={scanning ? "destructive" : "default"}
        onClick={onToggleScan}
        className="font-mono text-xs gap-2"
      >
        {scanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        {scanning ? "PAUSE" : "SCAN"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onReset}
        className="font-mono text-xs gap-2"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        RESET
      </Button>
    </div>
  );
}