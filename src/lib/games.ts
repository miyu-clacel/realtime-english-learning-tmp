import type { GameType } from "./types";

export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  emoji: string;
}

export const GAMES: Record<GameType, GameInfo> = {
  "word-quiz": {
    id: "word-quiz",
    name: "単語テスト",
    description: "5問の穴埋めテスト。全員提出後にランキング発表。",
    emoji: "📚",
  },
  survive: {
    id: "survive",
    name: "Survive",
    description: "10問サバイバル。15秒以内に正解した人だけ生き残る。",
    emoji: "🔥",
  },
};

export const GAME_LIST: GameInfo[] = Object.values(GAMES);

export function isGameType(value: string): value is GameType {
  return value === "word-quiz" || value === "survive";
}

export function getPlayPath(gameType: GameType): string {
  return gameType === "survive" ? "/survive" : "/quiz";
}

export function getAdminPath(gameType: GameType): string {
  return `/admin/${gameType}`;
}

export function getJoinPath(gameType: GameType): string {
  return `/join/${gameType}`;
}
