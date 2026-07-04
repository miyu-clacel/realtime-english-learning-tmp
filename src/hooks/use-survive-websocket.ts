"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  QuizQuestionPublic,
  SurvivePlayerResult,
  WsMessage,
} from "@/lib/types";

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }
  return "ws://localhost:3000/ws";
}

export type SurvivePhase =
  | "lobby"
  | "question"
  | "round_result"
  | "final";

export function useSurviveWebSocket(roomId: string, username: string) {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<SurvivePhase>("lobby");
  const [question, setQuestion] = useState<QuizQuestionPublic | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [survivors, setSurvivors] = useState<string[]>([]);
  const [aliveCount, setAliveCount] = useState(0);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isAlive, setIsAlive] = useState(true);
  const [finalResults, setFinalResults] = useState<SurvivePlayerResult[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intentionalCloseRef = useRef(false);

  useEffect(() => {
    if (!roomId || !username) return;

    intentionalCloseRef.current = false;
    setWsError(null);
    setPhase("lobby");
    setSubmitted(false);
    setIsAlive(true);

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
          if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
          break;
        case "survive_question":
          setPhase("question");
          setQuestion(data.question ?? null);
          setQuestionNumber(data.questionNumber ?? 0);
          setTotalQuestions(data.totalQuestions ?? 10);
          setEndsAt(data.endsAt ?? null);
          setSurvivors(data.survivors ?? []);
          setAliveCount(data.aliveCount ?? 0);
          setSubmitted(false);
          setCorrectAnswer(null);
          setEliminated([]);
          setIsAlive(data.survivors?.includes(username) ?? true);
          break;
        case "survive_round_result":
          setPhase("round_result");
          setQuestion(data.question ?? null);
          setQuestionNumber(data.questionNumber ?? 0);
          setSurvivors(data.survivors ?? []);
          setAliveCount(data.aliveCount ?? 0);
          setEliminated(data.eliminated ?? []);
          setCorrectAnswer(data.correctAnswer ?? null);
          setIsAlive(data.survivors?.includes(username) ?? false);
          break;
        case "survive_final":
          setPhase("final");
          setFinalResults(data.surviveResults ?? []);
          setSurvivors(data.survivors ?? []);
          setAliveCount(data.aliveCount ?? 0);
          setIsAlive(data.survivors?.includes(username) ?? false);
          break;
        case "survive_submit_ack":
          setSubmitted(true);
          break;
        case "room_state":
          if (data.participants) setParticipants(data.participants);
          if (data.survivors) setSurvivors(data.survivors);
          if (data.aliveCount !== undefined) setAliveCount(data.aliveCount);
          if (data.phase) setPhase(data.phase as SurvivePhase);
          break;
        case "reset":
          setPhase("lobby");
          setQuestion(null);
          setSubmitted(false);
          setIsAlive(true);
          setFinalResults([]);
          break;
        case "error":
          if (data.error) setWsError(data.error);
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (!intentionalCloseRef.current) {
        setWsError("サーバーとの接続が切れました。ページを再読み込みしてください。");
      }
    };

    ws.onerror = () => {
      setWsError("WebSocket接続に失敗しました。ページを再読み込みしてください。");
    };

    return () => {
      intentionalCloseRef.current = true;
      ws.close();
    };
  }, [roomId, username]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!question || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      setWsError(null);
      wsRef.current.send(
        JSON.stringify({
          type: "submit",
          answers: { [question.id]: answer },
        } satisfies WsMessage)
      );
    },
    [question]
  );

  return {
    connected,
    phase,
    question,
    questionNumber,
    totalQuestions,
    endsAt,
    survivors,
    aliveCount,
    eliminated,
    correctAnswer,
    submitted,
    isAlive,
    finalResults,
    participants,
    wsError,
    submitAnswer,
  };
}
