import { Args, ID, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { PubSub } from 'graphql-subscriptions'
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { Message, MessageRead, Profile, Room, RoomMember } from "./chat.model";
import {
    CreateRoomInput,
    EditMessageInput,
    GetMessagesInput,
    MarkReadInput,
    SendMessageInput
} from './dto/chat.dto'


//  Pub/Sub Event Names
// Constants prevent typos. If you rename an evnet, the complier tells you
const EVENTS = {
    MESSAGE_ADDED: 'MESSAGE_ADDED',
    MESSAGE_UPDATED: 'MESSAGE_UPDATED',
    MESSAGE_DELETED: 'MESSAGE_DELETED',
    MESSAGE_READ: 'MESSAGE_READ'
} as const

// One shared PubSub instance for all subscriptions in this resolver
const pubSub = new PubSub()

@Resolver()
export class ChatResolver {
    constructor(
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway
    ) { }


    /**
     * Get a single user profile.
     *
     * GraphQL query:
     *   query {
     *     profile(id: "uuid") {
     *       username
     *       avatar_url
     *       is_online
     *     }
     *   }
     */
    @Query(() => Profile)
    async profile(@Args('id', { type: () => ID }) id: string): Promise<Profile> {
        return this.chatService.getProfile(id)
    }

    /**
     * Create a new room.
     *
     * GraphQL mutation:
     *   mutation {
     *     createRoom(input: {
     *       name: "Team Chat"
     *       is_group: true
     *       created_by: "user-uuid"
     *       member_ids: ["user-uuid", "other-uuid"]
     *     }) { id name created_at }
     *   }
     */
    @Mutation(() => Room)
    async createRoom(@Args('input') input: CreateRoomInput): Promise<Room> {
        return this.chatService.createRoom(input)
    }

    /**
         * Get a single room by ID.
    */
    @Query(() => Room)
    async room(@Args('id', { type: () => ID }) id: string): Promise<Room> {
        return this.chatService.getRoom(id)
    }

    // Get all rooms a user is a member of (for the sidebar)
    @Query(() => [Room])
    async roomsForUser(
        @Args('user_id', { type: () => ID }) user_id: string,
    ): Promise<Room[]> {
        return this.chatService.getRoomsForUser(user_id)
    }

    // Get all members of a room, with their profile info.
    @Query(() => [RoomMember])
    async roomMembers(
        @Args('room_id', { type: () => ID }) room_id: string
    ): Promise<RoomMember[]> {
        return this.chatService.getRoomMembers(room_id)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MESSAGE QUERIES & MUTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Send a message via GraphQL.
     * After saving, publishes to PubSub so GraphQL subscribers receive it.
     *
     * Example:
     *   mutation {
     *     sendMessage(input: {
     *       room_id: "room-uuid"
     *       sender_id: "user-uuid"
     *       content: "Hello!"
     *     }) { id content created_at sender { username } }
     *   }
     */

    @Mutation(() => Message)
    async sendMessage(@Args('input') input: SendMessageInput): Promise<Message> {
        const message = await this.chatService.saveMessage(input)

        // Publish so all active subscriptions for this room receive the message
        await pubSub.publish(`${EVENTS.MESSAGE_ADDED}.${message.room_id}`, {
            messageAdded: message,
        });

        // Also broadcast over Socket.IO for real-time clients
        this.chatGateway.server?.to(message.room_id).emit('new_message', message)

        return message
    }

    // Edit an Existing message
    @Mutation(() => Message)
    async editMessage(
        @Args('input') input: EditMessageInput,
        @Args('requesting_user_id', { type: () => ID }) requesting_user_id: string
    ): Promise<Message> {
        const message = await this.chatService.editMessage(input, requesting_user_id)

        await pubSub.publish(`${EVENTS.MESSAGE_UPDATED}.${message.room_id}`, {
            messageUpdated: message,
        });

        this.chatGateway.server?.to(message.room_id).emit('message_updated', message)

        return message;
    }

    // Delete a message
    @Mutation(() => Message)
    async deleteMessage(
        @Args('message_id', { type: () => ID }) message_id: string,
        @Args('room_id', { type: () => ID }) room_id: string,
        @Args('requesting_user_id', { type: () => ID }) requesting_user_id: string
    ): Promise<Message> {
        const message = await this.chatService.deleteMessage(message_id, requesting_user_id)
        await pubSub.publish(`${EVENTS.MESSAGE_DELETED}.${room_id}`, {
            messageDeleted: { message_id, room_id, is_deleted: true },
        });

        this.chatGateway.server?.to(room_id).emit('message_deleted', {
            message_id,
            room_id,
            is_deleted: true
        })

        return message;
    }

    /**
 * Get paginated message history for a room.
 *
 * Example (first load):
 *   query {
 *     messages(input: { room_id: "uuid", limit: 30 }) {
 *       id content created_at
 *       sender { username avatar_url }
 *       attachments { file_url file_name }
 *       reply_to { id content sender { username } }
 *     }
 *   }
 *
 * Example (load older messages):
 *   query {
 *     messages(input: {
 *       room_id: "uuid"
 *       before: "2024-01-15T10:00:00Z"   ← cursor
 *       limit: 30
 *     }) { ... }
 *   }
 */
    @Query(() => [Message])
    async messages(@Args('input') input: GetMessagesInput): Promise<Message[]> {
        return this.chatService.getMessages(input)
    }

    // Get a single message by ID (useful for showing quoted messages)
    @Query(() => Message)
    async message(
        @Args('id', { type: () => ID }) id: string,
    ): Promise<Message> {
        return this.chatService.getMessage(id)
    }

    // Mark messages as read (update read receipt)
    @Mutation(() => MessageRead)
    async markRead(@Args('input') input: MarkReadInput): Promise<MessageRead> {
        const receipt = await this.chatService.markRead(input)
        await pubSub.publish(`${EVENTS.MESSAGE_READ}.${input.room_id}`, {
            messageRead: receipt,
        });

        return receipt;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUBSCRIPTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Subscribe to new messages in a room.
     *
     * HOW SUBSCRIPTIONS WORK:
     *   1. Client opens a WebSocket connection to the /graphql endpoint
     *   2. Client sends the subscription operation (below)
     *   3. When sendMessage() is called, pubSub.publish() fires
     *   4. The `filter` function checks if the event matches this subscription's room
     *   5. If yes → the message is pushed to the client over WebSocket
     *
     * GraphQL subscription operation:
     *   subscription {
     *     messageAdded(room_id: "room-uuid") {
     *       id content created_at
     *       sender { username avatar_url }
     *     }
     *   }
     */

    @Subscription(() => Message, {
        /**
         * filter() runs for every published event.
         * payload = the data from pubSub.publish()
         * variables = the arguments from the subscription operation
         *
         * Return true → deliver to this subscriber
         * Return false → skip (not their room)
         */
        filter: (payload, variables) =>
            payload.messageAdded.room_id === variables.room_id,
    })
    messageAdded(@Args('room_id', { type: () => ID }) room_id: string) {
        // asyncIterableIterator returns an async generator that yields events
        return pubSub.asyncIterableIterator(`${EVENTS.MESSAGE_ADDED}.${room_id}`);
    }


    /**
     * Subscribe to message edits in a room.
     */
    @Subscription(() => Message, {
        filter: (payload, variables) =>
            payload.messageUpdated.room_id === variables.room_id,
    })
    messageUpdated(@Args('room_id', { type: () => ID }) room_id: string) {
        return pubSub.asyncIterableIterator(`${EVENTS.MESSAGE_UPDATED}.${room_id}`);
    }

    /**
   * Subscribe to read receipts in a room.
   * Lets you show "Seen by Alice" under messages.
   */
    @Subscription(() => MessageRead, {
        filter: (payload, variables) =>
            payload.messageRead.room_id === variables.room_id,
    })
    messageRead(@Args('room_id', { type: () => ID }) room_id: string) {
        return pubSub.asyncIterableIterator(`${EVENTS.MESSAGE_READ}.${room_id}`);
    }


}


