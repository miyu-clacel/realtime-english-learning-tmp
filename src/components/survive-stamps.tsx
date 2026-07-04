"use client";

import { useEffect, useState } from "react";
import type { SurviveStampEvent } from "@/lib/types";
import { SURVIVE_STAMPS } from "@/lib/survive";

interface StampPickerProps {
  onStamp: (stamp: string) => void;
  disabled?: boolean;
}

export function StampPicker({ onStamp, disabled }: StampPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-center text-muted-foreground">
        スタンプで盛り上げよう！
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SURVIVE_STAMPS.map((stamp) => (
          <button
            key={stamp}
            type="button"
            disabled={disabled}
            onClick={() => onStamp(stamp)}
            className="text-2xl w-11 h-11 rounded-full bg-muted/60 hover:bg-muted hover:scale-110 active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none"
            aria-label={`スタンプ ${stamp}`}
          >
            {stamp}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FloatingStamp extends SurviveStampEvent {
  left: number;
}

export function StampOverlay({ events }: { events: SurviveStampEvent[] }) {
  const [floating, setFloating] = useState<FloatingStamp[]>([]);

  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    const entry: FloatingStamp = {
      ...latest,
      left: 10 + Math.random() * 80,
    };
    setFloating((prev) => [...prev, entry]);
    const timer = setTimeout(() => {
      setFloating((prev) => prev.filter((item) => item.id !== entry.id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [events]);

  if (floating.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floating.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-8 flex flex-col items-center animate-stamp-float"
          style={{ left: `${item.left}%` }}
        >
          <span className="text-5xl drop-shadow-md">{item.stamp}</span>
          <span className="text-xs font-medium bg-background/80 px-2 py-0.5 rounded-full mt-1 shadow-sm">
            {item.username}
          </span>
        </div>
      ))}
    </div>
  );
}
