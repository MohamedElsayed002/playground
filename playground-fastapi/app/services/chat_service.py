import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import NotFoundException
from app.models.chat import ChatConversation, ChatMessage


CONTEXT_MESSAGE_LIMIT = 20


async def get_or_create_conversation(
    db: AsyncSession, user_id: int, conversation_id: uuid.UUID | None
) -> ChatConversation:
    if conversation_id is None:
        conversation = ChatConversation(user_id=user_id)
        db.add(conversation)
        await db.flush()
        return conversation

    result = await db.execute(
        select(ChatConversation)
        .where(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id,
        )
        .with_for_update()
    )
    conversation = result.scalar_one_or_none()
    if conversation is None:
        raise NotFoundException("Chat conversation", conversation_id)
    return conversation


async def get_context_messages(
    db: AsyncSession, conversation_id: uuid.UUID
) -> list[dict[str, object]]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(CONTEXT_MESSAGE_LIMIT)
    )
    messages = list(reversed(result.scalars().all()))
    return [{"role": message.role, "content": [{"text": message.content}]} for message in messages]


async def save_message(
    db: AsyncSession, conversation_id: uuid.UUID, role: str, content: str
) -> ChatMessage:
    message = ChatMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    db.add(message)
    await db.flush()
    return message
