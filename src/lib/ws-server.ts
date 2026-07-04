import type { Server } from "http";
import { parse } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { getRoom } from "./rooms";
import { gradeQuiz, toPublicQuestions } from "./quiz";
import {
  getSurviveSession,
  getSurviveSessionStatus,
  handleSurviveJoin,
  handleSurviveLastWords,
  handleSurviveSubmit,
  resetSurviveSession,
  sendSurviveRoomState,
  startSurviveGame,
  syncSurvivePlayerState,
} from "./ws-survive";
import type { QuizResult, RankingEntry, WsMessage } from "./types";

const TIME_UP_GRACE_MS = 500;

interface ClientInfo {
  roomId: string;
  username: string;
}

interface Submission {
  score: number;
  submittedAt: number;
}

interface RoomSession {
  phase: "lobby" | "quiz" | "ranking";
  submissions: Map<string, Submission>;
  startedAt: number | null;
  endsAt: number | null;
  timeExpired: boolean;
  revealPending: boolean;
  timerHandle: ReturnType<typeof setTimeout> | null;
  finalizeHandle: ReturnType<typeof setTimeout> | null;
}

const globalForWs = globalThis as unknown as {
  wsClients: Map<WebSocket, ClientInfo> | undefined;
  wsRoomSessions: Map<string, RoomSession> | undefined;
};

const clients = globalForWs.wsClients ?? new Map<WebSocket, ClientInfo>();
if (!globalForWs.wsClients) {
  globalForWs.wsClients = clients;
}

const roomSessions = globalForWs.wsRoomSessions ?? new Map<string, RoomSession>();
if (!globalForWs.wsRoomSessions) {
  globalForWs.wsRoomSessions = roomSessions;
}

function createEmptySession(): RoomSession {
  return {
    phase: "lobby",
    submissions: new Map(),
    startedAt: null,
    endsAt: null,
    timeExpired: false,
    revealPending: false,
    timerHandle: null,
    finalizeHandle: null,
  };
}

function clearSessionTimers(session: RoomSession) {
  if (session.timerHandle) {
    clearTimeout(session.timerHandle);
    session.timerHandle = null;
  }
  if (session.finalizeHandle) {
    clearTimeout(session.finalizeHandle);
    session.finalizeHandle = null;
  }
}

function getSession(roomId: string): RoomSession {
  const normalized = roomId.toUpperCase();
  let session = roomSessions.get(normalized);
  if (!session) {
    session = createEmptySession();
    roomSessions.set(normalized, session);
  }
  return session;
}

function resetSession(roomId: string) {
  const normalized = roomId.toUpperCase();
  const existing = roomSessions.get(normalized);
  if (existing) clearSessionTimers(existing);
  roomSessions.set(normalized, createEmptySession());
}

function getRoomClients(roomId: string): WebSocket[] {
  const normalized = roomId.toUpperCase();
  const result: WebSocket[] = [];
  for (const [ws, info] of clients.entries()) {
    if (info.roomId === normalized && ws.readyState === WebSocket.OPEN) {
      result.push(ws);
    }
  }
  return result;
}

function getConnectedUsernames(roomId: string): string[] {
  return getRoomClients(roomId).map((ws) => clients.get(ws)!.username);
}

function send(ws: WebSocket, message: WsMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(roomId: string, message: WsMessage) {
  for (const ws of getRoomClients(roomId)) {
    send(ws, message);
  }
}

function buildRankings(roomId: string, session: RoomSession): RankingEntry[] {
  const room = getRoom(roomId);
  const totalQuestions = room?.questions.length ?? 0;

  const entries = Array.from(session.submissions.entries())
    .map(([username, sub]) => ({
      username,
      score: sub.score,
      totalQuestions,
      submittedAt: sub.submittedAt,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.submittedAt - b.submittedAt;
    });

  let rank = 0;
  let prevScore: number | null = null;
  return entries.map((entry, index) => {
    if (entry.score !== prevScore) {
      rank = index + 1;
      prevScore = entry.score;
    }
    return { rank, ...entry };
  });
}

function sendRoomState(roomId: string) {
  const room = getRoom(roomId);
  if (room?.gameType === "survive") {
    sendSurviveRoomState(roomId, getConnectedUsernames, broadcast);
    return;
  }

  const session = getSession(roomId);
  const connected = getConnectedUsernames(roomId);
  const submittedUsers = connected.filter((name) =>
    session.submissions.has(name)
  );

  broadcast(roomId, {
    type: "room_state",
    phase: session.phase,
    participants: connected,
    submittedCount: submittedUsers.length,
    totalCount: connected.length,
    submittedUsers,
    endsAt: session.endsAt ?? undefined,
  });
}

function showRanking(roomId: string) {
  const session = getSession(roomId);
  if (session.phase === "ranking") return;
  if (session.submissions.size === 0) return;

  session.phase = "ranking";
  clearSessionTimers(session);

  const rankings = buildRankings(roomId, session);
  broadcast(roomId, { type: "ranking", rankings });
  sendRoomState(roomId);
}

function startTimer(roomId: string, room: NonNullable<ReturnType<typeof getRoom>>) {
  const session = getSession(roomId);
  session.startedAt = Date.now();
  session.endsAt = session.startedAt + room.timeLimitSeconds * 1000;
  session.timeExpired = false;

  const remaining = Math.max(0, session.endsAt - Date.now());
  session.timerHandle = setTimeout(() => handleTimeUp(roomId), remaining);
}

function recordSubmission(
  ws: WebSocket,
  roomId: string,
  username: string,
  answers: Record<number, string>
): QuizResult[] | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const session = getSession(roomId);
  if (session.phase !== "quiz" || session.submissions.has(username)) {
    return null;
  }

  const { score, results } = gradeQuiz(answers, room.questions);
  session.submissions.set(username, {
    score,
    submittedAt: Date.now(),
  });

  send(ws, { type: "submit_ack", score, results });
  return results;
}

function finalizeQuizRound(roomId: string) {
  const session = getSession(roomId);
  if (session.phase !== "quiz") return;

  for (const ws of getRoomClients(roomId)) {
    const info = clients.get(ws)!;
    if (!session.submissions.has(info.username)) {
      recordSubmission(ws, roomId, info.username, {});
    }
  }

  session.revealPending = false;
  showRanking(roomId);
}

function beginReveal(roomId: string, messageType: "time_up" | "reveal_results") {
  const session = getSession(roomId);
  if (session.phase !== "quiz" || session.revealPending) return;

  session.revealPending = true;
  session.timeExpired = true;
  if (session.timerHandle) {
    clearTimeout(session.timerHandle);
    session.timerHandle = null;
  }

  broadcast(roomId, {
    type: messageType,
    endsAt: session.endsAt ?? undefined,
  });

  session.finalizeHandle = setTimeout(
    () => finalizeQuizRound(roomId),
    TIME_UP_GRACE_MS
  );
}

function handleTimeUp(roomId: string) {
  const session = getSession(roomId);
  if (session.phase !== "quiz" || session.revealPending) return;
  beginReveal(roomId, "time_up");
}

function sendQuizData(
  ws: WebSocket,
  room: NonNullable<ReturnType<typeof getRoom>>
) {
  const session = getSession(room.id);
  const payload: WsMessage = {
    type: "quiz_data",
    timeLimitSeconds: room.timeLimitSeconds,
  };

  if (session.phase === "quiz" && session.startedAt !== null) {
    payload.questions = toPublicQuestions(room.questions);
    payload.endsAt = session.endsAt ?? undefined;
  }

  send(ws, payload);
}

export function getRoomSessionStatus(roomId: string) {
  const room = getRoom(roomId);
  if (!room) return null;

  const participants = getConnectedUsernames(roomId);

  if (room.gameType === "survive") {
    return getSurviveSessionStatus(roomId, participants);
  }

  const session = getSession(roomId);

  return {
    roomId: room.id,
    roomName: room.name,
    phase: session.phase,
    participantCount: participants.length,
    participants,
    submittedCount: session.submissions.size,
    submittedUsers: Array.from(session.submissions.keys()),
    timeLimitSeconds: room.timeLimitSeconds,
    endsAt: session.endsAt,
  };
}

export function startQuiz(
  roomId: string
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { ok: false, error: "ルームが見つかりません" };
  }

  if (room.gameType === "survive") {
    return startSurviveGame(
      roomId,
      getConnectedUsernames,
      broadcast,
      sendRoomState
    );
  }

  const normalized = roomId.toUpperCase();
  const session = getSession(normalized);

  if (session.phase === "quiz" && session.startedAt !== null) {
    return { ok: false, error: "テストはすでに進行中です" };
  }

  clearSessionTimers(session);
  session.submissions.clear();
  session.timeExpired = false;
  session.revealPending = false;
  session.phase = "quiz";
  startTimer(normalized, room);

  broadcast(normalized, {
    type: "quiz_start",
    questions: toPublicQuestions(room.questions),
    timeLimitSeconds: room.timeLimitSeconds,
    endsAt: session.endsAt ?? undefined,
  });
  sendRoomState(normalized);

  return { ok: true };
}

export function revealResults(
  roomId: string
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(roomId);
  if (!room) {
    return { ok: false, error: "ルームが見つかりません" };
  }

  if (room.gameType === "survive") {
    return { ok: false, error: "Surviveモードでは使用できません" };
  }

  const normalized = roomId.toUpperCase();
  const session = getSession(normalized);

  if (session.phase === "lobby" || session.startedAt === null) {
    return { ok: false, error: "テストが開始されていません" };
  }

  if (session.phase === "ranking") {
    return { ok: false, error: "すでに結果を表示しています" };
  }

  if (session.revealPending) {
    return { ok: false, error: "結果表示を処理中です" };
  }

  beginReveal(normalized, "reveal_results");
  return { ok: true };
}

function handleJoin(ws: WebSocket, roomId: string, username: string) {
  const room = getRoom(roomId);
  if (!room) {
    send(ws, { type: "error", error: "ルームが見つかりません" });
    return;
  }

  const normalizedRoomId = roomId.toUpperCase();
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    send(ws, { type: "error", error: "ユーザー名が無効です" });
    return;
  }

  if (room.gameType === "survive") {
    let session = getSurviveSession(normalizedRoomId);
    if (session.phase === "final") {
      resetSurviveSession(normalizedRoomId);
      broadcast(normalizedRoomId, {
        type: "reset",
        gameType: "survive",
        phase: "lobby",
      });
      session = getSurviveSession(normalizedRoomId);
    }

    const isKnownPlayer = session.playerStates.has(trimmedUsername);
    if (
      session.phase !== "lobby" &&
      session.phase !== "final" &&
      !isKnownPlayer
    ) {
      send(ws, { type: "error", error: "ゲーム進行中は参加できません" });
      return;
    }

    clients.set(ws, { roomId: normalizedRoomId, username: trimmedUsername });

    if (session.phase === "lobby" || session.phase === "final") {
      handleSurviveJoin(ws, normalizedRoomId, send, broadcast, sendRoomState);
    } else {
      send(ws, {
        type: "quiz_data",
        gameType: "survive",
        timeLimitSeconds: room.timeLimitSeconds,
        totalQuestions: room.questions.length,
      });
      syncSurvivePlayerState(ws, normalizedRoomId, send);
      sendRoomState(normalizedRoomId);
    }
    return;
  }

  const session = getSession(normalizedRoomId);

  if (session.phase === "ranking") {
    resetSession(normalizedRoomId);
    broadcast(normalizedRoomId, { type: "reset" });
  }

  clients.set(ws, { roomId: normalizedRoomId, username: trimmedUsername });

  sendQuizData(ws, room);
  sendRoomState(normalizedRoomId);

  const updatedSession = getSession(normalizedRoomId);
  if (updatedSession.phase === "ranking") {
    send(ws, {
      type: "ranking",
      rankings: buildRankings(normalizedRoomId, updatedSession),
    });
  } else if (updatedSession.phase === "quiz" && updatedSession.startedAt) {
    send(ws, {
      type: "quiz_start",
      questions: toPublicQuestions(room.questions),
      timeLimitSeconds: room.timeLimitSeconds,
      endsAt: updatedSession.endsAt ?? undefined,
    });
  } else if (
    updatedSession.endsAt &&
    Date.now() >= updatedSession.endsAt &&
    !updatedSession.revealPending
  ) {
    handleTimeUp(normalizedRoomId);
  }
}

function handleSubmit(ws: WebSocket, answers: Record<number, string>) {
  const info = clients.get(ws);
  if (!info) return;

  const room = getRoom(info.roomId);
  if (!room) return;

  if (room.gameType === "survive") {
    handleSurviveSubmit(
      ws,
      info.roomId,
      info.username,
      answers,
      send,
      sendRoomState
    );
    return;
  }

  const session = getSession(info.roomId);

  if (session.phase === "lobby") {
    send(ws, { type: "error", error: "テストが開始されていません" });
    return;
  }

  if (session.phase === "ranking") {
    send(ws, { type: "error", error: "このラウンドは終了しています" });
    return;
  }

  if (session.submissions.has(info.username)) {
    send(ws, { type: "error", error: "すでに回答済みです" });
    return;
  }

  const allowPartial =
    session.revealPending ||
    session.timeExpired ||
    (session.endsAt !== null && Date.now() >= session.endsAt);

  if (!allowPartial) {
    const unanswered = room.questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      send(ws, {
        type: "error",
        error: `未回答の問題があります（${unanswered.length}問）`,
      });
      return;
    }
  }

  const results = recordSubmission(ws, info.roomId, info.username, answers);
  if (!results) return;

  sendRoomState(info.roomId);
}

function handleDisconnect(ws: WebSocket) {
  const info = clients.get(ws);
  if (!info) return;

  clients.delete(ws);
  sendRoomState(info.roomId);
}

function bindWebSocketHandlers(wss: WebSocketServer) {
  wss.on("connection", (ws) => {
    const client = ws as WebSocket & { isAlive?: boolean };
    client.isAlive = true;
    ws.on("pong", () => {
      client.isAlive = true;
    });

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as WsMessage;

        switch (data.type) {
          case "join":
            if (data.roomId && data.username) {
              handleJoin(ws, data.roomId, data.username);
            }
            break;
          case "submit":
            if (data.answers) {
              handleSubmit(ws, data.answers);
            }
            break;
          case "survive_last_words":
            if (data.message !== undefined) {
              const info = clients.get(ws);
              if (info) {
                handleSurviveLastWords(
                  ws,
                  info.roomId,
                  info.username,
                  data.message,
                  send,
                  broadcast
                );
              }
            }
            break;
        }
      } catch {
        send(ws, { type: "error", error: "無効なメッセージです" });
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
    });
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      const client = ws as WebSocket & { isAlive?: boolean };
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

export const WS_PATH = "/ws";

/** 本番デプロイ用: HTTP サーバーと同じポートの /ws で WebSocket を提供 */
export function attachWebSocketServer(server: Server) {
  const wss = bindWebSocketHandlers(
    new WebSocketServer({ noServer: true, perMessageDeflate: false })
  );

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url ?? "");
    if (pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  console.log(`> WebSocket server attached at ${WS_PATH}`);
  return wss;
}

/** 開発用: 別ポートで WebSocket を起動（WS_PORT 指定時のみ） */
export function createWebSocketServer(port: number) {
  const wss = bindWebSocketHandlers(new WebSocketServer({ port }));
  console.log(`> WebSocket server running on ws://localhost:${port}`);
  return wss;
}
