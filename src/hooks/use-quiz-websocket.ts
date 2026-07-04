"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  QuizQuestionPublic,
  QuizResult,
  RankingEntry,
  WsMessage,
} from "@/lib/types";

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }

  return "ws://localhost:3000";
}

export type QuizPhase = "lobby" | "quiz" | "waiting" | "ranking";

export function useQuizWebSocket(roomId: string, username: string) {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<QuizPhase>("lobby");
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [submittedUsers, setSubmittedUsers] = useState<string[]>([]);
  const [myResults, setMyResults] = useState<QuizResult[]>([]);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const applyRoomState = useCallback((data: WsMessage) => {
    if (data.participants) setParticipants(data.participants);
    if (data.submittedCount !== undefined) setSubmittedCount(data.submittedCount);
    if (data.totalCount !== undefined) setTotalCount(data.totalCount);
    if (data.submittedUsers) setSubmittedUsers(data.submittedUsers);
    if (data.endsAt !== undefined) setEndsAt(data.endsAt);

    if (data.phase === "ranking") {
      setPhase("ranking");
    } else if (data.phase === "lobby") {
      setPhase("lobby");
    } else if (data.submittedUsers?.includes(username)) {
      setPhase("waiting");
    } else if (data.phase === "quiz") {
      setPhase("quiz");
    }
  }, [username]);

  const applyQuizStart = useCallback((data: WsMessage) => {
    if (data.questions) setQuestions(data.questions);
    if (data.timeLimitSeconds !== undefined) {
      setTimeLimitSeconds(data.timeLimitSeconds);
    }
    if (data.endsAt !== undefined) setEndsAt(data.endsAt);
    setMyResults([]);
    setMyScore(null);
    setRankings([]);
    setTimeUp(false);
    setPhase("quiz");
  }, []);

  useEffect(() => {
    if (!roomId || !username) return;

    setQuestions([]);
    setTimeLimitSeconds(null);
    setEndsAt(null);
    setTimeUp(false);
    setWsError(null);
    setPhase("lobby");

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "join",
          roomId,
          username,
        } satisfies WsMessage)
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WsMessage;

      switch (data.type) {
        case "quiz_data":
          if (data.timeLimitSeconds !== undefined) {
            setTimeLimitSeconds(data.timeLimitSeconds);
          }
          if (data.questions) setQuestions(data.questions);
          if (data.endsAt !== undefined) setEndsAt(data.endsAt);
          break;
        case "quiz_start":
          applyQuizStart(data);
          break;
        case "room_state":
          applyRoomState(data);
          break;
        case "submit_ack":
          if (data.results) setMyResults(data.results);
          if (data.score !== undefined) setMyScore(data.score);
          setPhase("waiting");
          break;
        case "time_up":
          setTimeUp(true);
          if (data.endsAt !== undefined) setEndsAt(data.endsAt);
          break;
        case "reveal_results":
          setTimeUp(true);
          if (data.endsAt !== undefined) setEndsAt(data.endsAt);
          break;
        case "ranking":
          if (data.rankings) {
            setRankings(data.rankings);
            setPhase("ranking");
          }
          break;
        case "reset":
          setPhase("lobby");
          setQuestions([]);
          setMyResults([]);
          setMyScore(null);
          setRankings([]);
          setTimeUp(false);
          setEndsAt(null);
          break;
        case "error":
          if (data.error) setWsError(data.error);
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [roomId, username, applyRoomState, applyQuizStart]);

  const submitAnswers = useCallback((answers: Record<number, string>) => {
    setWsError(null);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "submit",
          answers,
        } satisfies WsMessage)
      );
    }
  }, []);

  return {
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
  };
}
