"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAMES, isGameType } from "@/lib/games";
import type { GameType } from "@/lib/types";

export default function JoinPage({
  params,
}: {
  params: Promise<{ gameType: string }>;
}) {
  const { gameType: gameTypeParam } = use(params);
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isGameType(gameTypeParam)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-destructive">無効なゲームです</p>
      </main>
    );
  }

  const gameType = gameTypeParam as GameType;
  const game = GAMES[gameType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = roomId.trim().toUpperCase();
    if (!trimmed) {
      setError("ルームIDを入力してください");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${trimmed}`);
      if (!res.ok) {
        setError("ルームが見つかりません。IDを確認してください。");
        return;
      }

      const data = await res.json();
      if (data.room.gameType !== gameType) {
        setError(`このルームは${GAMES[data.room.gameType as GameType]?.name ?? "別"}用です`);
        return;
      }

      sessionStorage.setItem("roomId", trimmed);
      sessionStorage.setItem("gameType", gameType);
      router.push("/username");
    } catch {
      setError("接続エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ゲーム選択に戻る
        </Link>

        <div className="text-center space-y-2">
          <div className="text-4xl">{game.emoji}</div>
          <h1 className="text-2xl font-bold tracking-tight">{game.name}</h1>
          <p className="text-muted-foreground text-sm">{game.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ルームに参加</CardTitle>
            <CardDescription>
              管理者から共有されたルームIDを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">ルームID</Label>
                <Input
                  id="roomId"
                  placeholder="例: A1B2C3D4"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="font-mono tracking-widest"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "確認中..." : "入室する"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
