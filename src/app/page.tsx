"use client";

import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAME_LIST, getAdminPath, getJoinPath } from "@/lib/games";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">ゲームを選ぶ</h1>
          <p className="text-muted-foreground text-sm">
            プレイするゲームを選んで、ルームに参加または作成してください
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {GAME_LIST.map((game) => (
            <Card key={game.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{game.emoji}</span>
                  {game.name}
                </CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-2">
                <Button asChild className="w-full">
                  <Link href={getJoinPath(game.id)}>
                    <Users className="w-4 h-4 mr-2" />
                    参加する
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={getAdminPath(game.id)}>
                    <Shield className="w-4 h-4 mr-2" />
                    ルームを作成
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
