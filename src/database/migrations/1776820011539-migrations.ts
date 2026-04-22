import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1776820011539 implements MigrationInterface {
  name = 'Migrations1776820011539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP COLUMN "minimum_order_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD "minimum_order_amount" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP COLUMN "minimum_order_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD "minimum_order_amount" integer NOT NULL DEFAULT '0'`,
    );
  }
}
