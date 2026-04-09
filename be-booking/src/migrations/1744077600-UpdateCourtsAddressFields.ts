import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCourtsAddressFields17440776001744077600 implements MigrationInterface {
  name = 'UpdateCourtsAddressFields17440776001744077600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Kiểm tra xem các cột đã tồn tại chưa
    const table = await queryRunner.getTable('courts');
    const provinceColumn = table?.findColumnByName('province');
    const districtColumn = table?.findColumnByName('district');
    const wardColumn = table?.findColumnByName('ward');
    const addressColumn = table?.findColumnByName('address');

    // Thêm cột province nếu chưa có
    if (!provinceColumn) {
      await queryRunner.query(`
        ALTER TABLE \`courts\` ADD \`province\` VARCHAR(255) NULL
      `);
    }

    // Thêm cột district nếu chưa có
    if (!districtColumn) {
      await queryRunner.query(`
        ALTER TABLE \`courts\` ADD \`district\` VARCHAR(255) NULL
      `);
    }

    // Thêm cột ward nếu chưa có
    if (!wardColumn) {
      await queryRunner.query(`
        ALTER TABLE \`courts\` ADD \`ward\` VARCHAR(255) NULL
      `);
    }

    // Thêm cột address nếu chưa có
    if (!addressColumn) {
      await queryRunner.query(`
        ALTER TABLE \`courts\` ADD \`address\` TEXT NULL
      `);
    }

    // Update courts cũ - copy dữ liệu từ venue nếu có (venue dùng city thay cho province)
    // venue.district -> court.district
    // venue.city -> court.province (city là tỉnh/thành phố)
    // venue.address -> court.address
    await queryRunner.query(`
      UPDATE \`courts\` c
      LEFT JOIN \`venues\` v ON c.\`venue_id\` = v.\`id\`
      SET 
        c.\`province\` = COALESCE(c.\`province\`, v.\`city\`),
        c.\`district\` = COALESCE(c.\`district\`, v.\`district\`),
        c.\`address\` = COALESCE(c.\`address\`, v.\`address\`)
      WHERE c.\`province\` IS NULL OR c.\`address\` IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback - xóa các cột nếu cần
    await queryRunner.query(`ALTER TABLE \`courts\` DROP COLUMN \`address\``);
    await queryRunner.query(`ALTER TABLE \`courts\` DROP COLUMN \`ward\``);
    await queryRunner.query(`ALTER TABLE \`courts\` DROP COLUMN \`district\``);
    await queryRunner.query(`ALTER TABLE \`courts\` DROP COLUMN \`province\``);
  }
}