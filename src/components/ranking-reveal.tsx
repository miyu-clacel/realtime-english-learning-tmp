"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Medal, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RankingEntry } from "@/lib/types";

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

interface RankingRevealProps {
  rankings: RankingEntry[];
  username: string;
  revealKey: string;
  onRevealComplete?: () => void;
}

export function RankingReveal({
  rankings,
  username,
  revealKey,
  onRevealComplete,
}: RankingRevealProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scoreRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const [displayScores, setDisplayScores] = useState<number[]>(
    () => rankings.map(() => 0)
  );
  const [animationDone, setAnimationDone] = useState(false);

  onRevealCompleteRef.current = onRevealComplete;

  const revealOrder = useMemo(
    () => [...rankings].sort((a, b) => b.rank - a.rank),
    [rankings]
  );

  const displayOrder = useMemo(
    () => [...rankings].sort((a, b) => a.rank - b.rank),
    [rankings]
  );

  useLayoutEffect(() => {
    if (rankings.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 1, y: 0, scale: 1 });
      }
      rowRefs.current.forEach((row) => {
        if (row) gsap.set(row, { opacity: 1, x: 0 });
      });
      setDisplayScores(rankings.map((r) => r.score));
      setAnimationDone(true);
      onRevealCompleteRef.current?.();
      return;
    }

    setDisplayScores(rankings.map(() => 0));
    setAnimationDone(false);

    const scoreState = rankings.map(() => ({ value: 0 }));
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          setAnimationDone(true);
          onRevealCompleteRef.current?.();
        },
      });

      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: -20, scale: 0.95 });
      }
      rowRefs.current.forEach((row) => {
        if (row) gsap.set(row, { opacity: 0, x: -40 });
      });

      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
      });
      tl.to({}, { duration: 0.8 });

      revealOrder.forEach((entry) => {
        const displayIndex = displayOrder.findIndex(
          (r) => r.username === entry.username
        );
        const row = rowRefs.current[displayIndex];
        const scoreEl = scoreRefs.current[displayIndex];
        const state = scoreState[displayIndex];

        if (!row) return;

        tl.to(row, { opacity: 1, x: 0, duration: 0.5 });
        tl.to(
          state,
          {
            value: entry.score,
            duration: 0.8,
            snap: { value: 1 },
            onUpdate: () => {
              setDisplayScores((prev) => {
                const next = [...prev];
                next[displayIndex] = state.value;
                return next;
              });
              if (scoreEl) {
                scoreEl.textContent = String(Math.round(state.value));
              }
            },
          },
          "<0.1"
        );

        if (entry.rank === 1) {
          tl.to(row, {
            scale: 1.04,
            boxShadow: "0 0 24px rgba(234, 179, 8, 0.35)",
            duration: 0.35,
            ease: "elastic.out(1, 0.5)",
          });
          tl.to(row, {
            scale: 1,
            boxShadow: "0 0 0 rgba(234, 179, 8, 0)",
            duration: 0.3,
          });
        }

        tl.to({}, { duration: 0.4 });
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [revealKey, rankings, revealOrder, displayOrder]);

  return (
    <Card ref={containerRef}>
      <CardHeader className="text-center" ref={headerRef}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-600 mx-auto mb-2">
          <Trophy className="w-7 h-7" />
        </div>
        <CardTitle>結果発表</CardTitle>
        <CardDescription>
          {animationDone
            ? "全員の回答が揃いました！"
            : "順位を発表しています..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayOrder.map((entry, index) => {
          const isMe = entry.username === username;
          const isFirst = entry.rank === 1;

          return (
            <div
              key={entry.username}
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                isMe
                  ? "border-primary/50 bg-primary/5"
                  : isFirst && animationDone
                    ? "border-yellow-500/40 bg-yellow-500/5"
                    : "bg-muted/20"
              }`}
              style={{ opacity: 0 }}
            >
              <div className="shrink-0">{rankIcon(entry.rank)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {entry.username}
                  {isMe && (
                    <span className="text-xs text-muted-foreground ml-2">
                      あなた
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold tabular-nums">
                  <span
                    ref={(el) => {
                      scoreRefs.current[index] = el;
                    }}
                  >
                    {displayScores[index] ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    / {entry.totalQuestions}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">正解数</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
