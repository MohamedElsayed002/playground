import { Suspense }       from 'react';
import { RoomHeader } from '@/components/chat/room-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { MemberList } from '@/components/chat/member-list';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      <div className="flex flex-col flex-1 min-w-0">

        <Suspense fallback={<div className="h-14 border-b animate-pulse bg-gray-50" />}>
          <RoomHeader roomId={roomId} />
        </Suspense>

        <MessageList roomId={roomId} />

        <MessageInput roomId={roomId} />
      </div>

      <MemberList roomId={roomId} />

    </div>
  );
}