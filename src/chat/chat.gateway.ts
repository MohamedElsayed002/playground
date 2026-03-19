import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OnModuleInit } from '@nestjs/common';
import { Server } from "socket.io"

@WebSocketGateway()
export class ChatGateway implements OnModuleInit{
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server

  onModuleInit() {
     this.server.on('connection',(socket) => {
      console.log(socket.id)
     })
  }

  @SubscribeMessage('createChat')
  create(@MessageBody() message: string) {
    this.server.emit('newSentMessage',message)
    // return this.chatService.create(message);
  }

  @SubscribeMessage('sentSingleClient')
  sentSingleClient(
    @MessageBody() data: { targetClient: string, message: string}
  ) {
    // const target = this.server.sockets.sockets.get(data.targetClient)
    // target?.emit('sentSingleClient',data.message)
    this.server.to(data.targetClient).emit('sentSingleClient',data.message)
  }


}
