import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationIdToCourts17440912001744091200 implements MigrationInterface {
  name = 'AddLocationIdToCourts17440912001744091200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm cột location_id nếu chưa có
    const table = await queryRunner.getTable('courts');
    const locationIdColumn = table?.findColumnByName('location_id');
    
    if (!locationIdColumn) {
      await queryRunner.query(`
        ALTER TABLE \`courts\` ADD \`location_id\` VARCHAR(255) NULL
      `);
      
      // Thêm foreign key nếu cần
      await queryRunner.query(`
        ALTER TABLE \`courts\` ADD CONSTRAINT \`fk_courts_location\`
        FOREIGN KEY (\`location_id\`) REFERENCES \`locations\`(\`id\`) ON DELETE SET NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`courts\` DROP FOREIGN KEY \`fk_courts_location\``);
    await queryRunner.query(`ALTER TABLE \`courts\` DROP COLUMN \`location_id\``);
  }
}