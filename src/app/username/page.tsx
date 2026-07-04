"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
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

export default function UsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedRoomId = sessionStorage.getItem("roomId");
    if (!storedRoomId) {
      router.replace("/");
      return;
    }
    setRoomId(storedRoomId);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = username.trim();
    if (!trimmed) {
      setError("ユーザー名を入力してください");
      return;
    }
    if (trimmed.length > 20) {
      setError("ユーザー名は20文字以内にしてください");
      return;
    }

    sessionStorage.setItem("username", trimmed);
    router.push("/quiz");
  };

  if (!roomId) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
              <User className="w-6 h-6" />
            </div>
            <CardTitle>ユーザー名を設定</CardTitle>
            <CardDescription>
              ルーム <span className="font-mono font-semibold">{roomId}</span>{" "}
              のテストに参加します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ユーザー名</Label>
                <Input
                  id="username"
                  placeholder="表示名を入力"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full">
                テストを始める
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
