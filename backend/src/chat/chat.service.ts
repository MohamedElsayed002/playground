import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  CreateRoomInput,
  EditMessageInput,
  GetMessagesInput,
  MarkReadInput,
  SendMessageInput,
} from './dto/chat.dto';
import {
  Attachment,
  Message,
  MessageRead,
  Profile,
  Room,
  RoomMember,
} from './chat.model';
import { Chat } from './entities/chat.entity';
import { GeminiService } from 'src/gemini/gemini.service';
import { GeminiConfig } from 'config/gemini-config';

const MESSAGE_INCLUDE: Prisma.MessageInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      isOnline: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  attachments: true,
  replyTo: {
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isOnline: true,
          lastSeenAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService
  ) { }

  async getProfile(userId: string): Promise<Profile> {
    const row = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!row) throw new NotFoundException(`Profile ${userId} not found`);
    return this.toProfile(row);
  }

  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.prisma.profile.update({
      where: { id: userId },
      data: {
        isOnline,
        ...(isOnline === false && { lastSeenAt: new Date() }),
      },
    });
  }

  async createRoom(input: CreateRoomInput): Promise<Room> {
    const rawMemberIds = (input.member_ids ?? [])
      .map((id) => id.trim())
      .filter(Boolean);
    const uniqueRawMemberIds = Array.from(new Set(rawMemberIds));
    const allIds = Array.from(
      new Set([...uniqueRawMemberIds, input.created_by]),
    );

    const profiles = await this.prisma.profile.findMany({
      where: {
        OR: [{ id: { in: allIds } }, { userId: { in: allIds } }],
      },
      select: { id: true, userId: true },
    });

    const idToProfileId = new Map<string, string>();
    for (const p of profiles) {
      idToProfileId.set(p.id, p.id);
      idToProfileId.set(p.userId, p.id);
    }

    const missing = allIds.filter((id) => !idToProfileId.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Invalid member ids: ${missing.join(', ')}`,
      );
    }

    const createdById = idToProfileId.get(input.created_by)!;
    const memberProfileIds = uniqueRawMemberIds.map(
      (id) => idToProfileId.get(id)!,
    );
    if (!memberProfileIds.includes(createdById)) {
      memberProfileIds.push(createdById);
    }
    const uniqueMemberProfileIds = Array.from(new Set(memberProfileIds));

    // Direct message guardrails: must be exactly two distinct users
    if (!input.is_group) {
      if (uniqueMemberProfileIds.length < 2) {
        throw new BadRequestException(
          'Direct message must include another user',
        );
      }
      if (uniqueMemberProfileIds.length > 2) {
        throw new BadRequestException(
          'Direct message can only include two users',
        );
      }

      const otherId = uniqueMemberProfileIds.find((id) => id !== createdById);
      if (!otherId) {
        throw new BadRequestException(
          'You cannot create a direct message with yourself',
        );
      }

      // Check if a DM between these two users already exists
      const candidates = await this.prisma.room.findMany({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: createdById } } },
            { members: { some: { userId: otherId } } },
            { members: { every: { userId: { in: uniqueMemberProfileIds } } } },
          ],
        },
        include: { members: { select: { userId: true } } },
      });

      const existing = candidates.find((r) => r.members.length === 2);
      if (existing) {
        return this.toRoom(existing);
      }
    }

    const room = await this.prisma.room.create({
      data: {
        name: input.name ?? null,
        description: input.description ?? null,
        isGroup: input.is_group,
        createdBy: createdById,
        members: {
          createMany: {
            data: uniqueMemberProfileIds.map((profileId) => ({
              userId: profileId,
              role: profileId === createdById ? 'admin' : 'member',
            })),
          },
        },
      },
    });

    this.logger.log(`Room created: ${room.id}`);
    return this.toRoom(room);
  }

  async getRoom(roomId: string): Promise<Room> {
    const row = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!row) throw new NotFoundException(`Room ${roomId} not found`);
    return this.toRoom(row);
  }

  async getRoomsForUser(userId: string): Promise<Room[]> {
    const rows = await this.prisma.room.findMany({
      where: {
        members: { some: { userId } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return rows.map((r) => this.toRoom(r));
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const rows = await this.prisma.roomMember.findMany({
      where: {
        roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isOnline: true,
            lastSeenAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return rows.map((m) => ({
      room_id: m.roomId,
      user_id: m.userId,
      role: m.role,
      joined_at: m.joinedAt.toISOString(),
      profile: m.user ? this.toProfile(m.user) : undefined,
    }));
  }

  // Messages
  async saveMessage(input: SendMessageInput): Promise<Message> {
    const membership = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: input.room_id,
          userId: input.sender_id,
        },
      },
    });

    if (!membership)
      throw new ForbiddenException('User is not a member of this room');

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          roomId: input.room_id,
          senderId: input.sender_id,
          content: input.content,
          type: input.type ?? 'text',
          replyToId: input.reply_to_id ?? null,
        },
        include: MESSAGE_INCLUDE,
      }),
      this.prisma.room.update({
        where: {
          id: input.room_id,
        },
        data: {
          updatedAt: new Date(),
        },
      }),
    ]);

    return this.toMessage(message);
  }

  async editMessage(
    input: EditMessageInput,
    requestingUserId: string,
  ): Promise<Message> {
    const existing = await this.prisma.message.findUnique({
      where: {
        id: input.message_id,
      },
      select: {
        senderId: true,
        isDeleted: true,
      },
    });
    if (!existing) throw new NotFoundException('Message not found');
    if (existing.isDeleted)
      throw new BadRequestException('Cannot edit a delete message');
    if (existing.senderId !== requestingUserId)
      throw new ForbiddenException('You can only edit your own messages');

    const updated = await this.prisma.message.update({
      where: {
        id: input.message_id,
      },
      data: {
        content: input.content,
        editedAt: new Date(),
      },
      include: MESSAGE_INCLUDE,
    });
    return this.toMessage(updated);
  }

  async deleteMessage(
    messageId: string,
    requestingUserId: string,
  ): Promise<Message> {
    const existing = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      select: {
        senderId: true,
      },
    });

    if (!existing) throw new NotFoundException('Message not found');
    if (existing.senderId !== requestingUserId)
      throw new ForbiddenException('You can only delete you own messages');

    const deleted = await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        isDeleted: true,
        content: '',
        editedAt: null,
      },
      include: MESSAGE_INCLUDE,
    });
    return this.toMessage(deleted);
  }

  async getMessages(input: GetMessagesInput): Promise<Message[]> {
    const limit = Math.min(input.limit ?? 30, 100);
    const rows = await this.prisma.message.findMany({
      where: {
        roomId: input.room_id,
        ...(input.before && {
          createdAt: {
            lt: new Date(input.before),
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: MESSAGE_INCLUDE,
    });
    return rows.map((m) => this.toMessage(m));
  }

  async getMessage(messageId: string): Promise<Message> {
    const row = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: MESSAGE_INCLUDE,
    });
    if (!row) throw new NotFoundException(`Message ${messageId} not found`);
    return this.toMessage(row);
  }

  // Read receipts

  async markRead(input: MarkReadInput): Promise<MessageRead> {
    const now = new Date();
    const row = await this.prisma.messageRead.upsert({
      where: {
        roomId_userId: { roomId: input.room_id, userId: input.user_id },
      },
      create: {
        roomId: input.room_id,
        userId: input.user_id,
        lastReadMessageId: input.message_id,
        readAt: now,
      },
      update: {
        lastReadMessageId: input.message_id,
        readAt: now,
      },
    });
    return {
      room_id: row.roomId,
      user_id: row.userId,
      last_read_message_id: row.lastReadMessageId ?? undefined,
      read_at: row.readAt.toISOString(),
    };
  }

  private toProfile(p: any): Profile {
    return {
      id: p.id,
      username: p.username,
      avatar_url: p.avatarUrl ?? undefined,
      bio: p.bio ?? undefined,
      is_online: p.isOnline,
      last_seen_at: p.lastSeenAt?.toISOString(),
      created_at: p.createdAt?.toISOString() ?? '',
      updated_at: p.updatedAt?.toISOString() ?? '',
    };
  }

  private toRoom(r: any): Room {
    return {
      id: r.id,
      name: r.name ?? undefined,
      description: r.description ?? undefined,
      is_group: r.isGroup,
      created_by: r.createdBy ?? undefined,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    };
  }

  private toMessage(m: any): Message {
    return {
      id: m.id,
      room_id: m.roomId,
      sender_id: m.senderId ?? undefined,
      content: m.content,
      type: m.type,
      edited_at: m.editedAt?.toISOString(),
      is_deleted: m.isDeleted,
      reply_to_id: m.replyToId ?? undefined,
      created_at: m.createdAt.toISOString(),
      updated_at: m.updatedAt.toISOString(),
      sender: m.sender ? this.toProfile(m.sender) : undefined,
      attachments: (m.attachments ?? []).map(
        (a: any): Attachment => ({
          id: a.id,
          message_id: a.messageId,
          file_url: a.fileUrl,
          file_name: a.fileName,
          file_size: a.fileSize ?? undefined,
          mime_type: a.mimeType ?? undefined,
          created_at: a.createdAt.toISOString(),
        }),
      ),
      reply_to: m.replyTo ? this.toMessage(m.replyTo) : undefined,
    };
  }


  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    this.logger.log(`Processing chat request: ${request.message.substring(0, 50)}`)

    try {
      const response = await this.geminiService.generateContent(
        request.message,
        {
          model: request.model || GeminiConfig.models.chat,
          useWebSearch: request.enableWebSearch ?? true,
          thinkingBudget: this.getThinkingBudget(request.complexity),
          includeThoughts: true,
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 8192
        }
      )

      // Calculate cache savings if applicable
      const cacheSavings = response.usage.cachedTokens > 0
      ? {
          cached: response.usage.cachedTokens,
          total: response.usage.totalTokens,
          savingsPercentage: ((response.usage.cachedTokens / response.usage.totalTokens) * 75).toFixed(1),
        }
      : null;

      return {
        response: response.text,
        sources: response.sources,
        usage: response.usage,
        cacheSavings: cacheSavings ?? undefined,
        cost: this.geminiService.calculateCost(response.usage,request.model),
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
        timestamp: new Date()
      }
    } catch (error) {
      return error
    }
  }

  async streamChat(request: ChatRequestDto): Promise<Observable<MessageEvent>> {
    this.logger.log(`Streaming chat request ${request.message.substring(0,50)}`)

    return new Observable((subscriber) => {
      (async () => {
        try {
          const stream = await this.geminiService.streamContent(
            request.message,
            {
              model: request.model || GeminiConfig.models.chat,
              useWebSearch: request.enableWebSearch ?? true,
              temperature: request.temperature ?? 0.7,
              maxTokens: request.maxTokens ?? 8192
            }
          )

          for await(const chunk of stream) {
            subscriber.next({
              data: {text: chunk},
            } as MessageEvent)
          }
          subscriber.complete()
        }catch(error) {
          subscriber.error(error)
          return error
        }
      })
    })
  }

  private getThinkingBudget(complexity?: 'simple' | 'medium' | 'complex' | 'advanced'): number {
    return GeminiConfig.thinkingBudgets[complexity || 'medium']
  }
}
