import { NextResponse } from "next/server";
import { getRoomPublic } from "@/lib/rooms";
import { getRoomSessionStatus } from "@/lib/ws-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = getRoomPublic(id);

  if (!room) {
    return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
  }

  const status = getRoomSessionStatus(id);

  return NextResponse.json({
    room,
    status: status ?? {
      phase: "lobby",
      participantCount: 0,
      participants: [],
      submittedCount: 0,
      submittedUsers: [],
      timeLimitSeconds: room.timeLimitSeconds,
      endsAt: null,
    },
  });
}
