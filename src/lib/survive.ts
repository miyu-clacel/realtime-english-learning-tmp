import type { QuizQuestion } from "./types";

export const SURVIVE_QUESTION_COUNT = 10;
export const SURVIVE_ROUND_SECONDS = 15;
export const SURVIVE_ROUND_RESULT_MS = 3000;
export const MAX_LAST_WORDS_LENGTH = 100;

/** 難易度順（易→難）の10問 */
export const DEFAULT_SURVIVE_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    sentence: "I ___ a student.",
    answer: "am",
    hint: "be動詞（一人称）",
  },
  {
    id: 2,
    sentence: "She ___ to school every day.",
    answer: "goes",
    hint: "三人称単数の「行く」",
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
    hint: "「〜以来」の前置詞",
  },
  {
    id: 5,
    sentence: "If it rains tomorrow, we ___ cancel the picnic.",
    answer: "will",
    hint: "第一条件文の未来形",
  },
  {
    id: 6,
    sentence: "The letter ___ by Tom yesterday.",
    answer: "was written",
    hint: "受動態（過去）",
  },
  {
    id: 7,
    sentence: "Not only did he apologize, ___ he also paid for the damage.",
    answer: "but",
    hint: "Not only ... but also の形",
  },
  {
    id: 8,
    sentence: "Had I known about the traffic, I ___ left earlier.",
    answer: "would have",
    hint: "仮定法過去完了",
  },
  {
    id: 9,
    sentence: "The proposal, ___ was submitted last week, has been approved.",
    answer: "which",
    hint: "非限定用法の関係代名詞",
  },
  {
    id: 10,
    sentence: "Scarcely ___ the meeting begun when the fire alarm went off.",
    answer: "had",
    hint: "Scarcely had ... when ... の倒置",
  },
];

export function gradeSurviveAnswer(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const normalize = (value: string) => value.trim().toLowerCase();
  return normalize(userAnswer) === normalize(correctAnswer);
}
