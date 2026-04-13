import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatConversation } from '../../entities/chat-conversation.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { Venue } from '../../entities/venue.entity';
import { Court } from '../../entities/court.entity';
import { Location } from '../../entities/location.entity';
import { Racket } from '../../entities/racket.entity';
import { Booking } from '../../entities/booking.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatConversation, ChatMessage, Venue, Court, Location, Racket, Booking])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

