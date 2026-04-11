import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBlogPosts1744301000000 implements MigrationInterface {
  name = 'SeedBlogPosts1744301000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`blog_posts\` (
        \`id\`,
        \`slug\`,
        \`title\`,
        \`excerpt\`,
        \`content\`,
        \`cover_image\`,
        \`meta_title\`,
        \`meta_description\`,
        \`meta_keywords\`,
        \`is_featured\`,
        \`is_published\`,
        \`published_at\`
      )
      SELECT
        uuid(),
        'bi-quyet-khoi-dong-truoc-khi-choi-pickleball',
        'Bi quyet khoi dong truoc khi choi Pickleball',
        '5 phut khoi dong dung cach giup giam chan thuong va vao tran hieu qua hon.',
        '<h2>Vi sao can khoi dong?</h2><p>Khoi dong giup tang nhiet do co the, cai thien do linh hoat va han che chan thuong.</p><h2>Quy trinh 5 phut</h2><ul><li>1 phut xoay khop co tay, co chan, vai</li><li>2 phut chay buoc nho tai cho</li><li>2 phut gian co lung, dui, bap chan</li></ul><p>Truoc khi vao tran, hay danh 5-10 qua bong de lam quen cam giac.</p>',
        'https://res.cloudinary.com/di7d0xja0/image/upload/v1775878449/image_xczpsy.jpg',
        'Bi quyet khoi dong truoc khi choi Pickleball | San Pickleball',
        'Huong dan khoi dong nhanh, an toan, giup nguoi moi choi Pickleball vao tran tot hon.',
        'pickleball,khoi dong,pickleball cho nguoi moi,ky thuat co ban',
        1,
        1,
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM \`blog_posts\` WHERE \`slug\` = 'bi-quyet-khoi-dong-truoc-khi-choi-pickleball'
      )
    `);

    await queryRunner.query(`
      INSERT INTO \`blog_posts\` (
        \`id\`,
        \`slug\`,
        \`title\`,
        \`excerpt\`,
        \`content\`,
        \`cover_image\`,
        \`meta_title\`,
        \`meta_description\`,
        \`meta_keywords\`,
        \`is_featured\`,
        \`is_published\`,
        \`published_at\`
      )
      SELECT
        uuid(),
        'chon-vot-pickleball-phu-hop-theo-trinh-do',
        'Chon vot Pickleball phu hop theo trinh do',
        'Goi y chon vot theo muc tieu: kiem soat, suc manh va do ben.',
        '<h2>Neu ban la nguoi moi</h2><p>Uu tien vot de danh, trong luong vua phai va tay cam em.</p><h2>Neu ban da choi on dinh</h2><p>Can nhac mat vot carbon, do nham cao de tang do xoay.</p><h2>Thong so nen quan tam</h2><ul><li>Trong luong vot</li><li>Do day loi</li><li>Chat lieu mat vot</li></ul>',
        'https://res.cloudinary.com/di7d0xja0/image/upload/v1775878449/image_xczpsy.jpg',
        'Cach chon vot Pickleball phu hop | San Pickleball',
        'Tu van chon vot Pickleball theo trinh do va loi choi de toi uu hieu suat.',
        'chon vot pickleball,vot pickleball,kinh nghiem choi pickleball',
        1,
        1,
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM \`blog_posts\` WHERE \`slug\` = 'chon-vot-pickleball-phu-hop-theo-trinh-do'
      )
    `);

    await queryRunner.query(`
      INSERT INTO \`blog_posts\` (
        \`id\`,
        \`slug\`,
        \`title\`,
        \`excerpt\`,
        \`content\`,
        \`cover_image\`,
        \`meta_title\`,
        \`meta_description\`,
        \`meta_keywords\`,
        \`is_featured\`,
        \`is_published\`,
        \`published_at\`
      )
      SELECT
        uuid(),
        'lich-thi-dau-noi-bo-va-hoat-dong-cong-dong',
        'Lich thi dau noi bo va hoat dong cong dong',
        'Cap nhat lich giao luu, thi dau noi bo va cac su kien hap dan trong thang.',
        '<h2>Su kien noi bat</h2><p>Hang tuan co khung gio giao luu cho nguoi moi va nguoi da choi lau nam.</p><h2>Cach tham gia</h2><p>Dang ky tren he thong dat san, chon muc su kien va xac nhan thong tin.</p><h2>Loi ich</h2><p>Mo rong ket noi, hoc hoi chien thuat moi va nang cao ky nang thi dau.</p>',
        'https://res.cloudinary.com/di7d0xja0/image/upload/v1775878449/image_xczpsy.jpg',
        'Lich thi dau noi bo Pickleball | San Pickleball',
        'Theo doi lich thi dau noi bo va tham gia hoat dong cong dong Pickleball moi nhat.',
        'lich thi dau pickleball,su kien pickleball,cong dong pickleball',
        0,
        1,
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM \`blog_posts\` WHERE \`slug\` = 'lich-thi-dau-noi-bo-va-hoat-dong-cong-dong'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`blog_posts\`
      WHERE \`slug\` IN (
        'bi-quyet-khoi-dong-truoc-khi-choi-pickleball',
        'chon-vot-pickleball-phu-hop-theo-trinh-do',
        'lich-thi-dau-noi-bo-va-hoat-dong-cong-dong'
      )
    `);
  }
}
