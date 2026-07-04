import { NextResponse } from "next/server";
import { getRoom } from "@/lib/rooms";
import { startQuiz } from "@/lib/ws-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = getRoom(id);

  if (!room) {
    return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
  }

  const result = startQuiz(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
