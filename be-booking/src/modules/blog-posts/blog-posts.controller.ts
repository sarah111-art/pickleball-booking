import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BlogPostsService } from './blog-posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blog-posts')
export class BlogPostsController {
  constructor(private svc: BlogPostsService) {}

  @Get()
  findPublic(@Query() q: any) {
    return this.svc.findPublic(q);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAdmin() {
    return this.svc.findAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
