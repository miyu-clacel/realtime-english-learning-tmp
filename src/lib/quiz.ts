import type { QuizQuestion, QuizQuestionPublic, QuizResult } from "./types";

export const QUESTION_COUNT = 5;
export const DEFAULT_TIME_LIMIT_SECONDS = 180;
export const MIN_TIME_LIMIT_SECONDS = 30;
export const MAX_TIME_LIMIT_SECONDS = 3600;

/** 秒数を「1分」「1分30秒」「45秒」形式で表示 */
export function formatTimeLimit(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (sec === 0) return `${min}分`;
  return `${min}分${sec}秒`;
}

/** 分入力（整数）を秒に変換 */
export function minutesToSeconds(minutes: number): number {
  return Math.round(minutes) * 60;
}

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    sentence: "I ___ to school every day.",
    answer: "go",
    hint: "毎日学校へ「行く」",
  },
  {
    id: 2,
    sentence: "She ___ English very well.",
    answer: "speaks",
    hint: "英語を「話す」（三人称単数）",
  },
  {
    id: 3,
    sentence: "This book is ___ than that one.",
    answer: "better",
    hint: "good の比較級",
  },
  {
    id: 4,
    sentence: "We have lived here ___ 2020.",
    answer: "since",
    hint: "「2020年から」という起点",
  },
  {
    id: 5,
    sentence: "Could you ___ me with this homework?",
    answer: "help",
    hint: "宿題を「手伝って」",
  },
];

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

export function toPublicQuestions(
  questions: QuizQuestion[]
): QuizQuestionPublic[] {
  return questions.map(({ id, sentence, hint }) => ({ id, sentence, hint }));
}

export function validateQuestions(input: unknown): QuizQuestion[] | string {
  if (!Array.isArray(input) || input.length !== QUESTION_COUNT) {
    return `問題は${QUESTION_COUNT}問必要です`;
  }

  const questions: QuizQuestion[] = [];

  for (let i = 0; i < QUESTION_COUNT; i++) {
    const raw = input[i];
    if (!raw || typeof raw !== "object") {
      return `問題${i + 1}の形式が不正です`;
    }

    const sentence = "sentence" in raw ? String(raw.sentence).trim() : "";
    const answer = "answer" in raw ? String(raw.answer).trim() : "";
    const hint = "hint" in raw ? String(raw.hint).trim() : "";

    if (!sentence) {
      return `問題${i + 1}の問題文を入力してください`;
    }
    if (!sentence.includes("___")) {
      return `問題${i + 1}の問題文には空欄「___」が必要です`;
    }
    if (!answer) {
      return `問題${i + 1}の正解を入力してください`;
    }
    if (!hint) {
      return `問題${i + 1}のヒントを入力してください`;
    }

    questions.push({ id: i + 1, sentence, answer, hint });
  }

  return questions;
}

export function validateTimeLimit(input: unknown): number | string {
  const seconds = Number(input);
  if (!Number.isFinite(seconds) || !Number.isInteger(seconds)) {
    return "制限時間は整数で入力してください";
  }
  if (seconds < MIN_TIME_LIMIT_SECONDS) {
    return `制限時間は${MIN_TIME_LIMIT_SECONDS}秒以上にしてください`;
  }
  if (seconds > MAX_TIME_LIMIT_SECONDS) {
    return `制限時間は${MAX_TIME_LIMIT_SECONDS}秒以内にしてください`;
  }
  return seconds;
}

export function gradeQuiz(
  answers: Record<number, string>,
  questions: QuizQuestion[]
): {
  score: number;
  results: QuizResult[];
} {
  const results = questions.map((q) => ({
    questionId: q.id,
    userAnswer: (answers[q.id] ?? "").trim(),
    correctAnswer: q.answer,
    isCorrect: checkAnswer(answers[q.id] ?? "", q.answer),
  }));

  return {
    score: results.filter((r) => r.isCorrect).length,
    results,
  };
}
