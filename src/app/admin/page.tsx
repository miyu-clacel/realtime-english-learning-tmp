"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Plus, Play, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_QUIZ_QUESTIONS,
  DEFAULT_TIME_LIMIT_SECONDS,
  MIN_TIME_LIMIT_SECONDS,
  QUESTION_COUNT,
  formatTimeLimit,
  minutesToSeconds,
} from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/types";

interface CreatedRoom {
  id: string;
  name: string;
  createdAt: number;
  questions: QuizQuestion[];
  timeLimitSeconds: number;
}

interface RoomStatus {
  phase: "lobby" | "quiz" | "ranking";
  participantCount: number;
  participants: string[];
  submittedCount: number;
  submittedUsers: string[];
}

type QuestionDraft = Omit<QuizQuestion, "id">;

function createDefaultDrafts(): QuestionDraft[] {
  return DEFAULT_QUIZ_QUESTIONS.map(({ sentence, answer, hint }) => ({
    sentence,
    answer,
    hint,
  }));
}

export default function AdminPage() {
  const [roomName, setRoomName] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    String(DEFAULT_TIME_LIMIT_SECONDS / 60)
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(createDefaultDrafts);
  const [createdRooms, setCreatedRooms] = useState<CreatedRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [roomStatuses, setRoomStatuses] = useState<Record<string, RoomStatus>>(
    {}
  );
  const [startingId, setStartingId] = useState<string | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const fetchRoomStatus = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setRoomStatuses((prev) => ({
        ...prev,
        [roomId]: {
          phase: data.status.phase,
          participantCount: data.status.participantCount,
          participants: data.status.participants,
          submittedCount: data.status.submittedCount ?? 0,
          submittedUsers: data.status.submittedUsers ?? [],
        },
      }));
    } catch {
      // ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (createdRooms.length === 0) return;

    createdRooms.forEach((room) => {
      fetchRoomStatus(room.id);
    });

    const interval = setInterval(() => {
      createdRooms.forEach((room) => {
        fetchRoomStatus(room.id);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [createdRooms, fetchRoomStatus]);

  const handleStartQuiz = async (roomId: string) => {
    setStartingId(roomId);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "テストの開始に失敗しました");
        return;
      }
      await fetchRoomStatus(roomId);
    } catch {
      setError("接続エラーが発生しました");
    } finally {
      setStartingId(null);
    }
  };

  const handleRevealResults = async (roomId: string) => {
    setRevealingId(roomId);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/reveal`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "結果の表示に失敗しました");
        return;
      }
      await fetchRoomStatus(roomId);
    } catch {
      setError("接続エラーが発生しました");
    } finally {
      setRevealingId(null);
    }
  };

  const phaseLabel = (phase: RoomStatus["phase"]) => {
    switch (phase) {
      case "lobby":
        return "待機中";
      case "quiz":
        return "進行中";
      case "ranking":
        return "結果発表";
    }
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionDraft,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = roomName.trim();
    if (!trimmed) {
      setError("ルーム名を入力してください");
      return;
    }

    const minutes = Number(timeLimitMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || !Number.isInteger(minutes)) {
      setError("制限時間は1分以上の整数（分）で入力してください");
      return;
    }

    const timeLimitSeconds = minutesToSeconds(minutes);
    if (timeLimitSeconds < MIN_TIME_LIMIT_SECONDS) {
      setError(`制限時間は${formatTimeLimit(MIN_TIME_LIMIT_SECONDS)}以上にしてください`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          timeLimitSeconds,
          questions: questions.map((q, i) => ({ ...q, id: i + 1 })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "ルームの作成に失敗しました");
        return;
      }

      const data = await res.json();
      setCreatedRooms((prev) => [data.room, ...prev]);
      setRoomName("");
      setTimeLimitMinutes(String(DEFAULT_TIME_LIMIT_SECONDS / 60));
      setQuestions(createDefaultDrafts());
    } catch {
      setError("接続エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const copyRoomId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          トップに戻る
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">管理者ダッシュボード</h1>
          <p className="text-muted-foreground text-sm">
            テスト問題を設定してルームを作成し、参加者が揃ったらテストを開始してください
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新しいルームを作成
            </CardTitle>
            <CardDescription>
              ルーム名と{QUESTION_COUNT}問の穴埋め問題を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roomName">ルーム名</Label>
                <Input
                  id="roomName"
                  placeholder="例: 英語テスト A組"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">制限時間（分）</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  placeholder="例: 3"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                />
                {Number.isFinite(Number(timeLimitMinutes)) &&
                  Number(timeLimitMinutes) >= 1 && (
                    <p className="text-xs text-muted-foreground">
                      = {formatTimeLimit(minutesToSeconds(Number(timeLimitMinutes)))}
                    </p>
                  )}
                <p className="text-xs text-muted-foreground">
                  1分 = 60秒。時間切れ時は自動で結果表示。それ以外は管理者が「結果を表示」で一斉公開
                </p>
              </div>

              <div className="space-y-4">
                <Label>テスト問題（全{QUESTION_COUNT}問）</Label>
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="space-y-3 p-4 rounded-lg border bg-muted/20"
                  >
                    <p className="text-sm font-semibold text-muted-foreground">
                      問題 {index + 1}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor={`sentence-${index}`}>問題文</Label>
                      <Input
                        id={`sentence-${index}`}
                        placeholder="例: I ___ to school every day."
                        value={question.sentence}
                        onChange={(e) =>
                          updateQuestion(index, "sentence", e.target.value)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        空欄は「___」で表してください
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`answer-${index}`}>正解</Label>
                      <Input
                        id={`answer-${index}`}
                        placeholder="例: go"
                        value={question.answer}
                        onChange={(e) =>
                          updateQuestion(index, "answer", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`hint-${index}`}>ヒント</Label>
                      <Input
                        id={`hint-${index}`}
                        placeholder="例: 毎日学校へ「行く」"
                        value={question.hint}
                        onChange={(e) =>
                          updateQuestion(index, "hint", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "作成中..." : "ルームを作成"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {createdRooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>作成したルーム</CardTitle>
              <CardDescription>
                ルームIDを共有し、準備ができたらテストを開始してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {createdRooms.map((room) => {
                const status = roomStatuses[room.id];
                const canStart =
                  !status || status.phase === "lobby" || status.phase === "ranking";

                return (
                  <div
                    key={room.id}
                    className="p-3 rounded-lg border bg-muted/30 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{room.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge className="font-mono tracking-widest bg-muted text-foreground">
                            {room.id}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {room.questions.length}問 ·{" "}
                            {formatTimeLimit(room.timeLimitSeconds)}
                          </span>
                          {status && (
                            <Badge className="text-xs bg-secondary text-secondary-foreground">
                              {phaseLabel(status.phase)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyRoomId(room.id)}
                      >
                        {copiedId === room.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {status && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          {status.participantCount} 人が参加中
                          {status.participants.length > 0 && (
                            <span>({status.participants.join(", ")})</span>
                          )}
                        </div>
                        {status.phase === "quiz" && (
                          <p>
                            提出済み: {status.submittedCount} /{" "}
                            {status.participantCount} 人
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleStartQuiz(room.id)}
                      disabled={!canStart || startingId === room.id}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {startingId === room.id
                        ? "開始中..."
                        : status?.phase === "quiz"
                          ? "テスト進行中"
                          : status?.phase === "ranking"
                            ? "もう一度テストを開始"
                            : "テストを開始"}
                    </Button>

                    {status?.phase === "quiz" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleRevealResults(room.id)}
                        disabled={revealingId === room.id}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        {revealingId === room.id
                          ? "表示中..."
                          : "結果を一斉に表示"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
