"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuizQuestionPublic, QuizResult } from "@/lib/types";

interface AnswerReviewProps {
  questions: QuizQuestionPublic[];
  myResults: QuizResult[];
  myScore: number | null;
  revealed: boolean;
}

export function AnswerReview({
  questions,
  myResults,
  myScore,
  revealed,
}: AnswerReviewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!revealed || !cardRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(cardRef.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [revealed]);

  if (!revealed || myResults.length === 0) return null;

  return (
    <Card ref={cardRef} style={{ opacity: 0 }}>
      <CardHeader>
        <CardTitle>あなたの答え合わせ</CardTitle>
        <CardDescription>
          正解数: {myScore} / {questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => {
          const result = myResults.find((r) => r.questionId === question.id)!;

          return (
            <div
              key={question.id}
              className={`p-4 rounded-lg border ${
                result.isCorrect
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                {result.isCorrect ? (
                  <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    Q{index + 1}.{" "}
                    {question.sentence.replace("___", "______")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {question.hint}
                  </p>
                </div>
              </div>
              <div className="ml-7 flex flex-wrap gap-2 text-sm">
                <Badge
                  className={
                    result.isCorrect
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-destructive text-destructive-foreground border-transparent"
                  }
                >
                  あなたの回答: {result.userAnswer}
                </Badge>
                {!result.isCorrect && (
                  <Badge className="bg-muted text-foreground">
                    正解: {result.correctAnswer}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
