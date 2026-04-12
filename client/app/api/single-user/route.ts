import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await req.json();
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  return NextResponse.json({ user });
}
