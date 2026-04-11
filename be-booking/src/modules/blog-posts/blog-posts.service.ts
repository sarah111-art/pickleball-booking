import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../../entities/blog-post.entity';

interface UpsertBlogPostPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

@Injectable()
export class BlogPostsService {
  constructor(@InjectRepository(BlogPost) private repo: Repository<BlogPost>) {}

  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async buildUniqueSlug(
    title: string,
    preferred?: string,
    excludeId?: string,
  ) {
    const base = this.slugify(preferred || title) || `post-${Date.now()}`;
    let slug = base;
    let idx = 1;

    while (true) {
      const found = await this.repo.findOne({ where: { slug } });
      if (!found || found.id === excludeId) return slug;
      slug = `${base}-${idx++}`;
    }
  }

  async create(payload: UpsertBlogPostPayload) {
    if (!payload?.title || !payload?.content) {
      throw new BadRequestException('Title và content là bắt buộc');
    }

    const slug = await this.buildUniqueSlug(payload.title, payload.slug);
    const post = this.repo.create({
      slug,
      title: payload.title,
      excerpt: payload.excerpt,
      content: payload.content,
      coverImage: payload.coverImage,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      metaKeywords: payload.metaKeywords,
      isFeatured: Boolean(payload.isFeatured),
      isPublished: Boolean(payload.isPublished),
      publishedAt: payload.isPublished ? new Date() : undefined,
    });

    return this.repo.save(post);
  }

  async update(id: string, payload: UpsertBlogPostPayload) {
    const post = await this.findOne(id);

    if (payload.title !== undefined) post.title = payload.title;
    if (payload.slug !== undefined || payload.title !== undefined) {
      post.slug = await this.buildUniqueSlug(
        payload.title || post.title,
        payload.slug,
        id,
      );
    }
    if (payload.excerpt !== undefined) post.excerpt = payload.excerpt;
    if (payload.content !== undefined) post.content = payload.content;
    if (payload.coverImage !== undefined) post.coverImage = payload.coverImage;
    if (payload.metaTitle !== undefined) post.metaTitle = payload.metaTitle;
    if (payload.metaDescription !== undefined) {
      post.metaDescription = payload.metaDescription;
    }
    if (payload.metaKeywords !== undefined) {
      post.metaKeywords = payload.metaKeywords;
    }
    if (payload.isFeatured !== undefined) {
      post.isFeatured = Boolean(payload.isFeatured);
    }

    if (payload.isPublished !== undefined) {
      const nextPublished = Boolean(payload.isPublished);
      post.isPublished = nextPublished;
      post.publishedAt = nextPublished
        ? post.publishedAt || new Date()
        : undefined;
    }

    return this.repo.save(post);
  }

  async remove(id: string) {
    const post = await this.findOne(id);
    await this.repo.remove(post);
    return { success: true };
  }

  async findOne(id: string) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.repo.findOne({
      where: { slug, isPublished: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async findPublic(query?: { featured?: string; limit?: string }) {
    const qb = this.repo
      .createQueryBuilder('post')
      .where('post.isPublished = :published', { published: true });

    if (query?.featured === 'true') {
      qb.andWhere('post.isFeatured = :featured', { featured: true });
    }

    qb.orderBy('post.publishedAt', 'DESC').addOrderBy('post.createdAt', 'DESC');

    if (query?.limit) {
      qb.take(Math.max(1, Math.min(20, Number(query.limit) || 10)));
    }

    return qb.getMany();
  }

  async findAdmin() {
    return this.repo
      .createQueryBuilder('post')
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }
}
