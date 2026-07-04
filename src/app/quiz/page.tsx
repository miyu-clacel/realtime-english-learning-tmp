"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  Clock,
  LogOut,
  Users,
} from "lucide-react";
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
import { AnswerReview } from "@/components/answer-review";
import { RankingReveal } from "@/components/ranking-reveal";
import { useQuizWebSocket } from "@/hooks/use-quiz-websocket";
import { formatTimeLimit } from "@/lib/quiz";

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
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function QuizPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [reviewVisible, setReviewVisible] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);

  answersRef.current = answers;

  const {
    connected,
    phase,
    questions,
    timeLimitSeconds,
    endsAt,
    timeUp,
    participants,
    submittedCount,
    totalCount,
    submittedUsers,
    myResults,
    myScore,
    rankings,
    wsError,
    submitAnswers,
  } = useQuizWebSocket(roomId, username);

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
    if (phase === "quiz") {
      setAnswers({});
      setError("");
      setReviewVisible(false);
      submittedRef.current = false;
    }
    if (phase === "lobby") {
      setAnswers({});
      setError("");
      setReviewVisible(false);
      submittedRef.current = false;
    }
    if (phase === "waiting" || phase === "ranking") {
      submittedRef.current = true;
    }
    if (phase === "ranking") {
      setReviewVisible(false);
    }
  }, [phase]);

  const autoSubmitIfNeeded = useCallback(() => {
    if (submittedRef.current || questions.length === 0) return;
    submittedRef.current = true;
    submitAnswers(
      Object.fromEntries(
        questions.map((q) => [q.id, (answersRef.current[q.id] ?? "").trim()])
      )
    );
  }, [questions, submitAnswers]);

  useEffect(() => {
    if (!endsAt || phase !== "quiz") {
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      const remaining = endsAt - Date.now();
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0) autoSubmitIfNeeded();
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt, phase, autoSubmitIfNeeded]);

  useEffect(() => {
    if (timeUp && phase === "quiz") {
      autoSubmitIfNeeded();
    }
  }, [timeUp, phase, autoSubmitIfNeeded]);

  useEffect(() => {
    if (wsError) setError(wsError);
  }, [wsError]);

  const revealKey = useMemo(
    () => `${roomId}:${rankings.map((r) => `${r.username}-${r.score}`).join(",")}`,
    [roomId, rankings]
  );

  const handleRevealComplete = useCallback(() => {
    setReviewVisible(true);
  }, []);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const unanswered = questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      setError(`未回答の問題があります（${unanswered.length}問）`);
      return;
    }

    submitAnswers(
      Object.fromEntries(questions.map((q) => [q.id, answers[q.id].trim()]))
    );
  };

  const handleLeave = () => {
    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("username");
    router.push("/");
  };

  if (!roomId || !username) return null;

  const questionsReady = questions.length > 0;

  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">単語テスト</h1>
            <p className="text-xs text-muted-foreground font-mono">{roomId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="gap-1.5 bg-muted text-foreground">
              <Users className="w-3.5 h-3.5" />
              {participants.length} 人参加
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleLeave}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {!connected && (
          <p className="text-center text-sm text-muted-foreground py-4">
            接続中...
          </p>
        )}

        {connected && phase === "lobby" && (
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-2">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <CardTitle>待機中</CardTitle>
              <CardDescription>
                管理者がテストを開始するまでお待ちください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeLimitSeconds !== null && (
                <p className="text-center text-sm text-muted-foreground">
                  制限時間: {formatTimeLimit(timeLimitSeconds)}
                </p>
              )}
              {participants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    参加中 ({participants.length}人)
                  </p>
                  {participants.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-center p-2 rounded-lg border bg-muted/20 text-sm"
                    >
                      {name}
                      {name === username && (
                        <span className="text-muted-foreground ml-1">(あなた)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {connected && !questionsReady && phase === "quiz" && (
          <p className="text-center text-sm text-muted-foreground py-4">
            問題を読み込み中...
          </p>
        )}

        {connected && questionsReady && phase === "quiz" && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    問題（全{questions.length}問）
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    制限時間内に回答してください。結果は管理者が一斉に表示します
                  </CardDescription>
                </div>
                {remainingMs !== null && (
                  <Badge
                    className={`shrink-0 font-mono text-sm tabular-nums ${
                      remainingMs <= 10000
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {formatRemaining(remainingMs)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {participants.length > 0 && (
                <div className="mb-6 p-3 rounded-lg border bg-muted/20 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">参加中:</span>
                  {participants.map((name) => (
                    <Badge key={name} className="text-xs bg-secondary text-secondary-foreground">
                      {name}
                      {name === username && " (あなた)"}
                    </Badge>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="space-y-3 p-4 rounded-lg border bg-muted/20"
                  >
                    <Label
                      htmlFor={`q-${question.id}`}
                      className="text-base font-medium leading-relaxed"
                    >
                      <span className="text-muted-foreground mr-2">
                        Q{index + 1}.
                      </span>
                      {renderSentence(question.sentence)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ヒント: {question.hint}
                    </p>
                    <Input
                      id={`q-${question.id}`}
                      placeholder="英単語を入力"
                      value={answers[question.id] ?? ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      autoComplete="off"
                    />
                  </div>
                ))}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full">
                  回答を提出
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {connected && phase === "waiting" && (
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-2">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <CardTitle>回答を提出しました</CardTitle>
              <CardDescription>
                管理者が結果を表示するまでお待ちください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {submittedCount}
                  <span className="text-lg text-muted-foreground font-normal">
                    {" "}
                    / {totalCount}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  提出済み
                </p>
              </div>

              <div className="space-y-2">
                {participants.map((name) => {
                  const done = submittedUsers.includes(name);
                  return (
                    <div
                      key={name}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        done ? "bg-green-500/5 border-green-500/30" : "bg-muted/20"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {name}
                        {name === username && (
                          <span className="text-muted-foreground ml-1">
                            (あなた)
                          </span>
                        )}
                      </span>
                      {done ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {connected && phase === "ranking" && (
          <>
            <RankingReveal
              rankings={rankings}
              username={username}
              revealKey={revealKey}
              onRevealComplete={handleRevealComplete}
            />
            <AnswerReview
              questions={questions}
              myResults={myResults}
              myScore={myScore}
              revealed={reviewVisible}
            />
          </>
        )}
      </div>
    </main>
  );
}
