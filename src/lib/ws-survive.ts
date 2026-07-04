import { WebSocket } from "ws";
import { getRoom } from "./rooms";
import {
  MAX_LAST_WORDS_LENGTH,
  SURVIVE_ROUND_RESULT_MS,
  SURVIVE_ROUND_SECONDS,
  gradeSurviveAnswer,
} from "./survive";
import { toPublicQuestions } from "./quiz";
import type { QuizQuestion, SurviveLastWord, SurvivePlayerResult, WsMessage } from "./types";

interface SurvivePlayerState {
  correctCount: number;
  eliminatedAtRound: number | null;
}

interface SurviveSession {
  phase: "lobby" | "question" | "round_result" | "final";
  questionIndex: number;
  alive: Set<string>;
  roundAnswers: Map<string, string>;
  playerStates: Map<string, SurvivePlayerState>;
  lastWords: Map<string, SurviveLastWord>;
  endsAt: number | null;
  timerHandle: ReturnType<typeof setTimeout> | null;
  delayHandle: ReturnType<typeof setTimeout> | null;
}

const globalForSurvive = globalThis as unknown as {
  surviveSessions: Map<string, SurviveSession> | undefined;
};

const surviveSessions =
  globalForSurvive.surviveSessions ?? new Map<string, SurviveSession>();
if (!globalForSurvive.surviveSessions) {
  globalForSurvive.surviveSessions = surviveSessions;
}

function createEmptySurviveSession(): SurviveSession {
  return {
    phase: "lobby",
    questionIndex: 0,
    alive: new Set(),
    roundAnswers: new Map(),
    playerStates: new Map(),
    lastWords: new Map(),
    endsAt: null,
    timerHandle: null,
    delayHandle: null,
  };
}

function clearSurviveTimers(session: SurviveSession) {
  if (session.timerHandle) {
    clearTimeout(session.timerHandle);
    session.timerHandle = null;
  }
  if (session.delayHandle) {
    clearTimeout(session.delayHandle);
    session.delayHandle = null;
  }
}

export function getSurviveSession(roomId: string): SurviveSession {
  const normalized = roomId.toUpperCase();
  let session = surviveSessions.get(normalized);
  if (!session) {
    session = createEmptySurviveSession();
    surviveSessions.set(normalized, session);
  }
  return session;
}

export function resetSurviveSession(roomId: string) {
  const normalized = roomId.toUpperCase();
  const existing = surviveSessions.get(normalized);
  if (existing) clearSurviveTimers(existing);
  surviveSessions.set(normalized, createEmptySurviveSession());
}

function getLastWordsList(session: SurviveSession): SurviveLastWord[] {
  return Array.from(session.lastWords.values()).sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.username.localeCompare(b.username);
  });
}

function buildSurviveResults(
  session: SurviveSession,
  totalRounds: number
): SurvivePlayerResult[] {
  return Array.from(session.playerStates.entries())
    .map(([username, state]) => ({
      username,
      survived: state.eliminatedAtRound === null,
      eliminatedAtRound: state.eliminatedAtRound,
      correctCount: state.correctCount,
      totalRounds,
    }))
    .sort((a, b) => {
      if (a.survived !== b.survived) return a.survived ? -1 : 1;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.username.localeCompare(b.username);
    });
}

function getCurrentQuestion(room: { questions: QuizQuestion[] }, index: number) {
  return room.questions[index];
}

export function getSurviveSessionStatus(
  roomId: string,
  participants: string[]
) {
  const room = getRoom(roomId);
  if (!room) return null;

  const session = getSurviveSession(roomId);
  return {
    roomId: room.id,
    roomName: room.name,
    gameType: "survive" as const,
    phase: session.phase,
    participantCount: participants.length,
    participants,
    aliveCount: session.alive.size,
    survivors: Array.from(session.alive),
    questionNumber:
      session.phase === "lobby" ? 0 : session.questionIndex + 1,
    totalQuestions: room.questions.length,
    submittedCount: session.roundAnswers.size,
    submittedUsers: Array.from(session.roundAnswers.keys()),
    timeLimitSeconds: SURVIVE_ROUND_SECONDS,
    endsAt: session.endsAt,
  };
}

export function startSurviveGame(
  roomId: string,
  getConnectedUsernames: (roomId: string) => string[],
  broadcast: (roomId: string, message: WsMessage) => void,
  sendRoomState: (roomId: string) => void
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(roomId);
  if (!room) return { ok: false, error: "ルームが見つかりません" };

  const normalized = roomId.toUpperCase();
  const session = getSurviveSession(normalized);
  const connected = getConnectedUsernames(normalized);

  if (connected.length === 0) {
    return { ok: false, error: "参加者がいません" };
  }

  if (session.phase !== "lobby" && session.phase !== "final") {
    return { ok: false, error: "ゲームはすでに進行中です" };
  }

  clearSurviveTimers(session);
  session.phase = "question";
  session.questionIndex = 0;
  session.alive = new Set(connected);
  session.roundAnswers = new Map();
  session.lastWords = new Map();
  session.playerStates = new Map(
    connected.map((name) => [name, { correctCount: 0, eliminatedAtRound: null }])
  );

  startSurviveQuestion(normalized, room, session, broadcast, sendRoomState);
  return { ok: true };
}

function startSurviveQuestion(
  roomId: string,
  room: NonNullable<ReturnType<typeof getRoom>>,
  session: SurviveSession,
  broadcast: (roomId: string, message: WsMessage) => void,
  sendRoomState: (roomId: string) => void
) {
  clearSurviveTimers(session);
  session.phase = "question";
  session.roundAnswers = new Map();
  session.endsAt = Date.now() + SURVIVE_ROUND_SECONDS * 1000;

  const question = getCurrentQuestion(room, session.questionIndex);
  if (!question) {
    finishSurviveGame(roomId, room, session, broadcast, sendRoomState);
    return;
  }

  broadcast(roomId, {
    type: "survive_question",
    gameType: "survive",
    phase: "question",
    question: toPublicQuestions([question])[0],
    questionNumber: session.questionIndex + 1,
    totalQuestions: room.questions.length,
    timeLimitSeconds: SURVIVE_ROUND_SECONDS,
    endsAt: session.endsAt,
    survivors: Array.from(session.alive),
    aliveCount: session.alive.size,
    lastWords: getLastWordsList(session),
  });
  sendRoomState(roomId);

  const remaining = Math.max(0, session.endsAt - Date.now());
  session.timerHandle = setTimeout(
    () => resolveSurviveRound(roomId, broadcast, sendRoomState),
    remaining
  );
}

function resolveSurviveRound(
  roomId: string,
  broadcast: (roomId: string, message: WsMessage) => void,
  sendRoomState: (roomId: string) => void
) {
  const room = getRoom(roomId);
  if (!room) return;

  const session = getSurviveSession(roomId);
  if (session.phase !== "question") return;

  clearSurviveTimers(session);
  session.phase = "round_result";

  const question = getCurrentQuestion(room, session.questionIndex);
  if (!question) return;

  const eliminated: string[] = [];
  for (const username of session.alive) {
    const answer = session.roundAnswers.get(username) ?? "";
    const isCorrect = gradeSurviveAnswer(answer, question.answer);
    const state = session.playerStates.get(username);
    if (!state) continue;

    if (isCorrect) {
      state.correctCount += 1;
    } else {
      state.eliminatedAtRound = session.questionIndex + 1;
      session.alive.delete(username);
      eliminated.push(username);
    }
  }

  broadcast(roomId, {
    type: "survive_round_result",
    gameType: "survive",
    phase: "round_result",
    questionNumber: session.questionIndex + 1,
    totalQuestions: room.questions.length,
    question: toPublicQuestions([question])[0],
    correctAnswer: question.answer,
    survivors: Array.from(session.alive),
    eliminated,
    aliveCount: session.alive.size,
    lastWords: getLastWordsList(session),
  });
  sendRoomState(roomId);

  session.delayHandle = setTimeout(() => {
    session.questionIndex += 1;
    if (session.alive.size === 0 || session.questionIndex >= room.questions.length) {
      finishSurviveGame(roomId, room, session, broadcast, sendRoomState);
      return;
    }
    startSurviveQuestion(roomId, room, session, broadcast, sendRoomState);
  }, SURVIVE_ROUND_RESULT_MS);
}

function finishSurviveGame(
  roomId: string,
  room: NonNullable<ReturnType<typeof getRoom>>,
  session: SurviveSession,
  broadcast: (roomId: string, message: WsMessage) => void,
  sendRoomState: (roomId: string) => void
) {
  clearSurviveTimers(session);
  session.phase = "final";

  const results = buildSurviveResults(session, room.questions.length);
  broadcast(roomId, {
    type: "survive_final",
    gameType: "survive",
    phase: "final",
    surviveResults: results,
    survivors: Array.from(session.alive),
    aliveCount: session.alive.size,
    totalQuestions: room.questions.length,
    lastWords: getLastWordsList(session),
  });
  sendRoomState(roomId);
}

export function handleSurviveJoin(
  ws: WebSocket,
  roomId: string,
  send: (ws: WebSocket, message: WsMessage) => void,
  _broadcast: (roomId: string, message: WsMessage) => void,
  sendRoomState: (roomId: string) => void
) {
  const room = getRoom(roomId);
  if (!room) return;

  send(ws, {
    type: "quiz_data",
    gameType: "survive",
    timeLimitSeconds: SURVIVE_ROUND_SECONDS,
    totalQuestions: room.questions.length,
    lastWords: getLastWordsList(getSurviveSession(roomId)),
  });

  sendRoomState(roomId);
}

export function syncSurvivePlayerState(
  ws: WebSocket,
  roomId: string,
  send: (ws: WebSocket, message: WsMessage) => void
) {
  const room = getRoom(roomId);
  if (!room) return;

  const session = getSurviveSession(roomId);
  const question = getCurrentQuestion(room, session.questionIndex);

  if (session.phase === "question" && question) {
    send(ws, {
      type: "survive_question",
      gameType: "survive",
      phase: "question",
      question: toPublicQuestions([question])[0],
      questionNumber: session.questionIndex + 1,
      totalQuestions: room.questions.length,
      timeLimitSeconds: SURVIVE_ROUND_SECONDS,
      endsAt: session.endsAt ?? undefined,
      survivors: Array.from(session.alive),
      aliveCount: session.alive.size,
      lastWords: getLastWordsList(session),
    });
  } else if (session.phase === "round_result" && question) {
    send(ws, {
      type: "survive_round_result",
      gameType: "survive",
      phase: "round_result",
      questionNumber: session.questionIndex + 1,
      totalQuestions: room.questions.length,
      question: toPublicQuestions([question])[0],
      correctAnswer: question.answer,
      survivors: Array.from(session.alive),
      aliveCount: session.alive.size,
      lastWords: getLastWordsList(session),
    });
  } else if (session.phase === "final") {
    send(ws, {
      type: "survive_final",
      gameType: "survive",
      phase: "final",
      surviveResults: buildSurviveResults(session, room.questions.length),
      survivors: Array.from(session.alive),
      aliveCount: session.alive.size,
      totalQuestions: room.questions.length,
      lastWords: getLastWordsList(session),
    });
  }
}

export function handleSurviveSubmit(
  ws: WebSocket,
  roomId: string,
  username: string,
  answers: Record<number, string>,
  send: (ws: WebSocket, message: WsMessage) => void,
  sendRoomState: (roomId: string) => void
) {
  const room = getRoom(roomId);
  if (!room) return;

  const session = getSurviveSession(roomId);

  if (session.phase !== "question") {
    send(ws, { type: "error", error: "現在は回答できません" });
    return;
  }

  if (!session.alive.has(username)) {
    send(ws, { type: "error", error: "あなたは脱落しています" });
    return;
  }

  if (session.roundAnswers.has(username)) {
    send(ws, { type: "error", error: "すでに回答済みです" });
    return;
  }

  const question = getCurrentQuestion(room, session.questionIndex);
  if (!question) return;

  const answer = answers[question.id]?.trim() ?? "";
  session.roundAnswers.set(username, answer);

  send(ws, { type: "survive_submit_ack", gameType: "survive" });
  sendRoomState(roomId);
}

export function sendSurviveRoomState(
  roomId: string,
  getConnectedUsernames: (roomId: string) => string[],
  broadcast: (roomId: string, message: WsMessage) => void
) {
  const session = getSurviveSession(roomId);
  const connected = getConnectedUsernames(roomId);
  const submittedUsers = connected.filter((name) =>
    session.roundAnswers.has(name)
  );

  broadcast(roomId, {
    type: "room_state",
    gameType: "survive",
    phase: session.phase,
    participants: connected,
    submittedCount: submittedUsers.length,
    totalCount: connected.length,
    submittedUsers,
    survivors: Array.from(session.alive),
    aliveCount: session.alive.size,
    questionNumber:
      session.phase === "lobby" ? 0 : session.questionIndex + 1,
    endsAt: session.endsAt ?? undefined,
  });
}

export function handleSurviveLastWords(
  ws: WebSocket,
  roomId: string,
  username: string,
  message: string,
  send: (ws: WebSocket, message: WsMessage) => void,
  broadcast: (roomId: string, message: WsMessage) => void
) {
  const session = getSurviveSession(roomId);

  if (session.phase === "lobby") {
    send(ws, { type: "error", error: "ゲーム開始前は遺言を残せません" });
    return;
  }

  if (session.alive.has(username)) {
    send(ws, { type: "error", error: "生存者は遺言を残せません" });
    return;
  }

  const state = session.playerStates.get(username);
  if (!state) {
    send(ws, { type: "error", error: "参加者として登録されていません" });
    return;
  }

  if (session.lastWords.has(username)) {
    send(ws, { type: "error", error: "遺言はすでに残しています" });
    return;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    send(ws, { type: "error", error: "遺言を入力してください" });
    return;
  }

  if (trimmed.length > MAX_LAST_WORDS_LENGTH) {
    send(ws, {
      type: "error",
      error: `遺言は${MAX_LAST_WORDS_LENGTH}文字以内にしてください`,
    });
    return;
  }

  session.lastWords.set(username, {
    username,
    message: trimmed,
    round: state.eliminatedAtRound ?? session.questionIndex + 1,
  });

  broadcast(roomId, {
    type: "survive_last_words_update",
    gameType: "survive",
    lastWords: getLastWordsList(session),
  });
}
