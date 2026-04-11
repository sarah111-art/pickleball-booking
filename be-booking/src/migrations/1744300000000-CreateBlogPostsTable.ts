import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlogPostsTable1744300000000 implements MigrationInterface {
  name = 'CreateBlogPostsTable1744300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`blog_posts\` (
        \`id\` char(36) NOT NULL DEFAULT (uuid()),
        \`slug\` varchar(255) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`excerpt\` text NULL,
        \`content\` longtext NOT NULL,
        \`cover_image\` text NULL,
        \`meta_title\` varchar(255) NULL,
        \`meta_description\` text NULL,
        \`meta_keywords\` text NULL,
        \`is_featured\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_published\` tinyint(1) NOT NULL DEFAULT 0,
        \`published_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_blog_posts_slug\` (\`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `blog_posts`');
  }
}
