import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { User } from '../entities/user.entity';
import { Location } from '../entities/location.entity';
import { Court } from '../entities/court.entity';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';
import { Setting } from '../entities/setting.entity';
import { Payment } from '../entities/payment.entity';
import { Venue } from '../entities/venue.entity';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Product } from '../entities/product.entity';
import { Racket } from '../entities/racket.entity';
import { RacketRental } from '../entities/racket-rental.entity';
import { RacketOrder } from '../entities/racket-order.entity';
import { BlogPost } from '../entities/blog-post.entity';

config();

const trimQuotes = (s?: string) =>
  (s || '').replace(/^\s*"(.*)"\s*$/, '$1').replace(/^\s*'(.*)'\s*$/, '$1');

export default new DataSource({
  type: 'mysql',
  host: trimQuotes(process.env.DB_HOST || 'localhost'),
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: trimQuotes(process.env.DB_USER || process.env.DB_USERNAME || 'root'),
  password: trimQuotes(process.env.DB_PASSWORD || ''),
  database: trimQuotes(process.env.DB_NAME || process.env.DB_DATABASE || 'pickleball'),
  entities: [User, Location, Court, Booking, Review, Setting, Payment, Venue, ChatConversation, ChatMessage, Product, Racket, RacketRental, RacketOrder, BlogPost],
  migrations: [__dirname + '/1*'],
  synchronize: false,
});