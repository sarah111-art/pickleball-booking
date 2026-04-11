import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import controllers and service tokens to create a minimal module for docs
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { UsersController } from '../modules/users/users.controller';
import { UsersService } from '../modules/users/users.service';
import { CourtsController } from '../modules/courts/courts.controller';
import { CourtsService } from '../modules/courts/courts.service';
import { BookingsController } from '../modules/bookings/bookings.controller';
import { BookingsService } from '../modules/bookings/bookings.service';
import { ReviewsController } from '../modules/reviews/reviews.controller';
import { ReviewsService } from '../modules/reviews/reviews.service';
import { UploadController } from '../modules/upload/upload.controller';
import { UploadService } from '../modules/upload/upload.service';
import { SettingsController } from '../modules/settings/settings.controller';
import { SettingsService } from '../modules/settings/settings.service';
import { PaymentsController } from '../modules/payments/payments.controller';
import { PaymentsService } from '../modules/payments/payments.service';
import { LocationsController } from '../modules/locations/locations.controller';
import { LocationsService } from '../modules/locations/locations.service';
import * as fs from 'fs';
const converter = require('openapi-to-postmanv2');

async function generate() {
  // create the full AppModule — when SKIP_DB=true AppModule uses a sqlite in-memory DB so controllers/repositories initialize
  // require AppModule so it resolves correctly under ts-node register
  const { AppModule } = require('../app.module');
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Pickleball Booking API')
    .setDescription('API for booking pickleball courts')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Authorization')
    .build();

  try {
    // debug: check modules & their routes to avoid scanner crashes
    const container = (app as any).container;
    const modules = [...container.getModules().values()];
    modules.forEach((m: any) => {
      console.log('module', m.metatype?.name || '<anonymous>', 'routes?', !!m.routes);
    });

    // ensure Nest fully initializes routes
    await app.init();

    const document = SwaggerModule.createDocument(app, config);

    const outFile = 'swagger.json';
    fs.writeFileSync(outFile, JSON.stringify(document, null, 2));
    console.log('Wrote', outFile);

    // convert to Postman collection
    await new Promise<void>((resolve, reject) => {
      converter.convert({ type: 'json', data: document }, {}, (err: any, result: any) => {
        if (!result || !result.result) {
          console.error('OpenAPI -> Postman conversion failed', err, result);
          reject(new Error('conversion failed'));
          return;
        }

        const postman = result.output[0].data;
        fs.writeFileSync('postman_collection.json', JSON.stringify(postman, null, 2));
        console.log('Wrote postman_collection.json');
        resolve();
      });
    });

    await app.close();

  } catch (err) {
    console.error('failed to create swagger document', err);
    process.exit(1);
  }

  process.exit(0);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
