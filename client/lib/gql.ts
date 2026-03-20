// ─────────────────────────────────────────────────────────────────
// src/lib/gql.ts  — All GraphQL documents in one place
// ─────────────────────────────────────────────────────────────────
// Keeping every query/mutation/subscription string here means:
//   • One file to update if the schema changes
//   • Easy to see all operations the frontend uses
// ─────────────────────────────────────────────────────────────────


export const PROFILE_FRAGMENT = `
  fragment ProfileFields on Profile {
    id username avatar_url bio is_online last_seen_at created_at updated_at
  }
`;

export const MESSAGE_FRAGMENT = `
  fragment MessageFields on Message {
    id room_id sender_id content type edited_at is_deleted reply_to_id created_at updated_at
    sender { ...ProfileFields }
    attachments { id message_id file_url file_name file_size mime_type created_at }
    reply_to {
      id content sender_id created_at
      sender { ...ProfileFields }
    }
  }
`;

// ── Queries ───────────────────────────────────────────────────────

export const GET_PROFILE = `
  ${PROFILE_FRAGMENT}
  query GetProfile($id: ID!) {
    profile(id: $id) { ...ProfileFields }
  }
`;

export const GET_ROOMS_FOR_USER = `
  query GetRoomsForUser($user_id: ID!) {
    roomsForUser(user_id: $user_id) {
      id name description is_group created_by created_at updated_at
    }
  }
`;

export const GET_ROOM = `
  query GetRoom($id: ID!) {
    room(id: $id) {
      id name description is_group created_by created_at updated_at
    }
  }
`;

export const GET_ROOM_MEMBERS = `
  ${PROFILE_FRAGMENT}
  query GetRoomMembers($room_id: ID!) {
    roomMembers(room_id: $room_id) {
      room_id user_id role joined_at
      profile { ...ProfileFields }
    }
  }
`;

export const GET_MESSAGES = `
  ${PROFILE_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  query GetMessages($input: GetMessagesInput!) {
    messages(input: $input) { ...MessageFields }
  }
`;

export const GET_MESSAGE = `
  ${PROFILE_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  query GetMessage($id: ID!) {
    message(id: $id) { ...MessageFields }
  }
`;

// ── Mutations ─────────────────────────────────────────────────────

export const CREATE_ROOM = `
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      id name description is_group created_by created_at updated_at
    }
  }
`;

export const SEND_MESSAGE = `
  ${PROFILE_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) { ...MessageFields }
  }
`;

export const EDIT_MESSAGE = `
  ${PROFILE_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  mutation EditMessage($input: EditMessageInput!, $requesting_user_id: ID!) {
    editMessage(input: $input, requesting_user_id: $requesting_user_id) { ...MessageFields }
  }
`;

export const DELETE_MESSAGE = `
  mutation DeleteMessage($message_id: ID!, $room_id: ID!, $requesting_user_id: ID!) {
    deleteMessage(
      message_id: $message_id
      room_id: $room_id
      requesting_user_id: $requesting_user_id
    ) { id is_deleted }
  }
`;

export const MARK_READ = `
  mutation MarkRead($input: MarkReadInput!) {
    markRead(input: $input) {
      room_id user_id last_read_message_id read_at
    }
  }
`;

// ── Subscriptions ─────────────────────────────────────────────────

export const SUB_MESSAGE_ADDED = `
  ${PROFILE_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  subscription MessageAdded($room_id: ID!) {
    messageAdded(room_id: $room_id) { ...MessageFields }
  }
`;

export const SUB_MESSAGE_UPDATED = `
  ${PROFILE_FRAGMENT}
  ${MESSAGE_FRAGMENT}
  subscription MessageUpdated($room_id: ID!) {
    messageUpdated(room_id: $room_id) { ...MessageFields }
  }
`;

export const SUB_MESSAGE_READ = `
  subscription MessageRead($room_id: ID!) {
    messageRead(room_id: $room_id) {
      room_id user_id last_read_message_id read_at
    }
  }
`;