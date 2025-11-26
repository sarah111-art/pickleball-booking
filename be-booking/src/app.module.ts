import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { Court } from './entities/court.entity';
import { TimeSlot } from './entities/timeslot.entity';
import { Booking } from './entities/booking.entity';
import { Review } from './entities/review.entity';
import { Payment } from './entities/payment.entity';
import { Setting } from './entities/setting.entity';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CourtsModule } from './modules/courts/courts.module';
import { TimeSlotsModule } from './modules/timeslots/timeslots.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UploadModule } from './modules/upload/upload.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AuthModule } from './modules/auth/auth.module';

// normalize environment values (strip accidental surrounding quotes like "password")
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): TypeOrmModuleOptions => {
        const skip = (process.env.SKIP_DB ?? cfg.get('SKIP_DB')) === 'true';
        const entities = [User, Location, Court, TimeSlot, Booking, Review, Setting, Payment];

        const trimQuotes = (s?: string) =>
          (s || '').replace(/^\s*"(.*)"\s*$/, '$1').replace(/^\s*'(.*)'\s*$/, '$1');

        if (skip) {
          return {
            type: 'sqlite' as const,
            database: ':memory:',
            entities,
            synchronize: true,
          };
        }

        return {
          type: 'mysql' as const,
          host: cfg.get('DB_HOST') ?? 'localhost',
          port: Number(cfg.get('DB_PORT') ?? 3306),
          username: cfg.get('DB_USERNAME') ?? 'root',
          password: trimQuotes(cfg.get<string>('DB_PASSWORD')),
          database: (cfg.get<string>('DB_NAME') ?? 'pickleball_booking') as string,
          entities,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    LocationsModule,
    CourtsModule,
    TimeSlotsModule,
    BookingsModule,
    ReviewsModule,
    UploadModule,
    SettingsModule,
    PaymentsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
