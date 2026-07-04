"use client";

import { useCallback, useEffect, useState, use } from "react";
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
import {
  DEFAULT_SURVIVE_PRESET,
  SURVIVE_PRESET_LIST,
  SURVIVE_QUESTION_COUNT,
  SURVIVE_ROUND_SECONDS,
  type SurvivePresetId,
} from "@/lib/survive";
import { GAMES, isGameType } from "@/lib/games";
import type { GameType, QuizQuestion } from "@/lib/types";

interface CreatedRoom {
  id: string;
  name: string;
  createdAt: number;
  gameType: GameType;
  questions: QuizQuestion[];
  timeLimitSeconds: number;
  survivePreset?: SurvivePresetId;
}

interface RoomStatus {
  phase: string;
  participantCount: number;
  participants: string[];
  submittedCount: number;
  submittedUsers: string[];
  aliveCount?: number;
  totalParticipants?: number;
  questionNumber?: number;
  totalQuestions?: number;
}

type QuestionDraft = Omit<QuizQuestion, "id">;

function createDefaultDrafts(): QuestionDraft[] {
  return DEFAULT_QUIZ_QUESTIONS.map(({ sentence, answer, hint }) => ({
    sentence,
    answer,
    hint,
  }));
}

export default function AdminGamePage({
  params,
}: {
  params: Promise<{ gameType: string }>;
}) {
  const { gameType: gameTypeParam } = use(params);

  if (!isGameType(gameTypeParam)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-destructive">無効なゲームです</p>
      </main>
    );
  }

  return <AdminGameContent gameType={gameTypeParam} />;
}

function AdminGameContent({ gameType }: { gameType: GameType }) {
  const game = GAMES[gameType];
  const isSurvive = gameType === "survive";

  const [roomName, setRoomName] = useState("");
  const [survivePreset, setSurvivePreset] =
    useState<SurvivePresetId>(DEFAULT_SURVIVE_PRESET);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    String(DEFAULT_TIME_LIMIT_SECONDS / 60)
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(createDefaultDrafts);
  const [createdRooms, setCreatedRooms] = useState<CreatedRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [roomStatuses, setRoomStatuses] = useState<Record<string, RoomStatus>>({});
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
          aliveCount: data.status.aliveCount,
          totalParticipants: data.status.totalParticipants,
          questionNumber: data.status.questionNumber,
          totalQuestions: data.status.totalQuestions,
        },
      }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (createdRooms.length === 0) return;
    createdRooms.forEach((room) => fetchRoomStatus(room.id));
    const interval = setInterval(() => {
      createdRooms.forEach((room) => fetchRoomStatus(room.id));
    }, 2000);
    return () => clearInterval(interval);
  }, [createdRooms, fetchRoomStatus]);

  const handleStart = async (roomId: string) => {
    setStartingId(roomId);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "開始に失敗しました");
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

  const phaseLabel = (phase: string) => {
    if (isSurvive) {
      switch (phase) {
        case "lobby":
          return "待機中";
        case "question":
          return "出題中";
        case "round_result":
          return "結果表示";
        case "final":
          return "終了";
        default:
          return phase;
      }
    }
    switch (phase) {
      case "lobby":
        return "待機中";
      case "quiz":
        return "進行中";
      case "ranking":
        return "結果発表";
      default:
        return phase;
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

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: trimmed,
        gameType,
      };

      if (isSurvive) {
        body.preset = survivePreset;
      } else {
        const minutes = Number(timeLimitMinutes);
        if (!Number.isFinite(minutes) || minutes < 1 || !Number.isInteger(minutes)) {
          setError("制限時間は1分以上の整数（分）で入力してください");
          setLoading(false);
          return;
        }
        const timeLimitSeconds = minutesToSeconds(minutes);
        if (timeLimitSeconds < MIN_TIME_LIMIT_SECONDS) {
          setError(`制限時間は${formatTimeLimit(MIN_TIME_LIMIT_SECONDS)}以上にしてください`);
          setLoading(false);
          return;
        }
        body.timeLimitSeconds = timeLimitSeconds;
        body.questions = questions.map((q, i) => ({ ...q, id: i + 1 }));
      }

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "ルームの作成に失敗しました");
        return;
      }

      const data = await res.json();
      setCreatedRooms((prev) => [data.room, ...prev]);
      setRoomName("");
      if (!isSurvive) {
        setTimeLimitMinutes(String(DEFAULT_TIME_LIMIT_SECONDS / 60));
        setQuestions(createDefaultDrafts());
      }
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
          ゲーム選択に戻る
        </Link>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{game.emoji}</span>
            <h1 className="text-2xl font-bold tracking-tight">{game.name}</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            ルームを作成し、参加者が揃ったらゲームを開始してください
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新しいルームを作成
            </CardTitle>
            <CardDescription>
              {isSurvive
                ? `${SURVIVE_QUESTION_COUNT}問・各問${SURVIVE_ROUND_SECONDS}秒 · 難易度プリセットを選んでください`
                : `ルーム名と${QUESTION_COUNT}問の穴埋め問題を設定してください`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roomName">ルーム名</Label>
                <Input
                  id="roomName"
                  placeholder={isSurvive ? "例: Survive 練習会" : "例: 英語テスト A組"}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  autoFocus
                />
              </div>

              {isSurvive && (
                <div className="space-y-3">
                  <Label>難易度プリセット</Label>
                  <div className="grid gap-2">
                    {SURVIVE_PRESET_LIST.map((preset) => (
                      <label
                        key={preset.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          survivePreset === preset.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/20 hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="survivePreset"
                          value={preset.id}
                          checked={survivePreset === preset.id}
                          onChange={() => setSurvivePreset(preset.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-sm">{preset.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!isSurvive && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">制限時間（分）</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min={1}
                      max={60}
                      step={1}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(e.target.value)}
                    />
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
                        <Input
                          placeholder="問題文（___で空欄）"
                          value={question.sentence}
                          onChange={(e) =>
                            updateQuestion(index, "sentence", e.target.value)
                          }
                        />
                        <Input
                          placeholder="正解"
                          value={question.answer}
                          onChange={(e) =>
                            updateQuestion(index, "answer", e.target.value)
                          }
                        />
                        <Input
                          placeholder="ヒント"
                          value={question.hint}
                          onChange={(e) =>
                            updateQuestion(index, "hint", e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

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
            </CardHeader>
            <CardContent className="space-y-3">
              {createdRooms.map((room) => {
                const status = roomStatuses[room.id];
                const canStart =
                  !status ||
                  status.phase === "lobby" ||
                  status.phase === "final" ||
                  status.phase === "ranking";

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
                          {isSurvive && room.survivePreset && (
                            <Badge className="text-xs bg-secondary text-secondary-foreground">
                              {SURVIVE_PRESET_LIST.find((p) => p.id === room.survivePreset)
                                ?.label ?? room.survivePreset}
                            </Badge>
                          )}
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
                          {status.participantCount} 人が接続中
                          {isSurvive && status.totalParticipants !== undefined &&
                            status.totalParticipants > 0 && (
                            <span>
                              · 参加者 {status.totalParticipants}人 · 生存{" "}
                              {status.aliveCount ?? 0}人
                            </span>
                          )}
                          {isSurvive && status.questionNumber !== undefined &&
                            status.questionNumber > 0 && (
                              <span>
                                · 第{status.questionNumber}/{status.totalQuestions}問
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleStart(room.id)}
                      disabled={!canStart || startingId === room.id}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {startingId === room.id
                        ? "開始中..."
                        : canStart
                          ? "ゲームを開始"
                          : "進行中"}
                    </Button>

                    {!isSurvive && status?.phase === "quiz" && (
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
