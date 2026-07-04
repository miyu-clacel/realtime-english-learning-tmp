import { NextResponse } from "next/server";
import { createRoom, getAllRooms } from "@/lib/rooms";
import { validateQuestions, validateTimeLimit, DEFAULT_TIME_LIMIT_SECONDS } from "@/lib/quiz";

export async function GET() {
  const rooms = getAllRooms();
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "ルーム名を入力してください" },
        { status: 400 }
      );
    }

    const validated = validateQuestions(body.questions);
    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const timeLimitRaw =
      body.timeLimitSeconds ?? DEFAULT_TIME_LIMIT_SECONDS;
    const timeLimit = validateTimeLimit(timeLimitRaw);
    if (typeof timeLimit === "string") {
      return NextResponse.json({ error: timeLimit }, { status: 400 });
    }

    const room = createRoom(name, validated, timeLimit);
    return NextResponse.json(
      {
        room: {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt,
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
