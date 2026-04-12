export interface User {
  id: string;
  name: string;
  lastName: string;
  phoneNumber: string;
  bio: string;
  sex: string;
  image: string;
}

export interface GQL_Response_User {
  allUsers: {
    usersCount: number;
    users: User[];
  };
}

export interface GQL_Single_User {
  SingleUserFake: User;
}

export interface AuthProfile {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  profile: AuthProfile;
}

// GraphQL Models

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  is_online: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name?: string;
  description?: string;
  is_group: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id?: string;
  sender?: Profile;
  content: string;
  type: "text" | "image" | "file" | "system";
  edited_at?: string;
  is_deleted: boolean;
  reply_to_id?: string;
  reply_to?: Message;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: "member" | "admin";
  profile?: Profile;
  joined_at: string;
}

export interface MessageRead {
  room_id: string;
  user_id: string;
  last_read_message_id?: string;
  read_at: string;
}

// Socket.IO

export interface TypingPayload {
  room_id: string;
  user_id: string;
  username?: string;
  is_typing: boolean;
}

export interface UserPresencePayload {
  room_id: string;
  user_id: string;
}

export interface MessageDeletedPayload {
  message_id: string;
  room_id: string;
  is_deleted: true;
}

export type CodeSnippet = {
  language: string;
  code: string;
};
