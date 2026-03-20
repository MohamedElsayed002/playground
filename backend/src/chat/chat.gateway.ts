// Normal HTTP:  client sends request → server responds → done.
// WebSocket:    connection stays OPEN → either side can push data
//               at any time without a new request.
//
// Socket.IO builds on WebSocket and adds:
//   • Named events  (like custom message types)
//   • Rooms         (groups of sockets — maps perfectly to chat rooms)
//   • Auto-reconnect on network drop
//
// NestJS decorators:
//   @WebSocketGateway()  → register this class as a Socket.IO server
//   @WebSocketServer()   → inject the raw Socket.IO Server instance
//   @SubscribeMessage()  → handle a named incoming event
//
// CLIENT CONNECTION:
//   import { io } from 'socket.io-client';
//   const socket = io('http://localhost:3000/chat', {
//     auth: { user_id: 'your-uuid' }   ← sent in handshake
//   });
//
// EVENTS  (client → server):
//   join_room     { room_id }
//   leave_room    { room_id }
//   send_message  SendMessageInput
//   edit_message  EditMessageInput & { room_id, requesting_user_id }
//   delete_message { message_id, room_id, requesting_user_id }
//   typing_start  { room_id, user_id, username }
//   typing_stop   { room_id, user_id }
//   mark_read     MarkReadInput
//
// EVENTS  (server → client):
//   new_message     Message
//   message_updated Message
//   message_deleted { message_id, room_id, is_deleted: true }
//   user_joined     { room_id, user_id }
//   user_left       { room_id, user_id }
//   user_typing     { room_id, user_id, username?, is_typing }
//   message_read    MessageRead
//   error           { event, message }
// =================================================================

import { 
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
 } from "@nestjs/websockets"
 import { Logger } from "@nestjs/common"
 import { Server, Socket} from "socket.io"
 import { ChatService } from "./chat.service"
 import {
  EditMessageInput,
  MarkReadInput,
  SendMessageInput
  } from './dto/chat.dto'

  const socketUserMap = new Map<string,string>()

  @WebSocketGateway({
    cors:      { origin: '*', credentials: true },
    namespace: '/chat',   // client connects to: ws://localhost:3000/chat
  })


export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()

  server: Server

  private readonly logger = new Logger(ChatGateway.name)

  constructor(private readonly chatService: ChatService) {}

  // Lifecycle 
  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.user_id as string | undefined
    this.logger.log(`[connect] ${client.id}  user=${userId ?? 'unknown'}`)

    if(userId) {
      socketUserMap.set(client.id,userId)
      this.chatService.setOnlineStatus(userId,true).catch(() => null)
    }
  }

  handleDisconnect(client: Socket) {
      const userId = socketUserMap.get(client.id)
      this.logger.log(`[disconnect] ${client.id} user=${userId ?? 'unknown'}`)

      if(userId) {
        socketUserMap.delete(client.id)
        // Only mark offline if the user has no other open tabs/devices
        const stillOnline = [...socketUserMap.values()].includes(userId)
        if(!stillOnline) {
          this.chatService.setOnlineStatus(userId,false).catch(() => null)
        }
      }
  }

  // Room Management 
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room_id: string}
  ) {
    try {
      await client.join(payload.room_id)
      const userId = socketUserMap.get(client.id)
      this.logger.log(`[join_room] user=${userId} room=${payload.room_id}`)
      client.to(payload.room_id).emit('user_joined',{
        room_id: payload.room_id,
        user_id: userId
      })

      return { success: true, room_id: payload.room_id}
    }catch(error) {
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage('leave_room') 
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {room_id: string}
  ) {
    await client.leave(payload.room_id)
    const userId = socketUserMap.get(client.id)
    client.to(payload.room_id).emit('user_left',{
      room_id: payload.room_id,
      user_id: userId
    })
    return { success: true}
  }

  // Messaging
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageInput
  ) {
    try {
      const message = await this.chatService.saveMessage(payload)

      this.server.to(payload.room_id).emit('new_message',message)

      return { success: true, message_id: message.id}
    }catch(error) {
      this.logger.error(`send_message: ${error.message}`)
      client.emit('error',{event: 'send_message',message: error.message})
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EditMessageInput & { room_id: string, requesting_user_id: string}
  ) {
    try {
      const message = await this.chatService.editMessage(
        {
          message_id: payload.message_id,
          content: payload.content
        },
        payload.requesting_user_id
      )
      this.server.to(payload.room_id).emit('message_updated',message)
      return { sucess: true}
    }catch(error) {
      client.emit('error',{event: 'edit_message',message: error.messaage})
      throw new WsException(error.message)
    }
  }


  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {message_id: string, room_id: string, requesting_user_id: string}
  ) {
    try {
      await this.chatService.deleteMessage(
        payload.message_id,
        payload.requesting_user_id
      )
      this.server.to(payload.room_id).emit('message_deleted',{
        message_id: payload.message_id,
        room_id: payload.room_id,
        is_deleted: true
      })
      return { sucess: true}
    }catch(error) {
      client.emit('error', { event: 'delete_message', message: error.message });
      throw new WsException(error.message)
    }
  }

  // Typing indicator (Not saved to DB)
  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room_id: string, user_id: string, username: string}
  ) {
    // client.to() sends to everyone in the room EXCEPT the send
    client.to(payload.room_id).emit('user_typing',{
      ...payload,
      is_typing: true
    })
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room_id: string; user_id: string}
  ) {
    client.to(payload.room_id).emit('user_typing',{
      ...payload,
      is_typing: false
    })
  }

  // Read receipts 
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkReadInput
  ) {
    try {
      const receipt = await this.chatService.markRead(payload)

      // Broadcast so other clients can show "Seen by X" indicators
      client.to(payload.room_id).emit("message_read",receipt)
      return { success: true}
    }catch(error) {
      return {
        success: false,
        message: error.messsage
      }
    }
  }
}