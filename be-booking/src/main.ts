import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { 
  UsersModule, LocationsModule, CourtsModule,
  BookingsModule, ReviewsModule, SettingsModule, PaymentsModule, 
  AuthModule, ChatModule, RacketOrdersModule, BlogPostsModule 
} from './modules'; // Đảm bảo đường dẫn import đúng

let cachedApp: any;

async function setupApp(app: any) {
  // Allow larger JSON payloads for base64 image uploads.
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // 1. Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 2. Swagger Config
  const config = new DocumentBuilder()
    .setTitle('Pickleball Booking API')
    .setDescription('API for booking pickleball courts')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Authorization')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      UsersModule, LocationsModule, CourtsModule,
      BookingsModule, ReviewsModule, SettingsModule, PaymentsModule,
      AuthModule, ChatModule, RacketOrdersModule, BlogPostsModule,
    ],
  });
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

// Handler cho Vercel (Serverless)
export default async (req: any, res: any) => {
  if (!cachedApp) {
    const nestApp = await NestFactory.create(AppModule);
    cachedApp = await setupApp(nestApp);
  }
  const instance = cachedApp.getHttpAdapter().getInstance();
  return instance(req, res);
};

// Chạy local (Development)
if (process.env.NODE_ENV !== 'production') {
  async function bootstrap() {
    const nestApp = await NestFactory.create(AppModule);
    const app = await setupApp(nestApp);
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
  }
  bootstrap();
}