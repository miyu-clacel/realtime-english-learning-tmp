"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Shield } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      sessionStorage.setItem("roomId", trimmed);
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
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">単語テスト</h1>
          <p className="text-muted-foreground text-sm">
            ルームIDを入力してテストに参加しましょう
          </p>
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

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "確認中..." : "入室する"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="w-4 h-4" />
            管理者の方はこちら
          </Link>
        </div>
      </div>
    </main>
  );
}
