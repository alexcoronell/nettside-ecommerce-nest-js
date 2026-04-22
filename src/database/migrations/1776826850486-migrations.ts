import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1776826850486 implements MigrationInterface {
  name = 'Migrations1776826850486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "notes" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" ADD CONSTRAINT "UQ_fb73d2ec2c65bb88066e43a7d03" UNIQUE ("product_id", "discount_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_discounts" DROP CONSTRAINT "UQ_fb73d2ec2c65bb88066e43a7d03"`,
    );
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "notes"`);
  }
}
