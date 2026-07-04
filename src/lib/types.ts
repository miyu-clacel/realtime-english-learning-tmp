export interface QuizQuestion {
  id: number;
  /** 穴埋め部分は ___ で表す */
  sentence: string;
  answer: string;
  /** 日本語の意味・ヒント */
  hint: string;
}

/** クライアントに配信する問題（正解は含めない） */
export interface QuizQuestionPublic {
  id: number;
  sentence: string;
  hint: string;
}

export interface QuizResult {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Room {
  id: string;
  name: string;
  createdAt: number;
  questions: QuizQuestion[];
  /** 制限時間（秒） */
  timeLimitSeconds: number;
}

export interface RoomPublic {
  id: string;
  name: string;
  createdAt: number;
  questions: QuizQuestionPublic[];
  timeLimitSeconds: number;
}

export interface RankingEntry {
  rank: number;
  username: string;
  score: number;
  totalQuestions: number;
  submittedAt: number;
}

export type WsMessageType =
  | "join"
  | "submit"
  | "room_state"
  | "quiz_data"
  | "quiz_start"
  | "submit_ack"
  | "progress"
  | "ranking"
  | "reset"
  | "time_up"
  | "reveal_results"
  | "error";

export interface WsMessage {
  type: WsMessageType;
  roomId?: string;
  username?: string;
  answers?: Record<number, string>;
  questions?: QuizQuestionPublic[];
  timeLimitSeconds?: number;
  endsAt?: number;
  participants?: string[];
  submittedCount?: number;
  totalCount?: number;
  submittedUsers?: string[];
  phase?: "lobby" | "quiz" | "ranking";
  score?: number;
  results?: QuizResult[];
  rankings?: RankingEntry[];
  error?: string;
}
