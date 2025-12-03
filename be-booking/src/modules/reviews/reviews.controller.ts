import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private svc: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) {
    // body: { courtId, rating, comment }
    return this.svc.create(body);
  }

  @Get('court/:id')
  forCourt(@Param('id') id: string) {
    return this.svc.findByCourt(id);
  }
}
