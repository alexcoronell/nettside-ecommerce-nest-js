import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1776821244769 implements MigrationInterface {
  name = 'Migrations1776821244769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD "minimum_order_count" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP COLUMN "minimum_order_count"`,
    );
  }
}
