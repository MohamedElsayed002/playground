"use server";

import { prisma } from "@/lib/db";
import { ChatMode, MessageRole } from "@/lib/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function getChats() {
  try {
    return await prisma.chat.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
}

export async function getChat(id: string) {
  try {
    return await prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching chat ${id}:`, error);
    return null;
  }
}

export async function createChat(mode: ChatMode = "chat") {
  try {
    const chat = await prisma.chat.create({
      data: {
        title: "New Chat",
        mode,
      },
    });
    revalidatePath("/multiple-ai");
    return chat;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw new Error("Could not create chat session.");
  }
}

export async function deleteChat(id: string) {
  try {
    await prisma.chat.delete({
      where: { id },
    });
    revalidatePath("/multiple-ai");
    return { success: true };
  } catch (error) {
    console.error(`Error deleting chat ${id}:`, error);
    throw new Error("Could not delete chat session.");
  }
}

export async function saveUserMessage({
  chatId,
  content,
  modelId,
  mode,
}: {
  chatId: string;
  content: string;
  modelId: string;
  mode: ChatMode;
}) {
  try {
    const message = await prisma.message.create({
      data: {
        role: "user" as MessageRole,
        content,
        model: modelId,
        mode,
        chatId,
      },
    });
    revalidatePath(`/multiple-ai/${chatId}`);
    return message;
  } catch (error) {
    console.error("Error saving user message:", error);
    throw new Error("Could not save message.");
  }
}
