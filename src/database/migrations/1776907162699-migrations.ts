import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1776907162699 implements MigrationInterface {
  name = 'Migrations1776907162699';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" RENAME COLUMN "web_page" TO "website"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" RENAME COLUMN "website" TO "web_page"`,
    );
  }
}
