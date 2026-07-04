import { v4 as uuidv4 } from "uuid";
import type { QuizQuestion, Room, RoomPublic } from "./types";
import { toPublicQuestions } from "./quiz";

const globalForRooms = globalThis as unknown as {
  rooms: Map<string, Room> | undefined;
};

const rooms = globalForRooms.rooms ?? new Map<string, Room>();
if (!globalForRooms.rooms) {
  globalForRooms.rooms = rooms;
}

export function createRoom(
  name: string,
  questions: QuizQuestion[],
  timeLimitSeconds: number
): Room {
  const room: Room = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    name,
    createdAt: Date.now(),
    questions,
    timeLimitSeconds,
  };
  rooms.set(room.id, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId.toUpperCase());
}

export function getRoomPublic(roomId: string): RoomPublic | undefined {
  const room = getRoom(roomId);
  if (!room) return undefined;
  return {
    id: room.id,
    name: room.name,
    createdAt: room.createdAt,
    questions: toPublicQuestions(room.questions),
    timeLimitSeconds: room.timeLimitSeconds,
  };
}

export function getAllRooms(): RoomPublic[] {
  return Array.from(rooms.values()).map((room) => ({
    id: room.id,
    name: room.name,
    createdAt: room.createdAt,
    questions: toPublicQuestions(room.questions),
    timeLimitSeconds: room.timeLimitSeconds,
  }));
}
