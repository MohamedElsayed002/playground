// src/app/(chat)/rooms/[roomId]/page.tsx
// ─────────────────────────────────────────────────────────────────
// The main chat view for a single room.
// Layout (left-to-right inside the chat shell):
//
//   ┌──────────┬───────────────────────────┬──────────┐
//   │ RoomList │   header                  │          │
//   │ (sidebar)│   ───────────────────     │ Member   │
//   │          │   MessageList             │ List     │
//   │          │   (scrollable)            │          │
//   │          │   ───────────────────     │          │
//   │          │   MessageInput            │          │
//   └──────────┴───────────────────────────┴──────────┘
//
// Socket.IO connection is managed inside MessageInput via useSocket,
// which joins the room on mount and leaves on unmount automatically.
// ─────────────────────────────────────────────────────────────────

import { Suspense }       from 'react';
// import { RoomHeader }     from '@/components/chat/RoomHeader';
// import { MessageList }    from '@/components/chat/MessageList';
// import { MessageInput }   from '@/components/chat/MessageInput';
// import { MemberList }     from '@/components/chat/MemberList';
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

      {/* ── Centre column: header + messages + input ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Room header: name, description, member count */}
        <Suspense fallback={<div className="h-14 border-b animate-pulse bg-gray-50" />}>
          <RoomHeader roomId={roomId} />
        </Suspense>

        {/* Scrollable message history */}
        <MessageList roomId={roomId} />

        {/* Composer — also handles typing events via useSocket */}
        <MessageInput roomId={roomId} />
      </div>

      {/* ── Right column: member list + online status ── */}
      <MemberList roomId={roomId} />

    </div>
  );
}