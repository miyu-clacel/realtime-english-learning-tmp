import type { QuizQuestion } from "./types";
import {
  DEFAULT_SURVIVE_PRESET,
  getSurviveQuestions,
} from "./survive-presets";

export type { SurvivePresetId } from "./survive-presets";
export {
  DEFAULT_SURVIVE_PRESET,
  SURVIVE_PRESET_LIST,
  getSurvivePresetLabel,
  getSurviveQuestions,
  parseSurvivePreset,
} from "./survive-presets";

export const SURVIVE_QUESTION_COUNT = 30;
export const SURVIVE_ROUND_SECONDS = 15;
export const SURVIVE_ROUND_RESULT_MS = 3000;
export const MAX_LAST_WORDS_LENGTH = 100;
export const STAMP_COOLDOWN_MS = 1500;

/** 脱落者が送れるスタンプ（Zoomリアクション風） */
export const SURVIVE_STAMPS = ["👏", "😂", "🔥", "💪", "😭", "🎉", "👍", "💀"] as const;

export type SurviveStampEmoji = (typeof SURVIVE_STAMPS)[number];

export function isSurviveStamp(value: string): value is SurviveStampEmoji {
  return (SURVIVE_STAMPS as readonly string[]).includes(value);
}

export const DEFAULT_SURVIVE_QUESTIONS: QuizQuestion[] =
  getSurviveQuestions(DEFAULT_SURVIVE_PRESET);

export function gradeSurviveAnswer(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const normalize = (value: string) => value.trim().toLowerCase();
  return normalize(userAnswer) === normalize(correctAnswer);
}
