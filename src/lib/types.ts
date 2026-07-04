export type GameType = "word-quiz" | "survive";

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
  gameType: GameType;
  questions: QuizQuestion[];
  /** 制限時間（秒）word-quiz: 全体 / survive: 1問あたり */
  timeLimitSeconds: number;
}

export interface RoomPublic {
  id: string;
  name: string;
  createdAt: number;
  gameType: GameType;
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

export interface SurviveLastWord {
  username: string;
  message: string;
  round: number;
}

export interface SurvivePlayerResult {
  username: string;
  survived: boolean;
  eliminatedAtRound: number | null;
  correctCount: number;
  totalRounds: number;
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
  | "survive_start"
  | "survive_question"
  | "survive_submit_ack"
  | "survive_round_result"
  | "survive_final"
  | "survive_last_words"
  | "survive_last_words_update"
  | "error";

export type GamePhase =
  | "lobby"
  | "quiz"
  | "ranking"
  | "question"
  | "round_result"
  | "final";

export interface WsMessage {
  type: WsMessageType;
  gameType?: GameType;
  roomId?: string;
  username?: string;
  answers?: Record<number, string>;
  questions?: QuizQuestionPublic[];
  question?: QuizQuestionPublic;
  timeLimitSeconds?: number;
  endsAt?: number;
  participants?: string[];
  submittedCount?: number;
  totalCount?: number;
  submittedUsers?: string[];
  phase?: GamePhase;
  score?: number;
  results?: QuizResult[];
  rankings?: RankingEntry[];
  questionNumber?: number;
  totalQuestions?: number;
  survivors?: string[];
  eliminated?: string[];
  correctAnswer?: string;
  aliveCount?: number;
  surviveResults?: SurvivePlayerResult[];
  lastWords?: SurviveLastWord[];
  message?: string;
  error?: string;
}
