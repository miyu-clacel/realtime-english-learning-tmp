"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, MessageSquare, Skull, Trophy, Users } from "lucide-react";
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
import { useSurviveWebSocket } from "@/hooks/use-survive-websocket";
import { MAX_LAST_WORDS_LENGTH } from "@/lib/survive";
import type { SurviveLastWord } from "@/lib/types";

function renderSentence(sentence: string) {
  const parts = sentence.split("___");
  return (
    <>
      {parts[0]}
      <span className="inline-block min-w-[6rem] border-b-2 border-primary/40 mx-1 align-bottom" />
      {parts[1]}
    </>
  );
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  return `${totalSec}秒`;
}

function SurvivorSidebar({
  survivors,
  aliveCount,
  totalParticipants,
  username,
}: {
  survivors: string[];
  aliveCount: number;
  totalParticipants: number;
  username: string;
}) {
  return (
    <aside className="w-full lg:w-48 shrink-0">
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            参加者
          </CardTitle>
          <CardDescription className="text-xs">
            総数 {totalParticipants}人 · 生存 {aliveCount}人
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">生存者</p>
          {survivors.length === 0 ? (
            <p className="text-xs text-muted-foreground">生存者なし</p>
          ) : (
            survivors.map((name) => (
              <div
                key={name}
                className={`text-sm px-2 py-1 rounded-md ${
                  name === username
                    ? "bg-primary/10 text-primary font-medium"
                    : "bg-muted/40"
                }`}
              >
                {name}
                {name === username && (
                  <span className="text-xs ml-1 opacity-70">(あなた)</span>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function LastWordsPanel({
  lastWords,
  username,
}: {
  lastWords: SurviveLastWord[];
  username: string;
}) {
  if (lastWords.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          遺言
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lastWords.map((entry) => (
          <div
            key={entry.username}
            className={`p-2 rounded-md text-sm ${
              entry.username === username
                ? "bg-primary/10 border border-primary/20"
                : "bg-muted/40"
            }`}
          >
            <p className="font-medium text-xs text-muted-foreground mb-0.5">
              {entry.username}
              {entry.username === username && " (あなた)"}
              <span className="ml-1">· 第{entry.round}問</span>
            </p>
            <p className="leading-snug">{entry.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LastWordsForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(message.trim());
    setMessage("");
  };

  return (
    <Card className="border-dashed border-destructive/40 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          遺言を残す
        </CardTitle>
        <CardDescription>
          脱落しました。最後のメッセージを残せます（{MAX_LAST_WORDS_LENGTH}文字以内）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="遺言を入力..."
            maxLength={MAX_LAST_WORDS_LENGTH}
            disabled={disabled}
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={disabled || !message.trim()}>
            遺言を送る
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SurvivePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const {
    connected,
    phase,
    question,
    questionNumber,
    totalQuestions,
    endsAt,
    survivors,
    aliveCount,
    totalParticipants,
    eliminated,
    correctAnswer,
    submitted,
    isAlive,
    finalResults,
    lastWords,
    hasLastWords,
    wsError,
    submitAnswer,
    submitLastWords,
  } = useSurviveWebSocket(roomId, username);

  useEffect(() => {
    const storedRoomId = sessionStorage.getItem("roomId");
    const storedUsername = sessionStorage.getItem("username");
    if (!storedRoomId || !storedUsername) {
      router.replace("/");
      return;
    }
    setRoomId(storedRoomId);
    setUsername(storedUsername);
  }, [router]);

  useEffect(() => {
    if (wsError) setError(wsError);
  }, [wsError]);

  useEffect(() => {
    if (phase !== "question" || !endsAt) {
      setRemainingMs(null);
      return;
    }

    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt, phase]);

  useEffect(() => {
    if (phase === "question") {
      setAnswer("");
      setError("");
    }
  }, [phase, questionNumber]);

  const handleLeave = () => {
    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("gameType");
    router.push("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError("回答を入力してください");
      return;
    }
    submitAnswer(answer.trim());
  };

  if (!roomId || !username) return null;

  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-orange-500/5">
      <div className="max-w-4xl mx-auto py-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              🔥 Survive
            </h1>
            <p className="text-xs text-muted-foreground font-mono">{roomId}</p>
            {phase !== "lobby" && totalParticipants > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                参加者 {totalParticipants}人 · 生存 {aliveCount}人
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLeave}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {!connected && (
          <p className="text-center text-sm text-muted-foreground py-8">
            接続中...
          </p>
        )}

        {connected && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-52 shrink-0">
              <SurvivorSidebar
                survivors={survivors}
                aliveCount={aliveCount}
                totalParticipants={totalParticipants}
                username={username}
              />
              {phase !== "lobby" && (
                <LastWordsPanel lastWords={lastWords} username={username} />
              )}
            </div>

            <div className="flex-1 space-y-4">
              {phase === "lobby" && (
                <Card>
                  <CardHeader className="text-center">
                    <Clock className="w-10 h-10 mx-auto text-primary animate-pulse" />
                    <CardTitle>待機中</CardTitle>
                    <CardDescription>
                      管理者がゲームを開始するまでお待ちください
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center text-sm text-muted-foreground">
                    全{totalQuestions}問 · 各問15秒 · 正解者のみ生存
                  </CardContent>
                </Card>
              )}

              {phase === "question" && question && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-muted text-foreground">
                        第 {questionNumber} / {totalQuestions} 問
                      </Badge>
                      {remainingMs !== null && isAlive && (
                        <Badge
                          className={
                            remainingMs <= 5000
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-foreground"
                          }
                        >
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {formatRemaining(remainingMs)}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-relaxed pt-2">
                      {renderSentence(question.sentence)}
                    </CardTitle>
                    <CardDescription>{question.hint}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isAlive ? (
                      <div className="space-y-4">
                        <p className="text-center text-muted-foreground">
                          脱落しました。次の問題を見守りましょう
                        </p>
                        {!hasLastWords && (
                          <LastWordsForm onSubmit={submitLastWords} />
                        )}
                      </div>
                    ) : submitted ? (
                      <p className="text-center text-primary py-4 font-medium">
                        回答済み — 結果を待っています...
                      </p>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="answer">回答</Label>
                          <Input
                            id="answer"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="空欄に入る語句"
                            autoFocus
                            disabled={remainingMs === 0}
                          />
                        </div>
                        {error && (
                          <p className="text-sm text-destructive">{error}</p>
                        )}
                        <Button type="submit" className="w-full">
                          提出
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {phase === "round_result" && (
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>ラウンド結果</CardTitle>
                    <CardDescription>
                      第 {questionNumber} 問 — 正解:{" "}
                      <span className="font-semibold text-foreground">
                        {correctAnswer}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-1">
                      <p className="text-3xl font-bold text-primary">
                        {aliveCount}
                        <span className="text-lg text-muted-foreground font-normal">
                          / {totalParticipants}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">生存者</p>
                    </div>
                    {eliminated.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Skull className="w-4 h-4" />
                          脱落
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {eliminated.map((name) => (
                            <Badge key={name} className="bg-muted text-foreground">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isAlive && (
                      <div className="space-y-4">
                        <p className="text-center text-destructive text-sm">
                          あなたはこのラウンドで脱落しました
                        </p>
                        {!hasLastWords && (
                          <LastWordsForm onSubmit={submitLastWords} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {phase === "final" && (
                <Card>
                  <CardHeader className="text-center">
                    <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
                    <CardTitle>最終結果</CardTitle>
                    <CardDescription>
                      全{totalQuestions}問終了 — 参加者 {totalParticipants}人中{" "}
                      {aliveCount}人が生存
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {finalResults.map((result) => (
                        <div
                          key={result.username}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            result.username === username
                              ? "bg-primary/5 border-primary/30"
                              : "bg-muted/20"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {result.username}
                              {result.username === username && (
                                <span className="text-muted-foreground ml-1">
                                  (あなた)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              正解 {result.correctCount} / {result.totalRounds} 問
                            </p>
                          </div>
                          <Badge
                            className={
                              result.survived
                                ? "bg-green-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {result.survived
                              ? "生存"
                              : `第${result.eliminatedAtRound}問で脱落`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {!isAlive && !hasLastWords && (
                      <LastWordsForm onSubmit={submitLastWords} />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
