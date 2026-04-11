import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'title', length: 255 })
  title: string;

  @Column({ name: 'excerpt', type: 'text', nullable: true })
  excerpt?: string;

  @Column({ name: 'content', type: 'longtext' })
  content: string;

  @Column({ name: 'cover_image', type: 'text', nullable: true })
  coverImage?: string;

  @Column({ name: 'meta_title', length: 255, nullable: true })
  metaTitle?: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription?: string;

  @Column({ name: 'meta_keywords', type: 'text', nullable: true })
  metaKeywords?: string;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
