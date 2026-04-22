import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1776810799284 implements MigrationInterface {
  name = 'Migrations1776810799284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discounts" RENAME COLUMN "code" TO "name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" ADD CONSTRAINT "UQ_fb73d2ec2c65bb88066e43a7d03" UNIQUE ("product_id", "discount_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_discounts" DROP CONSTRAINT "UQ_fb73d2ec2c65bb88066e43a7d03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" RENAME COLUMN "name" TO "code"`,
    );
  }
}
