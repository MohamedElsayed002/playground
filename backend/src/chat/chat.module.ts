import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatResolver } from './chat.resolver';
import { AuthModule } from 'src/auth/auth.module';
import { GeminiModule } from 'src/gemini/gemini.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [AuthModule,GeminiModule],
  providers: [ChatGateway, ChatService, ChatResolver],
  controllers: [ChatController]
})
export class ChatModule {}
