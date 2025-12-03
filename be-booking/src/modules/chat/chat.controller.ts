import { Body, Controller, Post, UseGuards, Request, Optional } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface ChatRequestDto {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  conversationId?: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Request() req: any, @Body() body: ChatRequestDto) {
    // Get user ID from request (if authenticated, optional)
    const userId = req.user?.id;
    return this.chatService.sendMessage(userId, body);
  }

  @Post('conversation')
  async createConversation(@Request() req: any) {
    // Optional: allow unauthenticated users to create conversations
    const userId = req.user?.id;
    return this.chatService.createConversation(userId);
  }
}

