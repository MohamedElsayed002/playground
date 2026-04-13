import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = body?.query || "";

  const users = await prisma.users.findMany({
    select: {
      email: true,
      profiles: {
        select: {
          username: true,
        },
      },
    },
    where: query
      ? {
          OR: [
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              profiles: {
                is: {
                  username: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {},
  });

  return NextResponse.json({ users });
}
