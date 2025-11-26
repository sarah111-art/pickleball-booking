# be-booking (backend)

This is a minimal NestJS backend for the Pickleball Booking system. It includes modules and endpoints for Auth, Users, Courts, TimeSlots, Bookings, Payments (stub), Reviews, Upload (Cloudinary), Locations, and Settings.

## Quick start

Set environment variables in `.env` (example already included).

Install and run (Windows PowerShell):

```powershell
cd be-booking
npm install --legacy-peer-deps
npm run start:dev
```

The app runs at http://localhost:3000 by default.

## Main API endpoints (summary)

- Auth
  - POST /auth/register { email, password, fullname, phone } -> { user, accessToken }
  - POST /auth/login { email, password } -> { accessToken, refreshToken }
  - POST /auth/refresh-token { refreshToken } -> { accessToken }
  - POST /auth/forgot-password { email } -> { ok, resetToken }
  - POST /auth/reset-password { resetToken, password } -> { ok }
  - GET /auth/profile (Bearer) -> returns authenticated user

- Users
  - GET /users (protected)
  - GET /users/:id (protected)
  - POST /users (protected)
  - PATCH /users/:id (protected)
  - PATCH /users/:id/role (protected)
  - DELETE /users/:id (protected)

- Locations
  - POST/GET/GET:id/PATCH/DELETE /locations

- Courts
  - POST /courts (protected)
  - GET /courts?locationId=&minPrice=&maxPrice=&isActive= -> filter
  - GET /courts/:id
  - PUT /courts/:id (protected)
  - DELETE /courts/:id (protected)

- TimeSlots
  - POST /courts/:id/timeslots (protected) -> create slots for a date
  - GET /courts/:id/timeslots?date=YYYY-MM-DD
  - DELETE /timeslots/:id (protected)

- Bookings
  - POST /bookings (protected) { courtId, date, slotId, paymentMethod, note }
  - GET /bookings/my (protected)
  - GET /bookings?courtId=&date=
  - GET /bookings/:id
  - PATCH /bookings/:id/cancel (protected)

- Payments (stub)
  - POST /payments/create { bookingId, provider }
  - POST /payments/callback
  - GET /payments/status?bookingId=

- Reviews
  - POST /reviews (protected)
  - GET /reviews/court/:id

- Upload
  - Images are uploaded directly to Cloudinary when creating or updating courts. There is no standalone `/upload` API.
  - When creating/updating a court, provide `images` as an array of base64 strings or existing Cloudinary URLs — the server will upload base64 images to Cloudinary and store returned URLs.

- Settings
  - GET /settings (protected)
  - PUT /settings (protected)

## Notes
- This project uses TypeORM with MySQL (config in `.env`). For dev ease, `synchronize: true` is enabled — switch it off for production.
- The Payments module is a stub — to integrate with VNPay / MoMo / ZaloPay, implement provider-specific flows.
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
