import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private svc: ReviewsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.svc.create({
      courtId: body.courtId,
      rating: body.rating,
      comment: body.comment,
      userId: req.user?.id,
    });
  }

  @Get('court/:id')
  forCourt(@Param('id') id: string) {
    return this.svc.findByCourt(id);
  }
}
