import { Args, ID, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { PubSub } from 'graphql-subscriptions'
import { ChatService } from "./chat.service";
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
    constructor(private readonly chatService: ChatService) { }


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

}


