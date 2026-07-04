import { NextResponse } from "next/server";
import { createRoom, getAllRooms } from "@/lib/rooms";
import {
  validateQuestions,
  validateTimeLimit,
  DEFAULT_TIME_LIMIT_SECONDS,
  DEFAULT_QUIZ_QUESTIONS,
} from "@/lib/quiz";
import {
  DEFAULT_SURVIVE_PRESET,
  SURVIVE_ROUND_SECONDS,
  getSurviveQuestions,
  parseSurvivePreset,
} from "@/lib/survive";
import type { GameType } from "@/lib/types";

function parseGameType(value: unknown): GameType | null {
  if (value === "word-quiz" || value === "survive") return value;
  return null;
}

export async function GET() {
  const rooms = getAllRooms();
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const gameType = parseGameType(body.gameType) ?? "word-quiz";

    if (!name) {
      return NextResponse.json(
        { error: "ルーム名を入力してください" },
        { status: 400 }
      );
    }

    if (gameType === "survive") {
      const presetId = parseSurvivePreset(body.preset) ?? DEFAULT_SURVIVE_PRESET;
      const questions = getSurviveQuestions(presetId);
      const room = createRoom(
        name,
        "survive",
        questions,
        SURVIVE_ROUND_SECONDS,
        presetId
      );
      return NextResponse.json(
        {
          room: {
            id: room.id,
            name: room.name,
            createdAt: room.createdAt,
            gameType: room.gameType,
            questions: room.questions,
            timeLimitSeconds: room.timeLimitSeconds,
            survivePreset: room.survivePreset,
          },
        },
        { status: 201 }
      );
    }

    const validated = validateQuestions(body.questions ?? DEFAULT_QUIZ_QUESTIONS);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const timeLimitRaw =
      body.timeLimitSeconds ?? DEFAULT_TIME_LIMIT_SECONDS;
    const timeLimit = validateTimeLimit(timeLimitRaw);
    if (typeof timeLimit === "string") {
      return NextResponse.json({ error: timeLimit }, { status: 400 });
    }

    const room = createRoom(name, "word-quiz", validated, timeLimit);
    return NextResponse.json(
      {
        room: {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt,
          gameType: room.gameType,
          questions: room.questions,
          timeLimitSeconds: room.timeLimitSeconds,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "ルームの作成に失敗しました" },
      { status: 500 }
    );
  }
}
