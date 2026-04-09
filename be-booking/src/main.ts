import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CourtsModule } from './modules/courts/courts.module';
import { TimeSlotsModule } from './modules/timeslots/timeslots.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: true, // cho phép tất cả origin (dev)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const config = new DocumentBuilder()
    .setTitle('Pickleball Booking API')
    .setDescription('API for booking pickleball courts')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Authorization')
    .build();

  // ensure the application is fully initialized so Swagger explorer can scan controllers/routes
  await app.init();

  // Make sure every module has a 'routes' Map so Swagger scanner doesn't crash
  try {
    const container = (app as any).container;
    const modules = [...container.getModules().values()];
    modules.forEach((m: any) => {
      if (!m.routes || typeof m.routes.values !== 'function') {
        m.routes = new Map();
      }
    });

    // DEBUG: inspect internal modules to find any module with missing routes (causes SwaggerScanner crash)
    const bad = modules.filter((m: any) => !m.routes || typeof m.routes.values !== 'function');
    if (bad.length > 0) {
      console.error('Swagger debug: found modules with missing/invalid routes:');
      bad.forEach((m: any) => console.error(' -', m.metatype?.name || '<anonymous>', 'routes=', m.routes));
    }
  } catch (err) {
    console.error('Swagger debug: container inspection failed', err);
  }

  // Create the OpenAPI document but only scan application modules that have HTTP controllers.
  // This avoids scanning internal/core modules which do not expose a routes map and cause the
  // Swagger scanner to crash in some NestJS versions/environments.
  const document = SwaggerModule.createDocument(app, config, {
    include: [
      UsersModule,
      LocationsModule,
      CourtsModule,
      TimeSlotsModule,
      BookingsModule,
      ReviewsModule,
      SettingsModule,
      PaymentsModule,
      AuthModule,
      ChatModule,
    ],
  });
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
