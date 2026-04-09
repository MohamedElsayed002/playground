import { 
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Sse,
    MessageEvent,
    Get
} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger"
// import { ThrottlerGuard } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller('chat')
// @UseGuards(ThrottlerGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Send a chat message with web search grounding',
        description: 'Send a message to the AI chat. Supports web search grounding, custom models, temperature control, and thinking budget configuration.'
    })
    @ApiBody({ type: ChatRequestDto })
    @ApiResponse({
        status: 200,
        description: 'Chat response with sources and usage metrics',
        type: ChatResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid input',
    })
    @ApiResponse({
        status: 429,
        description: 'Too many requests - Rate limit exceeded',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
        return this.chatService.chat(chatRequest)
    }

    @Sse('stream')
    @ApiOperation({
        summary: 'Stream chat response',
        description: 'Get a streaming response from the AI chat. Returns Server-Sent Events (SSE) with incremental text chunks.'
    })
    @ApiBody({ type: ChatRequestDto })
    @ApiResponse({
        status: 200,
        description: 'Streaming chat response (Server-Sent Events)',
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid input',
    })
    @ApiResponse({
        status: 429,
        description: 'Too many requests - Rate limit exceeded',
    })
    async streamChat(@Body() chatRequest: ChatRequestDto): Promise<Observable<MessageEvent>> {
        return this.chatService.streamChat(chatRequest)
    }

    @Get('/debug-sentry')
    getError() {
        console.log("I'm Batman")
        throw new Error("My first Error")
    }
}
