import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { Court } from './entities/court.entity';
import { Booking } from './entities/booking.entity';
import { Review } from './entities/review.entity';
import { Payment } from './entities/payment.entity';
import { Setting } from './entities/setting.entity';
import { Venue } from './entities/venue.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Product } from './entities/product.entity';
import { Racket } from './entities/racket.entity';
import { RacketRental } from './entities/racket-rental.entity';
import { RacketOrder } from './entities/racket-order.entity';
import { BlogPost } from './entities/blog-post.entity';
import { UsersModule } from './modules/users/users.module';
import { VenuesModule } from './modules/venues/venues.module';
import { ChatModule } from './modules/chat/chat.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CourtsModule } from './modules/courts/courts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UploadModule } from './modules/upload/upload.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { RacketsModule } from './modules/rackets/rackets.module';
import { RacketRentalsModule } from './modules/racket-rentals/racket-rentals.module';
import { RacketOrdersModule } from './modules/racket-orders/racket-orders.module';
import { BlogPostsModule } from './modules/blog-posts/blog-posts.module';

// normalize environment values (strip accidental surrounding quotes like "password")
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const skip = (process.env.SKIP_DB ?? cfg.get('SKIP_DB')) === 'true';
        const entities = [User, Location, Court, Booking, Review, Setting, Payment, Venue, ChatConversation, ChatMessage, Product, Racket, RacketRental, RacketOrder, BlogPost];

        const trimQuotes = (s?: string) =>
          (s || '').replace(/^\s*"(.*)"\s*$/, '$1').replace(/^\s*'(.*)'\s*$/, '$1').trim();

        const databaseUrl = trimQuotes(
          cfg.get<string>('DATABASE_URL') ??
            cfg.get<string>('MYSQL_PUBLIC_URL') ??
            cfg.get<string>('MYSQL_URL') ??
            cfg.get<string>('DATABASE_PUBLIC_URL'),
        );

        if (skip) {
          return {
            type: 'sqlite' as const,
            database: ':memory:',
            entities,
            synchronize: false,
          };
        }

        // Common pool configuration for both URL and manual connection
        const poolConfig = {
          extra: {
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0,
            enableKeepAlive: true,
            decimalNumbers: true,
          },
        };

        if (databaseUrl) {
          return {
            type: 'mysql' as const,
            url: databaseUrl,
            entities,
            synchronize: true,
            ...poolConfig,
          };
        }

        return {
          type: 'mysql' as const,
          host: (cfg.get<string>('DB_HOST') ?? cfg.get<string>('MYSQLHOST') ?? 'localhost') as string,
          port: Number(cfg.get('DB_PORT') ?? cfg.get('MYSQLPORT') ?? 3306),
          username: (cfg.get<string>('DB_USERNAME') ?? cfg.get<string>('DB_USER') ?? cfg.get<string>('MYSQLUSER') ?? 'root') as string,
          password: trimQuotes(cfg.get<string>('DB_PASSWORD') ?? cfg.get<string>('MYSQLPASSWORD')),
          database: (cfg.get<string>('DB_DATABASE') ?? cfg.get<string>('DB_NAME') ?? cfg.get<string>('MYSQLDATABASE') ?? 'pickleball_booking') as string,
          entities,
          synchronize: true,
          ...poolConfig,
        };
      },
    }),
    UsersModule,
    VenuesModule,
    LocationsModule,
    CourtsModule,
    BookingsModule,
    ReviewsModule,
    UploadModule,
    SettingsModule,
    PaymentsModule,
    AuthModule,
    ChatModule,
    ProductsModule,
    RacketsModule,
    RacketRentalsModule,
    RacketOrdersModule,
    BlogPostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
